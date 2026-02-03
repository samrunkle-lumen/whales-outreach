#!/usr/bin/env python3
"""
Scrape industrial properties from multiple CRE sites using Firecrawl
Targets: Cushman & Wakefield, CBRE, Marcus & Millichap, Northmarq, Newmark, Colliers
Markets: NJ, PA, MD, IL, MA
"""
import requests
import json
import time
import re
import os
from datetime import datetime

# Use the user's API key
FIRECRAWL_API_KEY = "fc-827f134d09bf412096893bc0911f2b07"
BASE_URL = "https://api.firecrawl.dev/v1"

# Target states
TARGET_STATES = ["NJ", "PA", "MD", "IL", "MA"]
STATE_NAMES = {
    "new jersey": "NJ",
    "pennsylvania": "PA",
    "maryland": "MD",
    "illinois": "IL",
    "massachusetts": "MA"
}

# Common first and last names to validate broker names
COMMON_FIRST_NAMES = {
    "adam", "alan", "alex", "andrew", "anthony", "benjamin", "blake", "brad", "brandon", "brian",
    "bruce", "carl", "charles", "chris", "christopher", "craig", "dan", "daniel", "dave", "david",
    "dean", "dennis", "derek", "dominic", "donald", "doug", "douglas", "drew", "edward", "eric",
    "frank", "gary", "george", "greg", "gregory", "howard", "jack", "james", "jason", "jeff",
    "jeffrey", "jeremy", "jim", "joe", "john", "jonathan", "jordan", "joseph", "josh", "joshua",
    "justin", "keith", "ken", "kenneth", "kevin", "kyle", "larry", "lee", "mark", "martin",
    "matt", "matthew", "michael", "mike", "nathan", "nick", "nicholas", "patrick", "paul", "peter",
    "philip", "randy", "ray", "raymond", "richard", "rick", "rob", "robert", "roger", "ron",
    "ronald", "ryan", "sam", "samuel", "scott", "sean", "shane", "stephen", "steve", "steven",
    "ted", "thomas", "tim", "timothy", "todd", "tom", "tony", "travis", "tyler", "vincent",
    "walter", "wayne", "william", "abby", "allison", "amanda", "amy", "andrea", "angela", "anna",
    "ashley", "barbara", "beth", "betty", "brenda", "carol", "caroline", "catherine", "christina",
    "christine", "cindy", "cynthia", "debbie", "deborah", "diane", "donna", "elizabeth", "emily",
    "erin", "heather", "helen", "jamie", "jane", "janet", "jennifer", "jessica", "jill", "julia",
    "julie", "karen", "kate", "katherine", "kathleen", "kathy", "kelly", "kim", "kimberly", "laura",
    "lauren", "leslie", "linda", "lisa", "lori", "margaret", "maria", "marie", "mary", "megan",
    "melissa", "michelle", "nancy", "nicole", "pamela", "patricia", "rachel", "rebecca", "robin",
    "sandra", "sara", "sarah", "sharon", "stephanie", "susan", "teresa", "tiffany", "tracy", "victoria"
}

