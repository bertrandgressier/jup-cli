export class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(walletId: string) {
    super(`Wallet with ID "${walletId}" not found`, 'WALLET_NOT_FOUND', { walletId });
    this.name = 'WalletNotFoundError';
  }
}

export class WalletAlreadyExistsError extends WalletError {
  constructor(address: string) {
    super(`Wallet with address "${address}" already exists`, 'WALLET_ALREADY_EXISTS', { address });
    this.name = 'WalletAlreadyExistsError';
  }
}

export class InvalidPrivateKeyError extends WalletError {
  constructor() {
    super('Invalid private key format', 'INVALID_PRIVATE_KEY');
    this.name = 'InvalidPrivateKeyError';
  }
}

export class InvalidWalletNameError extends WalletError {
  constructor(reason: string) {
    super(`Invalid wallet name: ${reason}`, 'INVALID_WALLET_NAME');
    this.name = 'InvalidWalletNameError';
  }
}

export class MasterPasswordError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MasterPasswordError';
  }
}

export class MasterPasswordNotSetError extends MasterPasswordError {
  constructor() {
    super('Master password not set. Run "jupiter init" first.', 'MASTER_PASSWORD_NOT_SET');
    this.name = 'MasterPasswordNotSetError';
  }
}

export class InvalidMasterPasswordError extends MasterPasswordError {
  constructor() {
    super('Invalid master password', 'INVALID_MASTER_PASSWORD');
    this.name = 'InvalidMasterPasswordError';
  }
}

export class EncryptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class SessionKeyError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SessionKeyError';
  }
}

export class SessionKeyNotInitializedError extends SessionKeyError {
  constructor() {
    super('Session key not initialized. Run "jupiter init" first.', 'SESSION_KEY_NOT_INITIALIZED');
    this.name = 'SessionKeyNotInitializedError';
  }
}
