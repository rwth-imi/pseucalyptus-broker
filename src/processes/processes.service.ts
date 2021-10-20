import { Injectable } from '@nestjs/common';
import { Client } from 'src/clients/entities/client.entity';
import { File } from 'src/files/entities/file.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Process } from './entities/process.entity';

@Injectable()
export class ProcessesService {
  constructor(private readonly transactionsService: TransactionsService) {}

  async create(
    transactionId: string,
    processId: string,
    createdBy: Client,
  ): Promise<void> {
    const process: Process = new Process();
    process.createdAt = new Date();
    process.createdBy = createdBy;
    this.transactionsService.setProcess(transactionId, processId, process);
  }

  findOne(transactionId: string, processId: string): Process {
    return this.transactionsService
      .findOne(transactionId)
      .processes.get(processId);
  }

  async setFile(
    transactionId: string,
    processId: string,
    fileId: string,
    file: File,
  ) {
    const process: Process = this.findOne(transactionId, processId);
    process.files.set(fileId, file);
    this.transactionsService.setProcess(transactionId, processId, process);
  }
}
