export type ElectricityCountry = "ee" | "lv" | "lt" | "fi";

export interface EleringPricePoint {
  timestamp: number;
  price: number;
}

export interface EleringRangeResponse {
  success: boolean;
  data: Partial<Record<ElectricityCountry, EleringPricePoint[]>>;
}

export interface EleringCurrentResponse {
  success: boolean;
  data: EleringPricePoint[];
}

export interface ElectricityPrice {
  country: ElectricityCountry;
  timestamp: number;
  utcTime: string;
  localTime: string;
  priceEurMwh: number;
  priceEurKwh: number;
}

export interface CheapestWindow {
  country: ElectricityCountry;
  hours: number;
  startLocalTime: string;
  endLocalTime: string;
  averagePriceEurMwh: number;
  averagePriceEurKwh: number;
  points: ElectricityPrice[];
}
