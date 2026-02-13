import { Wallet } from '../../../domain/entities/wallet.entity';
import { WalletRepository } from '../../../domain/repositories/wallet.repository';
import { WalletNotFoundError } from '../../../core/errors/wallet.errors';

export class WalletManagerService {
  private walletRepo: WalletRepository;

  constructor(walletRepo: WalletRepository) {
    this.walletRepo = walletRepo;
  }

  async getAllWallets(): Promise<Wallet[]> {
    return this.walletRepo.findAll();
  }

  async getWallet(id: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findById(id);

    if (!wallet) {
      throw new WalletNotFoundError(id);
    }

    return wallet;
  }
}
