import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';

interface PropertyListing {
  address: string;
  slug: string;
  brokerName?: string;
  brokerCompany?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  propertyType?: string;
  sqft?: number;
  listingUrl?: string;
  listingDate?: string;
  description?: string;
  price?: string;
  searchResults: string[];
  scrapedContent?: string;
  createdAt: string;
}

function createSlug(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function searchWithFirecrawl(address: string): Promise<any> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    console.warn('FIRECRAWL_API_KEY not found, using mock data');
    return {
      searchResults: [
        `"${address}" site:loopnet.com`,
        `"${address}" site:crexi.com`,
        `"${address}" commercial real estate listing`,
      ],
      listingUrls: [],
      content: null,
    };
  }

  try {
    // Search for the address across multiple broker platforms
    const searchQueries = [
      `"${address}" site:loopnet.com`,
      `"${address}" site:crexi.com`,
      `"${address}" site:cbre.com`,
      `"${address}" site:cushmanwakefield.com`,
      `"${address}" site:jll.com`,
      `"${address}" commercial real estate broker listing`,
    ];

    // Use Firecrawl's search endpoint with timeout
    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 10000); // 10s timeout

    let searchResponse;
    try {
      searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `"${address}" commercial real estate listing broker`,
          limit: 5,
        }),
        signal: searchController.signal,
      });
    } finally {
      clearTimeout(searchTimeout);
    }

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Firecrawl search failed:', searchResponse.status, errorText);
      throw new Error(`Firecrawl search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const listingUrls = searchData.data?.map((result: any) => result.url) || [];

    // If we found listings, scrape the first one for details
    let scrapedData = null;
    if (listingUrls.length > 0) {
      const scrapeController = new AbortController();
      const scrapeTimeout = setTimeout(() => scrapeController.abort(), 15000); // 15s timeout

      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: listingUrls[0],
            formats: ['markdown', 'html'],
          }),
          signal: scrapeController.signal,
        });

        if (scrapeResponse.ok) {
          scrapedData = await scrapeResponse.json();
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Scrape request timed out');
        } else {
          throw error;
        }
      } finally {
        clearTimeout(scrapeTimeout);
      }
    }

    return {
      searchResults: searchQueries,
      listingUrls,
      content: scrapedData,
    };
  } catch (error) {
    console.error('Firecrawl error:', error instanceof Error ? error.message : error);
    // Return fallback data even on error - still create the property
    return {
      searchResults: [
        `"${address}" site:loopnet.com`,
        `"${address}" site:crexi.com`,
        `"${address}" commercial real estate listing`,
      ],
      listingUrls: [],
      content: null,
    };
  }
}

// Input validation schema
const addressSchema = z.object({
  address: z.string()
    .min(5, 'Address too short')
    .max(200, 'Address too long')
    .regex(/^[a-zA-Z0-9\s,.\-#]+$/, 'Invalid characters in address'),
});

function extractBrokerInfo(content: any, address: string): Partial<PropertyListing> {
  if (!content?.data?.markdown) {
    return {
      brokerName: 'To be determined',
      brokerCompany: 'Search for broker',
      propertyType: 'Commercial',
    };
  }

  const markdown = content.data.markdown;
  const extracted: Partial<PropertyListing> = {};

  // Extract broker name (look for common patterns)
  const brokerPatterns = [
    /(?:Broker|Agent|Representative):\s*([^\n]+)/i,
    /(?:Contact|Listed by):\s*([^\n]+)/i,
    /([A-Z][a-z]+ [A-Z][a-z]+)\s*(?:CCIM|SIOR|MAI)/i,
  ];

  for (const pattern of brokerPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      extracted.brokerName = match[1].trim();
      break;
    }
  }

  // Extract company name
  const companyPatterns = [
    /(?:Company|Firm|Brokerage):\s*([^\n]+)/i,
    /(CBRE|Colliers|Cushman & Wakefield|JLL|Marcus & Millichap|Newmark)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      extracted.brokerCompany = match[1].trim();
      break;
    }
  }

  // Extract email
  const emailMatch = markdown.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    extracted.brokerEmail = emailMatch[1];
  }

  // Extract phone (more strict to avoid parcel IDs)
  const phoneMatch = markdown.match(/(?:Phone|Tel|Call|Contact):\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})|(\(\d{3}\)\s*\d{3}[-.\s]?\d{4})/i);
  if (phoneMatch) {
    extracted.brokerPhone = (phoneMatch[1] || phoneMatch[2]).trim();
  }

  // Extract square footage - handle LoopNet "TOTAL SIZE" pattern and other formats
  const sqftPatterns = [
    /TOTAL\s+SIZE\s*\n+\s*([\d,]+)\s*SF/i,  // LoopNet: "TOTAL SIZE\n\n578,873 SF"
    /Building\s+Size[:\s]+([\d,]+)\s*(?:SF|sq\.?\s*ft\.?)/i,
    /([\d,]+)\s*(?:SF|sq\.?\s*ft\.?|square\s+feet)\s*(?:available|total|building)/i,
    /([\d,]+)\s*(?:SF|sq\.?\s*ft\.?)/i, // Generic fallback
  ];

  for (const pattern of sqftPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const sqftValue = parseInt(match[1].replace(/,/g, ''));
      // Sanity check - must be reasonable building size (100 SF - 10M SF)
      if (sqftValue >= 100 && sqftValue <= 10000000) {
        extracted.sqft = sqftValue;
        break;
      }
    }
  }

  // Extract property type - handle LoopNet "Land Use" and other patterns
  const typePatterns = [
    /Land\s+Use\s*\n+\s*([^\n]+)/i,  // LoopNet: "Land Use\n\nWarehouse"
    /(?:Property\s+Type|Building\s+Type|Type)[:\s]+([^\n]+)/i,
    /(?:Class|Category)[:\s]+([A-Z][^\n,]+)/i,
  ];

  for (const pattern of typePatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const type = match[1].trim();
      // Filter out common non-property-type values
      if (type && type.length > 2 && type.length < 50 && !type.match(/^\d+$/)) {
        extracted.propertyType = type;
        break;
      }
    }
  }

  // Extract price - match full price with decimals and units
  const pricePatterns = [
    /\$([\d,]+\.?\d*)\s*(?:SF\/YR|per\s+SF|\/SF)/i,  // "$14.95 SF/YR"
    /\$([\d,]+\.?\d*)\s*\/\s*(?:mo|month|yr|year)/i,
    /(?:Price|Asking|Rent)[:\s]+\$([\d,]+\.?\d*)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      extracted.price = match[0];
      break;
    }
  }

  return extracted;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 requests per minute per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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
    const validationResult = addressSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { address } = validationResult.data;

    const slug = createSlug(address);

    // Check if property already exists
    const propertiesDir = join(process.cwd(), 'data', 'properties');
    const propertyFile = join(propertiesDir, `${slug}.json`);

    if (existsSync(propertyFile)) {
      // Property already searched
      return NextResponse.json({ slug, exists: true });
    }

    // Search for broker listings with Firecrawl
    const firecrawlResults = await searchWithFirecrawl(address);

    // Extract broker information from scraped content
    const extractedInfo = extractBrokerInfo(firecrawlResults.content, address);

    // Create property listing data
    const propertyListing: PropertyListing = {
      address,
      slug,
      searchResults: firecrawlResults.searchResults,
      listingUrl: firecrawlResults.listingUrls[0],
      scrapedContent: firecrawlResults.content?.data?.markdown?.substring(0, 5000), // Limit stored content
      createdAt: new Date().toISOString(),
      ...extractedInfo,
    };

    // Ensure properties directory exists
    if (!existsSync(propertiesDir)) {
      mkdirSync(propertiesDir, { recursive: true });
    }

    // Save property data
    writeFileSync(propertyFile, JSON.stringify(propertyListing, null, 2));

    // Update properties index
    const indexFile = join(propertiesDir, 'index.json');
    let propertiesIndex: PropertyListing[] = [];

    if (existsSync(indexFile)) {
      propertiesIndex = JSON.parse(readFileSync(indexFile, 'utf-8'));
    }

    propertiesIndex.push({
      address: propertyListing.address,
      slug: propertyListing.slug,
      brokerName: propertyListing.brokerName,
      brokerCompany: propertyListing.brokerCompany,
      propertyType: propertyListing.propertyType,
      sqft: propertyListing.sqft,
      createdAt: propertyListing.createdAt,
      searchResults: [],
    });

    writeFileSync(indexFile, JSON.stringify(propertiesIndex, null, 2));

    return NextResponse.json({
      slug,
      exists: false,
      message: 'Property search completed',
      found: firecrawlResults.listingUrls.length > 0,
    });
  } catch (error) {
    console.error('Error searching address:', error);
    return NextResponse.json(
      { error: 'Failed to search address', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
