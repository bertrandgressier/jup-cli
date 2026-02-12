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

  async getWalletByAddress(address: string): Promise<Wallet | null> {
    return this.walletRepo.findByAddress(address);
  }

  async walletExists(address: string): Promise<boolean> {
    const wallet = await this.walletRepo.findByAddress(address);
    return !!wallet;
  }

  async updateWalletName(id: string, name: string): Promise<Wallet> {
    const wallet = await this.getWallet(id);
    wallet.updateName(name);
    return this.walletRepo.update(wallet);
  }

  async markWalletUsed(id: string): Promise<Wallet> {
    const wallet = await this.getWallet(id);
    wallet.markAsUsed();
    return this.walletRepo.update(wallet);
  }

  async deleteWallet(id: string): Promise<void> {
    const wallet = await this.getWallet(id);
    wallet.deactivate();
    await this.walletRepo.update(wallet);
  }

  async permanentlyDeleteWallet(id: string): Promise<void> {
    await this.walletRepo.delete(id);
  }
}
