import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { ProcessesModule } from './processes/processes.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [TransactionsModule, ProcessesModule, FilesModule],
})
export class AppModule {}
