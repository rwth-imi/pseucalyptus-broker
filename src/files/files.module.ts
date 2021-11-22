import { Module } from '@nestjs/common';
import { ProcessesModule } from 'src/processes/processes.module';
import { StorageModule } from 'src/storage/storage.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { FilesListingController } from './files-listing.controller';
import { FilesController } from './files.controller';
import { FilesGateway } from './files.gateway';
import { FilesService } from './files.service';

@Module({
  imports: [StorageModule, ProcessesModule, TransactionsModule],
  controllers: [FilesController, FilesListingController],
  providers: [FilesService, FilesGateway],
  exports: [FilesService],
})
export class FilesModule {}
