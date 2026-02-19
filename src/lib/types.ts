export interface Property {
  address: string;
  sqft: number;
  propertyType: string;
  city?: string;
  state?: string;
  customerId?: string;
  systemSize?: number; // kW
  leaseValue?: number; // Annual NOI
  grossRoofArea?: number; // ft²
  utility?: string;
}

export interface Building {
  address: string;
  name?: string;
  sqft: number;
  listingUrl?: string;
  city?: string;
  state?: string;
  utility?: string;
  propertyType?: string;
  yearBuilt?: number;
  clearHeight?: string;
  loadingDocks?: number;
}

export interface Broker {
  slug: string;
  name: string;
  fullName: string;
  company: string;
  market: string;
  email?: string;
  phone?: string;
  title?: string;
  profileUrl?: string;
  buildings: Building[];
}

export interface Firm {
  name: string;
  slug: string;
  market: string;
}

export interface Owner {
  name: string;
  slug: string;
  propertyCount: number;
  properties: Property[];
}

export interface OwnersData {
  owners: Owner[];
}

export interface BrokersData {
  firms: Firm[];
  brokers: Broker[];
}

export interface BuildingCalculation {
  address: string;
  sqft: number;
  utility: string;
  leaseRate: number;
  systemSizeLow: number;
  systemSizeHigh: number;
  annualIncomeLow: number;
  annualIncomeHigh: number;
  usableRoofSqft: number;
  lowRate: number;
  highRate: number;
  valueUpliftLow: number;
  valueUpliftHigh: number;
}

export interface PortfolioSummary {
  totalLow: number;
  totalHigh: number;
  totalSystemSizeLow: number;
  totalSystemSizeHigh: number;
  buildings: BuildingCalculation[];
}

export interface ReferralFee {
  low: number;
  high: number;
}

export interface PropertyListing {
  address: string;
  slug: string;
  brokerName?: string;
  brokerCompany?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  propertyType?: string;
  sqft?: number;
  listingUrl?: string;
  listingDate?: string;
  description?: string;
  price?: string;
  searchResults: string[];
  createdAt: string;
}

export interface PropertiesIndex {
  properties: PropertyListing[];
}
