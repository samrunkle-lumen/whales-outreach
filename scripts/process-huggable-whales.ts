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
  // ... other columns
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
  source?: string; // Track that this came from Huggable Whales
  customerId?: string; // Store the customer ID from CSV
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
  console.log('🐋 Processing Huggable Whales properties...\n');

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
  const addressMap = new Map<string, string[]>(); // address -> [customerIds]

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
  console.log(`🏢 Found ${addressMap.size} unique addresses to process\n`);

  // Load existing broker data for cross-referencing
  const brokersPath = join(process.cwd(), 'data', 'brokers.json');
  const brokersData = JSON.parse(readFileSync(brokersPath, 'utf-8'));

  const existingBrokers = new Set(
    brokersData.brokers.map((b: any) => b.company?.toLowerCase())
  );

  console.log(`📋 Loaded ${existingBrokers.size} existing broker companies for cross-reference\n`);

  // Process addresses
  const results: BrokerMatch[] = [];
  const matched: BrokerMatch[] = [];
  const unassigned: BrokerMatch[] = [];

  let processed = 0;
  let errors = 0;

  console.log('🔍 Starting address scraping...\n');
  console.log('⏱️  Rate limiting: 2 seconds between requests to avoid overwhelming API\n');

  for (const [address, customerIds] of addressMap.entries()) {
    processed++;

    console.log(`[${processed}/${addressMap.size}] Processing: ${address}`);

    // Search the address
    const result = await searchAddress(address);

    if (result && result.slug) {
      // Load the created property data
      const propertyPath = join(process.cwd(), 'data', 'properties', `${result.slug}.json`);

      if (existsSync(propertyPath)) {
        const propertyData: PropertyListing = JSON.parse(readFileSync(propertyPath, 'utf-8'));

        // Update property to mark it as from Huggable Whales
        propertyData.source = 'Huggable Whales';
        propertyData.customerId = customerIds.join(','); // Store all customer IDs for this address
        writeFileSync(propertyPath, JSON.stringify(propertyData, null, 2));

        // Check if broker was found and matches existing brokers
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
      } else {
        console.log(`  ⚠️  Property file not found`);
      }
    } else {
      errors++;
      console.log(`  ❌ Search failed`);
    }

    // Rate limiting - wait 2 seconds between requests
    if (processed < addressMap.size) {
      await sleep(2000);
    }
  }

  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 PROCESSING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total addresses processed: ${processed}`);
  console.log(`Successfully scraped: ${results.length}`);
  console.log(`Matched to existing brokers: ${matched.length}`);
  console.log(`Unassigned properties: ${unassigned.length}`);
  console.log(`Errors: ${errors}`);
  console.log('='.repeat(60) + '\n');

  // Save Huggable Whales data
  const huggableWhalesData = {
    source: 'Huggable Whales - Properties - 2_17_2026.csv',
    processedAt: new Date().toISOString(),
    filters: {
      targetStates: ['IL', 'NJ', 'MD', 'MA'],
      excludedStates: ['PA'],
      skippedPAProperties: skippedPA,
    },
    totalPropertiesInCSV: records.length,
    uniqueAddressesProcessed: addressMap.size,
    matched: matched.length,
    unassigned: unassigned.length,
    matchedProperties: matched,
    unassignedProperties: unassigned,
    allResults: results,
  };

  const outputPath = join(process.cwd(), 'data', 'huggable-whales-results.json');
  writeFileSync(outputPath, JSON.stringify(huggableWhalesData, null, 2));

  console.log(`💾 Results saved to: ${outputPath}\n`);

  // Create/update Unassigned Properties broker profile
  if (unassigned.length > 0) {
    const unassignedBroker = {
      slug: 'unassigned-properties',
      name: 'Unassigned',
      fullName: 'Unassigned Properties',
      company: 'Unassigned Properties',
      market: 'Multiple Markets',
      email: '',
      phone: '',
      title: 'Huggable Whales - Unassigned',
      buildings: unassigned.map(prop => ({
        address: prop.address,
        sqft: 0,
        propertyType: 'To be determined',
      })),
    };

    // Update brokers.json to include the unassigned broker
    const updatedBrokersData = { ...brokersData };

    // Remove existing unassigned broker if it exists
    updatedBrokersData.brokers = brokersData.brokers.filter(
      (b: any) => b.slug !== 'unassigned-properties'
    );

    // Add new unassigned broker
    updatedBrokersData.brokers.push(unassignedBroker);

    writeFileSync(brokersPath, JSON.stringify(updatedBrokersData, null, 2));
    console.log(`✅ Created "Unassigned Properties" broker profile with ${unassigned.length} properties\n`);
  }

  console.log('✨ Processing complete!\n');
}

main().catch(console.error);
