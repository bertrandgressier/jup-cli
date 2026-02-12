import { Wallet } from '../../../src/domain/entities/wallet.entity';

describe('Wallet Entity', () => {
  it('should create a wallet', () => {
    const wallet = new Wallet(
      'test-uuid',
      'Test Wallet',
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      'encrypted-key',
      'nonce',
      'salt',
      'auth-tag'
    );

    expect(wallet.id).toBe('test-uuid');
    expect(wallet.name).toBe('Test Wallet');
    expect(wallet.address).toBe('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    expect(wallet.isActive).toBe(true);
  });

  it('should mark wallet as used', () => {
    const wallet = new Wallet('test-uuid', 'Test', 'address', 'key', 'nonce', 'salt', 'auth-tag');

    expect(wallet.lastUsed).toBeUndefined();
    wallet.markAsUsed();
    expect(wallet.lastUsed).toBeInstanceOf(Date);
  });
});
