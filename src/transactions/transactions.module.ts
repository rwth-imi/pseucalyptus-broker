import { Module } from '@nestjs/common';
import { StorageModule } from 'src/storage/storage.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsGateway } from './transactions.gateway';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [StorageModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsGateway],
  exports: [TransactionsService],
})
export class TransactionsModule {}
