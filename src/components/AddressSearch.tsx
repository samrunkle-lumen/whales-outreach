'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddressSearch() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/search-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search address');
      }

      if (data.slug) {
        // Show success message before redirect
        if (data.exists) {
          setError('');
          router.push(`/property/${data.slug}`);
        } else {
          // New property created
          setError('');
          router.push(`/property/${data.slug}`);
        }
      } else {
        setError('Unable to process this address. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="address" className="block eyebrow text-[#5A5F52] mb-2">
            SEARCH PROPERTY ADDRESS
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, Philadelphia, PA 19103"
              className="flex-1 px-4 py-3 border-2 border-[#E7E8E3] rounded-lg focus:border-[#B1E5FF] focus:outline-none text-[#1A1A1A] placeholder:text-[#9FA38F]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#DFFF5E] text-[#1A1A1A] font-medium hover:bg-[#d4f54e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border-2 border-[#1A1A1A]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {error && !error.includes('Success') && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {error && error.includes('Success') && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="text-sm text-[#5A5F52]">
          <p>Enter a commercial property address to search for previous broker listings.</p>
          <p className="mt-1">We'll find the broker, property details, and create a dedicated page for outreach.</p>
        </div>
      </form>
    </div>
  );
}
