#!/usr/bin/env python3
"""
Find property listings for specific brokers by scraping property pages
and checking if the broker is listed as a contact
"""
import requests
import json
import time
import re
import os
from datetime import datetime

FIRECRAWL_API_KEY = "fc-827f134d09bf412096893bc0911f2b07"
BASE_URL = "https://api.firecrawl.dev/v1"

TARGET_STATES = ["NJ", "PA", "MD", "IL", "MA", "CT", "RI", "DE"]
STATE_NAMES = {
    "new jersey": "NJ", "pennsylvania": "PA", "maryland": "MD",
    "illinois": "IL", "massachusetts": "MA", "connecticut": "CT",
}

# Load broker info from data file
def load_brokers():
    script_dir = os.path.dirname(__file__)
    brokers_file = os.path.join(script_dir, "..", "data", "brokers.json")
    with open(brokers_file, "r") as f:
        data = json.load(f)

    # Build lookup by name (lowercase)
    broker_lookup = {}
    for b in data["brokers"]:
        name = b["fullName"].lower()
        broker_lookup[name] = b
        # Also add last name for partial matching
        parts = name.split()
        if len(parts) >= 2:
            last_name = parts[-1]
            broker_lookup[f"_{last_name}"] = b  # prefix with _ to avoid conflicts
    return broker_lookup, data["brokers"]


