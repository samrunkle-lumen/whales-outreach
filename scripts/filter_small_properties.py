#!/usr/bin/env python3
"""
Filter out properties with less than 1 MW solar potential.

Based on the calculation:
- usableRoofSqft = sqft × 0.80
- systemSizeHigh (kW) = usableRoofSqft / 100

For 1 MW (1000 kW) potential:
- 1000 = (sqft × 0.80) / 100
- sqft >= 125,000
"""
import json
import os

# Minimum sqft for 1 MW potential
MIN_SQFT_FOR_1MW = 125000

def main():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "brokers.json")

    with open(data_path, "r") as f:
        data = json.load(f)

    original_broker_count = len(data["brokers"])
    original_building_count = sum(len(b["buildings"]) for b in data["brokers"])

    print(f"Original: {original_broker_count} brokers, {original_building_count} properties")
    print(f"Filtering properties with sqft < {MIN_SQFT_FOR_1MW:,} (< 1 MW potential)")
    print("-" * 60)

    filtered_brokers = []
    removed_buildings = 0

    for broker in data["brokers"]:
        # Filter buildings
        filtered_buildings = []
        for building in broker["buildings"]:
            if building["sqft"] >= MIN_SQFT_FOR_1MW:
                filtered_buildings.append(building)
            else:
                removed_buildings += 1
                print(f"  Removed: {building['address'][:50]}... ({building['sqft']:,} SF)")

        # Only keep brokers with at least 1 building
        if filtered_buildings:
            broker["buildings"] = filtered_buildings
            filtered_brokers.append(broker)
        else:
            print(f"  Removed broker: {broker['fullName']} (no remaining properties)")

    # Update firms - only keep firms that have brokers
    broker_companies = set(b["company"] for b in filtered_brokers)
    filtered_firms = [f for f in data.get("firms", []) if f["name"] in broker_companies]

    # Update data
    data["brokers"] = filtered_brokers
    data["firms"] = filtered_firms

    final_broker_count = len(data["brokers"])
    final_building_count = sum(len(b["buildings"]) for b in data["brokers"])

    print("-" * 60)
    print(f"Final: {final_broker_count} brokers, {final_building_count} properties")
    print(f"Removed: {original_broker_count - final_broker_count} brokers, {removed_buildings} properties")

    # Save filtered data
    with open(data_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\nSaved to: {data_path}")


if __name__ == "__main__":
    main()
