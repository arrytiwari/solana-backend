// src/transactions/transactions.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RawTransaction } from './types/raw-transaction.types';
import { ProcessedTransaction } from './types/processed-transaction.types';
import { TransactionProcessor } from './transactions.processor';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private lastSignature: string | null = null; // To keep track of the latest processed transaction

  constructor(
    private configService: ConfigService,
    private processor: TransactionProcessor,
  ) {}

  /**
   * Validates the format of the Solana wallet address.
   * @param address The wallet address to validate
   * @returns Boolean indicating validity
   */
  private validateWalletAddress(address: string): boolean {
    // Solana addresses are base58-encoded and typically 32-44 characters long
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  /**
   * Polling function to fetch new transactions periodically.
   * Scheduled using @Cron decorator.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    const walletAddress = 'EgqxBkbNczXsgBmnkQ6VyKF6qRK446UGMgWhMed1L9c6';

    const apiKey = this.configService.get<string>('HELIUS_API_KEY');
    // const pollInterval =
    //   parseInt(this.configService.get<string>('POLL_INTERVAL')) || 10000;

    if (!walletAddress) {
      this.logger.error(
        'WALLET_ADDRESS is not defined in the environment variables.',
      );
      return;
    }

    if (!this.validateWalletAddress(walletAddress)) {
      this.logger.error(
        `WALLET_ADDRESS '${walletAddress}' is not a valid Solana address.`,
      );
      return;
    }

    if (!apiKey) {
      this.logger.error(
        'HELIUS_API_KEY is not defined in the environment variables.',
      );
      return;
    }

    this.logger.debug('Polling for new transactions...');

    try {
      let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=10`;

      if (this.lastSignature) {
        url += `&before=${this.lastSignature}`;
      }

      this.logger.debug(`Request URL: ${url}`);

      const response = await axios.get<RawTransaction[]>(url);
      const transactions = response.data;

      if (transactions.length === 0) {
        this.logger.debug('No new transactions found.');
        return;
      }

      // Process each transaction
      for (const tx of transactions.reverse()) {
        // Reverse to process oldest first
        // Comprehensive validation
        if (!tx.meta) {
          this.logger.warn(
            `Transaction ${tx.signature} is missing the 'meta' field. Skipping.`,
          );
          this.logger.debug(
            `Raw Transaction Data: ${JSON.stringify(tx, null, 2)}`,
          );
          continue; // Skip processing this transaction
        }

        if (!tx.transaction || !tx.transaction.message) {
          this.logger.warn(
            `Transaction ${tx.signature} is missing essential 'transaction.message' fields. Skipping.`,
          );
          this.logger.debug(
            `Raw Transaction Data: ${JSON.stringify(tx, null, 2)}`,
          );
          continue; // Skip processing this transaction
        }

        // Proceed with normalization and processing
        const processed = this.processor.normalizeTransaction(tx);
        this.logger.debug(`Processed Transaction: ${processed.signature}`);
        this.lastSignature = processed.signature; // Update the last signature
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          `Error fetching transactions from Helius: ${axiosError.message}`,
        );
        if (axiosError.response) {
          this.logger.error(`Status: ${axiosError.response.status}`);
          this.logger.error(
            `Data: ${JSON.stringify(axiosError.response.data)}`,
          );
        }
      } else {
        this.logger.error('Unexpected error:', error);
      }
    }
  }

  /**
   * Fetch historical transactions on-demand.
   * @param limit Number of transactions to fetch
   * @param beforeSignature Fetch transactions before this signature
   * @returns Array of processed transactions
   */
  async getHistoricalTransactions(
    limit: number = 50,
    beforeSignature?: string,
  ): Promise<ProcessedTransaction[]> {
    const walletAddress = this.configService.get<string>('WALLET_ADDRESS');
    const apiKey = this.configService.get<string>('HELIUS_API_KEY');

    if (!walletAddress) {
      this.logger.error(
        'WALLET_ADDRESS is not defined in the environment variables.',
      );
      return [];
    }

    if (!this.validateWalletAddress(walletAddress)) {
      this.logger.error(
        `WALLET_ADDRESS '${walletAddress}' is not a valid Solana address.`,
      );
      return [];
    }

    if (!apiKey) {
      this.logger.error(
        'HELIUS_API_KEY is not defined in the environment variables.',
      );
      return [];
    }

    try {
      let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=${limit}`;
      if (beforeSignature) {
        url += `&before=${beforeSignature}`;
      }

      this.logger.debug(`Historical Request URL: ${url}`);

      const response = await axios.get<RawTransaction[]>(url);
      const transactions = response.data;

      const processedTransactions: ProcessedTransaction[] = [];

      for (const tx of transactions) {
        // Comprehensive validation
        if (!tx.meta) {
          this.logger.warn(
            `Transaction ${tx.signature} is missing the 'meta' field. Skipping.`,
          );
          this.logger.debug(
            `Raw Transaction Data: ${JSON.stringify(tx, null, 2)}`,
          );
          continue; // Skip processing this transaction
        }

        if (!tx.transaction || !tx.transaction.message) {
          this.logger.warn(
            `Transaction ${tx.signature} is missing essential 'transaction.message' fields. Skipping.`,
          );
          this.logger.debug(
            `Raw Transaction Data: ${JSON.stringify(tx, null, 2)}`,
          );
          continue; // Skip processing this transaction
        }

        // Proceed with normalization and processing
        const processed = this.processor.normalizeTransaction(tx);
        processedTransactions.push(processed);
      }

      return processedTransactions;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          `Error fetching historical transactions from Helius: ${axiosError.message}`,
        );
        if (axiosError.response) {
          this.logger.error(`Status: ${axiosError.response.status}`);
          this.logger.error(
            `Data: ${JSON.stringify(axiosError.response.data)}`,
          );
        }
      } else {
        this.logger.error('Unexpected error:', error);
      }
      return [];
    }
  }
}
