#!/usr/bin/env python3
"""
Enrich broker emails using Apollo.io API
https://docs.apollo.io/reference/people-enrichment
"""
import requests
import json
import os
import time

# Apollo API configuration
APOLLO_API_KEY = os.environ.get("APOLLO_API_KEY", "")
BASE_URL = "https://api.apollo.io/api/v1"

# Company domain mappings
COMPANY_DOMAINS = {
    "CBRE": "cbre.com",
    "Cushman & Wakefield": "cushwake.com",
    "JLL": "jll.com",
    "Colliers": "colliers.com",
    "Newmark": "ngkf.com",
    "Marcus & Millichap": "marcusmillichap.com",
}


def enrich_person(first_name, last_name, company):
    """Look up a person via Apollo API"""
    if not APOLLO_API_KEY:
        print("Error: APOLLO_API_KEY environment variable not set")
        print("Get your API key from: https://app.apollo.io/#/settings/integrations/api")
        return None

    headers = {
        "Content-Type": "application/json",
        "x-api-key": APOLLO_API_KEY,
    }

    domain = COMPANY_DOMAINS.get(company, "")

    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "organization_name": company,
        "reveal_personal_emails": True,
    }

    if domain:
        payload["domain"] = domain

    try:
        response = requests.post(
            f"{BASE_URL}/people/match",
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            person = data.get("person")
            if person:
                return {
                    "email": person.get("email"),
                    "phone": person.get("phone_numbers", [{}])[0].get("sanitized_number") if person.get("phone_numbers") else None,
                    "title": person.get("title"),
                    "linkedin_url": person.get("linkedin_url"),
                }
        elif response.status_code == 401:
            print("Error: Invalid API key")
            return None
        elif response.status_code == 429:
            print("Rate limited, waiting 60 seconds...")
            time.sleep(60)
            return enrich_person(first_name, last_name, company)
        else:
            print(f"  API error: {response.status_code} - {response.text[:100]}")

    except Exception as e:
        print(f"  Error: {e}")

    return None


def main():
    if not APOLLO_API_KEY:
        print("=" * 60)
        print("Apollo Email Enrichment")
        print("=" * 60)
        print("\nError: APOLLO_API_KEY not set!")
        print("\nTo use this script:")
        print("1. Get your API key from: https://app.apollo.io/#/settings/integrations/api")
        print("2. Run: export APOLLO_API_KEY='your-api-key-here'")
        print("3. Run this script again")
        return

    script_dir = os.path.dirname(__file__)
    brokers_file = os.path.join(script_dir, "..", "data", "brokers.json")

    with open(brokers_file, "r") as f:
        data = json.load(f)

    print("=" * 60)
    print("Apollo Email Enrichment")
    print("=" * 60)

    # Find brokers without emails
    brokers_without_email = [
        b for b in data["brokers"]
        if not b.get("email") or "@" not in b.get("email", "")
    ]

    print(f"Total brokers: {len(data['brokers'])}")
    print(f"Brokers needing email: {len(brokers_without_email)}")

    if not brokers_without_email:
        print("\nAll brokers already have emails!")
        return

    enriched_count = 0
    for i, broker in enumerate(brokers_without_email):
        name_parts = broker["fullName"].split()
        if len(name_parts) < 2:
            continue

        first_name = name_parts[0]
        last_name = name_parts[-1]
        company = broker.get("company", "")

        print(f"\n[{i+1}/{len(brokers_without_email)}] Looking up: {broker['fullName']} at {company}")

        result = enrich_person(first_name, last_name, company)

        if result and result.get("email"):
            # Find and update the broker in the main data
            for b in data["brokers"]:
                if b["slug"] == broker["slug"]:
                    b["email"] = result["email"]
                    if result.get("phone") and not b.get("phone"):
                        b["phone"] = result["phone"]
                    if result.get("title") and not b.get("title"):
                        b["title"] = result["title"]
                    if result.get("linkedin_url") and not b.get("profileUrl"):
                        b["profileUrl"] = result["linkedin_url"]
                    break

            print(f"  ✓ Found: {result['email']}")
            enriched_count += 1
        else:
            print(f"  ✗ Not found")

        # Rate limiting - Apollo allows ~100 requests/minute on most plans
        time.sleep(0.7)

    # Save updated data
    with open(brokers_file, "w") as f:
        json.dump(data, f, indent=2)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Enriched {enriched_count} broker emails")
    print(f"Brokers still without email: {len(brokers_without_email) - enriched_count}")
    print(f"\nSaved to: {brokers_file}")


if __name__ == "__main__":
    main()
