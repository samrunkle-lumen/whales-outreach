# Address Search Feature

## Overview

The Address Search feature allows users to search for commercial property addresses and automatically discover previous broker listings, contact information, and create dedicated property pages for outreach.

## Features

### 🔍 Address Search
- Search any commercial property address
- Automatically searches multiple broker listing sites (LoopNet, Crexi, CBRE, Cushman & Wakefield, JLL)
- Creates unique property pages for each address
- Stores property and broker information for future reference

### 📄 Property Pages
- Dedicated page for each searched address at `/property/[slug]`
- Displays property details (type, sqft, price, listing date)
- Shows broker contact information (name, company, email, phone)
- Links to original listings
- Solar opportunity CTA section

### 💾 Data Storage
- Properties stored in `/data/properties/` directory
- Each property has its own JSON file: `{slug}.json`
- Properties index maintained in `index.json`
- Persistent across sessions

## How It Works

### 1. User Flow
```
User enters address → Search API called →
Firecrawl searches broker sites → Property data extracted →
Property page created → User redirected to property page
```

### 2. Components

#### **AddressSearch Component** (`src/components/AddressSearch.tsx`)
- Input field for address entry
- Search button with loading state
- Error handling and validation
- Redirects to property page on success

#### **Search API** (`src/app/api/search-address/route.ts`)
- Creates slug from address
- Checks if property already exists
- Searches broker listing sites using Firecrawl
- Extracts broker and property information
- Saves data to JSON files
- Returns slug for navigation

#### **Property Page** (`src/app/property/[slug]/page.tsx`)
- Dynamic route for each property
- Loads property data from JSON
- Displays all property and broker details
- Shows search results used
- Provides outreach CTA

### 3. Data Structure

**Property Listing:**
```typescript
{
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
  createdAt: string;
}
```

## Search Strategy

The system searches for broker listings across multiple platforms:

1. **LoopNet** - `"[address]" site:loopnet.com`
2. **Crexi** - `"[address]" site:crexi.com`
3. **CBRE** - `"[address]" site:cbre.com`
4. **Cushman & Wakefield** - `"[address]" site:cushmanwakefield.com`
5. **JLL** - `"[address]" site:jll.com`
6. **General Search** - `"[address]" commercial real estate listing`

## Usage

### For Users

1. **Navigate to Dashboard**
   - Go to the home page at `/`

2. **Search for Address**
   - Find the "Find Broker Listings by Address" section
   - Enter a commercial property address
   - Click "Search"

3. **View Results**
   - Automatically redirected to property page
   - View broker contact information
   - See property details
   - Access original listings

### For Developers

**To enable actual scraping with Firecrawl:**

1. Install Firecrawl CLI (already in package.json)
2. Set up Firecrawl API key in `.env.local`:
   ```
   FIRECRAWL_API_KEY=your_key_here
   ```

3. Update `src/app/api/search-address/route.ts` to use Firecrawl API:
   ```typescript
   import FirecrawlApp from '@firecrawl/firecrawl-node';

   const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
   ```

## File Structure

```
lumen-outreach/
├── src/
│   ├── components/
│   │   └── AddressSearch.tsx          # Search component
│   ├── app/
│   │   ├── api/
│   │   │   └── search-address/
│   │   │       └── route.ts           # Search API endpoint
│   │   └── property/
│   │       └── [slug]/
│   │           └── page.tsx           # Property page template
│   └── lib/
│       └── types.ts                   # TypeScript interfaces
└── data/
    └── properties/
        ├── index.json                 # Properties index
        ├── README.md                  # Properties documentation
        └── {slug}.json               # Individual property files
```

## Future Enhancements

### Planned Features
- [ ] Real-time Firecrawl integration for live scraping
- [ ] Automatic broker email enrichment
- [ ] Property image extraction from listings
- [ ] Competitive listing analysis
- [ ] Email templates for broker outreach
- [ ] Solar potential calculator integration
- [ ] Export property reports to PDF
- [ ] Bulk address import/search
- [ ] Property status tracking (contacted, interested, etc.)
- [ ] Integration with CRM systems

### Firecrawl Integration
To fully enable scraping, implement:
1. Web search API calls
2. Page scraping for listing details
3. Data extraction for broker contacts
4. Image downloading for properties
5. Rate limiting and error handling

## Troubleshooting

### Property Not Found
- Check if address is valid
- Ensure property has broker listings
- Try different address formats

### API Errors
- Verify `.env.local` configuration
- Check Firecrawl API quota
- Review error logs

### Missing Data
- Some properties may not have complete information
- Broker contact info depends on listing availability
- Manual enrichment may be needed

## API Reference

### POST /api/search-address

**Request:**
```json
{
  "address": "123 Main Street, Philadelphia, PA 19103"
}
```

**Response (Success):**
```json
{
  "slug": "123-main-street-philadelphia-pa-19103",
  "exists": false,
  "message": "Property search completed"
}
```

**Response (Error):**
```json
{
  "error": "Failed to search address"
}
```

## Testing

To test the feature:

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Find the address search section

4. Enter a test address:
   - "1601 Market Street, Philadelphia, PA"
   - "30 Hudson Yards, New York, NY"
   - Any commercial property address

5. Check `/data/properties/` for created files

6. Visit the property page at `/property/[slug]`

## Contributing

When extending this feature:
1. Maintain TypeScript types in `types.ts`
2. Follow Lumen brand guidelines for UI
3. Add error handling for edge cases
4. Update this documentation
5. Test with various address formats

---

Built with ❤️ for Lumen Energy's broker outreach pipeline.
