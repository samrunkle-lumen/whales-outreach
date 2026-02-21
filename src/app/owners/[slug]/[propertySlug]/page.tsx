import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SatelliteView } from "@/components/SatelliteView";
import { PropertyPDFExport } from "@/components/PropertyPDFExport";
import { calculateBuilding, formatCurrency, formatNumber, getUtilityFullName } from "@/lib/calculations";
import { OwnersData, Property } from "@/lib/types";
import ownersData from "@/../data/owners.json";

interface PageProps {
  params: Promise<{ slug: string; propertySlug: string }>;
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

function findPropertyBySlug(
  ownerSlug: string,
  propertySlug: string
): { property: Property; owner: { name: string; slug: string }; index: number } | null {
  const data = ownersData as OwnersData;
  const owner = data.owners.find((o) => o.slug === ownerSlug);

  if (!owner) return null;

  const propertyIndex = owner.properties.findIndex((_, index) => {
    return slugifyProperty(owner.properties[index].address, index) === propertySlug;
  });

  if (propertyIndex === -1) return null;

  return {
    property: owner.properties[propertyIndex],
    owner: { name: owner.name, slug: owner.slug },
    index: propertyIndex,
  };
}

// Pre-generate all property pages at build time to avoid serverless function issues
export async function generateStaticParams() {
  const data = ownersData as OwnersData;
  const params: { slug: string; propertySlug: string }[] = [];

  data.owners.forEach((owner) => {
    owner.properties.forEach((property, index) => {
      params.push({
        slug: owner.slug,
        propertySlug: slugifyProperty(property.address, index),
      });
    });
  });

  return params;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps) {
  const { slug, propertySlug } = await params;
  const result = findPropertyBySlug(slug, propertySlug);

  if (!result) {
    return {
      title: "Not Found | Lumen Energy",
    };
  }

  return {
    title: `${result.property.address} | ${result.owner.name} | Lumen Energy`,
    description: `Solar analysis for ${result.property.address}. Property owned by ${result.owner.name}. ${result.property.systemSize ? `System size: ${formatNumber(result.property.systemSize)} kW` : ''}`,
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug, propertySlug } = await params;
  const result = findPropertyBySlug(slug, propertySlug);

  if (!result) {
    notFound();
  }

  const { property, owner } = result;
  const calc = calculateBuilding(property);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="accent-line" />
      <Header />

      <main className="flex-1">
        {/* Property Header */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-b border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <Link
              href={`/owners/${owner.slug}`}
              className="inline-flex items-center gap-2 text-[#5A5F52] hover:text-[#1A1A1A] transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {owner.name}
            </Link>

            <p className="eyebrow text-[#5A5F52] mb-4">PROPERTY ANALYSIS</p>
            <h1 className="display text-[clamp(36px,5vw,56px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              {property.address}
            </h1>
            <p className="text-lg text-[#5A5F52] max-w-2xl mb-6">
              Solar opportunity analysis for this commercial property owned by {owner.name}.
            </p>

            {/* PDF Export Button */}
            <div className="flex gap-3">
              <PropertyPDFExport
                property={property}
                calculation={calc}
                owner={owner}
                variant="outline"
              />
            </div>
          </div>
        </section>

        {/* Satellite View */}
        <section className="px-6 md:px-12 py-8 md:py-12 border-b border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <div className="h-[400px] md:h-[500px] rounded-xl overflow-hidden border-2 border-[#E7E8E3]">
              <SatelliteView address={property.address} />
            </div>
          </div>
        </section>

        {/* Property Details */}
        <section className="px-6 md:px-12 py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Property Information */}
              <div className="space-y-6">
                <div>
                  <h2 className="display text-[28px] font-light tracking-[-0.02em] text-[#1A1A1A] mb-6">
                    Property Details
                  </h2>

                  <div className="space-y-4">
                    {property.propertyType && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">TYPE</span>
                        <span className="text-[#1A1A1A]">{property.propertyType}</span>
                      </div>
                    )}

                    {property.sqft > 0 && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">ROOF AREA</span>
                        <span className="text-[#1A1A1A]">{formatNumber(property.sqft)} ft²</span>
                      </div>
                    )}

                    {calc.usableRoofSqft > 0 && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">USABLE ROOF</span>
                        <span className="text-[#1A1A1A]">{formatNumber(calc.usableRoofSqft)} ft²</span>
                      </div>
                    )}

