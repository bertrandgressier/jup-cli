export interface PriceResult {
  mint: string;
  price: number;
  timestamp: Date;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  verified?: boolean;
}

// API Response Types
export interface PriceApiResponse {
  data?: Record<string, PriceDataEntry>;
}

export interface PriceDataEntry {
  usdPrice?: number;
  price?: number;
  usd?: number;
}
