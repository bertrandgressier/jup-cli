export interface JupiterApiPort {
  // Quote
  getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps?: number
  ): Promise<QuoteResult>;

  // Swap
  buildSwapTransaction(quote: QuoteResult, walletAddress: string): Promise<SwapTransactionResult>;

  // Price
  getPrice(mints: string[]): Promise<PriceResult[]>;
  searchTokens(query: string): Promise<TokenInfo[]>;
  getTokenInfo(mint: string): Promise<TokenInfo | null>;
}

export interface QuoteResult {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface RoutePlanStep {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapTransactionResult {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
  prioritizationType?: string;
  dynamicSlippageReport?: {
    slippageBps: number;
    predictedSlippageBps: number;
    stateAccountFees?: number;
  };
}

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

export interface TokenSearchResponse {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  verified?: boolean;
}
