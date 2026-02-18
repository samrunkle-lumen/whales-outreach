import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

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
  price?: string;
  scrapedContent?: string;
  source?: string;
  customerId?: string;
  [key: string]: any;
}

function extractBrokerInfo(scrapedContent: string): Partial<PropertyListing> {
  const extracted: Partial<PropertyListing> = {};

  // Extract broker name (look for common patterns)
  const brokerPatterns = [
    /(?:Broker|Agent|Representative):\s*([^\n]+)/i,
    /(?:Contact|Listed by):\s*([^\n]+)/i,
    /([A-Z][a-z]+ [A-Z][a-z]+)\s*(?:CCIM|SIOR|MAI)/i,
  ];

  for (const pattern of brokerPatterns) {
    const match = scrapedContent.match(pattern);
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
    const match = scrapedContent.match(pattern);
    if (match) {
      extracted.brokerCompany = match[1].trim();
      break;
    }
  }

  // Extract email
  const emailMatch = scrapedContent.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    extracted.brokerEmail = emailMatch[1];
  }

  // Extract phone (more strict to avoid parcel IDs)
  const phoneMatch = scrapedContent.match(/(?:Phone|Tel|Call|Contact):\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})|(\(\d{3}\)\s*\d{3}[-.\s]?\d{4})/i);
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
    const match = scrapedContent.match(pattern);
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
    const match = scrapedContent.match(pattern);
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
    const match = scrapedContent.match(pattern);
    if (match) {
      extracted.price = match[0];
      break;
    }
  }

  return extracted;
}

async function main() {
  console.log('🔄 Re-processing existing property files with fixed extraction patterns...\n');

  const propertiesDir = join(process.cwd(), 'data', 'properties');
  const files = readdirSync(propertiesDir).filter(f => f.endsWith('.json') && f !== 'index.json');

  console.log(`📁 Found ${files.length} property files to re-process\n`);

  let updated = 0;
  let noContent = 0;
  let improved = 0;

  for (const file of files) {
    const filePath = join(propertiesDir, file);
    const property: PropertyListing = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Skip if no scraped content
    if (!property.scrapedContent) {
      noContent++;
      continue;
    }

    // Extract data with new patterns
    const extracted = extractBrokerInfo(property.scrapedContent);

    // Track if we improved the data
    let hasImprovements = false;

    // Update property with extracted data
    if (extracted.sqft && extracted.sqft !== property.sqft) {
      property.sqft = extracted.sqft;
      hasImprovements = true;
    }

    if (extracted.propertyType && extracted.propertyType !== property.propertyType) {
      property.propertyType = extracted.propertyType;
      hasImprovements = true;
    }

    if (extracted.price && extracted.price !== property.price) {
      property.price = extracted.price;
      hasImprovements = true;
    }

    if (extracted.brokerPhone && extracted.brokerPhone !== property.brokerPhone) {
      property.brokerPhone = extracted.brokerPhone;
      hasImprovements = true;
    }

    if (extracted.brokerName && extracted.brokerName !== property.brokerName) {
      property.brokerName = extracted.brokerName;
      hasImprovements = true;
    }

    if (extracted.brokerCompany && extracted.brokerCompany !== property.brokerCompany) {
      property.brokerCompany = extracted.brokerCompany;
      hasImprovements = true;
    }

    if (extracted.brokerEmail && extracted.brokerEmail !== property.brokerEmail) {
      property.brokerEmail = extracted.brokerEmail;
      hasImprovements = true;
    }

    // Save updated property
    if (hasImprovements) {
      writeFileSync(filePath, JSON.stringify(property, null, 2));
      improved++;
      console.log(`✅ Updated: ${property.address} (sqft: ${property.sqft || 'N/A'})`);
    }

    updated++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 REPROCESSING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${updated}`);
  console.log(`Files with improvements: ${improved}`);
  console.log(`Files without scraped content: ${noContent}`);
  console.log('='.repeat(60) + '\n');
  console.log('✨ Re-processing complete!\n');
}

main().catch(console.error);
