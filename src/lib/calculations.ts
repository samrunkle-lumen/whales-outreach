import { Building, Property, BuildingCalculation, PortfolioSummary, ReferralFee } from "./types";

// Usable roof percentage by property type
const USABLE_ROOF_PERCENTAGE_INDUSTRIAL = 0.80;
const USABLE_ROOF_PERCENTAGE_OTHER = 0.50;

// Lumen revenue per watt for referral fee calculation
const LUMEN_REVENUE_PER_WATT = 0.15;
const REFERRAL_FEE_PERCENT = 0.15;

// Cap rate for property value uplift calculation
const CAP_RATE = 0.06;

// Solar lease rates by utility ($/SF/year)
export const UTILITY_RATES: Record<string, { lowRate: number; highRate: number; fullName: string }> = {
  // New Jersey - Higher rates due to strong solar incentives
  "PSE&G": { lowRate: 0.90, highRate: 1.50, fullName: "Public Service Electric & Gas" },
  "JCP&L": { lowRate: 0.85, highRate: 1.35, fullName: "Jersey Central Power & Light" },
  "ACE": { lowRate: 0.80, highRate: 1.30, fullName: "Atlantic City Electric" },
  "Rockland": { lowRate: 0.85, highRate: 1.40, fullName: "Rockland Electric" },

  // Maryland
  "BGE": { lowRate: 0.75, highRate: 1.25, fullName: "Baltimore Gas & Electric" },
  "Delmarva": { lowRate: 0.75, highRate: 1.25, fullName: "Delmarva Power" },
  "Pepco": { lowRate: 0.75, highRate: 1.25, fullName: "Potomac Electric Power (Pepco)" },
  "Potomac Edison": { lowRate: 0.70, highRate: 1.15, fullName: "The Potomac Edison" },

  // Illinois
  "ComEd": { lowRate: 0.65, highRate: 1.10, fullName: "Commonwealth Edison" },
  "Ameren": { lowRate: 0.60, highRate: 1.05, fullName: "Ameren Illinois" },

  // Pennsylvania
  "PECO": { lowRate: 0.75, highRate: 1.25, fullName: "PECO Energy" },
  "PPL": { lowRate: 0.70, highRate: 1.15, fullName: "PPL Electric Utilities" },
  "Duquesne": { lowRate: 0.65, highRate: 1.10, fullName: "Duquesne Light" },

  // Massachusetts - Strong SMART incentive program
  "Eversource MA": { lowRate: 0.85, highRate: 1.40, fullName: "Eversource Massachusetts" },
  "National Grid MA": { lowRate: 0.80, highRate: 1.35, fullName: "National Grid Massachusetts" },
  "Unitil": { lowRate: 0.75, highRate: 1.25, fullName: "Unitil" },

  // Default fallback
  "Default": { lowRate: 0.75, highRate: 1.25, fullName: "Estimated" },
};