# Organization configurations
ORGANIZATIONS = {
    "cushman_wakefield": {
        "name": "Cushman & Wakefield",
        "base_url": "https://www.cushmanwakefield.com",
        "searches": [
            "New Jersey industrial for lease",
            "Pennsylvania warehouse",
            "Maryland industrial",
            "Illinois warehouse",
            "Massachusetts industrial",
            "Boston warehouse"
        ]
    },
    "cbre": {
        "name": "CBRE",
        "base_url": "https://www.cbre.com",
        "searches": [
            "New Jersey industrial",
            "Pennsylvania warehouse",
            "Maryland industrial",
            "Chicago warehouse",
            "Massachusetts industrial",
            "Boston industrial"
        ]
    },
    "marcus_millichap": {
        "name": "Marcus & Millichap",
        "base_url": "https://www.marcusmillichap.com",
        "searches": [
            "New Jersey industrial",
            "Pennsylvania industrial",
            "Maryland warehouse",
            "Illinois industrial",
            "Massachusetts warehouse"
        ]
    },
    "northmarq": {
        "name": "Northmarq",
        "base_url": "https://www.northmarq.com",
        "searches": [
            "industrial New Jersey",
            "warehouse Pennsylvania",
            "industrial Maryland",
            "warehouse Illinois",
            "industrial Massachusetts"
        ]
    },
    "newmark": {
        "name": "Newmark",
        "base_url": "https://www.nmrk.com",
        "searches": [
            "industrial NJ",
            "warehouse PA",
            "industrial MD",
            "warehouse IL",
            "industrial MA",
            "Boston warehouse"
        ]
    },
    "colliers": {
        "name": "Colliers",
        "base_url": "https://www.colliers.com",
        "searches": [
            "New Jersey industrial",
            "Pennsylvania warehouse",
            "Maryland industrial",
            "Illinois warehouse",
            "Massachusetts industrial"
        ]
    }
}


def search_properties(org_config, query):
    """Use Firecrawl map to find property URLs"""
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "url": org_config["base_url"],
        "search": query,
        "limit": 100
    }

    try:
        response = requests.post(f"{BASE_URL}/map", headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            return response.json().get("links", [])
        else:
            print(f"  Error searching '{query}': {response.status_code}")
            return []
    except Exception as e:
        print(f"  Exception searching '{query}': {e}")
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
        print(f"  Error scraping {url}: {response.status_code}")
        return None
    except Exception as e:
        print(f"  Exception scraping {url}: {e}")
        return None


def is_valid_broker_name(name):
    """Validate that a name looks like a real person's name"""
    if not name:
        return False

    parts = name.split()
    if len(parts) != 2:
        return False

    first, last = parts

    # Check first name is in common names list
    if first.lower() not in COMMON_FIRST_NAMES:
        return False

    # Last name should be 2-15 chars, start with uppercase
    if len(last) < 2 or len(last) > 15:
        return False
    if not last[0].isupper():
        return False
    if not last.replace("'", "").replace("-", "").isalpha():
        return False

    return True


def clean_address(text):
    """Clean up address text"""
    # Remove markdown/HTML artifacts
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)  # Remove markdown links
    text = re.sub(r'!\[.*?\]', '', text)  # Remove image markers
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
    text = re.sub(r'%[0-9A-Fa-f]{2}', '', text)  # Remove URL encoding
    text = re.sub(r'[#*_`]', '', text)  # Remove markdown formatting
    text = text.strip()
    return text


