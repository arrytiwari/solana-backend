// src/transactions/types/processed-transaction.types.ts
export interface ProcessedTransaction {
  signature: string;
  slot: number;
  blockTime: Date | null;
  fee: number | null;
  status: 'success' | 'failed';
  memo: string | null;
  sourceAddress: string | null;
  destinationAddress: string | null;
  amount: number | null; // in lamports
}
