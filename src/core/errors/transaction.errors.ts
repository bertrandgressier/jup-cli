export class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class TransactionFailedError extends TransactionError {
  constructor(signature: string, reason?: string) {
    super(`Transaction failed: ${reason || 'Unknown error'}`, 'TRANSACTION_FAILED', {
      signature,
      reason,
    });
    this.name = 'TransactionFailedError';
  }
}

export class InsufficientFundsError extends TransactionError {
  constructor(token: string, required: number, available: number) {
    super(
      `Insufficient funds: required ${required} ${token}, available ${available} ${token}`,
      'INSUFFICIENT_FUNDS',
      { token, required, available }
    );
    this.name = 'InsufficientFundsError';
  }
}

export class SlippageExceededError extends TransactionError {
  constructor(expected: number, actual: number) {
    super(`Slippage exceeded: expected ${expected}%, actual ${actual}%`, 'SLIPPAGE_EXCEEDED', {
      expected,
      actual,
    });
    this.name = 'SlippageExceededError';
  }
}
