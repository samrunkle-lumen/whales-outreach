"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Owner, Property } from "@/lib/types";
import { calculateBuilding, calculatePortfolio, formatCurrency, formatNumber } from "@/lib/calculations";

function slugifyProperty(address: string, index: number): string {
  const baseSlug = address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
  return `${baseSlug}-${index}`;
}

interface FilterableOwnerListProps {
  owners: Owner[];
}

const SQFT_RANGES = [
  { label: "All Sizes", min: 0, max: Infinity },
  { label: "Under 50K ft²", min: 0, max: 50000 },
  { label: "50K - 100K ft²", min: 50000, max: 100000 },
  { label: "100K - 250K ft²", min: 100000, max: 250000 },
  { label: "250K - 500K ft²", min: 250000, max: 500000 },
  { label: "500K+ ft²", min: 500000, max: Infinity },
];

export function FilterableOwnerList({ owners }: FilterableOwnerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedSqftRange, setSelectedSqftRange] = useState<number>(0);
  const [openOwners, setOpenOwners] = useState<Set<string>>(new Set());

  // Get unique states from all properties
  const states = useMemo(() => {
    const stateSet = new Set<string>();
    owners.forEach(owner => {
      owner.properties.forEach(property => {
        const state = property.address.match(/,\s*([A-Z]{2})\s*\d{5}?/)?.[1]
          || property.address.match(/,\s*([A-Z]{2})$/)?.[1]
          || property.state;
        if (state) stateSet.add(state);
      });
    });
    return Array.from(stateSet).sort();
  }, [owners]);

  // Filter owners based on search and filters
  const filteredData = useMemo(() => {
    const sqftRange = SQFT_RANGES[selectedSqftRange];
    const searchLower = searchQuery.toLowerCase();

    return owners
      .map(owner => {
        // Check if owner name matches search
        const nameMatches = !searchQuery ||
          owner.name.toLowerCase().includes(searchLower);

        // Filter properties by state and sqft
        const filteredProperties = owner.properties.filter(property => {
          // Search filter - check if address matches
          if (searchQuery && !property.address.toLowerCase().includes(searchLower) && !nameMatches) {
            return false;
          }

          // State filter
          if (selectedState) {
            const propertyState = property.address.match(/,\s*([A-Z]{2})\s*\d{5}?/)?.[1]
              || property.address.match(/,\s*([A-Z]{2})$/)?.[1]
              || property.state;
            if (propertyState !== selectedState) return false;
          }

          // Sqft filter
          if (property.sqft < sqftRange.min || property.sqft > sqftRange.max) {
            return false;
          }

          return true;
        });

        if (filteredProperties.length === 0) return null;

        return { ...owner, properties: filteredProperties, propertyCount: filteredProperties.length };
      })
      .filter((o): o is Owner => o !== null);
  }, [owners, searchQuery, selectedState, selectedSqftRange]);

  // Calculate totals
  const totalProperties = filteredData.reduce((sum, owner) => sum + owner.propertyCount, 0);
  const totalSqft = filteredData.reduce((sum, owner) =>
    sum + owner.properties.reduce((pSum, p) => pSum + p.sqft, 0), 0
  );

  const toggleOwner = (slug: string) => {
    setOpenOwners(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Header with Search and Filters */}
      <div className="mb-8">
        <h2 className="display text-[32px] font-light tracking-[-0.02em] text-[#1A1A1A] mb-6">
          Property Owners
        </h2>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by owner name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 border border-[#E7E8E3] rounded-lg text-[#1A1A1A] placeholder:text-[#9BA09C] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-2 border border-[#E7E8E3] rounded-lg text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
          >
            <option value="">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          {/* Sqft Range Filter */}
          <select
            value={selectedSqftRange}
            onChange={(e) => setSelectedSqftRange(Number(e.target.value))}
            className="px-4 py-2 border border-[#E7E8E3] rounded-lg text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
          >
            {SQFT_RANGES.map((range, index) => (
              <option key={index} value={index}>{range.label}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchQuery || selectedState || selectedSqftRange !== 0) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedState("");
                setSelectedSqftRange(0);
              }}
              className="px-4 py-2 text-[#5A5F52] hover:text-[#1A1A1A] transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Summary */}
        <p className="text-[#5A5F52]">
          Showing {filteredData.length} owner{filteredData.length !== 1 ? "s" : ""} with {totalProperties} propert{totalProperties !== 1 ? "ies" : "y"} ({formatNumber(totalSqft)} ft²)
        </p>
      </div>

      {/* Owner List */}
      <div className="space-y-4">
        {filteredData.map((owner) => {
          const isOpen = openOwners.has(owner.slug);
          const ownerSqft = owner.properties.reduce((sum, p) => sum + p.sqft, 0);
          const ownerSystemSize = owner.properties.reduce((sum, p) => sum + (p.systemSize || 0), 0);

          return (
            <div
              key={owner.slug}
              className="border border-[#E7E8E3] rounded-xl overflow-hidden"
            >
              {/* Owner Header */}
              <button
                onClick={() => toggleOwner(owner.slug)}
                className="w-full px-6 py-4 bg-[#F8F8F6] hover:bg-[#F0F0ED] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <h3 className="display text-[20px] font-light text-[#1A1A1A]">
                      {owner.name}
                    </h3>
                    <p className="text-sm text-[#5A5F52]">
                      {owner.propertyCount} propert{owner.propertyCount !== 1 ? "ies" : "y"} · {formatNumber(ownerSqft)} ft²{ownerSystemSize > 0 && ` · ${formatNumber(ownerSystemSize)} kW`}
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-[#5A5F52] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Properties */}
              {isOpen && (
                <div className="divide-y divide-[#E7E8E3]">
                  {owner.properties.map((property, index) => {
                    const propertySlug = slugifyProperty(property.address, index);

                    return (
                      <Link
                        key={`${propertySlug}-${index}`}
                        href={`/owners/${owner.slug}/${propertySlug}`}
                        className="block px-6 py-4 hover:bg-[#F8F8F6] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1A1A1A] font-medium truncate">
                              {property.address}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#5A5F52]">
                              {property.sqft > 0 && (
                                <span>{formatNumber(property.sqft)} ft²</span>
                              )}
                              {property.systemSize && property.systemSize > 0 && (
                                <span>{formatNumber(property.systemSize)} kW</span>
                              )}
                              {property.propertyType && (
                                <span>{property.propertyType}</span>
                              )}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-[#9BA09C] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#5A5F52] text-lg">No owners match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
