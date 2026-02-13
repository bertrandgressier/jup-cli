import { Trade, TradeType } from '../entities/trade.entity';

export interface TradeRepository {
  create(trade: Trade): Promise<Trade>;
  findByWallet(
    walletId: string,
    options?: {
      mint?: string;
      type?: TradeType;
      limit?: number;
      offset?: number;
    }
  ): Promise<Trade[]>;
  countByWallet(
    walletId: string,
    options?: {
      mint?: string;
      type?: TradeType;
    }
  ): Promise<number>;
  findBySignature(signature: string): Promise<Trade | null>;
  findByWalletAndMint(walletId: string, mint: string): Promise<Trade[]>;
}
