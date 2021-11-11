import { Injectable } from '@nestjs/common';
import { ProcessesService } from 'src/processes/processes.service';
import { StorageService } from 'src/storage/storage.service';
import { Stream } from 'stream';
import { File } from './entities/file.entity';
import { FilesGateway } from './files.gateway';

@Injectable()
export class FilesService {
  constructor(
    private readonly storageService: StorageService,
    private readonly processesService: ProcessesService,
    private readonly filesGateway: FilesGateway,
  ) {}

  async create(
    transactionId: string,
    processId: string,
    fileId: string,
    fileName: string,
    accessableBy: string[],
    mime: string,
    file: Stream,
  ): Promise<void> {
    const f: File = new File();
    f.name = fileName;
    f.accessableBy = accessableBy;
    f.createdAt = new Date();
    f.mime = mime;
    await this.storageService.setFile(transactionId, processId, fileId, file);
    await this.processesService.setFile(transactionId, processId, fileId, f);
    this.filesGateway.emit(transactionId, processId, fileId, f);
  }

  findOne(transactionId: string, processId: string, fileId: string): File {
    return this.processesService
      .findOne(transactionId, processId)
      .files.get(fileId);
  }

  async getBlob(
    transactionId: string,
    processId: string,
    fileId: string,
  ): Promise<Buffer> {
    return this.storageService.getFile(transactionId, processId, fileId);
  }
}
