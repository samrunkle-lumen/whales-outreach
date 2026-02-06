const fs = require('fs');
const path = require('path');

// Generate a deterministic random suffix based on a string
function generateSuffix(str) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Generate 4 characters from the hash
  let suffix = '';
  let absHash = Math.abs(hash);
  for (let i = 0; i < 4; i++) {
    suffix += chars[absHash % chars.length];
    absHash = Math.floor(absHash / chars.length);
  }
  return suffix;
}

// Read brokers.json
const brokersPath = path.join(__dirname, '..', 'data', 'brokers.json');
const data = JSON.parse(fs.readFileSync(brokersPath, 'utf8'));

// Add suffix to each broker
data.brokers = data.brokers.map(broker => {
  if (!broker.slug.match(/-[a-zA-Z0-9]{4}$/)) {
    const suffix = generateSuffix(broker.slug + broker.fullName);
    return {
      ...broker,
      slug: `${broker.slug}-${suffix}`
    };
  }
  return broker;
});

// Write back to file
fs.writeFileSync(brokersPath, JSON.stringify(data, null, 2));
console.log('✓ Added random suffixes to all broker slugs');
