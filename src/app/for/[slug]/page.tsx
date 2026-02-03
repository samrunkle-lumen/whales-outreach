import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CTAButton } from "@/components/CTAButton";
import { calculatePortfolio, formatCurrency, formatNumber, calculateBuilding, calculateReferralFee, getUtilityFullName, formatMillions } from "@/lib/calculations";
import { BrokersData } from "@/lib/types";
import brokersData from "@/../data/brokers.json";

interface PageProps {
  params: Promise<{ slug: string }>;
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

export async function generateStaticParams() {
  const data = brokersData as BrokersData;
  return data.brokers.map((broker) => ({
    slug: broker.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = brokersData as BrokersData;
  const broker = data.brokers.find((b) => b.slug === slug);

  if (!broker) {
    return {
      title: "Not Found | Lumen Energy",
    };
  }

  return {
    title: `${broker.fullName} | Turn Rooftops Into Revenue | Lumen Energy`,
    description: `Solar revenue analysis for ${broker.fullName}'s ${broker.buildings.length} properties in ${broker.market}. Potential: ${formatCurrency(calculatePortfolio(broker.buildings).totalLow)}-${formatCurrency(calculatePortfolio(broker.buildings).totalHigh)}/year.`,
  };
}

export default async function BrokerPage({ params }: PageProps) {
  const { slug } = await params;
  const data = brokersData as BrokersData;
  const broker = data.brokers.find((b) => b.slug === slug);

  if (!broker) {
    notFound();
  }

  const portfolio = calculatePortfolio(broker.buildings);
  const referralFee = calculateReferralFee(portfolio.totalSystemSizeLow, portfolio.totalSystemSizeHigh);
  const totalSqft = broker.buildings.reduce((acc, b) => acc + b.sqft, 0);
  const totalValueUplift = portfolio.buildings.reduce((acc, b) => acc + b.valueUpliftLow, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Accent Line */}
      <div className="accent-line" />

      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 md:px-12 py-12 md:py-16">
          <div className="max-w-[1000px] mx-auto">
            <p className="eyebrow text-[#9FA38F] mb-4">{broker.company} · {broker.market}</p>
            <h1 className="display text-[clamp(36px,5vw,64px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-4">
              {broker.name}, turn your clients&apos; rooftops into revenue
            </h1>
            <p className="text-lg text-[#9FA38F] max-w-2xl mb-8">
              We analyzed <span className="text-[#1A1A1A] font-medium">{broker.buildings.length} properties</span> in your portfolio.
              Here&apos;s how solar can create new income for your clients.
            </p>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#9FA38F] text-xs mb-1">Annual Revenue Potential</p>
                <p className="display text-[24px] text-[#1A1A1A]">
                  {formatCurrency(portfolio.totalLow)}
                </p>
                <p className="text-sm text-[#9FA38F]">to {formatCurrency(portfolio.totalHigh)}/yr</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#9FA38F] text-xs mb-1">Value Uplift</p>
                <p className="display text-[24px] text-[#1A1A1A]">
                  {formatMillions(totalValueUplift)}
                </p>
                <p className="text-sm text-[#9FA38F]">at 6% cap rate</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#9FA38F] text-xs mb-1">Properties</p>
                <p className="display text-[24px] text-[#1A1A1A]">{broker.buildings.length}</p>
                <p className="text-sm text-[#9FA38F]">{formatNumber(totalSqft)} SF total</p>
              </div>
              <a
                href="#partner-benefits"
                className="bg-gradient-to-b from-[#DFFF5E]/30 to-[#DFFF5E]/10 border-2 border-[#DFFF5E] rounded-xl p-5 block hover:border-[#c4e654] transition-colors group"
              >
                <p className="eyebrow text-[#9FA38F] text-xs mb-1">Your Referral Fee</p>
                <p className="display text-[24px] text-[#2E7D32]">{formatCurrency(referralFee.low)}+</p>
                <p className="text-sm text-[#9FA38F] group-hover:text-[#1A1A1A] transition-colors">at project close →</p>
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              <CTAButton href="https://www.getclockwise.com/c/sam-runkle-lumen-energy/lumen">
                Learn More
              </CTAButton>
            </div>
          </div>
        </section>

        {/* Buildings Grid */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1000px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="display text-[28px] font-light tracking-[-0.02em]">Property Analysis</h2>
              <span className="text-sm text-[#9FA38F]">
                {broker.buildings.length} properties
              </span>
            </div>

            <div className="space-y-3">
              {broker.buildings.map((building, index) => {
                const calc = calculateBuilding(building);
                const buildingSlug = slugifyBuilding(building.address, index);
                return (
                  <Link
                    key={index}
                    href={`/for/${broker.slug}/${buildingSlug}`}
                    className="group block bg-white border border-[#E7E8E3] p-5 hover:border-[#B1E5FF] hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1A1A1A] group-hover:text-[#68A2CD] transition-colors mb-1">
                          {building.address.split(',')[0]}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[#9FA38F]">
                          <span>{formatNumber(building.sqft)} SF</span>
                          <span className="w-1 h-1 rounded-full bg-[#9FA38F]"></span>
                          <span>{formatNumber(calc.usableRoofSqft)} SF usable roof</span>
                          <span className="w-1 h-1 rounded-full bg-[#9FA38F]"></span>
                          <span className="text-[#68A2CD]">{getUtilityFullName(calc.utility)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-medium text-[#1A1A1A]">
                            {formatCurrency(calc.annualIncomeLow)}–{formatCurrency(calc.annualIncomeHigh)}
                            <span className="text-[#9FA38F] text-sm font-normal">/yr</span>
                          </p>
                          <p className="text-xs text-[#9FA38F]">
                            +{formatMillions(calc.valueUpliftLow)} value uplift
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#F8F8F6] flex items-center justify-center group-hover:bg-[#B1E5FF] transition-colors">
                          <svg className="w-5 h-5 text-[#9FA38F] group-hover:text-[#1A1A1A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Referral Fee Section */}
        <section id="partner-benefits" className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3] scroll-mt-8">
          <div className="max-w-[1000px] mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              <div className="flex flex-col">
                <p className="eyebrow text-[#9FA38F] mb-3">Partner Benefits</p>
                <h2 className="display text-[28px] font-light tracking-[-0.02em] mb-4">
                  Earn While Helping Your Clients
                </h2>
                <p className="text-[#9FA38F] mb-6 leading-relaxed">
                  When you refer your clients to Lumen, you&apos;ll receive a meaningful referral fee for every project that closes.
                  It&apos;s a win-win: your clients get new revenue from their rooftops, and you get compensated for the introduction.
                </p>
                <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border border-[#E7E8E3] rounded-xl p-6 mt-auto">
                  <p className="eyebrow text-[#9FA38F] text-xs mb-2">Your Potential Referral Fee</p>
                  <p className="display text-[36px] text-[#1A1A1A]">
                    {formatCurrency(referralFee.low)}+
                  </p>
                  <p className="text-sm text-[#9FA38F] mt-2">
                    Based on the portfolio above. Paid upon project completion.
                  </p>
                </div>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-6 flex flex-col">
                <h3 className="font-medium text-[#1A1A1A] mb-6">How Referrals Work</h3>
                <div className="space-y-8 flex-1 flex flex-col justify-center">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#B1E5FF] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#1A1A1A]">1</div>
                    <div className="pt-1">
                      <p className="font-medium text-[#1A1A1A]">Introduce Your Client</p>
                      <p className="text-sm text-[#9FA38F]">Connect us with the building owner or decision maker</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#B1E5FF] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#1A1A1A]">2</div>
                    <div className="pt-1">
                      <p className="font-medium text-[#1A1A1A]">We Handle Everything</p>
                      <p className="text-sm text-[#9FA38F]">Analysis, competitive bidding, and project execution</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#B1E5FF] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#1A1A1A]">3</div>
                    <div className="pt-1">
                      <p className="font-medium text-[#1A1A1A]">Get Paid</p>
                      <p className="text-sm text-[#9FA38F]">Receive your referral fee when the project closes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="display text-[28px] font-light tracking-[-0.02em] mb-8">Why Solar Matters for Your Clients</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">New Revenue Stream</h3>
                <p className="text-sm text-[#9FA38F] leading-relaxed">Transform unused rooftop space into predictable annual income without upfront costs.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Increase Property Value</h3>
                <p className="text-sm text-[#9FA38F] leading-relaxed">Boost NOI and appeal to ESG-focused investors and tenants seeking sustainable buildings.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">White-Glove Service</h3>
                <p className="text-sm text-[#9FA38F] leading-relaxed">Lumen handles everything—analysis, competitive bidding, and project execution.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Long-Term Stability</h3>
                <p className="text-sm text-[#9FA38F] leading-relaxed">20-25 year agreements with predictable, inflation-adjusted payments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1000px] mx-auto">
            <div className="max-w-[500px]">
              <h2 className="display text-[32px] font-light tracking-[-0.02em] mb-3">
                Ready to unlock this value for your clients?
              </h2>
              <p className="text-[#9FA38F] mb-6">
                Schedule a 15-minute call to discuss how we can help you differentiate your listings with solar revenue potential.
              </p>
              <div className="flex flex-wrap gap-4">
                <CTAButton href="https://www.getclockwise.com/c/sam-runkle-lumen-energy/lumen">
                  Book a Call
                </CTAButton>
              </div>
              <p className="mt-4 text-sm text-[#9FA38F]">
                No commitment · Investment-grade analysis · White-glove service
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