// Map regions/cities to utilities
export function getUtilityForLocation(state: string, city?: string): string {
  const cityLower = city?.toLowerCase() || "";
  const stateLower = state.toLowerCase();

  if (stateLower === "nj" || stateLower === "new jersey") {
    // Northern NJ - PSE&G territory (premium market near NYC)
    if (["newark", "jersey city", "elizabeth", "paterson", "clifton", "passaic",
         "east orange", "bayonne", "union", "edison", "woodbridge", "piscataway",
         "parsippany", "morristown", "randolph", "east hanover", "carlstadt",
         "secaucus", "kearny", "totowa", "wayne", "kenilworth"].some(c => cityLower.includes(c))) {
      return "PSE&G";
    }
    // Central/Shore NJ - JCP&L territory
    if (["toms river", "brick", "jackson", "lakewood", "freehold", "red bank",
         "long branch", "asbury park", "hamilton", "bordentown", "trenton", "tinton falls",
         "dayton", "cranbury", "somerset", "sea girt"].some(c => cityLower.includes(c))) {
      return "JCP&L";
    }
    // South NJ - ACE territory
    if (["atlantic city", "vineland", "millville", "bridgeton", "glassboro",
         "voorhees", "cherry hill", "logan", "camden", "mount laurel", "haddon",
         "pennsauken", "salem"].some(c => cityLower.includes(c))) {
      return "ACE";
    }
    // Rockland territory (NW NJ near NY border)
    if (["park ridge", "mahwah", "ramsey", "sussex"].some(c => cityLower.includes(c))) {
      return "Rockland";
    }
    // Default NJ to PSE&G (largest utility)
    return "PSE&G";
  }

  if (stateLower === "md" || stateLower === "maryland") {
    // Baltimore area - BGE
    if (["baltimore", "towson", "dundalk", "essex", "parkville", "catonsville",
         "ellicott city", "columbia", "halethorpe", "middle river", "glen burnie",
         "savage"].some(c => cityLower.includes(c))) {
      return "BGE";
    }
    // Eastern Shore - Delmarva
    if (["salisbury", "ocean city", "easton", "cambridge"].some(c => cityLower.includes(c))) {
      return "Delmarva";
    }
    // DC suburbs - Pepco
    if (["bethesda", "silver spring", "rockville", "gaithersburg", "college park"].some(c => cityLower.includes(c))) {
      return "Pepco";
    }
    // Western MD - Potomac Edison (I-81 corridor)
    if (["hagerstown", "frederick", "cumberland", "williamsport"].some(c => cityLower.includes(c))) {
      return "Potomac Edison";
    }
    // Default MD to BGE
    return "BGE";
  }

  if (stateLower === "il" || stateLower === "illinois") {
    // Chicago area - ComEd
    if (["chicago", "aurora", "naperville", "joliet", "elgin", "waukegan",
         "cicero", "schaumburg", "evanston", "elk grove", "bolingbrook", "romeoville"].some(c => cityLower.includes(c))) {
      return "ComEd";
    }
    // Downstate - Ameren
    if (["springfield", "peoria", "champaign", "decatur", "bloomington"].some(c => cityLower.includes(c))) {
      return "Ameren";
    }
    // Default IL to ComEd
    return "ComEd";
  }

  if (stateLower === "pa" || stateLower === "pennsylvania") {
    // Philadelphia area - PECO
    if (["philadelphia", "king of prussia", "conshohocken", "bensalem", "malvern",
         "blue bell"].some(c => cityLower.includes(c))) {
      return "PECO";
    }
    // Lehigh Valley & Central PA - PPL
    if (["allentown", "bethlehem", "easton", "harrisburg", "york", "lancaster",
         "carlisle", "mechanicsburg", "shiremanstown", "chambersburg"].some(c => cityLower.includes(c))) {
      return "PPL";
    }
    // Pittsburgh area - Duquesne
    if (["pittsburgh", "cranberry township", "moon township", "aliquippa"].some(c => cityLower.includes(c))) {
      return "Duquesne";
    }
    // Default PA to PECO
    return "PECO";
  }

  if (stateLower === "ma" || stateLower === "massachusetts") {
    // Greater Boston / Eastern MA - Eversource
    if (["boston", "cambridge", "somerville", "quincy", "brockton", "fall river", "new bedford",
         "taunton", "framingham", "plymouth", "barnstable", "worcester"].some(c => cityLower.includes(c))) {
      return "Eversource MA";
    }
    // Central/Western MA - National Grid
    if (["springfield", "holyoke", "chicopee", "northampton", "westfield", "pittsfield",
         "leominster", "fitchburg", "gardner"].some(c => cityLower.includes(c))) {
      return "National Grid MA";
    }
    // Default MA to Eversource (largest utility)
    return "Eversource MA";
  }

  return "Default";
}

export function getLeaseRates(utility: string): { lowRate: number; highRate: number } {
  const rates = UTILITY_RATES[utility] || UTILITY_RATES["Default"];
  return { lowRate: rates.lowRate, highRate: rates.highRate };
}

export function getUtilityFullName(utility: string): string {
  return UTILITY_RATES[utility]?.fullName || utility;
}

function isIndustrialProperty(propertyType?: string): boolean {
  if (!propertyType) return false;
  const type = propertyType.toLowerCase();
  return type.includes('industrial') || type.includes('warehouse') || type.includes('manufacturing');
}

function getUsableRoofPercentage(propertyType?: string): number {
  return isIndustrialProperty(propertyType)
    ? USABLE_ROOF_PERCENTAGE_INDUSTRIAL
    : USABLE_ROOF_PERCENTAGE_OTHER;
}