def extract_broker_info(md, org_name):
    """Extract broker name and email with comprehensive patterns"""
    broker_name = ""
    broker_email = ""

    # Comprehensive broker name patterns - try multiple approaches
    broker_patterns = [
        # CONTACT section header followed by agent name (Cushman & Wakefield style)
        r'#+\s*CONTACT[^\n]*\n.*?\[([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\]',
        # "Contact for details" section with name on next line
        r'(?:CONTACT|Contact)\s+(?:FOR|for)\s+(?:DETAILS|details)[^\n]*\n[^\n]*\[([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\]',
        # ######  heading format for names (common in C&W pages)
        r'#{4,6}\s*\[?([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\]?',
        # Name followed by title in markdown links: [John Smith](url) Managing Director
        r'\[([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\][^\n]*(?:Managing|Vice|Executive|Senior|Director|Chair|Principal)',
        # Name followed immediately by title on same/next line
        r'([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\s*\n?\s*(?:Managing Director|Vice Chair|Senior Vice President|Executive Vice President|Director|Principal|Senior Associate|Senior Director)',
        # "Contact: John Smith" or "Broker: John Smith" etc
        r'(?:Contact|Broker|Agent|Listed by|Listing Agent|Represented by|For more information)[:\s]+([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)',
        # "John Smith, Senior Vice President" or with title
        r'([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+),?\s*(?:Senior|Managing|Vice|Executive|Director|Principal|Associate|SIOR|CCIM|MAI|Broker|Agent|Chair)',
        # **John Smith** or ### John Smith (bold/heading in markdown)
        r'\*\*([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\*\*',
        r'#{1,3}\s*([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)',
        # [John Smith](link) - markdown link with name
        r'\[([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\]\(',
        # Name followed by location: "John Smith Rosemont, United States" or "Chicago, United States"
        r'([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\s+[A-Z][a-z]+,\s+United States',
        # Name followed by phone: John Smith +1 (555)
        r'([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\s+\+?1?\s*\(?\d{3}\)?',
        # Name followed by email pattern: "John Smith john.smith@"
        r'([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\s+[a-zA-Z0-9._%+-]+@',
        # Common CRE page layouts - name on its own line before email
        r'\n([A-Z][a-z]+)\s+([A-Z][a-zA-Z\'\-]+)\n[^\n]*@',
        # Name with middle initial: "John A. Smith"
        r'([A-Z][a-z]+)\s+[A-Z]\.\s+([A-Z][a-zA-Z\'\-]+)',
    ]

    # Search for names
    for pattern in broker_patterns:
        matches = re.findall(pattern, md)
        for match in matches:
            if isinstance(match, tuple) and len(match) >= 2:
                potential_name = f"{match[0]} {match[1]}"
            else:
                potential_name = str(match)

            if is_valid_broker_name(potential_name):
                broker_name = potential_name
                break
        if broker_name:
            break

    # If still no name, try to extract from email addresses
    if not broker_name:
        org_domains = {
            "Cushman & Wakefield": "cushwake",
            "CBRE": "cbre",
            "Marcus & Millichap": "marcusmillichap",
            "Northmarq": "northmarq",
            "Newmark": "nmrk",
            "Colliers": "colliers",
        }
        domain = org_domains.get(org_name, "")
        if domain:
            # Look for firstname.lastname@ pattern
            email_name_match = re.search(rf'([a-z]+)\.([a-z]+)@{domain}', md, re.IGNORECASE)
            if email_name_match:
                first = email_name_match.group(1).capitalize()
                last = email_name_match.group(2).capitalize()
                potential_name = f"{first} {last}"
                if is_valid_broker_name(potential_name):
                    broker_name = potential_name

    # Find email - look for emails near the broker name if we found one
    if broker_name:
        # Try to find email within 500 chars of the broker name
        name_pos = md.find(broker_name)
        if name_pos >= 0:
            context = md[max(0, name_pos-200):name_pos+500]
            email_match = re.search(r'([a-zA-Z0-9._%+-]+@(?:cushwake|cbre|marcusmillichap|northmarq|nmrk|colliers)[a-zA-Z0-9.-]*\.[a-zA-Z]{2,})', context, re.IGNORECASE)
            if email_match:
                broker_email = email_match.group(1)

    # If no broker-specific email, try to find any corporate email
    if not broker_email:
        # Look for emails from the organization's domain
        org_domain_patterns = {
            "Cushman & Wakefield": r'[a-zA-Z0-9._%+-]+@cushwake\.com',
            "CBRE": r'[a-zA-Z0-9._%+-]+@cbre\.com',
            "Marcus & Millichap": r'[a-zA-Z0-9._%+-]+@marcusmillichap\.com',
            "Northmarq": r'[a-zA-Z0-9._%+-]+@northmarq\.com',
            "Newmark": r'[a-zA-Z0-9._%+-]+@nmrk\.com',
            "Colliers": r'[a-zA-Z0-9._%+-]+@colliers\.com',
        }

        if org_name in org_domain_patterns:
            email_match = re.search(org_domain_patterns[org_name], md, re.IGNORECASE)
            if email_match:
                broker_email = email_match.group(0)

    return broker_name, broker_email


