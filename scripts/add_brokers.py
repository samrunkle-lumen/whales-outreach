#!/usr/bin/env python3
"""
Add specified brokers to brokers.json
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

# Brokers to add
NEW_BROKERS = [
    {"name": "Adam Tyler", "company": "Cushman & Wakefield", "email": "adam.tyler@cushwake.com", "phone": "312-470-1840", "market": "Illinois"},
    {"name": "Alex Cantu", "company": "Colliers", "email": "alex.cantu@colliers.com", "phone": "317-503-5642", "market": "Illinois"},
    {"name": "Alex Davenport", "company": "Colliers", "email": "alex.davenport@colliers.com", "phone": "317-556-3676", "market": "Illinois"},
    {"name": "Bo Cashman", "company": "CBRE", "email": "bo.cashman@cbre.com", "phone": "410-244-3188", "market": "Maryland"},
    {"name": "Brad Ruppel", "company": "CBRE", "email": "brad.ruppel@cbre.com", "phone": "610-251-5139", "market": "Pennsylvania"},
    {"name": "Brian Fiumara", "company": "CBRE", "email": "brian.fiumara@cbre.com", "phone": "610-580-8672", "market": "Pennsylvania"},
    {"name": "Chris Skeffington", "company": "CBRE", "email": "chris.skeffington@cbre.com", "phone": "781-771-2188", "market": "Massachusetts"},
    {"name": "Daniel Hincks", "company": "Colliers", "email": "daniel.hincks@colliers.com", "phone": "857-234-4868", "market": "Massachusetts"},
    {"name": "David Coffman", "company": "JLL", "email": "david.coffman@jll.com", "phone": "617-531-4243", "market": "Massachusetts"},
    {"name": "Ed Halaburt", "company": "JLL", "email": "ed.halaburt@jll.com", "phone": "312-228-2007", "market": "Illinois"},
    {"name": "Frank Petz", "company": "Colliers", "email": "frank.petz@colliers.com", "phone": "617-750-4500", "market": "Massachusetts"},
    {"name": "Jason Lundy", "company": "JLL", "email": "jason.lundy@jll.com", "phone": "732-850-5326", "market": "New Jersey"},
    {"name": "Jeff Devine", "company": "Colliers", "email": "jeff.devine@colliers.com", "phone": "847-732-6070", "market": "Illinois"},
    {"name": "Jim Carpenter", "company": "Cushman & Wakefield", "email": "jim.carpenter@cushwake.com", "phone": "312-470-3830", "market": "Illinois"},
    {"name": "Joe Hill", "company": "CBRE", "email": "joseph.hill1@cbre.com", "phone": "610-386-6022", "market": "Pennsylvania"},
    {"name": "John Plower", "company": "JLL", "email": "john.plower@jll.com", "phone": "484-571-1879", "market": "Pennsylvania"},
    {"name": "Jonathan Beard", "company": "CBRE", "email": "jonathan.beard@cbre.com", "phone": "410-244-3183", "market": "Maryland"},
    {"name": "Kevin Lammers", "company": "JLL", "email": "kevin.lammers@jll.com", "phone": "856-448-3226", "market": "New Jersey"},
    {"name": "Kurt Sarbaugh", "company": "JLL", "email": "kurt.sarbaugh@jll.com", "phone": "312-300-7320", "market": "Illinois"},
    {"name": "Lenny Pierce", "company": "JLL", "email": "lenny.pierce@jll.com", "phone": "617-531-4120", "market": "Massachusetts"},
    {"name": "Matt Sherry", "company": "Colliers", "email": "matthew.sherry@colliers.com", "phone": "401-378-2844", "market": "Massachusetts"},
    {"name": "Megan Barker", "company": "Cushman & Wakefield", "email": "megan.barker@cushwake.com", "phone": "312-424-8202", "market": "Illinois"},
    {"name": "Michael Hines", "company": "CBRE", "email": "michael.hines@cbre.com", "phone": "610-251-5185", "market": "Pennsylvania"},
    {"name": "Michael Restivo", "company": "JLL", "email": "michael.restivo@jll.com", "phone": "617-848-5858", "market": "Massachusetts"},
    {"name": "Mike Tenteris", "company": "Cushman & Wakefield", "email": "michael.tenteris@cushwake.com", "phone": "312-470-3832", "market": "Illinois"},
    {"name": "Nick Stefans", "company": "JLL", "email": "nicholas.stefans@jll.com", "phone": "908-202-3180", "market": "New Jersey"},
    {"name": "PJ Oreilly", "company": "CBRE", "email": "pj.oreilly@cbre.com", "phone": "203-521-7786", "market": "Massachusetts"},
    {"name": "Ross Bratcher", "company": "JLL", "email": "ross.bratcher@jll.com", "phone": "", "market": "Illinois"},
    {"name": "Roy Sandeman", "company": "CBRE", "email": "roy.sandeman@cbre.com", "phone": "401-536-1859", "market": "Massachusetts"},
    {"name": "Ryan Cottone", "company": "JLL", "email": "ryan.cottone@jll.com", "phone": "610-733-5271", "market": "Pennsylvania"},
    {"name": "Scott Dragos", "company": "CBRE", "email": "scott.dragos@cbre.com", "phone": "508-317-4253", "market": "Massachusetts"},
    {"name": "Sean Devaney", "company": "JLL", "email": "sean.devaney@jll.com", "phone": "312-228-2868", "market": "Illinois"},
    {"name": "Steve Disse", "company": "Colliers", "email": "steve.disse@colliers.com", "phone": "312-485-6470", "market": "Illinois"},
    {"name": "Tommy Hovey", "company": "JLL", "email": "tommy.hovey@jll.com", "phone": "860-944-3851", "market": "Massachusetts"},
    {"name": "Tyler Peck", "company": "JLL", "email": "tyler.peck@jll.com", "phone": "908-963-4743", "market": "New Jersey"},
    {"name": "Tyler Ziebel", "company": "Colliers", "email": "tyler.ziebel@colliers.com", "phone": "217-552-0618", "market": "Illinois"},
    {"name": "Will McCormack", "company": "JLL", "email": "william.mccormack@jll.com", "phone": "203-918-2699", "market": "Massachusetts"},
]

def main():
    script_dir = os.path.dirname(__file__)
    data_dir = os.path.join(script_dir, "..", "data")
    brokers_file = os.path.join(data_dir, "brokers.json")

    # Load existing data
    with open(brokers_file, "r") as f:
        data = json.load(f)

    existing_slugs = {b["slug"] for b in data["brokers"]}
    existing_firms = {f["name"] for f in data["firms"]}

    added_count = 0
    for broker_info in NEW_BROKERS:
        slug = slugify(broker_info["name"])

        # Skip if already exists
        if slug in existing_slugs:
            print(f"  Skipped (exists): {broker_info['name']}")
            continue

        # Add firm if needed
        if broker_info["company"] not in existing_firms:
            data["firms"].append({
                "name": broker_info["company"],
                "slug": slugify(broker_info["company"]),
                "market": broker_info["market"]
            })
            existing_firms.add(broker_info["company"])
            print(f"  Added firm: {broker_info['company']}")

        # Create broker entry
        name_parts = broker_info["name"].split()
        first_name = name_parts[0] if name_parts else broker_info["name"]

        broker = {
            "slug": slug,
            "name": first_name,
            "fullName": broker_info["name"],
            "company": broker_info["company"],
            "market": broker_info["market"],
            "email": broker_info["email"],
            "phone": broker_info["phone"],
            "buildings": []  # No properties yet
        }

        data["brokers"].append(broker)
        existing_slugs.add(slug)
        added_count += 1
        print(f"  Added broker: {broker_info['name']} ({broker_info['company']})")

    # Sort
    data["firms"].sort(key=lambda f: f["name"])
    data["brokers"].sort(key=lambda b: (b["company"], b["fullName"]))

    # Save
    with open(brokers_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\nAdded {added_count} new brokers")
    print(f"Total brokers: {len(data['brokers'])}")
    print(f"Total firms: {len(data['firms'])}")

if __name__ == "__main__":
    main()
