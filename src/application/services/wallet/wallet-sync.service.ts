import { WalletRepository } from '../../../domain/repositories/wallet.repository';
import { SolanaRpcPort } from '../../ports/blockchain.port';
import { WalletNotFoundError } from '../../../core/errors/wallet.errors';
import { LoggerService } from '../../../core/logger/logger.service';

export interface PriceProvider {
  getPrice(mints: string[]): Promise<{ mint: string; price: number; timestamp: Date }[]>;
}

export interface SyncResult {
  balancesFound: number;
  totalValue: number;
}

export interface WalletState {
  address: string;
  solBalance: number;
  tokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
    price: number;
    value: number;
  }>;
  totalValue: number;
}

export class WalletSyncService {
  private walletRepo: WalletRepository;
  private solanaRpc: SolanaRpcPort;
  private priceProvider: PriceProvider;

  constructor(
    walletRepo: WalletRepository,
    solanaRpc: SolanaRpcPort,
    priceProvider: PriceProvider
  ) {
    this.walletRepo = walletRepo;
    this.solanaRpc = solanaRpc;
    this.priceProvider = priceProvider;
  }

  async getWalletState(walletId: string): Promise<WalletState> {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    LoggerService.getInstance().info(`Fetching wallet state for ${wallet.address}`);

    const walletTokens = await this.solanaRpc.getTokenAccounts(wallet.address);

    const mints = walletTokens.tokens.map((t) => t.mint);
    if (walletTokens.solBalance > 0) {
      mints.unshift('So11111111111111111111111111111111111111112');
    }

    let prices: Map<string, number> = new Map();
    if (mints.length > 0) {
      try {
        const priceResults = await this.priceProvider.getPrice(mints);
        prices = new Map(priceResults.map((p) => [p.mint, p.price]));
      } catch (error) {
        LoggerService.getInstance().warn(
          `Failed to fetch prices: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    const tokens: WalletState['tokens'] = [];
    let totalValue = 0;

    if (walletTokens.solBalance > 0) {
      const price = prices.get('So11111111111111111111111111111111111111112') || 0;
      const value = walletTokens.solBalance * price;
      tokens.push({
        mint: 'So11111111111111111111111111111111111111112',
        amount: walletTokens.solBalance,
        decimals: 9,
        price,
        value,
      });
      totalValue += value;
    }

    for (const token of walletTokens.tokens) {
      const price = prices.get(token.mint) || 0;
      const value = token.uiAmount * price;
      tokens.push({
        mint: token.mint,
        amount: token.uiAmount,
        decimals: token.decimals,
        price,
        value,
      });
      totalValue += value;
    }

    wallet.markAsUsed();
    await this.walletRepo.update(wallet);

    return {
      address: wallet.address,
      solBalance: walletTokens.solBalance,
      tokens,
      totalValue,
    };
  }
}