def parse_property(scrape_data, url, org_name):
    """Parse property details from scraped markdown"""
    if not scrape_data or "data" not in scrape_data:
        return None

    md = scrape_data["data"].get("markdown", "")
    metadata = scrape_data["data"].get("metadata", {})

    # Extract address - look for patterns
    state_pattern = r'(NJ|PA|MD|IL|MA|New Jersey|Pennsylvania|Maryland|Illinois|Massachusetts)'
    address_patterns = [
        # Standard format: "123 Main St, City, NJ 12345"
        rf'(\d+[^,\n]{{5,50}}),\s*([A-Za-z][A-Za-z\s]{{2,30}}),\s*({state_pattern})\s*(\d{{5}})?',
    ]

    address_match = None
    for pattern in address_patterns:
        address_match = re.search(pattern, md, re.IGNORECASE)
        if address_match:
            break

    if not address_match:
        return None

    street = clean_address(address_match.group(1).strip())
    city = clean_address(address_match.group(2).strip())
    state = address_match.group(3).strip()
    zip_code = address_match.group(5) if address_match.lastindex >= 5 and address_match.group(5) else ""

    # Validate street address looks reasonable
    if len(street) < 5 or len(street) > 100:
        return None
    if not re.match(r'^\d+\s', street):  # Should start with a number
        return None
    if any(x in street.lower() for x in ['http', 'www', '.com', '.org', 'svg', 'png', 'jpg']):
        return None

    # Validate city
    if len(city) < 2 or len(city) > 30:
        return None
    if not city[0].isupper():
        return None
    if any(x in city.lower() for x in ['http', 'www', '.com', 'svg', 'png']):
        return None

    # Normalize state
    state = STATE_NAMES.get(state.lower(), state.upper())

    # Only keep target states
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
            if sqft >= 10000:  # Only accept reasonable sizes
                break

    if sqft < 10000:  # Only properties >= 10,000 SF
        return None

    # Extract property type
    prop_type = "Industrial"
    type_keywords = {
        "warehouse": "Warehouse",
        "distribution": "Distribution",
        "flex": "Flex",
        "manufacturing": "Manufacturing",
        "cold storage": "Cold Storage",
        "logistics": "Logistics",
        "fulfillment": "Fulfillment"
    }
    for keyword, ptype in type_keywords.items():
        if keyword in md.lower():
            prop_type = ptype
            break

    # Extract broker info
    broker_name, broker_email = extract_broker_info(md, org_name)

    # Extract phone
    phone_match = re.search(r'(\+?1?\s*[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})', md)
    phone = phone_match.group(1) if phone_match else ""

    # Extract property name (if different from address)
    property_name = ""
    name_patterns = [
        # H1/H2 heading with property name keywords
        r'#\s*([A-Z][A-Za-z0-9\s\-&]+(?:Distribution|Logistics|Business|Industrial|Commerce|Trade|Corporate|Flex|Warehouse|Fulfillment)\s*(?:Center|Park|Campus|Complex|Facility|Hub)?)',
        # Title in metadata
        r'title["\']?\s*[:=]\s*["\']?([A-Z][A-Za-z0-9\s\-&]+(?:Distribution|Logistics|Business|Industrial|Commerce|Trade|Corporate|Flex|Warehouse|Fulfillment)\s*(?:Center|Park|Campus|Complex|Facility|Hub)?)',
        # Standalone property name patterns - City + descriptor
        rf'({city}\s+(?:Distribution|Logistics|Business|Industrial|Commerce)\s+(?:Center|Park|Campus|Complex|Facility))',
        # Name followed by address
        r'^#*\s*([A-Z][A-Za-z0-9\s\-&]{5,50}(?:Center|Park|Campus|Complex|Facility|Hub))\s*\n',
    ]

    for pattern in name_patterns:
        name_match = re.search(pattern, md, re.IGNORECASE | re.MULTILINE)
        if name_match:
            potential_name = name_match.group(1).strip()
            # Clean up and validate
            potential_name = re.sub(r'\s+', ' ', potential_name)
            # Make sure it's not just the street address
            if potential_name.lower() != street.lower() and len(potential_name) > 5 and len(potential_name) < 60:
                property_name = potential_name
                break

    return {
        "address": full_address,
        "name": property_name,
        "street": street,
        "city": city,
        "state": state,
        "zip_code": zip_code,
        "sqft": sqft,
        "property_type": prop_type,
        "lead_broker": broker_name,
        "broker_email": broker_email,
        "broker_phone": phone,
        "source": org_name,
        "source_url": url
    }