def search_properties(base_url, query, limit=50):
    """Search for property URLs"""
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "url": base_url,
        "search": query,
        "limit": limit
    }

    try:
        response = requests.post(f"{BASE_URL}/map", headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            links = response.json().get("links", [])
            # Filter for property URLs
            return [url for url in links if any(x in url.lower() for x in ["property", "listing", "properties", "listings"])]
        return []
    except Exception as e:
        print(f"  Error: {e}")
        return []


def scrape_page(url):
    """Scrape a page for markdown"""
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {"url": url, "formats": ["markdown"]}

    try:
        response = requests.post(f"{BASE_URL}/scrape", headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            return response.json().get("data", {}).get("markdown", "")
        return ""
    except:
        return ""


def find_broker_on_page(md, broker_lookup):
    """Check if any known broker appears on the page"""
    md_lower = md.lower()

    for name, broker in broker_lookup.items():
        if name.startswith("_"):
            continue  # Skip partial name entries
        if name in md_lower:
            return broker

    return None


def parse_property(md, url):
    """Extract property details"""
    # Extract address
    state_pattern = r'(NJ|PA|MD|IL|MA|CT|New Jersey|Pennsylvania|Maryland|Illinois|Massachusetts|Connecticut)'
    match = re.search(
        rf'(\d+[^,\n]{{5,50}}),\s*([A-Za-z][A-Za-z\s]{{2,30}}),\s*({state_pattern})\s*(\d{{5}})?',
        md, re.IGNORECASE
    )

    if not match:
        return None

    street = match.group(1).strip()
    city = match.group(2).strip()
    state = match.group(3).strip()
    zip_code = match.group(5) if match.lastindex >= 5 and match.group(5) else ""

    # Clean up
    street = re.sub(r'\[.*?\]\(.*?\)', '', street)
    street = re.sub(r'[#*_`]', '', street).strip()

    if len(street) < 5 or not re.match(r'^\d+\s', street):
        return None

    state = STATE_NAMES.get(state.lower(), state.upper())
    if state not in TARGET_STATES:
        return None

    # Extract sqft
    sqft = 0
    sqft_match = re.search(r'([\d,]+)\s*(?:SF|sq\.?\s*ft|square feet)', md, re.IGNORECASE)
    if sqft_match:
        sqft = int(sqft_match.group(1).replace(",", ""))

    if sqft < 10000:
        return None

    # Property type
    prop_type = "Industrial"
    for keyword, ptype in {"warehouse": "Warehouse", "distribution": "Distribution", "flex": "Flex", "logistics": "Logistics"}.items():
        if keyword in md.lower():
            prop_type = ptype
            break

    full_address = f"{street}, {city}, {state}"
    if zip_code:
        full_address += f" {zip_code}"

    # Extract property name
    property_name = ""
    name_patterns = [
        r'#\s*([A-Z][A-Za-z0-9\s\-&]+(?:Distribution|Logistics|Business|Industrial|Commerce|Trade|Corporate|Flex|Warehouse|Fulfillment)\s*(?:Center|Park|Campus|Complex|Facility|Hub)?)',
        rf'({city}\s+(?:Distribution|Logistics|Business|Industrial|Commerce)\s+(?:Center|Park|Campus|Complex|Facility))',
    ]
    for pattern in name_patterns:
        name_match = re.search(pattern, md, re.IGNORECASE | re.MULTILINE)
        if name_match:
            potential_name = name_match.group(1).strip()
            potential_name = re.sub(r'\s+', ' ', potential_name)
            if potential_name.lower() != street.lower() and len(potential_name) > 5 and len(potential_name) < 60:
                property_name = potential_name
                break

    result = {
        "address": full_address,
        "city": city,
        "state": state,
        "sqft": sqft,
        "propertyType": prop_type,
        "listingUrl": url
    }
    if property_name:
        result["name"] = property_name

    return result


def main():
    print("="*60)
    print("Find Broker Listings")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    broker_lookup, all_brokers = load_brokers()
    print(f"Loaded {len(all_brokers)} brokers")

    # Brokers with no buildings
    empty_brokers = [b for b in all_brokers if not b.get("buildings")]
    print(f"Brokers needing listings: {len(empty_brokers)}")

    # Search configurations
    searches = [
        ("https://www.cushmanwakefield.com", "New Jersey industrial warehouse"),
        ("https://www.cushmanwakefield.com", "Pennsylvania warehouse industrial"),
        ("https://www.cushmanwakefield.com", "Maryland industrial warehouse"),
        ("https://www.cushmanwakefield.com", "Illinois Chicago industrial"),
        ("https://www.cushmanwakefield.com", "Massachusetts Boston industrial"),
        ("https://www.cbre.com", "New Jersey industrial for lease"),
        ("https://www.cbre.com", "Pennsylvania industrial warehouse"),
        ("https://www.cbre.com", "Maryland industrial for lease"),
        ("https://www.cbre.com", "Illinois industrial Chicago"),
        ("https://www.cbre.com", "Massachusetts industrial Boston"),
        ("https://www.colliers.com", "New Jersey industrial warehouse"),
        ("https://www.colliers.com", "Pennsylvania industrial warehouse"),
        ("https://www.colliers.com", "Illinois Chicago industrial"),
        ("https://www.colliers.com", "Massachusetts Boston industrial"),
        ("https://property.jll.com", "New Jersey industrial"),
        ("https://property.jll.com", "Pennsylvania industrial"),
        ("https://property.jll.com", "Maryland industrial"),
        ("https://property.jll.com", "Illinois industrial"),
        ("https://property.jll.com", "Massachusetts industrial"),
    ]

    all_urls = set()
    for base_url, query in searches:
        print(f"\nSearching: {base_url} - {query}")
        urls = search_properties(base_url, query, limit=30)
        print(f"  Found {len(urls)} URLs")
        all_urls.update(urls)
        time.sleep(0.3)

    print(f"\nTotal unique property URLs: {len(all_urls)}")

    # Scrape and check for brokers
    found_listings = {}  # broker_slug -> list of properties
    seen_addresses = set()

    for i, url in enumerate(list(all_urls)[:100]):
        print(f"[{i+1}/{min(len(all_urls), 100)}] {url[:60]}...")

        md = scrape_page(url)
        if not md:
            continue

        # Check if any broker is on this page
        broker = find_broker_on_page(md, broker_lookup)
        if broker:
            prop = parse_property(md, url)
            if prop:
                addr_key = prop["address"].lower()
                if addr_key not in seen_addresses:
                    seen_addresses.add(addr_key)
                    slug = broker["slug"]
                    if slug not in found_listings:
                        found_listings[slug] = []
                    found_listings[slug].append(prop)
                    print(f"  ✓ Found listing for {broker['fullName']}: {prop['city']}, {prop['state']} - {prop['sqft']:,} SF")

        time.sleep(0.3)

    # Save results
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "scraped")
    os.makedirs(output_dir, exist_ok=True)

    output_file = os.path.join(output_dir, "broker_listings.json")
    with open(output_file, "w") as f:
        json.dump(found_listings, f, indent=2)

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    total_found = sum(len(props) for props in found_listings.values())
    print(f"Found {total_found} listings for {len(found_listings)} brokers")

    for slug, props in sorted(found_listings.items(), key=lambda x: -len(x[1])):
        broker = next((b for b in all_brokers if b["slug"] == slug), None)
        if broker:
            print(f"  {broker['fullName']}: {len(props)} listings")

    print(f"\nResults saved to: {output_file}")
    print("Run merge_broker_listings.py to add these to brokers.json")


if __name__ == "__main__":
    main()
