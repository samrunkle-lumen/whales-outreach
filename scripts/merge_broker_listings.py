#!/usr/bin/env python3
"""
Merge found broker listings into brokers.json
"""
import json
import os

def main():
    script_dir = os.path.dirname(__file__)
    data_dir = os.path.join(script_dir, "..", "data")

    # Load brokers data
    brokers_file = os.path.join(data_dir, "brokers.json")
    with open(brokers_file, "r") as f:
        data = json.load(f)

    # Load found listings
    listings_file = os.path.join(data_dir, "scraped", "broker_listings.json")
    if not os.path.exists(listings_file):
        print("No broker listings found. Run find_broker_listings.py first.")
        return

    with open(listings_file, "r") as f:
        found_listings = json.load(f)

    print(f"Found listings for {len(found_listings)} brokers")

    # Merge listings
    updated_count = 0
    for broker in data["brokers"]:
        slug = broker["slug"]
        if slug in found_listings:
            existing_addresses = set(b["address"] for b in broker.get("buildings", []))
            new_listings = found_listings[slug]

            added = 0
            for listing in new_listings:
                if listing["address"] not in existing_addresses:
                    broker.setdefault("buildings", []).append(listing)
                    existing_addresses.add(listing["address"])
                    added += 1

            if added > 0:
                print(f"  {broker['fullName']}: +{added} listings")
                updated_count += 1

    # Save
    with open(brokers_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\nUpdated {updated_count} brokers")
    total_buildings = sum(len(b.get("buildings", [])) for b in data["brokers"])
    print(f"Total properties: {total_buildings}")


if __name__ == "__main__":
    main()
