import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { calculatePortfolio, formatCurrency, formatNumber, calculateBuilding, formatMillions } from "@/lib/calculations";
import { OwnersData } from "@/lib/types";
import ownersData from "@/../data/owners.json";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function slugifyProperty(address: string, index: number): string {
  const baseSlug = address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
  return `${baseSlug}-${index}`;
}

// Pre-generate all owner pages at build time to avoid serverless function issues
export async function generateStaticParams() {
  const data = ownersData as OwnersData;
  return data.owners.map((owner) => ({
    slug: owner.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = ownersData as OwnersData;
  const owner = data.owners.find((o) => o.slug === slug);

  if (!owner) {
    return {
      title: "Not Found | Lumen Energy",
    };
  }

  return {
    title: `${owner.name} Portfolio | Lumen Energy`,
    description: `Solar revenue analysis for ${owner.name}'s ${owner.propertyCount} properties. Total system size: ${formatNumber(owner.properties.reduce((sum, p) => sum + (p.systemSize || 0), 0))} kW.`,
  };
}

export default async function OwnerPage({ params }: PageProps) {
  const { slug } = await params;
  const data = ownersData as OwnersData;
  const owner = data.owners.find((o) => o.slug === slug);

  if (!owner) {
    notFound();
  }

  const portfolio = calculatePortfolio(owner.properties);
  const totalSqft = owner.properties.reduce((acc, p) => acc + (p.sqft || 0), 0);
  const totalSystemSize = owner.properties.reduce((acc, p) => acc + (p.systemSize || 0), 0);
  const totalLeaseValue = owner.properties.reduce((acc, p) => acc + (p.leaseValue || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Accent Line */}
      <div className="accent-line" />

      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 md:px-12 py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto">
            <p className="eyebrow text-[#5A5F52] mb-4">PROPERTY OWNER PORTFOLIO</p>
            <h1 className="display text-[clamp(36px,5vw,64px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-4">
              {owner.name}
            </h1>
            <p className="text-lg text-[#5A5F52] max-w-2xl mb-8">
              Portfolio analysis for <span className="text-[#1A1A1A] font-medium">{owner.propertyCount} {owner.propertyCount === 1 ? 'property' : 'properties'}</span>. Solar opportunity for rooftop revenue generation.
            </p>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">{totalLeaseValue > 0 ? 'Total Annual Lease Value' : 'Annual Revenue Potential'}</p>
                {totalLeaseValue > 0 ? (
                  <>
                    <p className="display text-[24px] text-[#2E7D32]">
                      {formatCurrency(totalLeaseValue)}
                    </p>
                    <p className="text-sm text-[#5A5F52]">from solar leases</p>
                  </>
                ) : portfolio.totalLow === portfolio.totalHigh ? (
                  <>
                    <p className="display text-[24px] text-[#1A1A1A]">
                      {formatCurrency(portfolio.totalLow)}
                    </p>
                    <p className="text-sm text-[#5A5F52]">per year</p>
                  </>
                ) : (
                  <>
                    <p className="display text-[24px] text-[#1A1A1A]">
                      {formatCurrency(portfolio.totalLow)}
                    </p>
                    <p className="text-sm text-[#5A5F52]">to {formatCurrency(portfolio.totalHigh)}/yr</p>
                  </>
                )}
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Total System Size</p>
                <p className="display text-[24px] text-[#1A1A1A]">
                  {formatNumber(totalSystemSize)} kW
                </p>
                <p className="text-sm text-[#5A5F52]">~{formatNumber(Math.round(totalSystemSize / 1000))} MW</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Properties</p>
                <p className="display text-[24px] text-[#1A1A1A]">{owner.propertyCount}</p>
                <p className="text-sm text-[#5A5F52]">{formatNumber(totalSqft)} ft² total</p>
              </div>
              <div className="bg-gradient-to-b from-[#DFFF5E]/30 to-[#DFFF5E]/10 border-2 border-[#DFFF5E] rounded-xl p-5">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Annual Lease Value</p>
                <p className="display text-[24px] text-[#2E7D32]">{formatCurrency(totalLeaseValue)}</p>
                <p className="text-sm text-[#5A5F52]">from solar leases</p>
              </div>
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="display text-[28px] font-light tracking-[-0.02em] mb-6">Portfolio Properties</h2>

            <div className="space-y-3">
              {owner.properties.map((property, index) => {
                const calc = calculateBuilding(property);
                const propertySlug = slugifyProperty(property.address, index);

                return (
                  <Link
                    key={index}
                    href={`/owners/${owner.slug}/${propertySlug}`}
                    className="group/item block bg-white border border-[#E7E8E3] p-5 hover:border-[#B1E5FF] hover:shadow-md transition-all rounded-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1A1A1A] group-hover/item:text-[#68A2CD] transition-colors mb-1">
                          {property.address}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[#5A5F52]">
                          <span>{formatNumber(property.sqft)} ft²</span>
                          {property.systemSize && property.systemSize > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-[#5A5F52]"></span>
                              <span>{formatNumber(property.systemSize)} kW</span>
                            </>
                          )}
                          {property.propertyType && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-[#5A5F52]"></span>
                              <span>{property.propertyType}</span>
                            </>
                          )}
                          {property.utility && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-[#5A5F52]"></span>
                              <span className="text-[#68A2CD]">{property.utility}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right space-y-1">
                          {property.leaseValue && property.leaseValue > 0 ? (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#5A5F52] font-medium mb-0.5">Annual Lease</p>
                              <p className="text-base font-medium text-[#2E7D32]">
                                {formatCurrency(property.leaseValue)}
                                <span className="text-[#5A5F52] text-xs font-normal">/yr</span>
                              </p>
                            </div>
                          ) : calc.annualIncomeLow === calc.annualIncomeHigh ? (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#5A5F52] font-medium mb-0.5">Annual Revenue</p>
                              <p className="text-base font-medium text-[#1A1A1A]">
                                {formatCurrency(calc.annualIncomeLow)}
                                <span className="text-[#5A5F52] text-xs font-normal">/yr</span>
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#5A5F52] font-medium mb-0.5">Estimated Annual</p>
                              <p className="text-base font-medium text-[#1A1A1A]">
                                {formatCurrency(calc.annualIncomeLow)}–{formatCurrency(calc.annualIncomeHigh)}
                                <span className="text-[#5A5F52] text-xs font-normal">/yr</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#F8F8F6] flex items-center justify-center group-hover/item:bg-[#B1E5FF] transition-colors">
                          <svg className="w-5 h-5 text-[#5A5F52] group-hover/item:text-[#1A1A1A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Solar Opportunity CTA */}
        <section className="px-6 md:px-12 py-12 md:py-16 bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="display text-[clamp(32px,4vw,48px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              Solar Revenue Opportunity
            </h2>
            <p className="text-lg text-[#5A5F52] max-w-2xl mx-auto mb-8">
              This portfolio has significant potential for rooftop solar revenue generation. Transform unused roof space into predictable annual income.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DFFF5E] text-[#1A1A1A] font-medium hover:bg-[#d4f54e] transition-colors rounded-lg border-2 border-[#1A1A1A]"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
