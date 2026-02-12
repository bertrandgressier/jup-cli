import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';

// Type for parsed instruction data from Solana
export type ParsedInstructionData = Record<string, unknown> | null;

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

export interface BlockchainPort {
  getConnection(): Connection;

  // Transaction
  signTransaction(
    transaction: Transaction | VersionedTransaction,
    privateKey: string
  ): Promise<Transaction | VersionedTransaction>;

  sendTransaction(transaction: Transaction | VersionedTransaction): Promise<string>;

  confirmTransaction(signature: string): Promise<boolean>;

  // Wallet
  getBalance(address: string): Promise<number>;
  getTokenBalance(address: string, mint: string): Promise<number>;

  // Scanning
  getSignaturesForAddress(
    address: string,
    options?: { before?: string; limit?: number }
  ): Promise<SignatureInfo[]>;

  getParsedTransaction(signature: string): Promise<ParsedTransaction | null>;
}

export interface SolanaRpcPort {
  getTokenAccounts(walletAddress: string): Promise<WalletTokens>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransactionError = any;

export interface SignatureInfo {
  signature: string;
  slot: number;
  err: TransactionError | null;
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
        parsed?: ParsedInstructionData;
        accounts?: string[];
        data?: string;
      }>;
    };
    signatures: string[];
  };
  meta: {
    err: TransactionError | null;
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
