"use client";

import { useState } from "react";
import { Broker } from "@/lib/types";
import { calculatePortfolio, formatCurrency, formatNumber } from "@/lib/calculations";

interface BrokerOutreachButtonProps {
  broker: Broker;
  baseUrl?: string;
}

export function BrokerOutreachButton({ broker, baseUrl = "" }: BrokerOutreachButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const portfolio = calculatePortfolio(broker.buildings);
  const totalSqft = broker.buildings.reduce((acc, b) => acc + b.sqft, 0);
  const brokerPageUrl = `${baseUrl}/for/${broker.slug}`;

  // Calculate per-property average for impact
  const avgAnnualPerProperty = Math.round((portfolio.totalLow + portfolio.totalHigh) / 2 / broker.buildings.length);
  const avgSqftPerProperty = Math.round(totalSqft / broker.buildings.length);

  const emailSubject = `${broker.name} - ${formatCurrency(portfolio.totalHigh)}/yr sitting on your clients' rooftops`;

  const emailBody = `${broker.name},

Your clients are leaving ${formatCurrency(portfolio.totalLow)}–${formatCurrency(portfolio.totalHigh)}/year on the table.

I analyzed ${broker.buildings.length} ${broker.buildings.length === 1 ? 'property' : 'properties'} you represent (${formatNumber(totalSqft)} SF total). The rooftops alone could generate serious passive income through solar leases—with zero capital investment from owners.

Here's the breakdown I put together for you: ${brokerPageUrl}

Why this matters to you:
→ Avg property = ${formatCurrency(avgAnnualPerProperty)}/yr in new income for your client
→ Property values increase 3-5% from the added NOI
→ You bring owners a revenue stream they didn't know existed

How it works: You make an intro. We do everything else—site analysis, competitive developer bidding, lease negotiation. Owners sign a lease and start collecting checks.

Two options:
1. Forward this to an owner who'd want to know about this
2. 15 min call to walk through specific properties: https://www.getclockwise.com/c/sam-runkle-lumen-energy/lumen

Either way, happy to be a resource.

Sam Runkle
Lumen Energy`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = emailBody;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(broker.email || "")}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, "_blank");
    setShowModal(false);
  };

  const handleOpenMailto = () => {
    const mailtoLink = `mailto:${broker.email || ""}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink, "_blank");
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 rounded hover:bg-[#E7E8E3] transition-colors"
        title={`Email ${broker.fullName}`}
      >
        <svg className="w-4 h-4 text-[#9FA38F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E7E8E3]">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Outreach to {broker.fullName}</h3>
                <p className="text-sm text-[#9FA38F]">{broker.email || "No email on file"}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[#E7E8E3] flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-[#4D4D4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1">Subject</label>
                <div className="bg-[#F8F8F6] rounded-lg p-3 text-sm text-[#1A1A1A]">
                  {emailSubject}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1">Message</label>
                <div className="bg-[#F8F8F6] rounded-lg p-3 text-sm text-[#1A1A1A] whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-[250px] overflow-y-auto">
                  {emailBody}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 p-4 border-t border-[#E7E8E3] bg-[#F8F8F6]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleOpenGmail}
                  disabled={!broker.email}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-[#DFFF5E] text-[#1A1A1A] rounded-lg hover:bg-[#d4f54e] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                  Send via Gmail
                </button>
                <button
                  onClick={handleOpenMailto}
                  disabled={!broker.email}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-[#E7E8E3] text-[#1A1A1A] rounded-lg hover:bg-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Other Email App
                </button>
              </div>
              <button
                onClick={handleCopy}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm text-[#9FA38F] hover:text-[#1A1A1A] transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied to clipboard!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy to clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
