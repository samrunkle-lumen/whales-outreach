import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { checkRateLimit, getClientIP } from "@/lib/ratelimit";

// API Keys from environment
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

// Input validation schema
const scrapeBrokersSchema = z.object({
  firmName: z.string()
    .min(2, 'Firm name too short')
    .max(100, 'Firm name too long')
    .regex(/^[a-zA-Z0-9\s&.,'-]+$/, 'Invalid characters in firm name'),
  markets: z.array(z.string().regex(/^[A-Z]{2}$/, 'Invalid state code'))
    .min(1, 'At least one market required')
    .max(10, 'Too many markets'),
  website: z.string().url('Invalid website URL'),
  brokerNames: z.array(z.string()).optional(),
});

// Validate external URLs to prevent SSRF attacks
function validateExternalURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Block internal IPs and localhost
    const hostname = url.hostname.toLowerCase();

    // Block localhost variations
    if (
      hostname === 'localhost' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // Block private IP ranges (IPv4)
    if (
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.startsWith('169.254.')
    ) {
      return false;
    }

    // Whitelist approach - only allow known safe domains
    const allowedDomains = [
      'loopnet.com',
      'crexi.com',
      'costar.com',
      'ten-x.com',
      'commercialcafe.com',
      'commercialsearch.com'
    ];

    // Check if hostname ends with any allowed domain
    const isAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    return isAllowed;
  } catch {
    return false;
  }
}

interface ScrapedProperty {
  address: string;
  name?: string;
  sqft: number;
  city?: string;
  state?: string;
  propertyType?: string;
  listingUrl?: string;
}

interface ScrapedBroker {
  name: string;
  fullName: string;
  email?: string;
  phone?: string;
  title?: string;
  properties: ScrapedProperty[];
}

// Extract state from address or city
function extractState(address: string, city?: string): string | undefined {
  // Try to find state in address
  const stateMatch = address.match(/,\s*([A-Z]{2})\s*\d{5}/) ||
    address.match(/,\s*([A-Z]{2})$/) ||
    address.match(/,\s*([A-Z]{2})\s*,/);
  if (stateMatch) return stateMatch[1];

  // Try city if provided
  if (city) {
    const cityStateMatch = city.match(/([A-Z]{2})$/);
    if (cityStateMatch) return cityStateMatch[1];
  }

  return undefined;
}

// Parse square footage from text
function parseSqft(text: string): number | null {
  const match = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:SF|sq\.?\s*ft|square\s*feet)/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ""), 10);
  }
  return null;
}

