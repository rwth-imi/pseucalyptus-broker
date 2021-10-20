import { Injectable } from '@nestjs/common';
import { Client } from 'src/clients/entities/client.entity';
import { Process } from 'src/processes/entities/process.entity';
import { StorageService } from 'src/storage/storage.service';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(private readonly storageService: StorageService) {}

  async create(createdBy: Client): Promise<Transaction> {
    const transaction = new Transaction();
    do {
      transaction.id = uuidv4();
    } while (this.findOne(transaction.id));
    transaction.createdBy = createdBy;
    transaction.createdAt = new Date();
    await this.storageService.setTransaction(transaction);
    return transaction;
  }

  findOne(transactionId: string): Transaction {
    return this.storageService.getTransaction(transactionId);
  }

  async delete(transaction: Transaction): Promise<void> {
    await this.storageService.deleteTransaction(transaction);
  }

  async setProcess(transactionId: string, process: Process): Promise<void> {
    const transaction: Transaction = this.findOne(transactionId);
    transaction.processes.set(process.id, process);
    await this.storageService.setTransaction(transaction);
  }
}
