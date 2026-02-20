"use client";

import { Property, BuildingCalculation } from "@/lib/types";
import { formatCurrency, formatNumber, getUtilityFullName, formatMillions } from "@/lib/calculations";
import DOMPurify from "isomorphic-dompurify";

interface PropertyPDFExportProps {
  property: Property;
  calculation: BuildingCalculation;
  owner: { name: string; slug: string };
  variant?: "primary" | "outline";
}

export function PropertyPDFExport({
  property,
  calculation,
  owner,
  variant = "primary",
}: PropertyPDFExportProps) {
  const handleDownload = async () => {
    // Dynamic import to keep bundle size small
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;

    // Get API key for satellite image - use 2:1 aspect ratio (800x400) to prevent stretching
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const encodedAddress = encodeURIComponent(property.address);
    const satelliteUrl = apiKey
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=18&size=800x400&maptype=satellite&key=${apiKey}`
      : "";

    // Determine if we have exact CSV values (no range)
    const hasExactLeaseValue = calculation.annualIncomeLow === calculation.annualIncomeHigh;
    const hasExactSystemSize = calculation.systemSizeLow === calculation.systemSizeHigh;

    // Create a temporary element with the PDF content
    const content = document.createElement("div");
    // Sanitize HTML to prevent XSS attacks
    content.innerHTML = DOMPurify.sanitize(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 32px 28px; background: white; max-width: 850px; margin: 0 auto; box-sizing: border-box;">
        <!-- Header -->
        <div style="margin-bottom: 30px; padding-bottom: 22px; border-bottom: 3px solid #1A1A1A; position: relative;">
          <div style="position: absolute; bottom: -3px; left: 0; width: 60px; height: 3px; background: #DFFF5E;"></div>
          <svg width="160" height="38" viewBox="0 0 836 197" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <!-- Horizontal Address Section -->
        <div style="margin-bottom: 18px;">
          <div style="display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;">
            <p style="font-size: 12px; color: #5A5F52; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; font-weight: 600;">Solar Opportunity</p>
            <h1 style="font-size: 26px; font-weight: 600; color: #1A1A1A; margin: 0; line-height: 1.2;">
              ${property.address}
            </h1>
          </div>
          <p style="font-size: 14px; color: #5A5F52; margin: 8px 0 0 0;">
            ${owner.name}
          </p>
        </div>

        <!-- Two Column Layout: Image + Property Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 30px; align-items: end;">
          <!-- Left Column: Satellite Image -->
          ${satelliteUrl ? `
          <div style="border-radius: 6px; overflow: hidden; border: 2px solid #E7E8E3; width: 100%; height: 220px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <img src="${satelliteUrl}" alt="Satellite view" style="width: 100%; height: 220px; object-fit: cover; display: block;" crossorigin="anonymous" />
          </div>
          ` : '<div></div>'}

          <!-- Right Column: Property Meta -->
          <div style="padding: 20px 24px; background: linear-gradient(135deg, #F8F8F6 0%, #FAFAFA 100%); border-radius: 6px; border: 1px solid #E7E8E3; height: 220px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center;">
            <div style="border-left: 3px solid #DFFF5E; padding-left: 12px; margin-bottom: 18px;">
              <p style="font-size: 12px; color: #5A5F52; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; font-weight: 600;">Property Details</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 20px; font-size: 14px; line-height: 1.5;">
              <div><span style="color: #5A5F52;">Roof Area:</span> <span style="color: #1A1A1A; font-weight: 600;">${formatNumber(property.sqft)} ft²</span></div>
              <div><span style="color: #5A5F52;">Usable:</span> <span style="color: #1A1A1A; font-weight: 600;">${formatNumber(calculation.usableRoofSqft)} ft²</span></div>
              ${property.propertyType ? `<div><span style="color: #5A5F52;">Type:</span> <span style="color: #1A1A1A; font-weight: 600;">${property.propertyType}</span></div>` : ''}
              <div><span style="color: #5A5F52;">Utility:</span> <span style="color: #1A1A1A; font-weight: 600;">${getUtilityFullName(calculation.utility)}</span></div>
            </div>
          </div>
        </div>

        <!-- Financial Opportunity: 3-Column Layout -->
        <div style="margin-bottom: 30px;">
          <div style="border-left: 4px solid #DFFF5E; padding-left: 14px; margin-bottom: 20px;">
            <h2 style="font-size: 21px; font-weight: 600; color: #1A1A1A; margin: 0;">Financial Opportunity</h2>
          </div>

          <div style="display: grid; grid-template-columns: ${property.systemSize && property.systemSize > 0 ? '1fr 1fr 1fr' : '1fr 1fr'}; gap: 16px; align-items: stretch;">
            ${property.systemSize && property.systemSize > 0 ? `
            <!-- System Size -->
            <div style="padding: 22px; background: linear-gradient(135deg, #F0FFF4 0%, #F8F8F6 100%); border-radius: 6px; border: 1px solid #E7E8E3; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between;">
              <p style="font-size: 11px; color: #5A5F52; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; font-weight: 600;">System Size</p>
              <div>
                <p style="font-size: 40px; font-weight: 700; color: #1A1A1A; margin: 0; line-height: 1;">
                  ${formatNumber(property.systemSize)}
                </p>
                <p style="font-size: 16px; color: #5A5F52; margin: 6px 0 0 0; font-weight: 500;">kW</p>
              </div>
            </div>
            ` : ''}

            <!-- Annual Revenue -->
            <div style="padding: 22px; background: ${property.leaseValue && property.leaseValue > 0 ? 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)' : 'linear-gradient(135deg, #F8F8F6 0%, #FFFFFF 100%)'}; border-radius: 6px; border: 2px solid ${property.leaseValue && property.leaseValue > 0 ? '#2E7D32' : '#E7E8E3'}; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between;">
              <p style="font-size: 11px; color: #5A5F52; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; font-weight: 600;">${property.leaseValue && property.leaseValue > 0 ? 'Lease Value' : 'Annual Revenue'}</p>
              <div>
                <p style="font-size: 40px; font-weight: 700; color: ${property.leaseValue && property.leaseValue > 0 ? '#2E7D32' : '#1A1A1A'}; margin: 0; line-height: 1;">
                  ${hasExactLeaseValue ? formatCurrency(calculation.annualIncomeLow) : formatCurrency(calculation.annualIncomeLow)}
                </p>
                <p style="font-size: 16px; color: #5A5F52; margin: 6px 0 0 0; font-weight: 500;">
                  ${hasExactLeaseValue ? '/yr' : `to ${formatCurrency(calculation.annualIncomeHigh)}/yr`}
                </p>
              </div>
            </div>

            <!-- Value Uplift -->
            <div style="padding: 22px; background: linear-gradient(135deg, #FFFEF5 0%, #FFFBF0 100%); border-radius: 6px; border: 2px solid #DFFF5E; box-shadow: 0 2px 4px rgba(223,255,94,0.15); display: flex; flex-direction: column; justify-content: space-between;">
              <p style="font-size: 11px; color: #5A5F52; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; font-weight: 600;">Value Uplift</p>
              <div>
                <p style="font-size: 40px; font-weight: 700; color: #1A1A1A; margin: 0; line-height: 1;">
                  ${hasExactLeaseValue ? formatMillions(calculation.valueUpliftLow) : formatMillions(calculation.valueUpliftLow)}
                </p>
                <p style="font-size: 16px; color: #5A5F52; margin: 6px 0 0 0; font-weight: 500;">
                  ${hasExactLeaseValue ? 'at 6% cap' : `to ${formatMillions(calculation.valueUpliftHigh)} at 6%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Two Column: Why Solar Leasing + Why Lumen -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 30px; align-items: start;">
          <!-- Why Solar Leasing -->
          <div style="padding: 20px; background: linear-gradient(135deg, #FAFFFE 0%, #F8F8F6 100%); border-radius: 6px; border: 1px solid #E7E8E3; box-shadow: 0 1px 2px rgba(0,0,0,0.04); height: 100%; box-sizing: border-box;">
            <div style="border-left: 3px solid #DFFF5E; padding-left: 10px; margin-bottom: 14px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #1A1A1A; margin: 0;">Why Solar Leasing</h2>
            </div>
            <div style="font-size: 13px; color: #1A1A1A; line-height: 1.7;">
              <p style="margin: 0 0 11px 0;"><strong>Passive Income:</strong> Turn unused rooftop into steady revenue. Zero capital, zero operations.</p>
              <p style="margin: 0 0 11px 0;"><strong>Property Value:</strong> Solar lease NOI increases property value at sale. At a 6% cap rate, every $1M in annual lease revenue adds $16.7M to sale price.</p>
              <p style="margin: 0 0 11px 0;"><strong>Tenant Benefits:</strong> Community solar reduces tenant energy costs with no installation on their part.</p>
              <p style="margin: 0;"><strong>No Risk:</strong> 20-25 year agreements with investment-grade developers and inflation-adjusted payments.</p>
            </div>
          </div>

          <!-- Why Lumen -->
          <div style="padding: 20px; background: linear-gradient(135deg, #FAFFFE 0%, #F8F8F6 100%); border-radius: 6px; border: 1px solid #E7E8E3; box-shadow: 0 1px 2px rgba(0,0,0,0.04); height: 100%; box-sizing: border-box;">
            <div style="border-left: 3px solid #DFFF5E; padding-left: 10px; margin-bottom: 14px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #1A1A1A; margin: 0;">Why Lumen Energy</h2>
            </div>
            <p style="font-size: 13px; color: #1A1A1A; line-height: 1.7; margin: 0 0 12px 0;">
              We partner with leading CRE owners (Nuveen, JP Morgan, Hines) to maximize solar revenue through competitive bidding and white-glove service.
            </p>
            <div style="font-size: 13px; color: #1A1A1A; line-height: 1.7;">
              <p style="margin: 0 0 8px 0;"><strong>1.</strong> Portfolio analysis to identify highest revenue potential</p>
              <p style="margin: 0 0 8px 0;"><strong>2.</strong> Competitive bidding to maximize lease rates</p>
              <p style="margin: 0 0 8px 0;"><strong>3.</strong> Investment-grade financial modeling at no cost</p>
              <p style="margin: 0;"><strong>4.</strong> End-to-end white-glove execution and ongoing management</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div style="background: linear-gradient(135deg, #DFFF5E 0%, #E6FF7A 100%); border: 2px solid #1A1A1A; border-radius: 6px; padding: 22px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(26,26,26,0.08); position: relative;">
          <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; border-radius: 6px; background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%); pointer-events: none;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
            <div style="flex: 1; padding-right: 20px;">
              <h3 style="font-size: 19px; font-weight: 700; color: #1A1A1A; margin: 0 0 10px 0;">Get Your Investment-Grade Analysis</h3>
              <p style="font-size: 14px; color: #1A1A1A; margin: 0; line-height: 1.6;">
                Schedule a 15-minute call to receive your complete portfolio analysis and competitive bids from top solar developers.
              </p>
            </div>
            <div style="text-align: center; flex-shrink: 0;">
              <div style="background: white; padding: 12px 16px; border-radius: 4px; border: 1px solid #1A1A1A; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <a href="mailto:advisor@lumen.energy" style="font-size: 17px; color: #1A1A1A; font-weight: 700; text-decoration: none; display: block;">
                  advisor@lumen.energy
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #E7E8E3; padding-top: 18px; text-align: center; position: relative;">
          <div style="position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 80px; height: 2px; background: #DFFF5E;"></div>
          <p style="font-size: 11px; color: #5A5F52; margin: 0; line-height: 1.6;">
            Lumen Energy | getlumen.com<br>
            <span style="font-weight: 600;">Trusted by Nuveen, JP Morgan, Hines</span>
          </p>
        </div>
      </div>
    `);

    content.style.position = "absolute";
    content.style.left = "-9999px";
    content.style.top = "0";
    document.body.appendChild(content);

    try {
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      // Letter size is 612 x 792 points
      const pdfWidth = 612;
      const pdfHeight = 792;

      // Calculate image dimensions to fit within PDF while maintaining aspect ratio
      const imgWidth = canvas.width / 2;
      const imgHeight = canvas.height / 2;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // Center the image on the page
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);

      const filename = `${property.address.replace(/[^a-zA-Z0-9]/g, "-")}-solar-analysis.pdf`;
      pdf.save(filename);
    } finally {
      document.body.removeChild(content);
    }
  };

  if (variant === "outline") {
    return (
      <button
        onClick={handleDownload}
        className="inline-flex items-center px-5 py-3 border border-[#E7E8E3] text-[#1A1A1A] font-medium hover:border-[#B1E5FF] hover:bg-[#CAEDFF] transition-colors text-sm rounded-lg"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download PDF
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center justify-center px-3 py-2 border border-[#E7E8E3] text-[#1A1A1A] hover:border-[#B1E5FF] hover:bg-[#CAEDFF] transition-colors text-sm font-medium rounded-lg"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download PDF
    </button>
  );
}
