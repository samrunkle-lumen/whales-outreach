#!/usr/bin/env python3
"""
Merge scraped properties into the brokers.json format
Groups properties by broker and creates the proper data structure
"""
import json
import os
import re

def slugify(name):
    """Create a URL-friendly slug from a name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

def get_market(state):
    """Determine market from state"""
    markets = {
        "NJ": "New Jersey",
        "PA": "Pennsylvania",
        "MD": "Maryland",
        "IL": "Illinois",
        "MA": "Massachusetts"
    }
    return markets.get(state, "Northeast")

def main():
    script_dir = os.path.dirname(__file__)
    data_dir = os.path.join(script_dir, "..", "data")
    scraped_dir = os.path.join(data_dir, "scraped")

    # Load existing brokers data
    brokers_file = os.path.join(data_dir, "brokers.json")
    with open(brokers_file, "r") as f:
        existing_data = json.load(f)

    existing_firms = {f["name"]: f for f in existing_data.get("firms", [])}
    existing_brokers = {b["slug"]: b for b in existing_data.get("brokers", [])}

    # Load all scraped properties from multiple sources
    properties = []

    # Main scraped properties
    scraped_file = os.path.join(scraped_dir, "all_properties.json")
    if os.path.exists(scraped_file):
        with open(scraped_file, "r") as f:
            props = json.load(f)
            properties.extend(props)
            print(f"Loaded {len(props)} properties from main scraper")

    # Broker profiles properties
    broker_profiles_file = os.path.join(scraped_dir, "broker_profiles_properties.json")
    if os.path.exists(broker_profiles_file):
        with open(broker_profiles_file, "r") as f:
            props = json.load(f)
            properties.extend(props)
            print(f"Loaded {len(props)} properties from broker profiles scraper")

    if not properties:
        print("No scraped data found. Run scrape_properties.py first")
        return

    print(f"Total: {len(properties)} scraped properties")

    # Group properties by broker
    brokers_map = {}  # broker_name -> properties
    for prop in properties:
        broker_name = prop.get("lead_broker", "").strip()
        source = prop.get("source", "Unknown")

        if not broker_name:
            # Use source company as fallback broker name
            broker_name = f"{source} Listings"

        key = f"{broker_name}|{source}"
        if key not in brokers_map:
            brokers_map[key] = {
                "name": broker_name,
                "source": source,
                "email": prop.get("broker_email", ""),
                "phone": prop.get("broker_phone", ""),
                "properties": []
            }

        property_entry = {
            "address": prop["address"],
            "sqft": prop["sqft"],
            "propertyType": prop.get("property_type", "Industrial"),
            "city": prop.get("city", ""),
            "state": prop.get("state", ""),
            "listingUrl": prop.get("source_url", "")
        }
        # Add property name if available
        if prop.get("name"):
            property_entry["name"] = prop["name"]
        brokers_map[key]["properties"].append(property_entry)

    print(f"Found {len(brokers_map)} unique brokers")

    # Add new firms
    new_firms = []
    source_to_firm = {}
    for source in set(prop.get("source", "Unknown") for prop in properties):
        if source not in existing_firms:
            # Determine primary market from properties
            source_props = [p for p in properties if p.get("source") == source]
            states = [p.get("state") for p in source_props if p.get("state")]
            primary_state = max(set(states), key=states.count) if states else "NJ"

            firm = {
                "name": source,
                "slug": slugify(source),
                "market": get_market(primary_state)
            }
            new_firms.append(firm)
            source_to_firm[source] = firm
            print(f"  New firm: {source}")
        else:
            source_to_firm[source] = existing_firms[source]

    # Add new brokers
    new_brokers = []
    for key, broker_data in brokers_map.items():
        broker_name = broker_data["name"]
        source = broker_data["source"]
        slug = slugify(broker_name)

        # Check if broker already exists
        if slug in existing_brokers:
            # Add new properties to existing broker
            existing = existing_brokers[slug]
            existing_addresses = set(b["address"] for b in existing.get("buildings", []))
            for prop in broker_data["properties"]:
                if prop["address"] not in existing_addresses:
                    existing.setdefault("buildings", []).append(prop)
            print(f"  Updated broker: {broker_name} (+{len(broker_data['properties'])} properties)")
        else:
            # Create new broker
            # Get first name for display
            name_parts = broker_name.split()
            first_name = name_parts[0] if name_parts else broker_name

            # Determine market from properties
            states = [p.get("state") for p in broker_data["properties"] if p.get("state")]
            primary_state = max(set(states), key=states.count) if states else "NJ"

            new_broker = {
                "slug": slug,
                "name": first_name,
                "fullName": broker_name,
                "company": source,
                "market": get_market(primary_state),
                "email": broker_data.get("email", ""),
                "phone": broker_data.get("phone", ""),
                "buildings": broker_data["properties"]
            }
            new_brokers.append(new_broker)
            print(f"  New broker: {broker_name} ({len(broker_data['properties'])} properties)")

    # Combine data
    all_firms = list(existing_firms.values()) + new_firms
    all_brokers = list(existing_brokers.values()) + new_brokers

    # Sort
    all_firms.sort(key=lambda f: f["name"])
    all_brokers.sort(key=lambda b: (b["company"], b["fullName"]))

    # Save
    output = {
        "firms": all_firms,
        "brokers": all_brokers
    }

    with open(brokers_file, "w") as f:
        json.dump(output, f, indent=2)

    # Summary
    total_buildings = sum(len(b.get("buildings", [])) for b in all_brokers)
    print(f"\n{'='*60}")
    print("MERGE COMPLETE")
    print(f"{'='*60}")
    print(f"Total firms: {len(all_firms)}")
    print(f"Total brokers: {len(all_brokers)}")
    print(f"Total properties: {total_buildings}")
    print(f"\nSaved to: {brokers_file}")


if __name__ == "__main__":
    main()
