import { Wallet } from '../../../domain/entities/wallet.entity';
import { WalletRepository } from '../../../domain/repositories/wallet.repository';
import { keyEncryptionService } from '../security/key-encryption.service';
import {
  WalletNotFoundError,
  InvalidMasterPasswordError,
} from '../../../core/errors/wallet.errors';
import { MasterPasswordService } from '../security/master-password.service';

export class WalletExporterService {
  private walletRepo: WalletRepository;
  private masterPasswordService: MasterPasswordService;

  constructor(walletRepo: WalletRepository, masterPasswordService: MasterPasswordService) {
    this.walletRepo = walletRepo;
    this.masterPasswordService = masterPasswordService;
  }

  async exportPrivateKey(walletId: string, masterPassword: string): Promise<string> {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    let sessionKey: Buffer;
    try {
      sessionKey = await this.masterPasswordService.getSessionKeyWithPassword(masterPassword);
    } catch {
      throw new InvalidMasterPasswordError();
    }

    const privateKey = await keyEncryptionService.decryptPrivateKey(
      wallet.encryptedKey,
      wallet.keyNonce,
      wallet.keySalt,
      wallet.keyAuthTag,
      sessionKey
    );

    return privateKey;
  }

  async exportWalletInfo(walletId: string): Promise<Partial<Wallet>> {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    return {
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      createdAt: wallet.createdAt,
      lastUsed: wallet.lastUsed,
      isActive: wallet.isActive,
    };
  }
}
