import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

interface Property {
  address: string;
  sqft: number;
  propertyType: string;
  city?: string;
  state?: string;
  customerId?: string;
  systemSize?: number; // kW
  leaseValue?: number; // Annual NOI
  grossRoofArea?: number; // ft²
  utility?: string;
}

interface Owner {
  name: string;
  slug: string;
  propertyCount: number;
  properties: Property[];
}

interface OwnersData {
  owners: Owner[];
}

function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function slugify(text: string): string {
  const baseSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Add 4 random characters for uniqueness
  return `${baseSlug}-${generateRandomSuffix()}`;
}

function parseNumber(value: string | undefined): number {
  if (!value || value === '—' || value === '-') return 0;
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function extractPropertyType(buildingType: string): string {
  // Extract only the type before the comma
  if (!buildingType) return 'Commercial';
  const type = buildingType.split(',')[0].trim();
  return type || 'Commercial';
}

function extractStateFromAddress(address: string): string | undefined {
  // Match pattern like "City, ST 12345" or "City, ST"
  const match = address.match(/,\s*([A-Z]{2})\s*\d{5}?/) || address.match(/,\s*([A-Z]{2})$/);
  return match ? match[1] : undefined;
}

function extractCityFromAddress(address: string): string | undefined {
  // Extract city (text before last comma followed by state)
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return undefined;
}

async function main() {
  console.log('🔄 Processing owners CSV...\n');

  const csvPath = join(process.cwd(), 'CSVs', 'Huggable Whales - Properties - 2_19_2026.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true, // Handle Byte Order Mark
  });

  console.log(`📊 Found ${records.length} properties in CSV`);

  // Group by owner
  const ownerMap = new Map<string, Property[]>();

  for (const record of records) {
    const ownerName = record['Owner name']?.trim() || 'Unknown Owner';
    const address = record['Property address']?.trim();

    if (!address) continue;

    const property: Property = {
      address,
      sqft: parseNumber(record['Gross roof area (ft²)']),
      propertyType: extractPropertyType(record['Building type']),
      city: extractCityFromAddress(address),
      state: extractStateFromAddress(address),
      systemSize: parseNumber(record['CS - PV size (kW)']),
      leaseValue: parseNumber(record['CS - NOI']),
      grossRoofArea: parseNumber(record['Gross roof area (ft²)']),
      utility: record['Utility']?.trim() || undefined,
    };

    if (!ownerMap.has(ownerName)) {
      ownerMap.set(ownerName, []);
    }
    ownerMap.get(ownerName)!.push(property);
  }

  // Convert to owners array
  const owners: Owner[] = Array.from(ownerMap.entries())
    .map(([name, properties]) => ({
      name,
      slug: slugify(name),
      propertyCount: properties.length,
      properties: properties.sort((a, b) => b.sqft - a.sqft), // Sort by sqft descending
    }))
    .sort((a, b) => {
      // Sort by property count descending, then by name
      if (b.propertyCount !== a.propertyCount) {
        return b.propertyCount - a.propertyCount;
      }
      return a.name.localeCompare(b.name);
    });

  const ownersData: OwnersData = { owners };

  const outputPath = join(process.cwd(), 'data', 'owners.json');
  writeFileSync(outputPath, JSON.stringify(ownersData, null, 2));

  console.log('\n✅ Successfully processed owners CSV');
  console.log(`📊 Total owners: ${owners.length}`);
  console.log(`📊 Total properties: ${owners.reduce((sum, o) => sum + o.propertyCount, 0)}`);

  // Show top 10 owners by property count
  console.log('\n🏆 Top 10 owners by property count:');
  owners.slice(0, 10).forEach((owner, i) => {
    console.log(`${i + 1}. ${owner.name}: ${owner.propertyCount} properties`);
  });

  console.log('\n💾 Saved to data/owners.json\n');
}

main().catch(console.error);
