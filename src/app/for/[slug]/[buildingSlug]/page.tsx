import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CTAButton } from "@/components/CTAButton";
import { SatelliteView } from "@/components/SatelliteView";
import { ShareButton } from "@/components/ShareButton";
import { PDFDownloadButton } from "@/components/PDFDownloadButton";
import { EmailShareButton } from "@/components/EmailShareButton";
import { calculateBuilding, formatCurrency, formatNumber, formatMillions, getUtilityFullName } from "@/lib/calculations";
import { BrokersData, Building } from "@/lib/types";
import brokersData from "@/../data/brokers.json";

interface PageProps {
  params: Promise<{ slug: string; buildingSlug: string }>;
}

function slugifyBuilding(address: string, index: number): string {
  const baseSlug = address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
  return `${baseSlug}-${index}`;
}

function findBuildingBySlug(buildings: Building[], buildingSlug: string): Building | undefined {
  // Extract index from slug (last segment after final hyphen that's a number)
  const match = buildingSlug.match(/-(\d+)$/);
  if (match) {
    const index = parseInt(match[1], 10);
    if (index >= 0 && index < buildings.length) {
      return buildings[index];
    }
  }
  // Fallback: try to match by address slug (for backwards compatibility)
  return buildings.find((b, i) => slugifyBuilding(b.address, i) === buildingSlug);
}

function formatMW(kw: number): string {
  const mw = kw / 1000;
  if (mw >= 1) {
    return `${mw.toFixed(1)} MW`;
  }
  return `${kw} kW`;
}

export async function generateStaticParams() {
  const data = brokersData as BrokersData;
  const params: { slug: string; buildingSlug: string }[] = [];

  for (const broker of data.brokers) {
    broker.buildings.forEach((building, index) => {
      params.push({
        slug: broker.slug,
        buildingSlug: slugifyBuilding(building.address, index),
      });
    });
  }

  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, buildingSlug } = await params;
  const data = brokersData as BrokersData;
  const broker = data.brokers.find((b) => b.slug === slug);

  if (!broker) {
    return { title: "Not Found | Lumen Energy" };
  }

  const building = findBuildingBySlug(broker.buildings, buildingSlug);

  if (!building) {
    return { title: "Not Found | Lumen Energy" };
  }

  const calc = calculateBuilding(building);

  return {
    title: `${building.address} | Solar Analysis | Lumen Energy`,
    description: `This ${formatNumber(building.sqft)} ft² property could generate ${formatCurrency(calc.annualIncomeLow)}-${formatCurrency(calc.annualIncomeHigh)}/year in solar lease revenue.`,
  };
}

