"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem("lumen-auth");
    if (authStatus === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("lumen-auth", "authenticated");
        setIsAuthenticated(true);
      } else {
        setError(true);
        setPassword("");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(true);
      setPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#DFFF5E] flex flex-col relative">
      {/* Logo in top left */}
      <div className="absolute top-8 left-8">
        <svg width="420" height="99" viewBox="0 0 836 197" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 68.1688C0 95.4693 16.0494 119.002 39.2261 129.897V6.45319C16.0494 17.3352 0 40.881 0 68.1688Z" fill="#050505"/>
          <path d="M46.0608 68.1685C46.0608 105.816 76.5813 136.337 114.229 136.337V0C76.5813 0 46.0608 30.5205 46.0608 68.1685Z" fill="#050505"/>
          <path d="M189.244 0C186.687 0 184.166 0.152729 181.684 0.420008C147.588 4.18735 121.064 33.066 121.064 68.1685C121.064 103.271 147.588 132.149 181.684 135.917C184.166 136.197 186.687 136.349 189.244 136.349C226.893 136.349 257.414 105.829 257.414 68.1812C257.414 30.5332 226.905 0 189.244 0Z" fill="#050505"/>
          <path d="M296.639 6.84003H329.946V103.957H373.954V129.551H296.639V6.84003Z" fill="#050505"/>
          <path d="M471.518 129.552H438.912V105.36L440.666 108.165C439.848 111.905 438.153 115.586 435.582 119.209C433.127 122.832 429.621 125.87 425.063 128.325C420.623 130.779 415.304 132.006 409.111 132.006C402.566 132.006 396.899 130.603 392.107 127.799C387.432 124.877 383.868 120.962 381.414 116.054C379.077 111.028 377.907 105.302 377.907 98.874V31.7338H410.864V93.7903C410.864 98.8156 411.858 102.672 413.844 105.36C415.831 108.048 418.986 109.392 423.311 109.392C426.349 109.392 429.037 108.516 431.374 106.763C433.712 104.893 435.523 102.439 436.809 99.3999C438.094 96.2446 438.737 92.8554 438.737 89.2325V31.7338H471.518V129.552Z" fill="#050505"/>
          <path d="M479.677 31.7345H512.282V47.6869C514.854 42.5447 518.594 38.2206 523.502 34.7146C528.527 31.0917 534.546 29.2803 541.557 29.2803C549.037 29.2803 555.172 30.9748 559.964 34.364C564.755 37.7532 568.203 42.4278 570.306 48.3881C572.994 43.2459 576.91 38.8049 582.052 35.0652C587.194 31.2087 593.271 29.2803 600.283 29.2803C607.412 29.2803 613.373 30.6827 618.164 33.4875C622.956 36.2924 626.521 40.1489 628.858 45.0574C631.311 49.9658 632.539 55.6339 632.539 62.0616V129.552H599.583V68.723C599.583 62.9965 598.588 58.7893 596.602 56.1014C594.732 53.2964 591.693 51.8941 587.486 51.8941C584.447 51.8941 581.818 52.829 579.597 54.6989C577.377 56.5688 575.624 59.023 574.34 62.0616C573.053 64.9832 572.411 68.0802 572.411 71.3525V129.552H539.63V68.723C539.63 62.9965 538.636 58.7893 536.648 56.1014C534.78 53.2964 531.741 51.8941 527.534 51.8941C524.612 51.8941 521.983 52.829 519.644 54.6989C517.307 56.4519 515.496 58.9061 514.211 62.0616C513.042 65.1001 512.457 68.5476 512.457 72.4043V129.552H479.677V31.7345Z" fill="#050505"/>
          <path d="M687.665 131.831C677.03 131.831 667.798 129.728 659.967 125.521C652.138 121.196 646.177 115.236 642.086 107.64C637.997 99.9265 635.951 90.9861 635.951 80.8187C635.951 70.885 637.938 62.0616 641.912 54.3483C645.885 46.5182 651.67 40.3827 659.265 35.9417C666.98 31.5007 676.037 29.2803 686.438 29.2803C697.189 29.2803 706.305 31.4424 713.785 35.7665C721.264 40.0905 726.874 46.0508 730.614 53.6472C734.471 61.1266 736.398 69.7164 736.398 79.4164C736.398 81.9874 736.398 84.3247 736.398 86.4284H660.142V68.1971H706.948L702.39 69.2489C702.39 65.5092 701.864 62.12 700.813 59.0815C699.761 56.0429 698.007 53.5887 695.554 51.7188C693.098 49.732 690.002 48.7387 686.262 48.7387C682.64 48.7387 679.484 49.8489 676.796 52.0694C674.108 54.173 672.005 57.2116 670.486 61.1851C669.083 65.1586 668.381 69.8917 668.381 75.3844V85.2013C668.381 91.2784 669.083 96.3621 670.486 100.452C672.005 104.426 674.108 107.406 676.796 109.393C679.602 111.38 682.932 112.373 686.788 112.373C691.579 112.373 695.203 111.029 697.656 108.341C700.228 105.653 701.747 102.089 702.214 97.6477H735.346C734.646 103.725 732.366 109.334 728.51 114.477C724.77 119.619 719.394 123.826 712.382 127.098C705.487 130.254 697.248 131.831 687.665 131.831Z" fill="#050505"/>
          <path d="M740.713 31.7345H773.318V56.4519L772.091 51.7188C772.792 48.7972 774.428 45.5833 776.999 42.0773C779.571 38.5712 783.018 35.5911 787.343 33.1369C791.783 30.5659 796.926 29.2803 802.769 29.2803C809.664 29.2803 815.449 30.6827 820.124 33.4875C824.798 36.2924 828.304 40.1489 830.641 45.0574C832.98 49.9658 834.148 55.6339 834.148 62.0616V129.552H801.366V68.8982C801.366 63.1718 800.373 58.9061 798.386 56.1014C796.4 53.2964 793.302 51.8941 789.095 51.8941C785.94 51.8941 783.193 52.829 780.856 54.6989C778.519 56.4519 776.708 58.9061 775.423 62.0616C774.136 65.2169 773.494 68.6645 773.494 72.4043V129.552H740.713V31.7345Z" fill="#050505"/>
        </svg>
      </div>

      {/* Center form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter access code"
              className={`w-full px-6 py-4 pr-16 text-lg bg-white bg-opacity-80 border-2 ${
                error ? "border-red-500" : "border-[#1A1A1A]"
              } text-[#1A1A1A] placeholder-[#5A5F52] focus:outline-none focus:border-[#1A1A1A]`}
              autoFocus
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-[#1A1A1A] hover:text-[#5A5F52] transition-colors disabled:opacity-50"
              aria-label="Submit"
            >
              {isVerifying ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">Incorrect access code. Please try again.</p>
          )}
        </form>
      </div>

      {/* Bottom right text */}
      <div className="absolute bottom-8 right-8">
        <p className="text-[43px] md:text-[54px] font-bold text-[#1A1A1A] whitespace-nowrap">
          Turn rooftops into revenue
        </p>
      </div>
    </div>
  );
}
