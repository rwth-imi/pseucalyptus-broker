import { Injectable } from '@nestjs/common';
import { deserialize, serialize } from 'class-transformer';
import * as fs from 'fs';
import * as path from 'path';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Stream } from 'stream';

@Injectable()
export class StorageService {
  private readonly transactions = new Map<string, Transaction>();
  /*private readonly clients = new Map<string, Client>();

  private readonly clientsDir = path.join('data', 'clients');
  private readonly clientMetadataPath = (clientId: string) => path.join(this.clientsDir, clientId + '.json');*/

  private readonly transactionsDir = path.join(
    process.env.DATADIR ? process.env.DATADIR : 'data',
    'transactions',
  );
  private readonly transactionPath = (transactionId: string) =>
    path.join(this.transactionsDir, transactionId);
  private readonly transactionMetadataPath = (transactionId: string) =>
    path.join(this.transactionPath(transactionId), 'metadata.json');
  private readonly processPath = (transactionId: string, processId: string) =>
    path.join(this.transactionPath(transactionId), processId);
  private readonly filePath = (
    transactionId: string,
    processId: string,
    fileId: string,
  ) => path.join(this.processPath(transactionId, processId), fileId);

  constructor() {
    fs.mkdirSync(this.transactionsDir, { recursive: true });
    const transactionIds: string[] = fs
      .readdirSync(this.transactionsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    transactionIds.forEach((transactionId) => {
      const transaction: Transaction = deserialize<Transaction>(
        Transaction,
        fs.readFileSync(this.transactionMetadataPath(transactionId)).toString(),
      );
      transaction.id = transactionId;
      transaction.processes.forEach((process, processId) => {
        process.id = processId;
        process.files.forEach((file, fileId) => {
          file.id = fileId;
        });
      });
      this.transactions.set(transaction.id, transaction);
    });
  }

  async setTransaction(transaction: Transaction) {
    this.transactions.set(transaction.id, transaction);
    await fs.promises.mkdir(this.transactionPath(transaction.id), {
      recursive: true,
    });
    await fs.promises.writeFile(
      this.transactionMetadataPath(transaction.id),
      serialize<Transaction>(transaction, { enableCircularCheck: true }),
    );
  }

  getTransaction(transactionId: string): Transaction {
    return this.transactions.get(transactionId);
  }

  async deleteTransaction(transaction: Transaction): Promise<void> {
    this.transactions.delete(transaction.id);
    await fs.promises.rm(this.transactionPath(transaction.id), {
      recursive: true,
    });
  }

  async setFile(
    transactionId: string,
    processId: string,
    fileId: string,
    file: Stream,
  ): Promise<void> {
    await fs.promises.mkdir(this.processPath(transactionId, processId), {
      recursive: true,
    });
    const ws: fs.WriteStream = fs.createWriteStream(
      this.filePath(transactionId, processId, fileId),
    );
    file.pipe(ws);
  }

  async getFile(
    transactionId: string,
    processId: string,
    fileId: string,
  ): Promise<Buffer> {
    return fs.promises.readFile(
      this.filePath(transactionId, processId, fileId),
    );
  }
}