def scrape_organization(org_key, org_config, output_dir):
    """Scrape all properties from a single organization"""
    print(f"\n{'='*60}")
    print(f"Scraping: {org_config['name']}")
    print(f"{'='*60}")

    all_urls = []

    # Search for property URLs
    for query in org_config["searches"]:
        print(f"  Searching: {query}...")
        urls = search_properties(org_config, query)
        print(f"    Found {len(urls)} URLs")
        all_urls.extend(urls)
        time.sleep(0.5)

    # Dedupe and filter
    all_urls = list(set(all_urls))
    listing_urls = [url for url in all_urls if any(x in url.lower() for x in ["property", "listing", "properties", "listings"])]

    print(f"\nFound {len(listing_urls)} potential property URLs")

    if not listing_urls:
        print("No property URLs found, skipping...")
        return []

    # Scrape properties
    properties = []
    seen_addresses = set()

    for i, url in enumerate(listing_urls[:50]):  # Limit to 50 per org
        print(f"  [{i+1}/{min(len(listing_urls), 50)}] {url[:70]}...")

        result = scrape_property(url)
        if result:
            prop = parse_property(result, url, org_config["name"])
            if prop:
                # Dedupe by address
                addr_key = prop["address"].lower()
                if addr_key not in seen_addresses:
                    seen_addresses.add(addr_key)
                    properties.append(prop)
                    broker_info = f" - {prop['lead_broker']}" if prop['lead_broker'] else ""
                    print(f"    ✓ {prop['city']}, {prop['state']} - {prop['sqft']:,} SF{broker_info}")
                else:
                    print(f"    - Skipped (duplicate address)")
            else:
                print(f"    - Skipped (not target market or parse failed)")

        time.sleep(0.3)

    # Save org-specific results
    output_file = os.path.join(output_dir, f"{org_key}_properties.json")
    with open(output_file, "w") as f:
        json.dump(properties, f, indent=2)

    print(f"\nSaved {len(properties)} properties to {output_file}")
    return properties


def main():
    """Main entry point"""
    print("="*60)
    print("CRE Property Scraper")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "scraped")
    os.makedirs(output_dir, exist_ok=True)

    all_properties = []

    # Scrape each organization
    for org_key, org_config in ORGANIZATIONS.items():
        try:
            properties = scrape_organization(org_key, org_config, output_dir)
            all_properties.extend(properties)
        except Exception as e:
            print(f"Error scraping {org_config['name']}: {e}")
            continue

    # Save combined results
    combined_file = os.path.join(output_dir, "all_properties.json")
    with open(combined_file, "w") as f:
        json.dump(all_properties, f, indent=2)

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total properties scraped: {len(all_properties)}")

    by_state = {}
    for prop in all_properties:
        state = prop["state"]
        by_state[state] = by_state.get(state, 0) + 1

    for state, count in sorted(by_state.items()):
        print(f"  {state}: {count} properties")

    by_source = {}
    for prop in all_properties:
        source = prop["source"]
        by_source[source] = by_source.get(source, 0) + 1

    print("\nBy source:")
    for source, count in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"  {source}: {count} properties")

    # Broker stats
    brokers_found = sum(1 for p in all_properties if p["lead_broker"])
    print(f"\nProperties with broker names: {brokers_found}/{len(all_properties)}")

    print(f"\nResults saved to: {combined_file}")


if __name__ == "__main__":
    main()
