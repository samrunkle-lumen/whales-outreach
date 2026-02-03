"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CollapsibleSection, CollapsibleBroker } from "@/components/CollapsibleSection";
import { BrokerOutreachButton } from "@/components/BrokerOutreachButton";
import { BrokersData, Broker, Firm, Building } from "@/lib/types";
import { calculateBuilding, calculatePortfolio, formatCurrency, formatNumber, formatMillions } from "@/lib/calculations";

function slugifyBuilding(address: string, index: number): string {
  const baseSlug = address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
  return `${baseSlug}-${index}`;
}

interface FilterableBrokerListProps {
  firms: Firm[];
  brokers: Broker[];
}

const SQFT_RANGES = [
  { label: "All Sizes", min: 0, max: Infinity },
  { label: "Under 50K SF", min: 0, max: 50000 },
  { label: "50K - 100K SF", min: 50000, max: 100000 },
  { label: "100K - 250K SF", min: 100000, max: 250000 },
  { label: "250K - 500K SF", min: 250000, max: 500000 },
  { label: "500K+ SF", min: 500000, max: Infinity },
];

export function FilterableBrokerList({ firms, brokers }: FilterableBrokerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedSqftRange, setSelectedSqftRange] = useState<number>(0);

  // Get unique states from all buildings
  const states = useMemo(() => {
    const stateSet = new Set<string>();
    brokers.forEach(broker => {
      broker.buildings.forEach(building => {
        const state = building.address.match(/,\s*([A-Z]{2})\s*\d{5}?/)?.[1]
          || building.address.match(/,\s*([A-Z]{2})$/)?.[1]
          || broker.market?.match(/^([A-Z]{2})/)?.[1];
        if (state) stateSet.add(state);
      });
      // Also add from market field if available
      if (broker.market) {
        const marketState = broker.market.match(/^([A-Z]{2})/)?.[1];
        if (marketState) stateSet.add(marketState);
      }
    });
    return Array.from(stateSet).sort();
  }, [brokers]);

  // Filter brokers based on search and filters
  const filteredData = useMemo(() => {
    const sqftRange = SQFT_RANGES[selectedSqftRange];
    const searchLower = searchQuery.toLowerCase();

    return brokers
      .map(broker => {
        // Check if broker name matches search
        const nameMatches = !searchQuery ||
          broker.fullName.toLowerCase().includes(searchLower) ||
          broker.company.toLowerCase().includes(searchLower);

        if (!nameMatches) return null;

        // Filter buildings by state and sqft
        const filteredBuildings = broker.buildings.filter(building => {
          // State filter
          if (selectedState) {
            const buildingState = building.address.match(/,\s*([A-Z]{2})\s*\d{5}?/)?.[1]
              || building.address.match(/,\s*([A-Z]{2})$/)?.[1];
            if (buildingState !== selectedState) return false;
          }

          // Sqft filter
          if (building.sqft < sqftRange.min || building.sqft > sqftRange.max) {
            return false;
          }

          return true;
        });

        if (filteredBuildings.length === 0) return null;

        return { ...broker, buildings: filteredBuildings };
      })
      .filter((b): b is Broker => b !== null);
  }, [brokers, searchQuery, selectedState, selectedSqftRange]);

  // Group by firm
  const firmGroups = useMemo(() => {
    return firms.map(firm => ({
      firm,
      brokers: filteredData.filter(b => b.company === firm.name),
    })).filter(group => group.brokers.length > 0);
  }, [firms, filteredData]);

  const totalProperties = filteredData.reduce((acc, b) => acc + b.buildings.length, 0);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-xs text-[#9FA38F] mb-1.5">Search Brokers</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-white border border-[#E7E8E3] rounded-lg text-sm focus:outline-none focus:border-[#B1E5FF] focus:ring-1 focus:ring-[#B1E5FF]"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FA38F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* State Filter */}
          <div className="w-full md:w-40">
            <label className="block text-xs text-[#9FA38F] mb-1.5">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#E7E8E3] rounded-lg text-sm focus:outline-none focus:border-[#B1E5FF] focus:ring-1 focus:ring-[#B1E5FF] appearance-none cursor-pointer"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Square Footage Filter */}
          <div className="w-full md:w-48">
            <label className="block text-xs text-[#9FA38F] mb-1.5">Square Footage</label>
            <select
              value={selectedSqftRange}
              onChange={(e) => setSelectedSqftRange(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-white border border-[#E7E8E3] rounded-lg text-sm focus:outline-none focus:border-[#B1E5FF] focus:ring-1 focus:ring-[#B1E5FF] appearance-none cursor-pointer"
            >
              {SQFT_RANGES.map((range, idx) => (
                <option key={idx} value={idx}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 pt-3 border-t border-[#E7E8E3] flex items-center justify-between text-sm text-[#9FA38F]">
          <span>
            Showing <span className="text-[#1A1A1A] font-medium">{filteredData.length}</span> brokers with <span className="text-[#1A1A1A] font-medium">{totalProperties}</span> properties
          </span>
          {(searchQuery || selectedState || selectedSqftRange > 0) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedState("");
                setSelectedSqftRange(0);
              }}
              className="text-[#68A2CD] hover:text-[#1A1A1A] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Broker List */}
      <div className="space-y-4">
        {firmGroups.length === 0 ? (
          <div className="text-center py-12 text-[#9FA38F]">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No brokers match your search criteria</p>
          </div>
        ) : (
          firmGroups.map(({ firm, brokers: firmBrokers }, firmIndex) => {
            const firmBuildings = firmBrokers.flatMap(b => b.buildings);
            const firmPortfolio = calculatePortfolio(firmBuildings);

            return (
              <CollapsibleSection
                key={firm.slug}
                defaultOpen={firmIndex === 0}
                badge={`${firmBrokers.length} broker${firmBrokers.length !== 1 ? 's' : ''}`}
                subtitle={`${formatCurrency(firmPortfolio.totalLow)}–${formatCurrency(firmPortfolio.totalHigh)}/yr`}
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-lg">{firm.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{firm.name}</p>
                      <p className="text-xs text-[#9FA38F]">{firmBuildings.length} properties · {firm.market}</p>
                    </div>
                  </div>
                }
              >
                <div className="space-y-3">
                  {firmBrokers.map((broker, brokerIndex) => {
                    const brokerPortfolio = calculatePortfolio(broker.buildings);
                    return (
                      <CollapsibleBroker
                        key={broker.slug}
                        defaultOpen={firmIndex === 0 && brokerIndex === 0}
                        brokerName={broker.fullName}
                        brokerInitials={broker.fullName.split(' ').map(n => n[0]).join('')}
                        brokerTitle={broker.title}
                        brokerEmail={broker.email}
                        brokerPhone={broker.phone}
                        brokerProfileUrl={broker.profileUrl}
                        brokerSlug={broker.slug}
                        portfolioValue={`${formatCurrency(brokerPortfolio.totalLow)}–${formatCurrency(brokerPortfolio.totalHigh)}/yr`}
                        propertyCount={broker.buildings.length}
                        outreachButton={
                          <BrokerOutreachButton
                            broker={brokers.find(b => b.slug === broker.slug) || broker}
                            baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
                          />
                        }
                      >
                        <div className="space-y-2">
                          {broker.buildings.map((building, idx) => {
                            // Find original index for correct slug
                            const originalBroker = brokers.find(b => b.slug === broker.slug);
                            const originalIdx = originalBroker?.buildings.findIndex(
                              b => b.address === building.address && b.sqft === building.sqft
                            ) ?? idx;
                            const calc = calculateBuilding(building);
                            const buildingSlug = slugifyBuilding(building.address, originalIdx);
                            return (
                              <Link
                                key={idx}
                                href={`/for/${broker.slug}/${buildingSlug}`}
                                className="group block bg-[#FAFAFA] border border-[#E7E8E3] p-3 hover:border-[#B1E5FF] hover:bg-white transition-all"
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-[#1A1A1A] truncate group-hover:text-[#68A2CD] transition-colors">
                                      {building.address.split(',')[0]}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#9FA38F] mt-0.5">
                                      <span>{formatNumber(building.sqft)} SF</span>
                                      {building.propertyType && (
                                        <>
                                          <span className="w-1 h-1 rounded-full bg-[#9FA38F]"></span>
                                          <span>{building.propertyType}</span>
                                        </>
                                      )}
                                      <span className="w-1 h-1 rounded-full bg-[#9FA38F]"></span>
                                      <span className="text-[#68A2CD]">{calc.utility}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-[#1A1A1A]">
                                        {formatCurrency(calc.annualIncomeLow)}–{formatCurrency(calc.annualIncomeHigh)}
                                        <span className="text-[#9FA38F] text-xs font-normal">/yr</span>
                                      </p>
                                      <p className="text-xs text-[#9FA38F]">
                                        +{formatMillions(calc.valueUpliftLow)} uplift
                                      </p>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-[#F0F0EE] flex items-center justify-center group-hover:bg-[#B1E5FF] transition-colors">
                                      <svg className="w-3 h-3 text-[#9FA38F] group-hover:text-[#1A1A1A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </CollapsibleBroker>
                    );
                  })}
                </div>
              </CollapsibleSection>
            );
          })
        )}
      </div>
    </div>
  );
}
