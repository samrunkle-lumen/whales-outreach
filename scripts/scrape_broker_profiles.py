#!/usr/bin/env python3
"""
Scrape property listings for specific brokers by searching their profile pages
"""
import requests
import json
import time
import re
import os
from datetime import datetime

FIRECRAWL_API_KEY = "fc-827f134d09bf412096893bc0911f2b07"
BASE_URL = "https://api.firecrawl.dev/v1"

# Target states
TARGET_STATES = ["NJ", "PA", "MD", "IL", "MA", "CT", "RI", "DE"]
STATE_NAMES = {
    "new jersey": "NJ", "pennsylvania": "PA", "maryland": "MD",
    "illinois": "IL", "massachusetts": "MA", "connecticut": "CT",
    "rhode island": "RI", "delaware": "DE"
}

# Brokers to search for
BROKERS = [
    {"name": "Adam Tyler", "company": "Cushman & Wakefield", "email": "adam.tyler@cushwake.com", "phone": "312-470-1840"},
    {"name": "Alex Cantu", "company": "Colliers", "email": "alex.cantu@colliers.com", "phone": "317-503-5642"},
    {"name": "Alex Davenport", "company": "Colliers", "email": "alex.davenport@colliers.com", "phone": "317-556-3676"},
    {"name": "Bo Cashman", "company": "CBRE", "email": "bo.cashman@cbre.com", "phone": "410-244-3188"},
    {"name": "Brad Ruppel", "company": "CBRE", "email": "brad.ruppel@cbre.com", "phone": "610-251-5139"},
    {"name": "Brian Fiumara", "company": "CBRE", "email": "brian.fiumara@cbre.com", "phone": "610-580-8672"},
    {"name": "Chris Skeffington", "company": "CBRE", "email": "chris.skeffington@cbre.com", "phone": "781-771-2188"},
    {"name": "Daniel Hincks", "company": "Colliers", "email": "daniel.hincks@colliers.com", "phone": "857-234-4868"},
    {"name": "David Coffman", "company": "JLL", "email": "david.coffman@jll.com", "phone": "617-531-4243"},
    {"name": "Ed Halaburt", "company": "JLL", "email": "ed.halaburt@jll.com", "phone": "312-228-2007"},
    {"name": "Frank Petz", "company": "Colliers", "email": "frank.petz@colliers.com", "phone": "617-750-4500"},
    {"name": "Jason Lundy", "company": "JLL", "email": "jason.lundy@jll.com", "phone": "732-850-5326"},
    {"name": "Jeff Devine", "company": "Colliers", "email": "jeff.devine@colliers.com", "phone": "847-732-6070"},
    {"name": "Jeff Lockard", "company": "JLL", "email": "jeff.lockard@jll.com", "phone": "215-990-1889"},
    {"name": "Jim Carpenter", "company": "Cushman & Wakefield", "email": "jim.carpenter@cushwake.com", "phone": "312-470-3830"},
    {"name": "Joe Hill", "company": "CBRE", "email": "joseph.hill1@cbre.com", "phone": "610-386-6022"},
    {"name": "John Plower", "company": "JLL", "email": "john.plower@jll.com", "phone": "484-571-1879"},
    {"name": "Jonathan Beard", "company": "CBRE", "email": "jonathan.beard@cbre.com", "phone": "410-244-3183"},
    {"name": "Kevin Lammers", "company": "JLL", "email": "kevin.lammers@jll.com", "phone": "856-448-3226"},
    {"name": "Kurt Sarbaugh", "company": "JLL", "email": "kurt.sarbaugh@jll.com", "phone": "312-300-7320"},
    {"name": "Lenny Pierce", "company": "JLL", "email": "lenny.pierce@jll.com", "phone": "617-531-4120"},
    {"name": "Matt Sherry", "company": "Colliers", "email": "matthew.sherry@colliers.com", "phone": "401-378-2844"},
    {"name": "Megan Barker", "company": "Cushman & Wakefield", "email": "megan.barker@cushwake.com", "phone": "312-424-8202"},
    {"name": "Michael Hines", "company": "CBRE", "email": "michael.hines@cbre.com", "phone": "610-251-5185"},
    {"name": "Michael Restivo", "company": "JLL", "email": "michael.restivo@jll.com", "phone": "617-848-5858"},
    {"name": "Mike Tenteris", "company": "Cushman & Wakefield", "email": "michael.tenteris@cushwake.com", "phone": "312-470-3832"},
    {"name": "Nick Stefans", "company": "JLL", "email": "nicholas.stefans@jll.com", "phone": "908-202-3180"},
    {"name": "PJ Oreilly", "company": "CBRE", "email": "pj.oreilly@cbre.com", "phone": "203-521-7786"},
    {"name": "Ross Bratcher", "company": "JLL", "email": "ross.bratcher@jll.com", "phone": ""},
    {"name": "Roy Sandeman", "company": "CBRE", "email": "roy.sandeman@cbre.com", "phone": "401-536-1859"},
    {"name": "Ryan Cottone", "company": "JLL", "email": "ryan.cottone@jll.com", "phone": "610-733-5271"},
    {"name": "Scott Dragos", "company": "CBRE", "email": "scott.dragos@cbre.com", "phone": "508-317-4253"},
    {"name": "Sean Devaney", "company": "JLL", "email": "sean.devaney@jll.com", "phone": "312-228-2868"},
    {"name": "Steve Disse", "company": "Colliers", "email": "steve.disse@colliers.com", "phone": "312-485-6470"},
    {"name": "Tommy Hovey", "company": "JLL", "email": "tommy.hovey@jll.com", "phone": "860-944-3851"},
    {"name": "Tyler Peck", "company": "JLL", "email": "tyler.peck@jll.com", "phone": "908-963-4743"},
    {"name": "Tyler Ziebel", "company": "Colliers", "email": "tyler.ziebel@colliers.com", "phone": "217-552-0618"},
    {"name": "Will McCormack", "company": "JLL", "email": "william.mccormack@jll.com", "phone": "203-918-2699"},
]

