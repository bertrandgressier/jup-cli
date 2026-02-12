import Big from 'big.js';

export class CostBasis {
  private _avgPriceUsd: Big;
  private _totalAcquired: Big;
  private _totalCostUsd: Big;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly mint: string,
    avgPriceUsd: string,
    totalAcquired: string,
    totalCostUsd: string,
    public readonly symbol?: string,
    updatedAt: Date = new Date()
  ) {
    this._avgPriceUsd = new Big(avgPriceUsd || '0');
    this._totalAcquired = new Big(totalAcquired || '0');
    this._totalCostUsd = new Big(totalCostUsd || '0');
    this._updatedAt = updatedAt;
  }

  get avgPriceUsd(): string {
    return this._avgPriceUsd.toString();
  }

  get totalAcquired(): string {
    return this._totalAcquired.toString();
  }

  get totalCostUsd(): string {
    return this._totalCostUsd.toString();
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  calculateUnrealizedPnl(
    currentAmount: string,
    currentPrice: string
  ): { pnl: string; pnlPercent: string } {
    const amount = new Big(currentAmount);
    const price = new Big(currentPrice);

    const currentValue = amount.times(price);
    const costBasis = amount.times(this._avgPriceUsd);
    const pnl = currentValue.minus(costBasis);

    let pnlPercent = new Big('0');
    if (costBasis.gt(new Big('0'))) {
      pnlPercent = pnl.div(costBasis).times(100);
    }

    return {
      pnl: pnl.toFixed(6),
      pnlPercent: pnlPercent.toFixed(2),
    };
  }

  addAcquisition(amount: string, priceUsd: string): void {
    const amountBig = new Big(amount);
    const priceBig = new Big(priceUsd);

    const newTotal = this._totalAcquired.plus(amountBig);
    const newCost = this._totalCostUsd.plus(amountBig.times(priceBig));

    this._totalAcquired = newTotal;
    this._totalCostUsd = newCost;

    if (newTotal.gt(new Big('0'))) {
      this._avgPriceUsd = newCost.div(newTotal);
    } else {
      this._avgPriceUsd = new Big('0');
    }

    this._updatedAt = new Date();
  }
}
