"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMapsScript } from "@/lib/googleMaps";

interface SatelliteViewProps {
  address: string;
  className?: string;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function SatelliteView({ address, className = "" }: SatelliteViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loadMap = async () => {
      try {
        // Load Google Maps script (handles duplicate loading prevention)
        await loadGoogleMapsScript(apiKey);
      } catch (error) {
        console.error("Failed to load Google Maps:", error);
        return;
      }

      if (!mapRef.current) return;

      // Geocode the address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus
        ) => {
          if (status === "OK" && results && results[0] && mapRef.current) {
            const location = results[0].geometry.location;

            // Create the map
            const map = new google.maps.Map(mapRef.current, {
              center: location,
              zoom: 18,
              mapTypeId: google.maps.MapTypeId.SATELLITE,
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
            });

            mapInstanceRef.current = map;

            // Add a marker
            new google.maps.Marker({
              position: location,
              map: map,
              title: address,
            });
          }
        }
      );
    };

    loadMap();
  }, [address]);

  return <div ref={mapRef} className={`h-full w-full ${className}`} />;
}
