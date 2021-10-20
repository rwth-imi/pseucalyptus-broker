import { Injectable } from '@nestjs/common';
import { Client } from 'src/clients/entities/client.entity';
import { Process } from 'src/processes/entities/process.entity';
import { StorageService } from 'src/storage/storage.service';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from './entities/transaction.entity';
import { TransactionsGateway } from './transactions.gateway';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly storageService: StorageService,
    private readonly transactionsGateway: TransactionsGateway,
  ) {}

  async create(createdBy: Client): Promise<string> {
    let transactionId: string;
    const transaction = new Transaction();
    do {
      transactionId = uuidv4();
    } while (this.findOne(transactionId));
    transaction.createdBy = createdBy;
    transaction.createdAt = new Date();
    await this.storageService.setTransaction(transactionId, transaction);
    return transactionId;
  }

  findFiltered(
    requestedBy: Client,
    onlyWithoutProcesses: Array<string>,
  ): Map<string, Transaction> {
    const ts: Map<string, Transaction> = new Map<string, Transaction>();
    this.storageService
      .getAclTransactions(requestedBy.domain)
      .forEach((value, key) => {
        if (
          !Array.from(value.processes.keys()).every((v) =>
            onlyWithoutProcesses.includes(v),
          )
        )
          ts.set(key, value);
      });
    return ts;
  }

  findOne(transactionId: string): Transaction {
    return this.storageService.getTransaction(transactionId);
  }

  async delete(transactionId: string): Promise<void> {
    await this.storageService.deleteTransaction(transactionId);
  }

  async setProcess(
    transactionId: string,
    processId: string,
    process: Process,
  ): Promise<void> {
    const transaction: Transaction = this.findOne(transactionId);
    transaction.processes.set(processId, process);
    await this.storageService.setTransaction(transactionId, transaction);
    this.transactionsGateway.emit(transactionId, transaction);
  }
}
