// src/transactions/transactions.controller.ts

import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ProcessedTransaction } from './types/processed-transaction.types';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Endpoint to retrieve historical transactions.
   * Example: GET /transactions/history?limit=20&beforeSignature=abc123
   */
  @Get('history')
  async getHistory(
    @Query('limit') limit: string,
    @Query('beforeSignature') beforeSignature: string,
  ): Promise<ProcessedTransaction[]> {
    const parsedLimit = limit ? parseInt(limit) : 50;

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException(
        'Invalid limit parameter. It must be a positive integer.',
      );
    }

    return this.transactionsService.getHistoricalTransactions(
      parsedLimit,
      beforeSignature,
    );
  }
}