# Company base URLs for profile searches
COMPANY_URLS = {
    "Cushman & Wakefield": "https://www.cushmanwakefield.com",
    "CBRE": "https://www.cbre.com",
    "Colliers": "https://www.colliers.com",
    "JLL": "https://property.jll.com",
}


def search_broker_profile(broker):
    """Search for a broker's profile page"""
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    company = broker["company"]
    name_parts = broker["name"].lower().split()

    base_url = COMPANY_URLS.get(company, "")
    if not base_url:
        return []

    # Search for broker profile
    search_query = f"{broker['name']} industrial properties"

    data = {
        "url": base_url,
        "search": search_query,
        "limit": 30
    }

    try:
        response = requests.post(f"{BASE_URL}/map", headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            links = response.json().get("links", [])
            # Filter for property/listing URLs
            property_urls = [
                url for url in links
                if any(x in url.lower() for x in ["property", "listing", "properties", "listings"])
            ]
            return property_urls
        else:
            print(f"  Error searching for {broker['name']}: {response.status_code}")
            return []
    except Exception as e:
        print(f"  Exception searching for {broker['name']}: {e}")
        return []


def scrape_property(url):
    """Scrape a single property page"""
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "url": url,
        "formats": ["markdown"]
    }

    try:
        response = requests.post(f"{BASE_URL}/scrape", headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"    Exception: {e}")
        return None


def clean_address(text):
    """Clean up address text"""
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'!\[.*?\]', '', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'%[0-9A-Fa-f]{2}', '', text)
    text = re.sub(r'[#*_`]', '', text)
    return text.strip()


