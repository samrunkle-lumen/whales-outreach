import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FilterableOwnerList } from "@/components/FilterableOwnerList";
import { AddressSearch } from "@/components/AddressSearch";
import { PasswordGate } from "@/components/PasswordGate";
import { OwnersData } from "@/lib/types";
import { calculatePortfolio, formatCurrency, formatNumber } from "@/lib/calculations";
import ownersData from "@/../data/owners.json";

export default function Home() {
  const data = ownersData as OwnersData;

  // Calculate total portfolio stats
  const allProperties = data.owners.flatMap(o => o.properties);
  const portfolioSummary = calculatePortfolio(allProperties);
  const totalSqft = allProperties.reduce((acc, p) => acc + p.sqft, 0);

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
            <p className="eyebrow text-[#5A5F52] mb-4">WHALES OUTREACH</p>
            <h1 className="display text-[clamp(36px,5vw,56px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              Property Owner Pipeline
            </h1>
            <p className="text-lg text-[#5A5F52] max-w-2xl mb-8">
              Track and manage outreach for 1,641 high-value commercial properties across {data.owners.length} property owners.
              Organized by owner for targeted contact strategies.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Owners</p>
                <p className="display text-[28px] text-[#1A1A1A]">{data.owners.length}</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Properties</p>
                <p className="display text-[28px] text-[#1A1A1A]">{allProperties.length}</p>
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
              <p className="eyebrow text-[#5A5F52] mb-4">PROPERTY LOOKUP</p>
              <h2 className="display text-[clamp(32px,4vw,48px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-4">
                Search Properties by Address
              </h2>
              <p className="text-lg text-[#5A5F52] max-w-2xl mx-auto">
                Look up any property in the Whales database to view owner information and outreach details.
              </p>
            </div>
            <div className="flex justify-center">
              <AddressSearch />
            </div>
          </div>
        </section>

        {/* Property Owners - Filterable */}
        <section className="px-6 md:px-12 py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto">
            <FilterableOwnerList owners={data.owners} />
          </div>
        </section>
      </main>

        <Footer />
      </div>
    </PasswordGate>
  );
}
