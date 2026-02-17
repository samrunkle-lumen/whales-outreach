import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FilterableBrokerList } from "@/components/FilterableBrokerList";
import { AddBrokersButton } from "@/components/AddBrokersButton";
import { AddressSearch } from "@/components/AddressSearch";
import { PasswordGate } from "@/components/PasswordGate";
import { BrokersData } from "@/lib/types";
import { calculatePortfolio, formatCurrency, formatNumber } from "@/lib/calculations";
import brokersData from "@/../data/brokers.json";

export default function Home() {
  const data = brokersData as BrokersData;

  // Calculate total portfolio stats
  const allBuildings = data.brokers.flatMap(b => b.buildings);
  const portfolioSummary = calculatePortfolio(allBuildings);
  const totalSqft = allBuildings.reduce((acc, b) => acc + b.sqft, 0);

  return (
    <PasswordGate>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Accent Line */}
        <div className="accent-line" />

        <Header />

      <main className="flex-1">
        {/* Hero Section - Internal Dashboard Style */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-b border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <p className="eyebrow text-[#5A5F52] mb-4">Outreach Dashboard</p>
            <h1 className="display text-[clamp(36px,5vw,56px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              Broker Outreach Pipeline
            </h1>
            <p className="text-lg text-[#5A5F52] max-w-2xl mb-8">
              Track solar lease opportunities across {data.firms.length} firms and {data.brokers.length} brokers.
              Click any listing to view detailed analysis or share with prospects.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Firms</p>
                <p className="display text-[28px] text-[#1A1A1A]">{data.firms.length}</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Brokers</p>
                <p className="display text-[28px] text-[#1A1A1A]">{data.brokers.length}</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Properties</p>
                <p className="display text-[28px] text-[#1A1A1A]">{allBuildings.length}</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Total ft²</p>
                <p className="display text-[28px] text-[#1A1A1A]">{formatNumber(totalSqft)}</p>
              </div>
              <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border border-[#E7E8E3] rounded-xl p-4">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Pipeline Value</p>
                <p className="display text-[28px] text-[#1A1A1A]">
                  {formatCurrency(portfolioSummary.totalLow)}<span className="text-[#5A5F52] text-lg">/yr</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Address Search Section */}
        <section className="px-6 md:px-12 py-12 md:py-16 bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border-b border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-8">
              <p className="eyebrow text-[#5A5F52] mb-4">PROPERTY RESEARCH</p>
              <h2 className="display text-[clamp(32px,4vw,48px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-4">
                Find Broker Listings by Address
              </h2>
              <p className="text-lg text-[#5A5F52] max-w-2xl mx-auto">
                Search any commercial property address to discover previous broker listings, contact information, and solar opportunity details.
              </p>
            </div>
            <div className="flex justify-center">
              <AddressSearch />
            </div>
          </div>
        </section>

        {/* Firms & Brokers - Filterable */}
        <section className="px-6 md:px-12 py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto">
            <FilterableBrokerList firms={data.firms} brokers={data.brokers} />
          </div>
        </section>

        {/* Internal CTA */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3] bg-[#F8F8F6]">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="display text-[28px] font-light tracking-[-0.02em] text-[#1A1A1A] mb-2">
                  Need to add more brokers?
                </h2>
                <p className="text-[#5A5F52]">
                  Add new firms and brokers with automatic property scraping and contact enrichment.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <AddBrokersButton />
                <a
                  href="https://venmo.com/u/Sam-Runkle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#DFFF5E] text-[#1A1A1A] font-medium text-sm hover:bg-[#d4f54e] transition-colors"
                >
                  Venmo Sam $1M
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

        <Footer />
      </div>
    </PasswordGate>
  );
}
