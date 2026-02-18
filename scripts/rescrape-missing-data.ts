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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rescrapeAddress(address: string): Promise<any> {
  try {
    const response = await fetch('http://localhost:3000/api/search-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to rescrape ${address}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function main() {
  console.log('🔄 Re-scraping properties with missing data...\n');

  const propertiesDir = join(process.cwd(), 'data', 'properties');
  const files = readdirSync(propertiesDir).filter(f => f.endsWith('.json') && f !== 'index.json');

  // Identify properties that need re-scraping
  const needsRescrape: Array<{ file: string; address: string; slug: string }> = [];

  for (const file of files) {
    const filePath = join(propertiesDir, file);
    const property: PropertyListing = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Re-scrape if:
    // 1. No scraped content, OR
    // 2. Has scraped content but sqft is 0 or null (extraction failed), OR
    // 3. Source is Huggable Whales and missing key data
    const needsData =
      !property.scrapedContent ||
      (!property.sqft || property.sqft === 0) ||
      (property.source === 'Huggable Whales' && !property.sqft);

    if (needsData && property.source === 'Huggable Whales') {
      needsRescrape.push({
        file,
        address: property.address,
        slug: property.slug,
      });
    }
  }

  console.log(`📊 Found ${needsRescrape.length} Huggable Whales properties that need re-scraping\n`);
  console.log(`⏱️  Estimated time: ~${Math.ceil(needsRescrape.length * 2 / 60)} minutes\n`);

  if (needsRescrape.length === 0) {
    console.log('✨ All properties already have data!\n');
    return;
  }

  console.log('🔍 Starting re-scraping...\n');

  let processed = 0;
  let improved = 0;
  let failed = 0;

  for (const { file, address, slug } of needsRescrape) {
    processed++;
    console.log(`[${processed}/${needsRescrape.length}] Re-scraping: ${address}`);

    // Delete the existing file so the API will re-scrape
    const filePath = join(propertiesDir, file);
    const oldProperty: PropertyListing = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Re-scrape via API
    const result = await rescrapeAddress(address);

    if (result && result.slug) {
      // Check if new data is better
      const newFilePath = join(propertiesDir, `${result.slug}.json`);
      const newProperty: PropertyListing = JSON.parse(readFileSync(newFilePath, 'utf-8'));

      // Restore Huggable Whales metadata
      newProperty.source = 'Huggable Whales';
      newProperty.customerId = oldProperty.customerId;
      writeFileSync(newFilePath, JSON.stringify(newProperty, null, 2));

      if (newProperty.sqft && newProperty.sqft > 0) {
        improved++;
        console.log(`  ✅ Success! sqft: ${newProperty.sqft.toLocaleString()}, type: ${newProperty.propertyType || 'N/A'}`);
      } else {
        console.log(`  ⚪ Re-scraped but still no data found`);
      }
    } else {
      failed++;
      console.log(`  ❌ Re-scraping failed`);
    }

    // Rate limiting - wait 2 seconds between requests
    if (processed < needsRescrape.length) {
      await sleep(2000);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RE-SCRAPING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Properties attempted: ${processed}`);
  console.log(`Successfully improved: ${improved}`);
  console.log(`Failed to improve: ${failed}`);
  console.log(`Success rate: ${((improved / processed) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  console.log('✨ Re-scraping complete!\n');
  console.log('💡 Next step: Run `npm run process-whales` to update brokers.json\n');
}

main().catch(console.error);
