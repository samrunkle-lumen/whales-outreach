import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Property {
  address: string;
  sqft: number;
  propertyType: string;
  city?: string;
  state?: string;
  customerId?: string;
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

async function main() {
  console.log('🔄 Converting brokers.json to owners.json structure...\n');

  const brokersPath = join(process.cwd(), 'data', 'brokers.json');
  const brokersData = JSON.parse(readFileSync(brokersPath, 'utf-8'));

  // For now, create a placeholder structure
  // The unassigned properties will be under "Unknown Owner"
  // User will upload owner data later

  const unassignedBroker = brokersData.brokers.find(
    (b: any) => b.slug === 'unassigned-properties'
  );

  const owners: Owner[] = [];

  if (unassignedBroker && unassignedBroker.buildings) {
    // For now, group all properties under "Unknown Owner"
    // This will be updated when the user uploads owner data
    owners.push({
      name: 'Unknown Owner',
      slug: 'unknown-owner',
      propertyCount: unassignedBroker.buildings.length,
      properties: unassignedBroker.buildings.map((building: any) => ({
        address: building.address,
        sqft: building.sqft || 0,
        propertyType: building.propertyType || 'Commercial',
        city: building.city,
        state: building.state,
      })),
    });
  }

  const ownersData: OwnersData = {
    owners,
  };

  const outputPath = join(process.cwd(), 'data', 'owners.json');
  writeFileSync(outputPath, JSON.stringify(ownersData, null, 2));

  console.log('✅ Created owners.json with placeholder structure');
  console.log(`📊 Total owners: ${owners.length}`);
  console.log(`📊 Total properties: ${owners.reduce((sum, o) => sum + o.propertyCount, 0)}`);
  console.log('\n💡 Upload owner data CSV to properly organize properties by owner\n');
}

main().catch(console.error);
