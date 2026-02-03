"use client";

import { useState } from "react";

interface AddBrokersModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ScrapeResult {
  success: boolean;
  message: string;
  brokersAdded?: number;
  propertiesAdded?: number;
  errors?: string[];
}

export function AddBrokersModal({ onClose, onSuccess }: AddBrokersModalProps) {
  const [firmName, setFirmName] = useState("");
  const [markets, setMarkets] = useState("");
  const [website, setWebsite] = useState("");
  const [brokerNames, setBrokerNames] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [progress, setProgress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress("Starting scrape...");
    setResult(null);

    try {
      const response = await fetch("/api/scrape-brokers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firmName: firmName.trim(),
          markets: markets.split(",").map((m) => m.trim()).filter(Boolean),
          website: website.trim(),
          brokerNames: brokerNames
            .split("\n")
            .map((n) => n.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        onSuccess();
      }
    } catch {
      setResult({
        success: false,
        message: "Failed to connect to scraping service. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E7E8E3]">
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Add New Brokers
            </h3>
            <p className="text-sm text-[#5A5F52]">
              Scrape properties and enrich contacts automatically
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#E7E8E3] flex items-center justify-center transition-colors"
          >
            <svg
              className="w-5 h-5 text-[#4D4D4D]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Firm Name */}
          <div>
            <label className="block text-sm font-medium text-[#4D4D4D] mb-1">
              Firm Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="e.g., CBRE, JLL, Cushman & Wakefield"
              className="w-full px-4 py-2.5 bg-white border border-[#E7E8E3] rounded-lg text-sm focus:outline-none focus:border-[#B1E5FF] focus:ring-1 focus:ring-[#B1E5FF]"
              required
              disabled={isLoading}
            />
          </div>

          {/* Markets */}
          <div>
            <label className="block text-sm font-medium text-[#4D4D4D] mb-1">
              Markets of Interest <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={markets}
              onChange={(e) => setMarkets(e.target.value)}
              placeholder="e.g., NJ, PA, MD (comma-separated)"
              className="w-full px-4 py-2.5 bg-white border border-[#E7E8E3] rounded-lg text-sm focus:outline-none focus:border-[#B1E5FF] focus:ring-1 focus:ring-[#B1E5FF]"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-[#5A5F52] mt-1">
              State abbreviations, comma-separated
            </p>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-[#4D4D4D] mb-1">
              Firm Website or Listings Page <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., https://www.cbre.com/properties"
              className="w-full px-4 py-2.5 bg-white border border-[#E7E8E3] rounded-lg text-sm focus:outline-none focus:border-[#B1E5FF] focus:ring-1 focus:ring-[#B1E5FF]"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-[#5A5F52] mt-1">
              Link to their property listings or industrial/warehouse search page
            </p>
          </div>

          {/* Broker Names */}
          <div>
            <label className="block text-sm font-medium text-[#4D4D4D] mb-1">
              Broker Names (Optional)
            </label>
            <textarea
              value={brokerNames}
              onChange={(e) => setBrokerNames(e.target.value)}
              placeholder={"John Smith\nJane Doe\n(one per line)"}
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-[#E7E8E3] rounded-lg text-sm focus:outline-none focus:border-[#B1E5FF] focus:ring-1 focus:ring-[#B1E5FF] resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-[#5A5F52] mt-1">
              If you know specific broker names, enter them here. Otherwise,
              we&apos;ll try to find them from listings.
            </p>
          </div>

          {/* Progress/Result */}
          {isLoading && (
            <div className="bg-[#F8F8F6] border border-[#E7E8E3] rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin h-5 w-5 text-[#68A2CD]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    Processing...
                  </p>
                  <p className="text-xs text-[#5A5F52]">{progress}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.message}
              </p>
              {result.brokersAdded !== undefined && (
                <p className="text-xs text-green-700 mt-1">
                  Added {result.brokersAdded} {result.brokersAdded === 1 ? 'broker' : 'brokers'} with{" "}
                  {result.propertiesAdded} {result.propertiesAdded === 1 ? 'property' : 'properties'}
                </p>
              )}
              {result.errors && result.errors.length > 0 && (
                <ul className="text-xs text-red-700 mt-2 list-disc list-inside">
                  {result.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 3 && (
                    <li>...and {result.errors.length - 3} more errors</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-[#E7E8E3] text-[#4D4D4D] rounded-lg hover:bg-[#F8F8F6] transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !firmName || !markets || !website}
              className="flex-1 px-4 py-3 bg-[#DFFF5E] text-[#1A1A1A] rounded-lg hover:bg-[#d4f54e] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Scraping..." : "Add Brokers"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
