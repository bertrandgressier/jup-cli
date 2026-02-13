import { Trade } from '../../../src/domain/entities/trade.entity';

describe('Trade Entity', () => {
  describe('constructor', () => {
    it('should create a trade with all required fields', () => {
      const executedAt = new Date('2025-02-13T14:30:00Z');
      const trade = new Trade(
        'trade-uuid-1',
        'wallet-uuid-1',
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        '1.5',
        '270.0',
        'swap',
        'abc123signature',
        executedAt
      );

      expect(trade.id).toBe('trade-uuid-1');
      expect(trade.walletId).toBe('wallet-uuid-1');
      expect(trade.inputMint).toBe('So11111111111111111111111111111111111111112');
      expect(trade.outputMint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      expect(trade.inputAmount).toBe('1.5');
      expect(trade.outputAmount).toBe('270.0');
      expect(trade.type).toBe('swap');
      expect(trade.signature).toBe('abc123signature');
      expect(trade.executedAt).toBe(executedAt);
    });

    it('should create a trade with optional fields (symbols, USD prices)', () => {
      const executedAt = new Date();
      const trade = new Trade(
        'trade-uuid-2',
        'wallet-uuid-1',
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        '1.0',
        '180.0',
        'swap',
        'sig123',
        executedAt,
        'SOL',
        'USDC',
        '180.00',
        '1.00',
        '180.00',
        '180.00'
      );

      expect(trade.inputSymbol).toBe('SOL');
      expect(trade.outputSymbol).toBe('USDC');
      expect(trade.inputUsdPrice).toBe('180.00');
      expect(trade.outputUsdPrice).toBe('1.00');
      expect(trade.inputUsdValue).toBe('180.00');
      expect(trade.outputUsdValue).toBe('180.00');
    });

    it('should create a trade without optional fields (null USD prices)', () => {
      const trade = new Trade(
        'trade-uuid-3',
        'wallet-uuid-1',
        'mint-a',
        'mint-b',
        '100',
        '50',
        'swap',
        'sig456',
        new Date()
      );

      expect(trade.inputSymbol).toBeUndefined();
      expect(trade.outputSymbol).toBeUndefined();
      expect(trade.inputUsdPrice).toBeUndefined();
      expect(trade.outputUsdPrice).toBeUndefined();
      expect(trade.inputUsdValue).toBeUndefined();
      expect(trade.outputUsdValue).toBeUndefined();
    });

    it('should preserve all field values exactly as provided', () => {
      const executedAt = new Date('2025-02-13T10:15:30.123Z');
      const trade = new Trade(
        'exact-id',
        'exact-wallet',
        'exact-input-mint',
        'exact-output-mint',
        '0.000001',
        '999999999.999999999',
        'limit_order',
        'exact-signature',
        executedAt,
        'TOKENA',
        'TOKENB',
        '0.00000001',
        '999999.99',
        '0.00001',
        '1000000'
      );

      expect(trade.inputAmount).toBe('0.000001');
      expect(trade.outputAmount).toBe('999999999.999999999');
      expect(trade.type).toBe('limit_order');
      expect(trade.executedAt).toBe(executedAt);
      expect(trade.inputUsdPrice).toBe('0.00000001');
    });

    it('should handle executedAt as Date object', () => {
      const now = new Date();
      const trade = new Trade('id', 'wallet', 'mint-in', 'mint-out', '1', '2', 'swap', 'sig', now);

      expect(trade.executedAt).toBeInstanceOf(Date);
      expect(trade.executedAt).toBe(now);
    });
  });

  describe('trade types', () => {
    it('should accept type "swap"', () => {
      const trade = new Trade(
        'id',
        'wallet',
        'mint-in',
        'mint-out',
        '1',
        '2',
        'swap',
        'sig',
        new Date()
      );

      expect(trade.type).toBe('swap');
    });

    it('should accept type "limit_order"', () => {
      const trade = new Trade(
        'id',
        'wallet',
        'mint-in',
        'mint-out',
        '1',
        '2',
        'limit_order',
        'sig',
        new Date()
      );

      expect(trade.type).toBe('limit_order');
    });
  });
});
