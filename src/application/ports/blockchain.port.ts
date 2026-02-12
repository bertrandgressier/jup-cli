export interface TokenAccount {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
}

export interface WalletTokens {
  address: string;
  solBalance: number;
  tokens: TokenAccount[];
}

export interface SolanaRpcPort {
  getTokenAccounts(walletAddress: string): Promise<WalletTokens>;
}

export interface SignatureInfo {
  signature: string;
  slot: number;
  err: unknown;
  memo: string | null;
  blockTime?: number;
  confirmationStatus?: string;
}

export interface ParsedTransaction {
  slot: number;
  transaction: {
    message: {
      accountKeys: Array<{
        pubkey: string;
        signer: boolean;
        writable: boolean;
      }>;
      instructions: Array<{
        programId: string;
        parsed?: Record<string, unknown> | null;
        accounts?: string[];
        data?: string;
      }>;
    };
    signatures: string[];
  };
  meta: {
    err: unknown;
    fee: number;
    preBalances: number[];
    postBalances: number[];
    preTokenBalances?: Array<{
      accountIndex: number;
      mint: string;
      uiTokenAmount: {
        amount: string;
        decimals: number;
        uiAmount: number;
      };
    }>;
    postTokenBalances?: Array<{
      accountIndex: number;
      mint: string;
      uiTokenAmount: {
        amount: string;
        decimals: number;
        uiAmount: number;
      };
    }>;
    logMessages: string[];
  } | null;
  blockTime: number | null;
}