                    {property.utility && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">UTILITY</span>
                        <span className="text-[#1A1A1A]">{property.utility}</span>
                      </div>
                    )}

                    {property.city && property.state && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">LOCATION</span>
                        <span className="text-[#1A1A1A]">{property.city}, {property.state}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Solar Analysis */}
              <div className="space-y-6">
                <div>
                  <h2 className="display text-[28px] font-light tracking-[-0.02em] text-[#1A1A1A] mb-6">
                    Solar Opportunity
                  </h2>

                  <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border-2 border-[#E7E8E3] rounded-xl p-6 space-y-6">
                    {property.systemSize && property.systemSize > 0 && (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-2">SYSTEM SIZE</p>
                        <p className="display text-[36px] text-[#1A1A1A]">
                          {formatNumber(property.systemSize)} kW
                        </p>
                        <p className="text-sm text-[#5A5F52] mt-1">
                          ~{formatNumber(Math.round(property.systemSize / 1000))} MW capacity
                        </p>
                      </div>
                    )}

                    {property.leaseValue && property.leaseValue > 0 ? (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-2">ANNUAL LEASE VALUE</p>
                        <p className="display text-[36px] text-[#2E7D32]">
                          {formatCurrency(property.leaseValue)}
                          <span className="text-[#5A5F52] text-lg">/yr</span>
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-2">ESTIMATED ANNUAL REVENUE</p>
                        {calc.annualIncomeLow === calc.annualIncomeHigh ? (
                          <p className="display text-[28px] text-[#1A1A1A]">
                            {formatCurrency(calc.annualIncomeLow)}
                            <span className="text-[#5A5F52] text-lg">/yr</span>
                          </p>
                        ) : (
                          <>
                            <p className="display text-[28px] text-[#1A1A1A]">
                              {formatCurrency(calc.annualIncomeLow)}
                            </p>
                            <p className="text-sm text-[#5A5F52] mt-1">
                              to {formatCurrency(calc.annualIncomeHigh)}/year
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {!property.systemSize && calc.systemSizeLow > 0 && (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-2">ESTIMATED SYSTEM SIZE</p>
                        {calc.systemSizeLow === calc.systemSizeHigh ? (
                          <p className="text-[#1A1A1A] text-lg">
                            {formatNumber(calc.systemSizeLow)} kW
                          </p>
                        ) : (
                          <p className="text-[#1A1A1A] text-lg">
                            {formatNumber(calc.systemSizeLow)}–{formatNumber(calc.systemSizeHigh)} kW
                          </p>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-[#E7E8E3]">
                      <div className="mb-3">
                        <p className="eyebrow text-[#5A5F52] text-xs mb-1">VALUE UPLIFT AT SALE</p>
                        <p className="text-[22px] font-medium text-[#1A1A1A]">
                          {property.leaseValue && property.leaseValue > 0
                            ? formatCurrency(Math.round(property.leaseValue / 0.06))
                            : calc.annualIncomeLow === calc.annualIncomeHigh
                            ? formatCurrency(calc.valueUpliftLow)
                            : `${formatCurrency(calc.valueUpliftLow)}–${formatCurrency(calc.valueUpliftHigh)}`}
                          <span className="text-[#5A5F52] text-sm font-normal ml-2">at 6% cap</span>
                        </p>
                      </div>
                      <p className="text-sm text-[#5A5F52] leading-relaxed">
                        Transform unused rooftop space into predictable annual income without upfront costs through solar leasing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Solar Leasing */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="display text-[clamp(32px,4vw,42px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-8">
              Why Solar Leasing
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Passive Income */}
              <div className="bg-white border-2 border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-[20px] font-medium text-[#1A1A1A] mb-3">Passive Income, Zero Risk</h3>
                <p className="text-[#5A5F52] leading-relaxed mb-4">
                  Turn unused rooftop space into steady revenue with zero capital required and zero operational complexity.
                </p>
                <p className="text-[#5A5F52] leading-relaxed">
                  20-25 year agreements with inflation-adjusted payments provide predictable, long-term cash flow.
                </p>
              </div>

              {/* Property Value */}
              <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border-2 border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-[20px] font-medium text-[#1A1A1A] mb-3">Increased Property Value</h3>
                <p className="text-[#5A5F52] leading-relaxed mb-4">
                  New NOI from solar lease income directly increases property value at sale. At a 6% cap rate, annual lease revenue adds substantial value to your asset.
                </p>
                <p className="text-[#5A5F52] leading-relaxed">
                  ESG credentials improve marketability and attract institutional investors who prioritize sustainability.
                </p>
              </div>

              {/* Tenant Benefits */}
              <div className="bg-white border-2 border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-[20px] font-medium text-[#1A1A1A] mb-3">Tenant Benefits</h3>
                <p className="text-[#5A5F52] leading-relaxed mb-4">
                  Community solar subscriptions reduce tenant energy costs with no installation required on their part.
                </p>
                <p className="text-[#5A5F52] leading-relaxed">
                  Competitive advantage in attracting and retaining quality tenants.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Get Competitive Offers */}
        <section className="px-6 md:px-12 py-12 md:py-16 bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="display text-[clamp(32px,4vw,42px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              How to Get Competitive Offers
            </h2>
            <p className="text-lg text-[#5A5F52] max-w-3xl mb-8 leading-relaxed">
              Lumen Energy is the modern solar broker, partnering with leading real estate owners to turn their rooftops into new revenue. We deliver rigorous portfolio analysis, create transparent competition among top developers, and provide white-glove service throughout.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#DFFF5E] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1A1A1A] font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A1A1A] mb-2">Portfolio Analysis</h3>
                    <p className="text-sm text-[#5A5F52] leading-relaxed">
                      We evaluate your entire portfolio to identify the properties with the highest solar revenue potential.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#DFFF5E] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1A1A1A] font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A1A1A] mb-2">Competitive Bidding</h3>
                    <p className="text-sm text-[#5A5F52] leading-relaxed">
                      We create transparent competition among top solar developers to maximize your lease rates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#DFFF5E] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1A1A1A] font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A1A1A] mb-2">Investment-Grade Analysis</h3>
                    <p className="text-sm text-[#5A5F52] leading-relaxed">
                      Receive detailed financial modeling and due diligence at no cost to you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#DFFF5E] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1A1A1A] font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A1A1A] mb-2">White-Glove Execution</h3>
                    <p className="text-sm text-[#5A5F52] leading-relaxed">
                      We manage the entire process from start to finish, ensuring seamless execution.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#E7E8E3] rounded-xl p-6">
              <p className="eyebrow text-[#5A5F52] text-xs mb-3">TRUSTED BY INDUSTRY LEADERS</p>
              <p className="text-[#1A1A1A] leading-relaxed mb-4">
                We partner with leading commercial real estate owners including <strong>Nuveen, JP Morgan, Hines,</strong> and others to maximize their solar revenue potential.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:hello@lumen.energy"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#DFFF5E] text-[#1A1A1A] font-medium hover:bg-[#d4f54e] transition-colors rounded-lg border-2 border-[#1A1A1A]"
                >
                  Contact Us
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <Link
                  href={`/owners/${owner.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#E7E8E3] text-[#1A1A1A] font-medium hover:border-[#B1E5FF] hover:bg-[#CAEDFF] transition-colors rounded-lg"
                >
                  View Full Portfolio
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
