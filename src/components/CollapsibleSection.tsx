"use client";

import { useState, ReactNode } from "react";

interface CollapsibleSectionProps {
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: string;
  subtitle?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  badge,
  subtitle,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#E7E8E3] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-[#F8F8F6] hover:bg-[#F0F0EE] transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          {title}
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-sm text-[#5A5F52] bg-white px-3 py-1 rounded-full border border-[#E7E8E3]">
              {badge}
            </span>
          )}
          {subtitle && (
            <span className="hidden md:block text-sm text-[#5A5F52]">{subtitle}</span>
          )}
          <svg
            className={`w-5 h-5 text-[#5A5F52] transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="p-5 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

interface CollapsibleBrokerProps {
  brokerName: string;
  brokerInitials: string;
  brokerTitle?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerProfileUrl?: string;
  brokerSlug: string;
  portfolioValue: string;
  propertyCount: number;
  defaultOpen?: boolean;
  children: ReactNode;
  outreachButton?: ReactNode;
}

export function CollapsibleBroker({
  brokerName,
  brokerInitials,
  brokerTitle,
  brokerEmail,
  brokerPhone,
  brokerProfileUrl,
  brokerSlug,
  portfolioValue,
  propertyCount,
  defaultOpen = false,
  children,
  outreachButton,
}: CollapsibleBrokerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#E7E8E3] rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#FAFAFA] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#B1E5FF] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#1A1A1A] font-semibold text-sm">{brokerInitials}</span>
          </div>
          <div>
            <p className="font-medium text-[#1A1A1A]">{brokerName}</p>
            <p className="text-xs text-[#5A5F52]">{brokerTitle || "Broker"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-[#1A1A1A]">{portfolioValue}</p>
            <p className="text-xs text-[#5A5F52]">{propertyCount} {propertyCount === 1 ? 'property' : 'properties'}</p>
          </div>
          <svg
            className={`w-5 h-5 text-[#5A5F52] transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-[#E7E8E3]">
          {/* Contact Info Row */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-[#FAFAFA] border-b border-[#E7E8E3]">
            {brokerEmail && (
              <a
                href={`mailto:${brokerEmail}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E7E8E3] text-xs text-[#1A1A1A] hover:border-[#B1E5FF] hover:bg-[#CAEDFF] transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#68A2CD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {brokerEmail}
              </a>
            )}
            {brokerPhone && (
              <a
                href={`tel:${brokerPhone}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E7E8E3] text-xs text-[#1A1A1A] hover:border-[#B1E5FF] hover:bg-[#CAEDFF] transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#68A2CD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {brokerPhone}
              </a>
            )}
            {brokerProfileUrl && (
              <a
                href={brokerProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E7E8E3] text-xs text-[#5A5F52] hover:border-[#B1E5FF] hover:text-[#1A1A1A] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Profile
              </a>
            )}
            <a
              href={`/for/${brokerSlug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1A1A] text-white text-xs hover:bg-[#333] transition-colors"
            >
              View Portfolio
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            {outreachButton}
          </div>
          {/* Properties */}
          <div className="p-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
