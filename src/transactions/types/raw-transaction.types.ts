// src/transactions/types/raw-transaction.types.ts

export interface RawTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  meta?: {
    // Make meta optional
    fee: number;
    err: any;
    preBalances: number[];
    postBalances: number[];
    innerInstructions: any[];
    logMessages: string[];
  };
  transaction?: {
    // Make transaction optional
    message?: {
      // Make message optional
      accountKeys: string[];
      instructions: Array<{
        program: string;
        parsed?: {
          // Make parsed optional
          type: string;
          info: any;
        };
      }>;
      recentBlockhash: string;
    };
    signatures: string[];
  };
}
