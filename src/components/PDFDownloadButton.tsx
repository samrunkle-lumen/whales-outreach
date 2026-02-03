"use client";

import { Building, Broker, BuildingCalculation } from "@/lib/types";
import { formatCurrency, formatNumber, getUtilityFullName, formatMillions } from "@/lib/calculations";

interface PDFDownloadButtonProps {
  building: Building;
  broker: Broker;
  calculation: BuildingCalculation;
  variant?: "primary" | "outline";
}

export function PDFDownloadButton({
  building,
  broker,
  calculation,
  variant = "primary",
}: PDFDownloadButtonProps) {
  const handleDownload = async () => {
    // Dynamic import to keep bundle size small
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;

    // Get API key for satellite image - use 2:1 aspect ratio (800x400) to prevent stretching
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const encodedAddress = encodeURIComponent(building.address);
    const satelliteUrl = apiKey
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=18&size=800x400&maptype=satellite&key=${apiKey}`
      : "";

    // Create a temporary element with the PDF content
    const content = document.createElement("div");
    content.innerHTML = `
      <div style="font-family: Inter, system-ui, sans-serif; padding: 48px; max-width: 800px; background: white;">
        <!-- Accent Line -->
        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(180deg, #B1E5FF 0%, #DFFF5E 50%, #B1E5FF 100%);"></div>

        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; padding-left: 16px;">
          <svg width="200" height="47" viewBox="0 0 836 197" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 68.1688C0 95.4693 16.0494 119.002 39.2261 129.897V6.45319C16.0494 17.3352 0 40.881 0 68.1688Z" fill="#050505"/>
            <path d="M46.0608 68.1685C46.0608 105.816 76.5813 136.337 114.229 136.337V0C76.5813 0 46.0608 30.5205 46.0608 68.1685Z" fill="#050505"/>
            <path d="M189.244 0C186.687 0 184.166 0.152729 181.684 0.420008C147.588 4.18735 121.064 33.066 121.064 68.1685C121.064 103.271 147.588 132.149 181.684 135.917C184.166 136.197 186.687 136.349 189.244 136.349C226.893 136.349 257.414 105.829 257.414 68.1812C257.414 30.5332 226.905 0 189.244 0Z" fill="#050505"/>
            <path d="M296.639 6.84003H329.946V103.957H373.954V129.551H296.639V6.84003Z" fill="#050505"/>
            <path d="M471.518 129.552H438.912V105.36L440.666 108.165C439.848 111.905 438.153 115.586 435.582 119.209C433.127 122.832 429.621 125.87 425.063 128.325C420.623 130.779 415.304 132.006 409.111 132.006C402.566 132.006 396.899 130.603 392.107 127.799C387.432 124.877 383.868 120.962 381.414 116.054C379.077 111.028 377.907 105.302 377.907 98.874V31.7338H410.864V93.7903C410.864 98.8156 411.858 102.672 413.844 105.36C415.831 108.048 418.986 109.392 423.311 109.392C426.349 109.392 429.037 108.516 431.374 106.763C433.712 104.893 435.523 102.439 436.809 99.3999C438.094 96.2446 438.737 92.8554 438.737 89.2325V31.7338H471.518V129.552Z" fill="#050505"/>
            <path d="M479.677 31.7345H512.282V47.6869C514.854 42.5447 518.594 38.2206 523.502 34.7146C528.527 31.0917 534.546 29.2803 541.557 29.2803C549.037 29.2803 555.172 30.9748 559.964 34.364C564.755 37.7532 568.203 42.4278 570.306 48.3881C572.994 43.2459 576.91 38.8049 582.052 35.0652C587.194 31.2087 593.271 29.2803 600.283 29.2803C607.412 29.2803 613.373 30.6827 618.164 33.4875C622.956 36.2924 626.521 40.1489 628.858 45.0574C631.311 49.9658 632.539 55.6339 632.539 62.0616V129.552H599.583V68.723C599.583 62.9965 598.588 58.7893 596.602 56.1014C594.732 53.2964 591.693 51.8941 587.486 51.8941C584.447 51.8941 581.818 52.829 579.597 54.6989C577.377 56.5688 575.624 59.023 574.34 62.0616C573.053 64.9832 572.411 68.0802 572.411 71.3525V129.552H539.63V68.723C539.63 62.9965 538.636 58.7893 536.648 56.1014C534.78 53.2964 531.741 51.8941 527.534 51.8941C524.612 51.8941 521.983 52.829 519.644 54.6989C517.307 56.4519 515.496 58.9061 514.211 62.0616C513.042 65.1001 512.457 68.5476 512.457 72.4043V129.552H479.677V31.7345Z" fill="#050505"/>
            <path d="M687.665 131.831C677.03 131.831 667.798 129.728 659.967 125.521C652.138 121.196 646.177 115.236 642.086 107.64C637.997 99.9265 635.951 90.9861 635.951 80.8187C635.951 70.885 637.938 62.0616 641.912 54.3483C645.885 46.5182 651.67 40.3827 659.265 35.9417C666.98 31.5007 676.037 29.2803 686.438 29.2803C697.189 29.2803 706.305 31.4424 713.785 35.7665C721.264 40.0905 726.874 46.0508 730.614 53.6472C734.471 61.1266 736.398 69.7164 736.398 79.4164C736.398 81.9874 736.398 84.3247 736.398 86.4284H660.142V68.1971H706.948L702.39 69.2489C702.39 65.5092 701.864 62.12 700.813 59.0815C699.761 56.0429 698.007 53.5887 695.554 51.7188C693.098 49.732 690.002 48.7387 686.262 48.7387C682.64 48.7387 679.484 49.8489 676.796 52.0694C674.108 54.173 672.005 57.2116 670.486 61.1851C669.083 65.1586 668.381 69.8917 668.381 75.3844V85.2013C668.381 91.2784 669.083 96.3621 670.486 100.452C672.005 104.426 674.108 107.406 676.796 109.393C679.602 111.38 682.932 112.373 686.788 112.373C691.579 112.373 695.203 111.029 697.656 108.341C700.228 105.653 701.747 102.089 702.214 97.6477H735.346C734.646 103.725 732.366 109.334 728.51 114.477C724.77 119.619 719.394 123.826 712.382 127.098C705.487 130.254 697.248 131.831 687.665 131.831Z" fill="#050505"/>
            <path d="M740.713 31.7345H773.318V56.4519L772.091 51.7188C772.792 48.7972 774.428 45.5833 776.999 42.0773C779.571 38.5712 783.018 35.5911 787.343 33.1369C791.783 30.5659 796.926 29.2803 802.769 29.2803C809.664 29.2803 815.449 30.6827 820.124 33.4875C824.798 36.2924 828.304 40.1489 830.641 45.0574C832.98 49.9658 834.148 55.6339 834.148 62.0616V129.552H801.366V68.8982C801.366 63.1718 800.373 58.9061 798.386 56.1014C796.4 53.2964 793.302 51.8941 789.095 51.8941C785.94 51.8941 783.193 52.829 780.856 54.6989C778.519 56.4519 776.708 58.9061 775.423 62.0616C774.136 65.2169 773.494 68.6645 773.494 72.4043V129.552H740.713V31.7345Z" fill="#050505"/>
          </svg>
          <span style="font-size: 11px; color: #9FA38F; font-family: 'Roboto Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em;">${new Date().toLocaleDateString()}</span>
        </div>

        <div style="padding-left: 16px;">
          <!-- Eyebrow -->
          <p style="font-family: 'Roboto Mono', monospace; font-size: 11px; color: #9FA38F; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Solar Lease Opportunity</p>

          <!-- Title -->
          <h1 style="font-size: 32px; font-weight: 300; color: #1A1A1A; margin: 0 0 8px 0; line-height: 1.1; letter-spacing: -0.02em;">
            ${building.address.split(',')[0]}
          </h1>
          <p style="font-size: 14px; color: #9FA38F; margin: 0 0 8px 0;">
            ${building.address}
          </p>
          <p style="font-size: 13px; color: #68A2CD; margin: 0 0 24px 0;">
            Prepared for ${broker.fullName} · ${broker.company}
          </p>

          <!-- Satellite View -->
          ${satelliteUrl ? `
          <div style="margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #E7E8E3; width: 100%; height: 300px;">
            <img src="${satelliteUrl}" alt="Satellite view" style="width: 100%; height: 300px; object-fit: cover; display: block;" crossorigin="anonymous" />
          </div>
          ` : ''}

          <!-- Property Meta -->
          <div style="display: flex; gap: 24px; margin-bottom: 24px; font-size: 13px; color: #9FA38F;">
            <span><span style="color: #1A1A1A; font-weight: 500;">${formatNumber(building.sqft)} SF</span> building</span>
            <span><span style="color: #1A1A1A; font-weight: 500;">${formatNumber(calculation.usableRoofSqft)} SF</span> usable roof</span>
            <span><span style="color: #1A1A1A; font-weight: 500;">${building.propertyType || 'Industrial'}</span></span>
            <span style="color: #68A2CD;">${getUtilityFullName(calculation.utility)}</span>
          </div>

          <!-- Two Card Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
            <!-- Annual Lease Revenue Card -->
            <div style="background: white; border: 1px solid #E7E8E3; border-radius: 12px; padding: 24px;">
              <p style="font-family: 'Roboto Mono', monospace; font-size: 10px; color: #9FA38F; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Annual Lease Revenue</p>
              <p style="font-size: 28px; font-weight: 300; color: #1A1A1A; margin: 0 0 4px 0; letter-spacing: -0.02em;">
                ${formatCurrency(calculation.annualIncomeLow)} – ${formatCurrency(calculation.annualIncomeHigh)}
              </p>
              <p style="font-size: 13px; color: #9FA38F; margin: 0 0 20px 0;">per year</p>

              <div style="border-top: 1px solid #E7E8E3; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                  <span style="color: #9FA38F;">Lease Rate</span>
                  <span style="color: #1A1A1A; font-weight: 600;">$${calculation.lowRate.toFixed(2)} – $${calculation.highRate.toFixed(2)}/SF</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                  <span style="color: #9FA38F;">Usable Roof</span>
                  <span style="color: #1A1A1A; font-weight: 600;">${formatNumber(calculation.usableRoofSqft)} SF</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                  <span style="color: #9FA38F;">System Size</span>
                  <span style="color: #1A1A1A; font-weight: 600;">${calculation.systemSizeLow >= 1000 ? (calculation.systemSizeLow / 1000).toFixed(1) + ' MW' : calculation.systemSizeLow + ' kW'} – ${calculation.systemSizeHigh >= 1000 ? (calculation.systemSizeHigh / 1000).toFixed(1) + ' MW' : calculation.systemSizeHigh + ' kW'}</span>
                </div>
              </div>
            </div>

            <!-- Value Uplift Card -->
            <div style="background: linear-gradient(180deg, #FAFFFE 0%, #F5FFFC 100%); border: 1px solid #E7E8E3; border-radius: 12px; padding: 24px;">
              <p style="font-family: 'Roboto Mono', monospace; font-size: 10px; color: #9FA38F; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Value Uplift at Sale</p>
              <p style="font-size: 28px; font-weight: 300; color: #1A1A1A; margin: 0 0 4px 0; letter-spacing: -0.02em;">
                ${formatMillions(calculation.valueUpliftLow)} – ${formatMillions(calculation.valueUpliftHigh)}
              </p>
              <p style="font-size: 13px; color: #9FA38F; margin: 0 0 20px 0;">property value increase</p>

              <div style="border-top: 1px solid #E7E8E3; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                  <span style="color: #9FA38F;">Est. Property Value</span>
                  <span style="color: #1A1A1A; font-weight: 600;">${formatMillions(calculation.estimatedPropertyValue)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                  <span style="color: #9FA38F;">Value Increase</span>
                  <span style="color: #2E7D32; font-weight: 700;">+${calculation.valueIncreasePctLow}% – ${calculation.valueIncreasePctHigh}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                  <span style="color: #9FA38F;">Cap Rate</span>
                  <span style="color: #1A1A1A; font-weight: 600;">6%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Disclaimer -->
          <p style="font-size: 11px; color: #9FA38F; margin: 0 0 32px 0;">
            Estimates based on ${getUtilityFullName(calculation.utility)} utility market rates. Actual rates depend on roof condition, orientation, and local utility rates.
          </p>

          <!-- Why Solar Leasing Section -->
          <h3 style="font-size: 18px; font-weight: 300; color: #1A1A1A; margin: 0 0 16px 0; letter-spacing: -0.02em;">Why Solar Leasing</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
            <div style="padding-left: 12px; border-left: 2px solid #E7E8E3;">
              <p style="font-size: 13px; font-weight: 500; color: #1A1A1A; margin: 0 0 4px 0;">Passive Income</p>
              <p style="font-size: 12px; color: #9FA38F; margin: 0; line-height: 1.5;">Generate steady annual revenue with zero operational involvement.</p>
            </div>
            <div style="padding-left: 12px; border-left: 2px solid #E7E8E3;">
              <p style="font-size: 13px; font-weight: 500; color: #1A1A1A; margin: 0 0 4px 0;">Zero Capital Required</p>
              <p style="font-size: 12px; color: #9FA38F; margin: 0; line-height: 1.5;">Lumen handles all installation and maintenance at no cost.</p>
            </div>
            <div style="padding-left: 12px; border-left: 2px solid #E7E8E3;">
              <p style="font-size: 13px; font-weight: 500; color: #1A1A1A; margin: 0 0 4px 0;">Increased Property Value</p>
              <p style="font-size: 12px; color: #9FA38F; margin: 0; line-height: 1.5;">New NOI directly increases property value at sale.</p>
            </div>
            <div style="padding-left: 12px; border-left: 2px solid #E7E8E3;">
              <p style="font-size: 13px; font-weight: 500; color: #1A1A1A; margin: 0 0 4px 0;">Long-Term Stability</p>
              <p style="font-size: 12px; color: #9FA38F; margin: 0; line-height: 1.5;">20-25 year agreements with inflation-adjusted payments.</p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background: #F8F8F6; border: 1px solid #E7E8E3; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <h3 style="font-size: 14px; font-weight: 500; color: #1A1A1A; margin: 0 0 12px 0;">Next Steps</h3>
            <ol style="margin: 0; padding-left: 20px; color: #9FA38F; line-height: 1.8; font-size: 13px;">
              <li>Schedule a 15-minute intro call with Lumen Energy</li>
              <li>Receive investment-grade financial analysis at no cost</li>
              <li>Review competitive bids from top solar developers</li>
            </ol>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #E7E8E3; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-size: 11px; color: #9FA38F; margin: 0;">Contact Lumen Energy</p>
              <p style="font-size: 13px; color: #1A1A1A; margin: 4px 0 0 0;">hello@lumen.energy · getlumen.com</p>
            </div>
            <div style="background: #DFFF5E; padding: 10px 20px;">
              <span style="font-size: 12px; font-weight: 500; color: #1A1A1A;">Get Your Proposal</span>
            </div>
          </div>
        </div>
      </div>
    `;

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
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);

      const filename = `${building.address.replace(/[^a-zA-Z0-9]/g, "-")}-solar-analysis.pdf`;
      pdf.save(filename);
    } finally {
      document.body.removeChild(content);
    }
  };

  if (variant === "outline") {
    return (
      <button
        onClick={handleDownload}
        className="inline-flex items-center px-5 py-3 border border-[#E7E8E3] text-[#1A1A1A] font-medium hover:border-[#B1E5FF] hover:bg-[#CAEDFF] transition-colors text-sm"
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
      className="inline-flex items-center px-4 py-2 border border-[#E7E8E3] text-[#1A1A1A] hover:border-[#B1E5FF] hover:bg-[#CAEDFF] transition-colors text-sm font-medium"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download PDF
    </button>
  );
}
