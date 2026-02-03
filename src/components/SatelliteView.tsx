"use client";

interface SatelliteViewProps {
  address: string;
  className?: string;
}

export function SatelliteView({ address, className = "" }: SatelliteViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const encodedAddress = encodeURIComponent(address);

  if (!apiKey) {
    // Fallback when no API key is configured
    return (
      <div
        className={`bg-gradient-to-br from-[#B1E5FF]/20 to-[#ECFFB2]/20 flex flex-col items-center justify-center p-8 h-full ${className}`}
      >
        <div className="w-16 h-16 bg-[#5A5F52]/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#5A5F52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-[#5A5F52] text-center text-sm mb-2">Satellite view available</p>
        <p className="text-[#4D4D4D] text-center text-xs max-w-[200px]">{address}</p>
      </div>
    );
  }

  // Use a larger static image size for better quality
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=18&size=800x600&maptype=satellite&key=${apiKey}`;

  return (
    <div className={`overflow-hidden h-full ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mapUrl}
        alt={`Satellite view of ${address}`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