def parse_property(scrape_data, url, broker):
    """Parse property details from scraped markdown"""
    if not scrape_data or "data" not in scrape_data:
        return None

    md = scrape_data["data"].get("markdown", "")

    # Check if broker's name appears on the page
    broker_on_page = broker["name"].lower() in md.lower()

    # Extract address
    state_pattern = r'(NJ|PA|MD|IL|MA|CT|RI|DE|New Jersey|Pennsylvania|Maryland|Illinois|Massachusetts|Connecticut|Rhode Island|Delaware)'
    address_match = re.search(
        rf'(\d+[^,\n]{{5,50}}),\s*([A-Za-z][A-Za-z\s]{{2,30}}),\s*({state_pattern})\s*(\d{{5}})?',
        md, re.IGNORECASE
    )

    if not address_match:
        return None

    street = clean_address(address_match.group(1).strip())
    city = clean_address(address_match.group(2).strip())
    state = address_match.group(3).strip()
    zip_code = address_match.group(5) if address_match.lastindex >= 5 and address_match.group(5) else ""

    # Validate
    if len(street) < 5 or len(street) > 100:
        return None
    if not re.match(r'^\d+\s', street):
        return None
    if any(x in street.lower() for x in ['http', 'www', '.com', 'svg', 'png']):
        return None

    # Normalize state
    state = STATE_NAMES.get(state.lower(), state.upper())
    if state not in TARGET_STATES:
        return None

    full_address = f"{street}, {city}, {state}"
    if zip_code:
        full_address += f" {zip_code}"

    # Extract square footage
    sqft_patterns = [
        r'([\d,]+)\s*(?:SF|sq\.?\s*ft|square feet)',
        r'([\d,]+)\s*(?:RSF|rentable)',
    ]

    sqft = 0
    for pattern in sqft_patterns:
        sqft_match = re.search(pattern, md, re.IGNORECASE)
        if sqft_match:
            sqft = int(sqft_match.group(1).replace(",", ""))
            if sqft >= 10000:
                break

    if sqft < 10000:
        return None

    # Property type
    prop_type = "Industrial"
    type_keywords = {
        "warehouse": "Warehouse", "distribution": "Distribution",
        "flex": "Flex", "manufacturing": "Manufacturing",
        "logistics": "Logistics"
    }
    for keyword, ptype in type_keywords.items():
        if keyword in md.lower():
            prop_type = ptype
            break

    return {
        "address": full_address,
        "street": street,
        "city": city,
        "state": state,
        "zip_code": zip_code,
        "sqft": sqft,
        "property_type": prop_type,
        "lead_broker": broker["name"],
        "broker_email": broker["email"],
        "broker_phone": broker["phone"],
        "source": broker["company"],
        "source_url": url,
        "broker_on_page": broker_on_page
    }


def main():
    """Main entry point"""
    print("="*60)
    print("Broker Profile Scraper")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Searching for {len(BROKERS)} brokers")
    print("="*60)

    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "scraped")
    os.makedirs(output_dir, exist_ok=True)

    all_properties = []
    seen_addresses = set()

    for i, broker in enumerate(BROKERS):
        print(f"\n[{i+1}/{len(BROKERS)}] {broker['name']} ({broker['company']})")

        # Search for property URLs
        urls = search_broker_profile(broker)
        print(f"  Found {len(urls)} property URLs")

        if not urls:
            time.sleep(0.5)
            continue

        broker_properties = []

        # Scrape up to 10 properties per broker
        for j, url in enumerate(urls[:10]):
            print(f"    [{j+1}/{min(len(urls), 10)}] {url[:60]}...")

            result = scrape_property(url)
            if result:
                prop = parse_property(result, url, broker)
                if prop:
                    addr_key = prop["address"].lower()
                    if addr_key not in seen_addresses:
                        seen_addresses.add(addr_key)
                        broker_properties.append(prop)
                        print(f"      ✓ {prop['city']}, {prop['state']} - {prop['sqft']:,} SF")

            time.sleep(0.3)

        all_properties.extend(broker_properties)
        print(f"  Added {len(broker_properties)} properties for {broker['name']}")
        time.sleep(0.5)

    # Save results
    output_file = os.path.join(output_dir, "broker_profiles_properties.json")
    with open(output_file, "w") as f:
        json.dump(all_properties, f, indent=2)

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total properties: {len(all_properties)}")

    by_broker = {}
    for prop in all_properties:
        broker = prop["lead_broker"]
        by_broker[broker] = by_broker.get(broker, 0) + 1

    print("\nProperties by broker:")
    for broker, count in sorted(by_broker.items(), key=lambda x: -x[1]):
        print(f"  {broker}: {count}")

    print(f"\nResults saved to: {output_file}")


if __name__ == "__main__":
    main()
