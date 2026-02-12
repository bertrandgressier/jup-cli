import { Keypair } from '@solana/web3.js';
import { Wallet } from '../../../domain/entities/wallet.entity';
import { WalletRepository } from '../../../domain/repositories/wallet.repository';
import { keyEncryptionService } from '../security/key-encryption.service';
import {
  InvalidPrivateKeyError,
  WalletAlreadyExistsError,
  InvalidWalletNameError,
} from '../../../core/errors/wallet.errors';
import { MasterPasswordService } from '../security/master-password.service';
import { validateWalletName, validatePrivateKey } from './wallet-validation.util';

export class WalletImporterService {
  private walletRepo: WalletRepository;
  private masterPasswordService: MasterPasswordService;

  constructor(walletRepo: WalletRepository, masterPasswordService: MasterPasswordService) {
    this.walletRepo = walletRepo;
    this.masterPasswordService = masterPasswordService;
  }

  async importWallet(
    name: string,
    privateKeyBase58: string,
    masterPassword?: string
  ): Promise<Wallet> {
    validateWalletName(name);

    const privateKey = validatePrivateKey(privateKeyBase58);

    try {
      const keypair = Keypair.fromSecretKey(privateKey);
      const publicKey = keypair.publicKey.toBase58();

      const existing = await this.walletRepo.findByAddress(publicKey);
      if (existing) {
        throw new WalletAlreadyExistsError(publicKey);
      }

      const sessionKey = masterPassword
        ? await this.masterPasswordService.getSessionKeyWithPassword(masterPassword)
        : await this.masterPasswordService.getSessionKey();

      const { encryptedKey, nonce, salt, authTag } = await keyEncryptionService.encryptPrivateKey(
        privateKeyBase58.trim(),
        sessionKey
      );

      const wallet = new Wallet(
        crypto.randomUUID(),
        name,
        publicKey,
        encryptedKey,
        nonce,
        salt,
        authTag
      );

      return this.walletRepo.create(wallet);
    } catch (error) {
      if (
        error instanceof InvalidPrivateKeyError ||
        error instanceof WalletAlreadyExistsError ||
        error instanceof InvalidWalletNameError
      ) {
        throw error;
      }
      throw new InvalidPrivateKeyError();
    } finally {
      privateKey.fill(0);
    }
  }
}
