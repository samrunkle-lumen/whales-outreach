// Global Google Maps script loader to prevent duplicate loading
let isLoading = false;
let isLoaded = false;
const callbacks: (() => void)[] = [];

export async function loadGoogleMapsScript(apiKey: string): Promise<void> {
  // If already loaded, return immediately
  if (isLoaded) {
    return Promise.resolve();
  }

  // If currently loading, wait for it to finish
  if (isLoading) {
    return new Promise<void>((resolve) => {
      callbacks.push(resolve);
    });
  }

  // Check if script is already in the DOM
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    isLoaded = true;
    return Promise.resolve();
  }

  // Start loading
  isLoading = true;

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
      // Resolve all waiting callbacks
      callbacks.forEach(cb => cb());
      callbacks.length = 0;
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error("Failed to load Google Maps script"));
      callbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}