export default async function BuildingPage({ params }: PageProps) {
  const { slug, buildingSlug } = await params;
  const data = brokersData as BrokersData;
  const broker = data.brokers.find((b) => b.slug === slug);

  if (!broker) {
    notFound();
  }

  const building = findBuildingBySlug(broker.buildings, buildingSlug);

  if (!building) {
    notFound();
  }

  const calc = calculateBuilding(building);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Accent Line */}
      <div className="accent-line" />

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="px-6 md:px-12 py-4 border-b border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <Link
              href={`/for/${broker.slug}`}
              className="inline-flex items-center text-sm text-[#5A5F52] hover:text-[#1A1A1A] transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {broker.fullName}&apos;s Portfolio
            </Link>
          </div>
        </div>

        {/* Hero Section - Two Column Layout */}
        <section className="px-6 md:px-12 py-10 md:py-14">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column: Title, Info, and Pricing Cards */}
              <div className="flex flex-col">
                <p className="eyebrow text-[#5A5F52] mb-3">Solar Lease Opportunity</p>
                <h1 className="display text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.03em] text-[#1A1A1A] mb-2">
                  {building.name || building.address.split(',')[0]}
                </h1>
                <p className="text-base text-[#5A5F52] mb-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(building.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1A1A1A] border-b border-[#B1E5FF] hover:border-[#DFFF5E]"
                  >
                    {building.address}
                  </a>
                </p>

                {/* Property Meta */}
                <div className="flex flex-wrap gap-4 mt-3 mb-6 text-sm text-[#5A5F52]">
                  <span><span className="text-[#1A1A1A] font-medium">{formatNumber(building.sqft)} SF</span> building</span>
                  <span><span className="text-[#1A1A1A] font-medium">{formatNumber(calc.usableRoofSqft)} SF</span> usable roof</span>
                  <span><span className="text-[#1A1A1A] font-medium">{building.propertyType || 'Industrial'}</span></span>
                  <span className="text-[#68A2CD]">{getUtilityFullName(calc.utility)}</span>
                </div>

                {/* Pricing Cards - Stacked */}
                <div className="space-y-4 flex-1">
                  {/* Annual Lease Revenue Card */}
                  <div className="bg-white border border-[#E7E8E3] rounded-xl p-5">
                    <p className="eyebrow text-[#5A5F52] text-xs mb-1">Annual Lease Revenue</p>
                    <p className="display text-[32px] font-light text-[#1A1A1A] tracking-[-0.02em] leading-tight">
                      {formatCurrency(calc.annualIncomeLow)} – {formatCurrency(calc.annualIncomeHigh)}
                      <span className="text-[#5A5F52] text-lg ml-1">/yr</span>
                    </p>

                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#E7E8E3]">
                      <div>
                        <p className="text-xs text-[#5A5F52]">Lease Rate</p>
                        <p className="font-medium text-[#1A1A1A]">${calc.lowRate.toFixed(2)}–${calc.highRate.toFixed(2)}/ft²</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5A5F52]">Usable Roof</p>
                        <p className="font-medium text-[#1A1A1A]">{formatNumber(calc.usableRoofSqft)} SF</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5A5F52]">System Size</p>
                        <p className="font-medium text-[#1A1A1A]">{formatMW(calc.systemSizeLow)}–{formatMW(calc.systemSizeHigh)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Value Uplift Card */}
                  <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border border-[#E7E8E3] rounded-xl p-5">
                    <p className="eyebrow text-[#5A5F52] text-xs mb-1">Value Uplift at Sale</p>
                    <div className="flex items-baseline gap-3">
                      <p className="display text-[32px] font-light text-[#1A1A1A] tracking-[-0.02em] leading-tight">
                        {formatMillions(calc.valueUpliftLow)} – {formatMillions(calc.valueUpliftHigh)}
                      </p>
                      <span className="text-sm text-[#5A5F52]">at 6% cap rate</span>
                    </div>
                    <p className="text-xs text-[#5A5F52] mt-3">
                      New NOI from solar lease income capitalized at market rate increases property value at sale.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#5A5F52] mt-4 mb-4">
                  Estimates based on {getUtilityFullName(calc.utility)} utility market rates.
                </p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <EmailShareButton
                    building={building}
                    broker={broker}
                    calculation={calc}
                  />
                  <ShareButton address={building.address} />
                  <PDFDownloadButton
                    building={building}
                    broker={broker}
                    calculation={calc}
                  />
                  {building.listingUrl ? (
                    <a
                      href={building.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 border border-[#E7E8E3] text-[#1A1A1A] transition-all hover:border-[#B1E5FF] hover:bg-[#CAEDFF] text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Listing
                    </a>
                  ) : (
                    <div></div>
                  )}
                </div>
              </div>

              {/* Right Column: Satellite View */}
              <div className="lg:self-stretch">
                <div className="rounded-xl overflow-hidden shadow-lg border border-[#E7E8E3] h-full min-h-[400px]">
                  <SatelliteView address={building.address} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="display text-[28px] font-light tracking-[-0.02em] mb-8">Why Solar Leasing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Passive Income</h3>
                <p className="text-sm text-[#5A5F52] leading-relaxed">Generate steady annual revenue with zero operational involvement.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Zero Capital Required</h3>
                <p className="text-sm text-[#5A5F52] leading-relaxed">Lumen handles all installation and maintenance at no cost.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Increased Property Value</h3>
                <p className="text-sm text-[#5A5F52] leading-relaxed">New NOI from solar lease directly increases property value at sale.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Long-Term Stability</h3>
                <p className="text-sm text-[#5A5F52] leading-relaxed">20-25 year agreements with inflation-adjusted payments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* About & CTA Section - Side by Side */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* How to Get Competitive Offers */}
              <div>
                <h2 className="display text-[28px] font-light tracking-[-0.02em] mb-4">How to Get Competitive Offers</h2>
                <p className="text-base text-[#5A5F52] leading-relaxed">
                  Lumen Energy is the modern solar broker, partnering with leading real estate owners to turn their rooftops into new revenue. We deliver rigorous portfolio analysis, create transparent competition among top developers, and provide white-glove service throughout.
                </p>
              </div>

              {/* CTA */}
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-6 text-center flex flex-col items-center justify-center">
                <h2 className="display text-[24px] font-light tracking-[-0.02em] mb-4">
                  Ready to unlock your rooftop&apos;s potential?
                </h2>
                <div className="flex flex-wrap gap-3 justify-center">
                  <CTAButton href="https://www.getclockwise.com/c/sam-runkle-lumen-energy/lumen">
                    Talk to Lumen
                  </CTAButton>
                  <PDFDownloadButton
                    building={building}
                    broker={broker}
                    calculation={calc}
                    variant="outline"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
