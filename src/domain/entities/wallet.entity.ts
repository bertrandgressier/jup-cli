export class Wallet {
  private _name: string;
  private _isActive: boolean;
  private _lastUsed?: Date;

  constructor(
    public readonly id: string,
    name: string,
    public readonly address: string,
    public readonly encryptedKey: string,
    public readonly keyNonce: string,
    public readonly keySalt: string,
    public readonly keyAuthTag: string,
    isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    lastUsed?: Date
  ) {
    this.validateId(id);
    this.validateName(name);
    this.validateAddress(address);
    this._name = name;
    this._isActive = isActive;
    this._lastUsed = lastUsed;
  }

  get name(): string {
    return this._name;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastUsed(): Date | undefined {
    return this._lastUsed;
  }

  updateName(newName: string): void {
    this.validateName(newName);
    this._name = newName;
  }

  markAsUsed(): void {
    this._lastUsed = new Date();
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Wallet ID cannot be empty');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Wallet name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('Wallet name cannot exceed 100 characters');
    }
  }

  private validateAddress(address: string): void {
    if (!address || address.trim().length === 0) {
      throw new Error('Wallet address cannot be empty');
    }
  }
}
