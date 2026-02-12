import { CostBasis } from '../../../src/domain/entities/cost-basis.entity';

describe('CostBasis Entity', () => {
  it('should create a cost basis', () => {
    const costBasis = new CostBasis(
      'test-uuid',
      'wallet-1',
      'So11111111111111111111111111111111111111112',
      '80.50',
      '10.5',
      '845.25',
      'SOL'
    );

    expect(costBasis.id).toBe('test-uuid');
    expect(costBasis.walletId).toBe('wallet-1');
    expect(costBasis.mint).toBe('So11111111111111111111111111111111111111112');
    expect(costBasis.avgPriceUsd).toBe('80.5');
    expect(costBasis.totalAcquired).toBe('10.5');
    expect(costBasis.totalCostUsd).toBe('845.25');
    expect(costBasis.symbol).toBe('SOL');
  });

  it('should calculate unrealized PnL', () => {
    const costBasis = new CostBasis(
      'test-uuid',
      'wallet-1',
      'So11111111111111111111111111111111111111112',
      '80.00',
      '10',
      '800.00',
      'SOL'
    );

    const { pnl, pnlPercent } = costBasis.calculateUnrealizedPnl('10', '90');

    expect(parseFloat(pnl)).toBe(100); // (90 - 80) * 10
    expect(parseFloat(pnlPercent)).toBe(12.5); // (100 / 800) * 100
  });

  it('should add acquisition and update cost basis', () => {
    const costBasis = new CostBasis(
      'test-uuid',
      'wallet-1',
      'So11111111111111111111111111111111111111112',
      '80.00',
      '10',
      '800.00',
      'SOL'
    );

    costBasis.addAcquisition('5', '90');

    expect(costBasis.totalAcquired).toBe('15');
    expect(costBasis.totalCostUsd).toBe('1250');
    expect(parseFloat(costBasis.avgPriceUsd).toFixed(2)).toBe('83.33');
  });
});
