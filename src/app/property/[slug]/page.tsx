import { notFound } from 'next/navigation';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface PropertyListing {
  address: string;
  slug: string;
  brokerName?: string;
  brokerCompany?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  propertyType?: string;
  sqft?: number;
  listingUrl?: string;
  listingDate?: string;
  description?: string;
  price?: string;
  searchResults: string[];
  createdAt: string;
}

async function getProperty(slug: string): Promise<PropertyListing | null> {
  const propertyFile = join(process.cwd(), 'data', 'properties', `${slug}.json`);

  if (!existsSync(propertyFile)) {
    return null;
  }

  const data = readFileSync(propertyFile, 'utf-8');
  return JSON.parse(data);
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="accent-line" />
      <Header />

      <main className="flex-1">
        {/* Property Header */}
        <section className="px-6 md:px-12 py-12 md:py-16 border-b border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto">
            <p className="eyebrow text-[#5A5F52] mb-4">PROPERTY LISTING</p>
            <h1 className="display text-[clamp(36px,5vw,56px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              {property.address}
            </h1>
            <p className="text-lg text-[#5A5F52] max-w-2xl">
              Commercial property listing with broker information and solar potential analysis.
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

                    {property.sqft && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">SQUARE FEET</span>
                        <span className="text-[#1A1A1A]">{property.sqft.toLocaleString()} ft²</span>
                      </div>
                    )}

                    {property.price && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">PRICE</span>
                        <span className="text-[#1A1A1A]">{property.price}</span>
                      </div>
                    )}

                    {property.listingDate && (
                      <div className="flex justify-between py-3 border-b border-[#E7E8E3]">
                        <span className="eyebrow text-[#5A5F52] text-sm">LISTED</span>
                        <span className="text-[#1A1A1A]">
                          {new Date(property.listingDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {property.description && (
                  <div>
                    <h3 className="eyebrow text-[#5A5F52] mb-3">DESCRIPTION</h3>
                    <p className="text-[#1A1A1A] leading-relaxed">{property.description}</p>
                  </div>
                )}
              </div>

              {/* Broker Information */}
              <div className="space-y-6">
                <div>
                  <h2 className="display text-[28px] font-light tracking-[-0.02em] text-[#1A1A1A] mb-6">
                    Broker Contact
                  </h2>

                  <div className="bg-[#F8F8F6] border-2 border-[#E7E8E3] rounded-xl p-6 space-y-4">
                    {property.brokerName && (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-1">BROKER</p>
                        <p className="text-[#1A1A1A] text-lg font-medium">{property.brokerName}</p>
                      </div>
                    )}

                    {property.brokerCompany && (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-1">COMPANY</p>
                        <p className="text-[#1A1A1A]">{property.brokerCompany}</p>
                      </div>
                    )}

                    {property.brokerEmail && (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-1">EMAIL</p>
                        <a
                          href={`mailto:${property.brokerEmail}`}
                          className="text-[#1A1A1A] hover:text-[#5A5F52] underline"
                        >
                          {property.brokerEmail}
                        </a>
                      </div>
                    )}

                    {property.brokerPhone && (
                      <div>
                        <p className="eyebrow text-[#5A5F52] text-xs mb-1">PHONE</p>
                        <a
                          href={`tel:${property.brokerPhone}`}
                          className="text-[#1A1A1A] hover:text-[#5A5F52]"
                        >
                          {property.brokerPhone}
                        </a>
                      </div>
                    )}

                    {property.listingUrl && (
                      <div className="pt-4 border-t border-[#E7E8E3]">
                        <a
                          href={property.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#5A5F52] font-medium"
                        >
                          View Original Listing
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Results */}
                {property.searchResults && property.searchResults.length > 0 && (
                  <div>
                    <h3 className="eyebrow text-[#5A5F52] mb-3">SEARCH QUERIES USED</h3>
                    <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-xl p-4 space-y-2">
                      {property.searchResults.map((query, index) => (
                        <div key={index} className="text-sm text-[#5A5F52] font-mono">
                          {query}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Solar Opportunity CTA */}
        <section className="px-6 md:px-12 py-12 md:py-16 bg-gradient-to-b from-[#FAFFFE] to-[#F5FFFC] border-t border-[#E7E8E3]">
          <div className="max-w-[1200px] mx-auto text-center">
            <p className="eyebrow text-[#5A5F52] mb-4">SOLAR OPPORTUNITY</p>
            <h2 className="display text-[clamp(32px,4vw,48px)] leading-[1.0] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              Ready to Turn This Rooftop Into Revenue?
            </h2>
            <p className="text-lg text-[#5A5F52] max-w-2xl mx-auto mb-8">
              Contact the broker above to discuss solar lease opportunities for this property.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DFFF5E] text-[#1A1A1A] font-medium hover:bg-[#d4f54e] transition-colors rounded-lg border-2 border-[#1A1A1A]"
            >
              Back to Dashboard
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
