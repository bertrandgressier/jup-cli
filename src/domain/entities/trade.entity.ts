export type TradeType = 'swap' | 'limit_order';

export class Trade {
  constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly inputMint: string,
    public readonly outputMint: string,
    public readonly inputAmount: string,
    public readonly outputAmount: string,
    public readonly type: TradeType,
    public readonly signature: string,
    public readonly executedAt: Date,
    public readonly inputSymbol?: string,
    public readonly outputSymbol?: string,
    public readonly inputUsdPrice?: string,
    public readonly outputUsdPrice?: string,
    public readonly inputUsdValue?: string,
    public readonly outputUsdValue?: string
  ) {}
}
