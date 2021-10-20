import { Module } from '@nestjs/common';
import { ProcessesModule } from 'src/processes/processes.module';
import { StorageModule } from 'src/storage/storage.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [StorageModule, ProcessesModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
