import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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

export async function generateMetadata({ params }: PageProps) {
  const { slug, propertySlug } = await params;
  const result = findPropertyBySlug(slug, propertySlug);

  if (!result) {
    return {
      title: "Not Found | Whales Outreach",
    };
  }

  return {
    title: `${result.property.address} | ${result.owner.name} | Whales Outreach`,
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
            <p className="text-lg text-[#5A5F52] max-w-2xl">
              Solar opportunity analysis for this commercial property owned by {owner.name}.
            </p>
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
                        <p className="display text-[28px] text-[#1A1A1A]">
                          {formatCurrency(calc.annualIncomeLow)}
                        </p>
                        <p className="text-sm text-[#5A5F52] mt-1">
                          to {formatCurrency(calc.annualIncomeHigh)}/year
                        </p>
                      </div>
                    )}

                    {!property.systemSize && calc.systemSizeLow > 0 && (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-2">ESTIMATED SYSTEM SIZE</p>
                        <p className="text-[#1A1A1A] text-lg">
                          {formatNumber(calc.systemSizeLow)}–{formatNumber(calc.systemSizeHigh)} kW
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-[#E7E8E3]">
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

        {/* Owner Context */}
        <section className="px-6 md:px-12 py-12 md:py-16 bg-[#F8F8F6] border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <p className="eyebrow text-[#5A5F52] mb-3">PROPERTY OWNER</p>
            <h2 className="display text-[28px] font-light tracking-[-0.02em] text-[#1A1A1A] mb-4">
              Part of {owner.name} Portfolio
            </h2>
            <p className="text-[#5A5F52] mb-6">
              This property is part of a larger portfolio with significant solar opportunity potential.
            </p>
            <Link
              href={`/owners/${owner.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DFFF5E] text-[#1A1A1A] font-medium hover:bg-[#d4f54e] transition-colors rounded-lg border-2 border-[#1A1A1A]"
            >
              View Full Portfolio
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