// Extract broker names from markdown content
function extractBrokerNames(content: string): string[] {
  const names: string[] = [];
  const patterns = [
    // Common patterns for broker names
    /(?:Contact|Broker|Agent|Listed by|Listing Agent)[:\s]*([A-Z][a-z]+\s+[A-Z][a-zA-Z'-]+)/gi,
    /(?:###|####)\s*([A-Z][a-z]+\s+[A-Z][a-zA-Z'-]+)/g,
    /\[([A-Z][a-z]+\s+[A-Z][a-zA-Z'-]+)\]\(/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1].trim();
      // Filter out common false positives
      if (
        !name.match(/^(Industrial|Commercial|Warehouse|Office|Retail|Contact|Learn|Read|View|Click)/i) &&
        name.split(" ").length >= 2 &&
        name.length <= 40
      ) {
        if (!names.includes(name)) {
          names.push(name);
        }
      }
    }
  }

  return names;
}

// Extract property name from URL slug
function extractNameFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Look for listing path segments that might contain the name
    // e.g., /listings/hagerstown-distribution-center-16604-industrial-ln...
    for (const part of pathParts) {
      // Skip common non-name segments
      if (['listings', 'properties', 'property', 'for-lease', 'for-sale', 'en', 'united-states'].includes(part.toLowerCase())) {
        continue;
      }

      // If it contains numbers at the start (like an address), extract the name part before it
      const nameMatch = part.match(/^([a-z-]+(?:-[a-z]+)*)-\d/i);
      if (nameMatch) {
        const name = nameMatch[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        // Filter out generic names
        if (!name.match(/^(Industrial|Commercial|Warehouse|Office|For Lease|Property)$/i) && name.length > 3) {
          return name;
        }
      }
    }
  } catch {
    // Invalid URL
  }
  return undefined;
}

// Extract property name from page content
function extractNameFromContent(content: string): string | undefined {
  // Look for common title/heading patterns
  const patterns = [
    /^#\s+([A-Z][A-Za-z0-9\s&'-]+(?:Center|Centre|Park|Building|Complex|Plaza|Campus|Facility|Distribution|Warehouse|Industrial))/m,
    /(?:Property|Building|Facility)\s*(?:Name)?[:\s]+([A-Z][A-Za-z0-9\s&'-]+(?:Center|Centre|Park|Building|Complex|Plaza|Campus|Facility|Distribution|Warehouse|Industrial))/i,
    /title[:\s]+["']?([A-Z][A-Za-z0-9\s&'-]+(?:Center|Centre|Park|Building|Complex|Plaza|Campus|Facility|Distribution|Warehouse|Industrial))["']?/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 5 && name.length < 100) {
        return name;
      }
    }
  }
  return undefined;
}

// Extract properties from scraped content
function extractProperties(content: string, targetStates: string[], url?: string): ScrapedProperty[] {
  const properties: ScrapedProperty[] = [];

  // Try to extract property name from URL or content
  const nameFromUrl = url ? extractNameFromUrl(url) : undefined;
  const nameFromContent = extractNameFromContent(content);
  const propertyName = nameFromContent || nameFromUrl;

  // Look for property patterns in the content
  const propertyPatterns = [
    // Address with sqft
    /(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Parkway|Pkwy)[^|]*?),?\s*([A-Za-z\s]+),?\s*([A-Z]{2})\s*\d{0,5}[^|]*?(\d{1,3}(?:,\d{3})*)\s*(?:SF|sq\.?\s*ft)/gi,
  ];

  for (const pattern of propertyPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const state = match[3]?.toUpperCase();
      if (targetStates.includes(state)) {
        const sqft = parseInt(match[4].replace(/,/g, ""), 10);
        if (sqft >= 20000) {
          properties.push({
            address: `${match[1].trim()}, ${match[2].trim()}, ${state}`,
            name: propertyName,
            sqft,
            city: match[2].trim(),
            state,
            propertyType: "Industrial",
          });
        }
      }
    }
  }

  return properties;
}

// Scrape URL with Firecrawl
async function scrapeWithFirecrawl(url: string): Promise<string | null> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  // Set up timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`Firecrawl error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data?.markdown || null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Firecrawl scrape timeout");
    } else {
      console.error("Firecrawl scrape error:", error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Search for property URLs with Firecrawl
async function searchPropertyUrls(
  baseUrl: string,
  markets: string[]
): Promise<string[]> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  // Validate baseUrl before proceeding
  if (!validateExternalURL(baseUrl)) {
    throw new Error("Invalid or disallowed base URL");
  }

  const urls: string[] = [];

  // Build search queries
  const searchTerms = markets.flatMap((state) => [
    `${state} industrial for lease`,
    `${state} warehouse`,
  ]);

  for (const term of searchTerms) {
    // Set up timeout for each search
    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 10000); // 10s timeout

    try {
      const response = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          query: term,
          limit: 20,
          scrapeOptions: {
            formats: ["markdown"],
          },
        }),
        signal: searchController.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          for (const result of data.data) {
            // Validate each URL before adding
            if (result.url && validateExternalURL(result.url) && result.url.includes(new URL(baseUrl).hostname)) {
              urls.push(result.url);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Search timeout for ${term}`);
      } else {
        console.error(`Search error for ${term}:`, error);
      }
    } finally {
      clearTimeout(searchTimeout);
    }
  }

  // Also try to crawl the provided URL directly
  urls.push(baseUrl);

  return [...new Set(urls)]; // Deduplicate
}

// Enrich broker with Apollo
async function enrichWithApollo(
  brokerName: string,
  firmName: string,
  firmDomain?: string
): Promise<{ email?: string; phone?: string; title?: string }> {
  if (!APOLLO_API_KEY) {
    return {};
  }

  const nameParts = brokerName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  // Set up timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch("https://api.apollo.io/api/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        organization_name: firmName,
        domain: firmDomain,
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.person) {
        return {
          email: data.person.email,
          phone: data.person.phone_numbers?.[0]?.sanitized_number,
          title: data.person.title,
        };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Apollo enrichment timeout for ${brokerName}`);
    } else {
      console.error(`Apollo enrichment error for ${brokerName}:`, error);
    }
  } finally {
    clearTimeout(timeout);
  }

  return {};
}

// Slugify a string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 requests per 5 minutes per IP (scraping is expensive)
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, {
      maxRequests: 5,
      windowMs: 5 * 60 * 1000, // 5 minutes
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = scrapeBrokersSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { firmName, markets, website, brokerNames } = validationResult.data;

    // Validate website URL to prevent SSRF attacks
    if (!validateExternalURL(website)) {
      return NextResponse.json(
        { success: false, message: "Invalid or disallowed website URL" },
        { status: 400 }
      );
    }

    // Extract domain from website
    let firmDomain: string | undefined;
    try {
      firmDomain = new URL(website).hostname.replace("www.", "");
    } catch {
      // Invalid URL
    }

    const errors: string[] = [];
    const scrapedBrokers: ScrapedBroker[] = [];
    const propertiesByBroker: Map<string, ScrapedProperty[]> = new Map();

    // Initialize provided broker names
    const knownBrokers = new Set<string>(brokerNames || []);

    // Search for property URLs
    let propertyUrls: string[] = [];
    try {
      propertyUrls = await searchPropertyUrls(website, markets);
    } catch (error) {
      errors.push(`Failed to search for properties: ${error}`);
    }

    // Scrape each URL for properties and broker names
    const allProperties: ScrapedProperty[] = [];
    for (const url of propertyUrls.slice(0, 30)) {
      // Limit to 30 URLs

      // Validate URL before scraping
      if (!validateExternalURL(url)) {
        errors.push(`Skipped invalid URL: ${url}`);
        continue;
      }

      try {
        const content = await scrapeWithFirecrawl(url);
        if (content) {
          // Extract broker names from content
          const foundNames = extractBrokerNames(content);
          for (const name of foundNames) {
            knownBrokers.add(name);
          }

          // Extract properties (pass URL for name extraction)
          const properties = extractProperties(content, markets, url);
          for (const prop of properties) {
            prop.listingUrl = url;
            allProperties.push(prop);
          }
        }
      } catch (error) {
        errors.push(`Failed to scrape ${url}: ${error}`);
      }
    }

    // If no brokers found, create a placeholder
    if (knownBrokers.size === 0) {
      knownBrokers.add(`${firmName} Listings`);
    }

    // Distribute properties among brokers (or assign all to placeholder)
    const brokerArray = Array.from(knownBrokers);
    if (allProperties.length > 0) {
      // If we have actual broker names, try to assign properties intelligently
      // For now, assign all to first broker or distribute evenly
      const propertiesPerBroker = Math.ceil(allProperties.length / brokerArray.length);
      for (let i = 0; i < brokerArray.length; i++) {
        const brokerProps = allProperties.slice(
          i * propertiesPerBroker,
          (i + 1) * propertiesPerBroker
        );
        if (brokerProps.length > 0) {
          propertiesByBroker.set(brokerArray[i], brokerProps);
        }
      }
    }

    // Enrich brokers with Apollo and build final broker objects
    for (const brokerName of knownBrokers) {
      const properties = propertiesByBroker.get(brokerName) || [];
      if (properties.length === 0) continue;

      const enrichment = await enrichWithApollo(brokerName, firmName, firmDomain);
      const nameParts = brokerName.split(" ");

      scrapedBrokers.push({
        name: nameParts[0],
        fullName: brokerName,
        email: enrichment.email,
        phone: enrichment.phone,
        title: enrichment.title || "Broker",
        properties,
      });
    }

    if (scrapedBrokers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No brokers or properties found. Try a different URL or add broker names manually.",
          errors,
        },
        { status: 200 }
      );
    }

    // Read existing brokers.json
    const brokersJsonPath = path.join(process.cwd(), "data", "brokers.json");
    let existingData: { firms: unknown[]; brokers: unknown[] } = {
      firms: [],
      brokers: [],
    };

    try {
      const fileContent = await fs.readFile(brokersJsonPath, "utf-8");
      existingData = JSON.parse(fileContent);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    // Add new firm if not exists
    const firmSlug = slugify(firmName);
    const existingFirm = (existingData.firms as { slug: string }[]).find(
      (f) => f.slug === firmSlug
    );
    if (!existingFirm) {
      existingData.firms.push({
        name: firmName,
        slug: firmSlug,
        market: markets.join(", "),
      });
    }

    // Add new brokers
    let brokersAdded = 0;
    let propertiesAdded = 0;

    for (const broker of scrapedBrokers) {
      const brokerSlug = slugify(broker.fullName);

      // Check if broker already exists
      const existingBroker = (existingData.brokers as { slug: string; buildings: { address: string }[] }[]).find(
        (b) => b.slug === brokerSlug
      );

      if (existingBroker) {
        // Merge properties
        const existingAddresses = new Set(
          existingBroker.buildings.map((b) => b.address)
        );
        const newBuildings = broker.properties
          .filter((p) => !existingAddresses.has(p.address))
          .map((p) => ({
            address: p.address,
            name: p.name,
            sqft: p.sqft,
            city: p.city,
            state: p.state,
            propertyType: p.propertyType,
            listingUrl: p.listingUrl,
          }));
        existingBroker.buildings.push(...newBuildings);
        propertiesAdded += newBuildings.length;
      } else {
        // Add new broker
        existingData.brokers.push({
          slug: brokerSlug,
          name: broker.name,
          fullName: broker.fullName,
          company: firmName,
          market: markets.join(", "),
          email: broker.email,
          phone: broker.phone,
          title: broker.title,
          buildings: broker.properties.map((p) => ({
            address: p.address,
            name: p.name,
            sqft: p.sqft,
            city: p.city,
            state: p.state,
            propertyType: p.propertyType,
            listingUrl: p.listingUrl,
          })),
        });
        brokersAdded++;
        propertiesAdded += broker.properties.length;
      }
    }

    // Save updated brokers.json
    await fs.writeFile(brokersJsonPath, JSON.stringify(existingData, null, 2));

    return NextResponse.json({
      success: true,
      message: `Successfully added brokers from ${firmName}!`,
      brokersAdded,
      propertiesAdded,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Scrape brokers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
