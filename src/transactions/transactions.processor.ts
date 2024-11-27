// src/transactions/transactions.processor.ts

import { Injectable, Logger } from '@nestjs/common';
import { RawTransaction } from './types/raw-transaction.types';
import { ProcessedTransaction } from './types/processed-transaction.types';

@Injectable()
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  /**
   * Normalizes raw transaction data into a processed format.
   * @param tx RawTransaction object
   * @returns ProcessedTransaction object
   */
  normalizeTransaction(tx: RawTransaction): ProcessedTransaction {
    const status = tx.meta?.err ? 'failed' : 'success';
    const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : null;

    const memoInstruction = tx.transaction?.message?.instructions.find(
      (instr) => instr.parsed?.type === 'memo',
    );

    const transferInstruction = tx.transaction?.message?.instructions.find(
      (instr) => instr.parsed?.type === 'transfer',
    );

    const memo = memoInstruction?.parsed?.info?.memo || null;
    const sourceAddress = tx.transaction?.message?.accountKeys[0] || null;
    const destinationAddress = tx.transaction?.message?.accountKeys[1] || null;
    const amount = transferInstruction?.parsed?.info?.lamports || null;

    const processed: ProcessedTransaction = {
      signature: tx.signature,
      slot: tx.slot,
      blockTime,
      fee: tx.meta?.fee || null,
      status,
      memo,
      sourceAddress,
      destinationAddress,
      amount,
    };

    this.logger.debug(`Normalized Transaction: ${processed.signature}`);

    return processed;
  }
}
