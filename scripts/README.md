# Huggable Whales Processing Scripts

Scripts for bulk processing properties from the "Huggable Whales" CSV file.

## Overview

These scripts extract property addresses from the CSV, scrape each address for broker listings using Firecrawl, cross-reference with existing broker data, and organize properties into:
- **Matched properties** - Properties with brokers that match existing brokers in the system
- **Unassigned properties** - Properties without broker matches (grouped under "Unassigned Properties" broker)

## Files

### `process-huggable-whales-test.ts`
**Test mode** - Processes only the first 10 unique addresses to verify everything works.

**Usage:**
```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the test
npm run process-whales-test
```

**Duration:** ~20 seconds
**Output:** `data/huggable-whales-test-results.json`

### `process-huggable-whales.ts`
**Full processing** - Processes all 2,310 properties from the CSV.

**Usage:**
```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the full processing
npm run process-whales
```

**Duration:** ~77 minutes (2 seconds per address for rate limiting)
**Output:** `data/huggable-whales-results.json`

## Important Notes

### Before Running

1. **Start the dev server** - The scripts call `http://localhost:3000/api/search-address`
   ```bash
   npm run dev
   ```

2. **Firecrawl API Key** - Ensure your Firecrawl API key is set in `.env.local`
   ```
   FIRECRAWL_API_KEY=your_key_here
   ```

3. **API Rate Limits** - Scripts include 2-second delays between requests to avoid overwhelming the API

### What the Scripts Do

1. **Parse CSV** - Extracts all addresses from "Property address" column
2. **Handle Duplicates** - Identifies unique addresses and tracks customer IDs for duplicates
3. **Scrape Addresses** - Calls the search-address API for each unique address
4. **Extract Broker Info** - Uses Firecrawl to find and extract broker contact information
5. **Cross-Reference** - Matches found brokers against existing brokers in `data/brokers.json`
6. **Create Property Files** - Each address gets a JSON file in `data/properties/{slug}.json`
7. **Tag Source** - Marks properties with `source: "Huggable Whales"` and `customerId`
8. **Generate Reports** - Creates summary JSON with matched/unassigned breakdowns

### Output Structure

**huggable-whales-results.json:**
```json
{
  "source": "Huggable Whales - Properties - 2_17_2026.csv",
  "processedAt": "2026-02-17T...",
  "totalProperties": 2311,
  "uniqueAddresses": 2310,
  "duplicateAddresses": 1,
  "matched": 150,
  "unassigned": 2160,
  "matchedProperties": [...],
  "unassignedProperties": [...],
  "allResults": [...]
}
```

### Unassigned Properties Broker

If unassigned properties are found, the scripts automatically create/update an "Unassigned Properties" broker profile in `data/brokers.json`:

```json
{
  "slug": "unassigned-properties",
  "name": "Unassigned",
  "fullName": "Unassigned Properties",
  "company": "Unassigned Properties",
  "market": "Multiple Markets",
  "buildings": [...]
}
```

## Workflow

### Recommended Workflow

1. **Test first:**
   ```bash
   npm run dev                    # Start server
   npm run process-whales-test    # Process 10 addresses
   ```

2. **Review test results:**
   - Check `data/huggable-whales-test-results.json`
   - Verify properties were created in `data/properties/`
   - Check broker matching accuracy

3. **Run full processing:**
   ```bash
   npm run process-whales         # Process all 2,310 addresses
   ```

4. **Monitor progress:**
   - Scripts show real-time progress in console
   - Each address displays: `[#/total] Processing: address`
   - Shows ✅ for matched, ⚪ for unassigned, ❌ for errors

5. **Review results:**
   - Check `data/huggable-whales-results.json` for summary
   - View individual property files in `data/properties/`
   - Check updated `data/brokers.json` for "Unassigned Properties" profile

## Troubleshooting

### "Connection refused" error
- Make sure dev server is running (`npm run dev`)
- Verify server is on `http://localhost:3000`

### API rate limit errors
- Firecrawl may have rate limits
- Scripts already include 2-second delays
- Increase delay in code if needed: `await sleep(5000)` for 5 seconds

### Out of API credits
- Check Firecrawl dashboard for quota
- Test mode helps verify before using full quota

### Properties not matched
- Review extraction regex in `src/app/api/search-address/route.ts`
- Some properties may legitimately not have broker listings
- Check `scrapedContent` in property JSON files to see what was found

## Data Privacy

- CSV contains customer IDs and property data
- Customer IDs are stored in property files for reference
- Do not commit sensitive data to version control
- Add `data/properties/*.json` to `.gitignore` if needed

## Cost Estimation

- **Test mode:** ~10 Firecrawl API calls
- **Full processing:** ~2,310 Firecrawl API calls (search + scrape per address)
- Check Firecrawl pricing: https://www.firecrawl.dev/pricing

---

**Questions?** Check the main ADDRESS_SEARCH_README.md for more details on the search functionality.
