#!/usr/bin/env node
/**
 * Merge broker and property data from MD and NJ/PA JSON files
 */

const fs = require('fs');
const path = require('path');

const MD_FILE = '/Users/sam/Coding/Broker Landing Pages/lumen-solar-landing-pages-main/maryland-industrial-properties.json';
const NJ_PA_FILE = '/Users/sam/Coding/Broker Landing Pages/lumen-solar-landing-pages-main/nj_pa_properties_with_brokers.json';
const OUTPUT_FILE = '/Users/sam/Desktop/lumen-outreach/data/brokers.json';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .trim();
}

function getFirstBrokerName(brokerString) {
  // Handle multiple brokers separated by commas
  const parts = brokerString.split(',');
  return parts[0].trim();
}

function parseFullAddress(address) {
  // Parse "123 Street, City, ST" format
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].split(' ');
    return {
      street: parts.slice(0, -2).join(', '),
      city: parts[parts.length - 2],
      state: stateZip[0]
    };
  } else if (parts.length === 2) {
    const stateZip = parts[1].split(' ');
    return {
      street: parts[0],
      city: '',
      state: stateZip[0]
    };
  }
  return { street: address, city: '', state: '' };
}

// Load data
console.log('Loading MD data...');
const mdData = JSON.parse(fs.readFileSync(MD_FILE, 'utf-8'));

console.log('Loading NJ/PA data...');
const njPaData = JSON.parse(fs.readFileSync(NJ_PA_FILE, 'utf-8'));

// Track firms and brokers
const firmsMap = new Map();
const brokersMap = new Map();

// Add JLL as a firm (all data is from JLL)
firmsMap.set('JLL', {
  name: 'JLL',
  slug: 'jll',
  market: 'National'
});

// Process MD data
console.log('\nProcessing MD data...');
for (const [brokerName, properties] of Object.entries(mdData.properties_by_broker)) {
  const brokerInfo = mdData.brokers.find(b => b.name === brokerName) || {};
  const slug = slugify(brokerName);

  if (!brokersMap.has(slug)) {
    brokersMap.set(slug, {
      slug,
      name: brokerName.split(' ')[0],
      fullName: brokerName,
      company: 'JLL',
      market: 'Maryland',
      email: brokerInfo.email && brokerInfo.email !== 'null' && brokerInfo.email !== 'not provided' ? brokerInfo.email : '',
      phone: brokerInfo.phone && brokerInfo.phone !== 'null' && brokerInfo.phone !== 'not provided' ? brokerInfo.phone : '',
      title: brokerInfo.title || '',
      profileUrl: brokerInfo.profile_url || '',
      linkedIn: brokerInfo.linkedin || '',
      buildings: []
    });
  }

  const broker = brokersMap.get(slug);

  for (const prop of properties) {
    broker.buildings.push({
      address: prop.full_address,
      sqft: prop.sqft,
      propertyType: prop.property_type || 'Industrial',
      listingUrl: prop.jll_url,
      clearHeight: prop.clear_height_ft ? `${prop.clear_height_ft}'` : undefined
    });
  }
}

// Process NJ/PA data
console.log('Processing NJ/PA data...');
for (const prop of njPaData) {
  // Skip properties with malformed data
  if (!prop.full_address || prop.city?.startsWith('![') || prop.street?.includes('http')) {
    continue;
  }

  const brokerString = prop.lead_broker || 'Unknown';
  const brokerName = getFirstBrokerName(brokerString);

  if (brokerName === '' || brokerName === 'Unknown') continue;

  const slug = slugify(brokerName);

  // Determine market based on state
  let market = 'National';
  if (prop.state === 'NJ') market = 'New Jersey';
  else if (prop.state === 'PA') market = 'Pennsylvania';

  if (!brokersMap.has(slug)) {
    brokersMap.set(slug, {
      slug,
      name: brokerName.split(' ')[0],
      fullName: brokerName,
      company: 'JLL',
      market,
      email: '',
      phone: '',
      title: '',
      profileUrl: '',
      buildings: []
    });
  }

  const broker = brokersMap.get(slug);

  // Add building if not duplicate
  const addressKey = prop.full_address.toLowerCase();
  const existingAddresses = broker.buildings.map(b => b.address.toLowerCase());

  if (!existingAddresses.includes(addressKey)) {
    broker.buildings.push({
      address: prop.full_address,
      sqft: prop.sqft,
      propertyType: prop.property_type || 'Industrial',
      listingUrl: prop.source_url
    });
  }
}

// Convert to arrays
const firms = Array.from(firmsMap.values());
const brokers = Array.from(brokersMap.values())
  .filter(b => b.buildings.length > 0)
  .sort((a, b) => b.buildings.length - a.buildings.length);

// Create output
const output = {
  firms,
  brokers
};

// Write output
console.log('\nWriting output...');
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

// Summary
console.log('\n=== Summary ===');
console.log(`Firms: ${firms.length}`);
console.log(`Brokers: ${brokers.length}`);
console.log(`Total properties: ${brokers.reduce((sum, b) => sum + b.buildings.length, 0)}`);

console.log('\nTop brokers by property count:');
brokers.slice(0, 10).forEach(b => {
  console.log(`  ${b.fullName}: ${b.buildings.length} properties`);
});