export function calculateBuilding(building: Building | Property): BuildingCalculation {
  // Handle missing or invalid address
  const address = building.address || "Unknown Address";
  const sqft = building.sqft && building.sqft > 0 ? building.sqft : 0;

  // Extract state from address
  const addressParts = address.split(",");
  const lastPart = addressParts[addressParts.length - 1]?.trim() || "";
  const state = lastPart.split(" ")[0] || building.state || "NJ";

  // Get city from address
  const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2]?.trim() : building.city;

  // Determine utility
  const utility = building.utility || getUtilityForLocation(state, city);
  const { lowRate, highRate } = getLeaseRates(utility);

  // Get property type (Property has propertyType, Building has propertyType as optional)
  const propertyType = 'propertyType' in building ? building.propertyType : (building as any).propertyType;

  // Calculate usable roof area using property-type-specific heuristic
  const usableRoofPercentage = getUsableRoofPercentage(propertyType);
  const usableRoofSqft = Math.round(sqft * usableRoofPercentage);

  // If property has CSV data, use it; otherwise calculate
  const hasCSVData = 'leaseValue' in building && building.leaseValue && building.leaseValue > 0;
  const hasCSVSystemSize = 'systemSize' in building && building.systemSize && building.systemSize > 0;

  let annualIncomeLow: number;
  let annualIncomeHigh: number;
  let systemSizeLow: number;
  let systemSizeHigh: number;

  if (hasCSVData) {
    // Use exact CSV lease value (CS - NOI) as the income - no ranges
    const csvLeaseValue = (building as Property).leaseValue || 0;
    annualIncomeLow = csvLeaseValue;
    annualIncomeHigh = csvLeaseValue;
  } else {
    // Calculate solar revenue using $/SF/year
    annualIncomeLow = Math.round(usableRoofSqft * lowRate);
    annualIncomeHigh = Math.round(usableRoofSqft * highRate);
  }

  if (hasCSVSystemSize) {
    // Use exact CSV system size - no ranges
    const csvSystemSize = (building as Property).systemSize || 0;
    systemSizeLow = csvSystemSize;
    systemSizeHigh = csvSystemSize;
  } else {
    // Calculate system size (100 SF per kW)
    systemSizeLow = Math.round(usableRoofSqft * 0.5 / 100);
    systemSizeHigh = Math.round(usableRoofSqft / 100);
  }

  // Calculate property value uplift at cap rate
  const valueUpliftLow = Math.round(annualIncomeLow / CAP_RATE);
  const valueUpliftHigh = Math.round(annualIncomeHigh / CAP_RATE);

  return {
    address,
    sqft,
    utility,
    leaseRate: (lowRate + highRate) / 2, // average for display
    systemSizeLow,
    systemSizeHigh,
    annualIncomeLow,
    annualIncomeHigh,
    usableRoofSqft,
    lowRate,
    highRate,
    valueUpliftLow,
    valueUpliftHigh,
  };
}

export function calculatePortfolio(buildings: (Building | Property)[]): PortfolioSummary {
  const calculatedBuildings = buildings.map(calculateBuilding);

  const totalLow = calculatedBuildings.reduce((sum, b) => sum + b.annualIncomeLow, 0);
  const totalHigh = calculatedBuildings.reduce((sum, b) => sum + b.annualIncomeHigh, 0);
  const totalSystemSizeLow = calculatedBuildings.reduce((sum, b) => sum + b.systemSizeLow, 0);
  const totalSystemSizeHigh = calculatedBuildings.reduce((sum, b) => sum + b.systemSizeHigh, 0);

  return {
    totalLow,
    totalHigh,
    totalSystemSizeLow,
    totalSystemSizeHigh,
    buildings: calculatedBuildings,
  };
}

export function calculateReferralFee(systemSizeLow: number, systemSizeHigh: number): ReferralFee {
  // System size is in kW, convert to W for calculation
  const systemWattsLow = systemSizeLow * 1000;
  const systemWattsHigh = systemSizeHigh * 1000;

  // Referral fee = 15% of Lumen revenue ($0.15/W)
  const low = Math.round(systemWattsLow * LUMEN_REVENUE_PER_WATT * REFERRAL_FEE_PERCENT);
  const high = Math.round(systemWattsHigh * LUMEN_REVENUE_PER_WATT * REFERRAL_FEE_PERCENT);

  return { low, high };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatMillions(n: number): string {
  const millions = n / 1_000_000;
  if (millions >= 1) {
    return `$${millions.toFixed(2)}M`;
  } else {
    const thousands = n / 1_000;
    return `$${Math.round(thousands)}K`;
  }
}
