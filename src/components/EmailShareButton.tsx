"use client";

import { useState } from "react";
import { Building, Broker, BuildingCalculation } from "@/lib/types";
import { formatCurrency, formatNumber, getUtilityFullName } from "@/lib/calculations";

interface EmailShareButtonProps {
  building: Building;
  broker: Broker;
  calculation: BuildingCalculation;
}

export function EmailShareButton({ building, broker, calculation }: EmailShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const emailSubject = `Solar Revenue Opportunity: ${building.address}`;

  const emailBody = `Hi,

I wanted to share an exciting opportunity regarding ${building.address}.

Based on a preliminary analysis by Lumen Energy, this ${formatNumber(building.sqft)} ft² property could generate ${formatCurrency(calculation.annualIncomeLow)} to ${formatCurrency(calculation.annualIncomeHigh)} per year in solar lease revenue—with no upfront investment required.

Key Details:
• Building: ${building.address}
• Size: ${formatNumber(building.sqft)} ft²
• Utility: ${getUtilityFullName(calculation.utility)}
• Estimated Annual Revenue: ${formatCurrency(calculation.annualIncomeLow)}–${formatCurrency(calculation.annualIncomeHigh)}
• System Size: ${formatNumber(calculation.systemSizeLow)}–${formatNumber(calculation.systemSizeHigh)} kW

How It Works:
1. Lumen provides a free, detailed analysis of your property
2. Top solar developers compete to offer the best lease terms
3. You receive predictable annual income with no capital outlay

View the full analysis here: ${pageUrl}

Would you be interested in learning more? I can connect you with Lumen Energy to discuss the opportunity in detail.

Best regards,
${broker.fullName}
${broker.company}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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

  const handleOpenEmail = () => {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink, "_blank");
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, "_blank");
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333333] transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email to Client
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#5A5F52]/20">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Share with Your Client</h3>
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
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1">Subject</label>
                <div className="bg-[#F8F8F6] rounded-lg p-3 text-sm text-[#1A1A1A]">
                  {emailSubject}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1">Message</label>
                <div className="bg-[#F8F8F6] rounded-lg p-3 text-sm text-[#1A1A1A] whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  {emailBody}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 p-4 border-t border-[#5A5F52]/20 bg-[#F8F8F6]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleOpenGmail}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-[#DFFF5E] text-[#1A1A1A] rounded-lg hover:bg-[#d4f54e] transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                  Open in Gmail
                </button>
                <button
                  onClick={handleOpenEmail}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-[#5A5F52]/30 text-[#1A1A1A] rounded-lg hover:bg-white transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Other Email App
                </button>
              </div>
              <button
                onClick={handleCopy}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm text-[#5A5F52] hover:text-[#1A1A1A] transition-colors"
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
