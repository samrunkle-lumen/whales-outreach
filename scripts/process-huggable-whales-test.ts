import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

interface CSVRow {
  'Short-listed': string;
  'Customer ID': string;
  'Property address': string;
  'Status': string;
  'Marketplace status': string;
  'Labels': string;
  'Utility': string;
}

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
  source?: string;
  customerId?: string;
}

interface BrokerMatch {
  address: string;
  customerId: string;
  brokerName?: string;
  brokerCompany?: string;
  matched: boolean;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchAddress(address: string): Promise<any> {
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
    console.error(`Failed to search ${address}:`, error);
    return null;
  }
}

async function main() {
  const TEST_LIMIT = 10; // Process only first 10 addresses for testing

  console.log('🐋 Processing Huggable Whales properties (TEST MODE)\n');
  console.log(`⚠️  TEST MODE: Will only process first ${TEST_LIMIT} unique addresses\n`);

  // Read CSV file
  const csvPath = join(process.cwd(), 'data', 'Huggable Whales - Properties - 2_17_2026.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const records: CSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`📊 Found ${records.length} total properties in CSV\n`);

  // Extract unique addresses (handle dupes)
  const addressMap = new Map<string, string[]>();

  // Filter to only IL, NJ, MD, and MA (exclude PA)
  const targetStates = ['IL', 'NJ', 'MD', 'MA'];
  let skippedPA = 0;

  records.forEach(row => {
    const address = row['Property address']?.trim();
    const customerId = row['Customer ID']?.trim();

    if (address && customerId) {
      // Extract state from address (last 2 letters before zip)
      const stateMatch = address.match(/,\s*([A-Z]{2})\s+\d{5}/);
      const state = stateMatch ? stateMatch[1] : null;

      // Skip Pennsylvania addresses
      if (state === 'PA') {
        skippedPA++;
        return;
      }

      // Only include target states
      if (state && targetStates.includes(state)) {
        if (!addressMap.has(address)) {
          addressMap.set(address, []);
        }
        addressMap.get(address)!.push(customerId);
      }
    }
  });

  console.log(`🗺️  Target states: IL, NJ, MD, MA\n`);
  console.log(`⏭️  Skipped PA properties: ${skippedPA}\n`);
  console.log(`🏢 Total unique addresses (filtered): ${addressMap.size}\n`);

  // Limit to first TEST_LIMIT addresses for testing
  const testAddresses = Array.from(addressMap.entries()).slice(0, TEST_LIMIT);

  console.log(`🧪 Processing ${testAddresses.length} addresses for testing...\n`);

  // Load existing broker data
  const brokersPath = join(process.cwd(), 'data', 'brokers.json');
  const brokersData = JSON.parse(readFileSync(brokersPath, 'utf-8'));

  const existingBrokers = new Set(
    brokersData.brokers.map((b: any) => b.company?.toLowerCase())
  );

  console.log(`📋 Loaded ${existingBrokers.size} existing broker companies\n`);

  // Process addresses
  const results: BrokerMatch[] = [];
  const matched: BrokerMatch[] = [];
  const unassigned: BrokerMatch[] = [];

  let processed = 0;
  let errors = 0;

  console.log('🔍 Starting address scraping...\n');

  for (const [address, customerIds] of testAddresses) {
    processed++;

    console.log(`[${processed}/${testAddresses.length}] Processing: ${address}`);

    const result = await searchAddress(address);

    if (result && result.slug) {
      const propertyPath = join(process.cwd(), 'data', 'properties', `${result.slug}.json`);

      if (existsSync(propertyPath)) {
        const propertyData: PropertyListing = JSON.parse(readFileSync(propertyPath, 'utf-8'));

        propertyData.source = 'Huggable Whales (TEST)';
        propertyData.customerId = customerIds.join(',');
        writeFileSync(propertyPath, JSON.stringify(propertyData, null, 2));

        const brokerCompany = propertyData.brokerCompany?.toLowerCase();
        const isMatched = brokerCompany &&
                         brokerCompany !== 'search for broker' &&
                         existingBrokers.has(brokerCompany);

        const match: BrokerMatch = {
          address,
          customerId: customerIds.join(','),
          brokerName: propertyData.brokerName,
          brokerCompany: propertyData.brokerCompany,
          matched: !!isMatched,
        };

        results.push(match);

        if (isMatched) {
          matched.push(match);
          console.log(`  ✅ Matched to existing broker: ${propertyData.brokerCompany}`);
        } else {
          unassigned.push(match);
          console.log(`  ⚪ Unassigned (no broker match)`);
        }
      }
    } else {
      errors++;
      console.log(`  ❌ Search failed`);
    }

    // Rate limiting
    if (processed < testAddresses.length) {
      await sleep(2000);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RUN SUMMARY');
  console.log('='.repeat(60));
  console.log(`Addresses processed: ${processed} of ${addressMap.size} total`);
  console.log(`Successfully scraped: ${results.length}`);
  console.log(`Matched to existing brokers: ${matched.length}`);
  console.log(`Unassigned properties: ${unassigned.length}`);
  console.log(`Errors: ${errors}`);
  console.log('='.repeat(60) + '\n');

  // Save test results
  const testData = {
    testMode: true,
    processedAt: new Date().toISOString(),
    filters: {
      targetStates: ['IL', 'NJ', 'MD', 'MA'],
      excludedStates: ['PA'],
      skippedPAProperties: skippedPA,
    },
    addressesProcessed: processed,
    totalFilteredAddresses: addressMap.size,
    results: {
      matched: matched.length,
      unassigned: unassigned.length,
      errors,
    },
    matchedProperties: matched,
    unassignedProperties: unassigned,
  };

  const outputPath = join(process.cwd(), 'data', 'huggable-whales-test-results.json');
  writeFileSync(outputPath, JSON.stringify(testData, null, 2));

  console.log(`💾 Test results saved to: ${outputPath}\n`);
  console.log('✅ Test complete! Review results before running full processing.\n');
  console.log(`📌 To process all ${addressMap.size} addresses, run: npm run process-whales\n`);
}

main().catch(console.error);
