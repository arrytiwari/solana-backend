import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionProcessor } from './transactions.processor';
@Module({
  providers: [TransactionsService, TransactionProcessor],
  // eslint-disable-next-line prettier/prettier
  controllers: [TransactionsController]
})
export class TransactionsModule {}
