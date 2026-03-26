// Executive Summary metrics
export interface ExecutiveSummaryMetrics {
  squareFootagePerCapita?: number;
  reitSquareFootagePerCapita?: number;
  nonReitSquareFootagePerCapita?: number;
  numberOfCurrentFacilities?: number;
  totalGrossSquareFootage?: number;
  totalNetRentableSquareFootage?: number;
  percentSqFtDriveUp?: number;
  percentCurrentFacilitiesOfferingClimateControl?: number;
  population?: number;
  populationDensity?: number;
  medianHouseholdIncome?: number;
  averageHouseholdIncome?: number;
  numberOfHouseholds?: number;
  percentRenters?: number;
  percentHomeowners?: number;
  [key: string]: number | string | undefined;
}

export interface RadiusAnalysis {
  radius: string;
  metrics: ExecutiveSummaryMetrics;
}

// Demographic data
export interface DemographicData {
  population?: number;
  populationDensity?: number;
  medianHouseholdIncome?: number;
  averageHouseholdIncome?: number;
  numberOfHouseholds?: number;
  percentRenters?: number;
  percentHomeowners?: number;
  incomeGrowth?: number;
  jobGrowth?: number;
  populationGrowth?: number;
  educationAttainment?: string;
  [key: string]: number | string | undefined;
}

// Opportunity metrics
export interface OpportunityMetrics {
  score?: number;
  rating?: string;
  details?: Record<string, string | number>;
}

// Rate trend data
export interface RateTrendData {
  month: string;
  averageRate: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

// Rental comp data
export interface RentalComp {
  facilityName: string;
  address: string;
  rate: number;
  unitSize: string;
  occupancy: number;
  distance: number;
}

// Operating performance
export interface OperatingPerformance {
  occupancyRate: number;
  rentCollectionRate: number;
  averageUnitRent: number;
  monthlyRevenue: number;
  operatingExpenses: number;
  netOperatingIncome: number;
}

// Map layer data
export interface MapLayerData {
  layerName: string;
  layerType: 'flood_zone' | 'crime_index' | 'income_growth' | 'job_growth' | 'population_growth' | 'education' | 'other';
  data: Record<string, string | number | boolean>;
  hoveredArea?: string;
  hoveredValue?: string | number;
  note?: string;
}

// Complete location profile
export interface LocationProfile {
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  executiveSummary: {
    threeMile?: RadiusAnalysis;
    fiveMile?: RadiusAnalysis;
    tenMile?: RadiusAnalysis;
  };
  demographics: {
    threeMile?: DemographicData;
    fiveMile?: DemographicData;
    tenMile?: DemographicData;
  };
  opportunity?: {
    threeMile?: OpportunityMetrics;
    fiveMile?: OpportunityMetrics;
    tenMile?: OpportunityMetrics;
  };
  rateTrends?: RateTrendData[];
  rentalComps?: RentalComp[];
  operatingPerformance?: {
    threeMile?: OperatingPerformance;
    fiveMile?: OperatingPerformance;
    tenMile?: OperatingPerformance;
  };
  mapLayers?: MapLayerData[];
}

// Tract IQ browser session state
export interface TractIQSession {
  isAuthenticated: boolean;
  lastActivityTime: number;
  currentAddress?: string;
}
