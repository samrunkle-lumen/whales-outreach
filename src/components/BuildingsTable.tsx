import { BuildingCalculation } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/calculations";

interface BuildingsTableProps {
  buildings: BuildingCalculation[];
}

export function BuildingsTable({ buildings }: BuildingsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      {/* Desktop Table */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="border-b border-[#9FA3BF]/30">
            <th className="text-left py-4 px-4 text-sm font-medium text-[#9FA3BF] uppercase tracking-wider">
              Address
            </th>
            <th className="text-right py-4 px-4 text-sm font-medium text-[#9FA3BF] uppercase tracking-wider">
              Sq Ft
            </th>
            <th className="text-right py-4 px-4 text-sm font-medium text-[#9FA3BF] uppercase tracking-wider">
              System Size (kW)
            </th>
            <th className="text-right py-4 px-4 text-sm font-medium text-[#9FA3BF] uppercase tracking-wider">
              Annual Lease Income
            </th>
          </tr>
        </thead>
        <tbody>
          {buildings.map((building, index) => (
            <tr
              key={index}
              className="border-b border-[#9FA3BF]/10 hover:bg-[#B1E5FF]/10 transition-colors"
            >
              <td className="py-4 px-4 text-[#1A1A1A]">{building.address}</td>
              <td className="py-4 px-4 text-[#1A1A1A] text-right">
                {formatNumber(building.sqft)}
              </td>
              <td className="py-4 px-4 text-[#1A1A1A] text-right">
                {formatNumber(building.systemSizeLow)} – {formatNumber(building.systemSizeHigh)}
              </td>
              <td className="py-4 px-4 text-[#1A1A1A] text-right font-medium">
                {formatCurrency(building.annualIncomeLow)} – {formatCurrency(building.annualIncomeHigh)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {buildings.map((building, index) => (
          <div
            key={index}
            className="border border-[#9FA3BF]/20 rounded-lg p-4 space-y-3"
          >
            <p className="text-[#1A1A1A] font-medium">{building.address}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[#9FA3BF] text-xs uppercase">Sq Ft</p>
                <p className="text-[#1A1A1A]">{formatNumber(building.sqft)}</p>
              </div>
              <div>
                <p className="text-[#9FA3BF] text-xs uppercase">System Size</p>
                <p className="text-[#1A1A1A]">
                  {formatNumber(building.systemSizeLow)} – {formatNumber(building.systemSizeHigh)} kW
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[#9FA3BF] text-xs uppercase">Annual Income</p>
                <p className="text-[#1A1A1A] font-medium">
                  {formatCurrency(building.annualIncomeLow)} – {formatCurrency(building.annualIncomeHigh)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
