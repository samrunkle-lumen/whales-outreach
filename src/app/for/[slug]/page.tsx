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
            <p className="eyebrow text-[#5A5F52] mb-4">{broker.company} · {broker.market}</p>
            <h1 className="display text-[clamp(36px,5vw,64px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-4">
              {broker.name}, turn your clients&apos; rooftops into revenue
            </h1>
            <p className="text-lg text-[#5A5F52] max-w-2xl mb-8">
              We analyzed <span className="text-[#1A1A1A] font-medium">{broker.buildings.length} {broker.buildings.length === 1 ? 'property' : 'properties'}</span> in your portfolio.
              Here&apos;s how solar can create new income for your clients.
            </p>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Annual Revenue Potential</p>
                <p className="display text-[24px] text-[#1A1A1A]">
                  {formatCurrency(portfolio.totalLow)}
                </p>
                <p className="text-sm text-[#5A5F52]">to {formatCurrency(portfolio.totalHigh)}/yr</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Value Uplift</p>
                <p className="display text-[24px] text-[#1A1A1A]">
                  {formatMillions(totalValueUplift)}
                </p>
                <p className="text-sm text-[#5A5F52]">at 6% cap rate</p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-5">
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Properties</p>
                <p className="display text-[24px] text-[#1A1A1A]">{broker.buildings.length}</p>
                <p className="text-sm text-[#5A5F52]">{formatNumber(totalSqft)} SF total</p>
              </div>
              <a
                href="#partner-benefits"
                className="bg-gradient-to-b from-[#DFFF5E]/30 to-[#DFFF5E]/10 border-2 border-[#DFFF5E] rounded-xl p-5 block hover:border-[#c4e654] transition-colors group"
              >
                <p className="eyebrow text-[#5A5F52] text-xs mb-1">Your Referral Fee</p>
                <p className="display text-[24px] text-[#2E7D32]">{formatCurrency(referralFee.low)}+</p>
                <p className="text-sm text-[#5A5F52] group-hover:text-[#1A1A1A] transition-colors">at project close →</p>
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              <CTAButton href="https://www.getclockwise.com/c/sam-runkle-lumen-energy/lumen">
                Learn More
              </CTAButton>
            </div>
          </div>
        </section>

        {/* Why This Matters Section */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3] bg-[#F8F8F6]">
          <div className="max-w-[1000px] mx-auto">
            <p className="eyebrow text-[#5A5F52] mb-3">Why This Matters</p>
            <h2 className="display text-[clamp(28px,4vw,36px)] leading-[1.05] tracking-[-0.02em] text-[#1A1A1A] mb-6">
              Stay Strategic. Stay Top-of-Mind. Stay Competitive.
            </h2>
            <p className="text-lg text-[#5A5F52] max-w-3xl mb-10 leading-relaxed">
              CRE is the long game. The brokers who succeed aren&apos;t just transaction facilitators—they&apos;re
              strategic advisors who bring ongoing opportunities to their clients. Solar leasing gives you a way to
              provide tangible value, stay relevant between deals, and differentiate yourself from peers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">Stay Relevant Between Deals</h3>
                <ul className="space-y-2 text-sm text-[#5A5F52] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Clients remember brokers who bring opportunities, not just transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Solar gives you a reason to reach out even when they&apos;re not buying or selling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Annual lease payments create annual conversation opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Position yourself as a strategic advisor throughout the property lifecycle</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">Differentiate from Your Peers</h3>
                <ul className="space-y-2 text-sm text-[#5A5F52] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Most brokers only call when there&apos;s a deal on the table</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>You&apos;re bringing a revenue opportunity they didn&apos;t know existed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Add value that offsets your fees and makes you more competitive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Clients will remember you 10 years later when it&apos;s time to sell</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">Strengthen Client Relationships</h3>
                <ul className="space-y-2 text-sm text-[#5A5F52] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Provide tangible value that benefits their NOI and property value</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Help them offer energy savings to tenants (competitive advantage)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Be the broker who brings solutions, not just problems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Create touchpoints throughout the property lifecycle</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">Build Your Reputation</h3>
                <ul className="space-y-2 text-sm text-[#5A5F52] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Partner with leading owners (Nuveen, JP Morgan, Hines use Lumen)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Position yourself as forward-thinking and sustainability-aware</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Help clients achieve ESG goals (matters for institutional investors)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2E7D32] mt-1">→</span>
                    <span>Be known as the broker who maximizes every revenue opportunity</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Buildings Grid */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1000px] mx-auto">
            <details className="group">
              <summary className="flex items-center justify-between mb-6 cursor-pointer list-none border-2 border-[#DFFF5E] bg-gradient-to-r from-[#DFFF5E]/10 to-transparent rounded-lg p-6 hover:border-[#B1E5FF] hover:bg-gradient-to-r hover:from-[#B1E5FF]/20 hover:to-transparent transition-all shadow-sm hover:shadow-md">
                <h2 className="display text-[28px] font-light tracking-[-0.02em]">Property Analysis</h2>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium text-[#1A1A1A]">
                    {broker.buildings.length} {broker.buildings.length === 1 ? 'property' : 'properties'}
                  </span>
                  <svg className="w-6 h-6 text-[#1A1A1A] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              <div className="space-y-3">
                {broker.buildings.map((building, index) => {
                  const calc = calculateBuilding(building);
                  const referralFee = calculateReferralFee(calc.systemSizeLow, calc.systemSizeHigh);
                  const buildingSlug = slugifyBuilding(building.address, index);
                  return (
                    <Link
                      key={index}
                      href={`/for/${broker.slug}/${buildingSlug}`}
                      className="group/item block bg-white border border-[#E7E8E3] p-5 hover:border-[#B1E5FF] hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-[#1A1A1A] group-hover/item:text-[#68A2CD] transition-colors mb-1">
                            {building.address.split(',')[0]}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-[#5A5F52]">
                            <span>{formatNumber(building.sqft)} SF</span>
                            <span className="w-1 h-1 rounded-full bg-[#5A5F52]"></span>
                            <span>{formatNumber(calc.usableRoofSqft)} SF usable roof</span>
                            <span className="w-1 h-1 rounded-full bg-[#5A5F52]"></span>
                            <span className="text-[#68A2CD]">{getUtilityFullName(calc.utility)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right space-y-1">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#5A5F52] font-medium mb-0.5">Annual Lease</p>
                              <p className="text-base font-medium text-[#1A1A1A]">
                                {formatCurrency(calc.annualIncomeLow)}–{formatCurrency(calc.annualIncomeHigh)}
                                <span className="text-[#5A5F52] text-xs font-normal">/yr</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#5A5F52] font-medium mb-0.5">Referral Income</p>
                              <p className="text-sm font-medium text-[#2E7D32]">
                                {formatCurrency(referralFee.low)}–{formatCurrency(referralFee.high)}
                              </p>
                            </div>
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
            </details>
          </div>
        </section>

        {/* Tenant & Property Benefits Section */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1000px] mx-auto">
            <p className="eyebrow text-[#5A5F52] mb-3">Client Value</p>
            <h2 className="display text-[clamp(28px,4vw,36px)] leading-[1.05] tracking-[-0.02em] text-[#1A1A1A] mb-6">
              How This Helps You Serve Your Clients Better
            </h2>
            <p className="text-lg text-[#5A5F52] max-w-3xl mb-10 leading-relaxed">
              Solar isn&apos;t just about NOI—it&apos;s about making properties more competitive and helping your clients
              attract and retain quality tenants. This gives you more powerful stories to tell when marketing properties.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tenant Benefits Card */}
              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">Tenant Benefits</h3>
                <ul className="space-y-3 text-sm text-[#5A5F52] leading-relaxed">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Energy cost savings</strong> through community solar subscriptions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Sustainability credentials</strong> for ESG-focused companies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">No upfront cost</strong> for tenants or landlords</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Competitive advantage</strong> in attracting quality tenants</span>
                  </li>
                </ul>
              </div>

              {/* Marketing Advantages Card */}
              <div className="bg-white border border-[#E7E8E3] rounded-xl p-6">
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">Marketing Advantages</h3>
                <ul className="space-y-3 text-sm text-[#5A5F52] leading-relaxed">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Differentiate listings</strong> with passive income story</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Appeal to institutional investors</strong> focused on sustainability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Increase property value</strong> from added NOI capitalized at sale</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Create refinancing opportunities</strong> with improved cash flow</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-[#5A5F52] mt-8 leading-relaxed">
              This means you can market properties more effectively and help clients maximize value across the entire
              property lifecycle—from tenant attraction to exit strategy.
            </p>
          </div>
        </section>

        {/* Referral Fee Section */}
        <section id="partner-benefits" className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3] scroll-mt-8">
          <div className="max-w-[1000px] mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              <div className="flex flex-col">
                <p className="eyebrow text-[#5A5F52] mb-3">Partner Benefits</p>
                <h2 className="display text-[28px] font-light tracking-[-0.02em] mb-4">
                  Build Stronger Client Relationships
                </h2>
                <p className="text-[#5A5F52] mb-6 leading-relaxed">
                  When you introduce your clients to Lumen, you&apos;re not just earning a referral fee—you&apos;re
                  positioning yourself as a strategic partner who maximizes every opportunity.
                </p>

                <div className="mb-6">
                  <p className="font-medium text-[#1A1A1A] mb-3">What this means for your practice:</p>
                  <ul className="space-y-2 text-sm text-[#5A5F52] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#2E7D32] mt-0.5">→</span>
                      <span><strong className="text-[#1A1A1A]">Stay top-of-mind:</strong> Annual lease payments give you a reason to check in every year</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2E7D32] mt-0.5">→</span>
                      <span><strong className="text-[#1A1A1A]">Create touchpoints:</strong> Refinancing opportunities when NOI increases, portfolio reviews, optimization discussions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2E7D32] mt-0.5">→</span>
                      <span><strong className="text-[#1A1A1A]">Differentiate your service:</strong> Bring value that offsets your fees and makes you irreplaceable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2E7D32] mt-0.5">→</span>
                      <span><strong className="text-[#1A1A1A]">Build your brand:</strong> Be the broker who thinks holistically about asset value</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border border-[#E7E8E3] rounded-xl p-6 mt-auto">
                  <p className="eyebrow text-[#5A5F52] text-xs mb-2">Your Potential Referral Fee</p>
                  <p className="display text-[36px] text-[#1A1A1A]">
                    {formatCurrency(referralFee.low)}+
                  </p>
                  <p className="text-sm text-[#5A5F52] mt-2">
                    Based on the portfolio above. But the real value? Clients remember brokers who bring
                    opportunities like this—often for a decade or more, long after the referral fee.
                  </p>
                </div>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-6 flex flex-col">
                <h3 className="font-medium text-[#1A1A1A] mb-6">How It Works</h3>
                <div className="space-y-8 flex-1 flex flex-col justify-center">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#B1E5FF] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#1A1A1A]">1</div>
                    <div className="pt-1">
                      <p className="font-medium text-[#1A1A1A]">Introduce Your Client</p>
                      <p className="text-sm text-[#5A5F52]">5-minute intro call to connect us with the decision maker</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#B1E5FF] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#1A1A1A]">2</div>
                    <div className="pt-1">
                      <p className="font-medium text-[#1A1A1A]">We Provide Investment-Grade Analysis</p>
                      <p className="text-sm text-[#5A5F52]">Rigorous portfolio analysis and competitive bids from top developers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#B1E5FF] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#1A1A1A]">3</div>
                    <div className="pt-1">
                      <p className="font-medium text-[#1A1A1A]">You Get Compensated & Positioned</p>
                      <p className="text-sm text-[#5A5F52]">Referral fee at project close AND positioned as the strategic advisor who made it happen</p>
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
                <p className="text-sm text-[#5A5F52] leading-relaxed">Transform unused rooftop space into predictable annual income without upfront costs.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Increase Property Value</h3>
                <p className="text-sm text-[#5A5F52] leading-relaxed">Boost NOI and appeal to ESG-focused investors and tenants seeking sustainable buildings.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">White-Glove Service</h3>
                <p className="text-sm text-[#5A5F52] leading-relaxed">Lumen handles everything—analysis, competitive bidding, and project execution.</p>
              </div>
              <div className="pl-5 border-l-2 border-[#E7E8E3]">
                <h3 className="font-medium mb-1.5">Long-Term Stability</h3>
                <p className="text-sm text-[#5A5F52] leading-relaxed">20-25 year agreements with predictable, inflation-adjusted payments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-t border-[#E7E8E3]">
          <div className="max-w-[1000px] mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="display text-[32px] font-light tracking-[-0.02em] mb-3">
                  Ready to unlock this value for your clients?
                </h2>
                <p className="text-[#5A5F52] mb-6">
                  Schedule a 15-minute call to discuss how we can help you differentiate your listings with solar revenue potential.
                </p>
                <div className="flex flex-wrap gap-4">
                  <CTAButton href="https://www.getclockwise.com/c/sam-runkle-lumen-energy/lumen">
                    Book a Call
                  </CTAButton>
                </div>
                <p className="mt-4 text-sm text-[#5A5F52]">
                  No commitment · Investment-grade analysis · White-glove service
                </p>
              </div>
              <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-6">
                <h3 className="font-medium text-[#1A1A1A] mb-4">Why Lumen?</h3>
                <ul className="space-y-3 text-sm text-[#5A5F52]">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Maximize revenue</strong> through competitive bidding among top solar developers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Zero upfront cost or risk</strong> — we handle everything at no cost to your clients</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">White-glove service</strong> from investment-grade analysis to project execution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-[#1A1A1A]">Trusted partner</strong> for leading commercial real estate owners <strong className="text-[#1A1A1A]">like Nuveen, JP Morgan, Hines, and others.</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
