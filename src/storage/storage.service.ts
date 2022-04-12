import { Injectable } from '@nestjs/common';
import { deserialize, serialize } from 'class-transformer';
import * as fs from 'fs';
import * as path from 'path';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Stream } from 'stream';

@Injectable()
export class StorageService {
  private readonly transactions: Map<string, Transaction> = new Map<
    string,
    Transaction
  >();
  private readonly acl: Map<string, Map<string, Transaction>> = new Map<
    string,
    Map<string, Transaction>
  >();

  private readonly transactionsDir;
  private readonly transactionPath = (transactionId: string) =>
    path.join(this.transactionsDir, encodeURIComponent(transactionId));
  private readonly transactionMetadataPath = (transactionId: string) =>
    path.join(this.transactionPath(transactionId), 'metadata.json');
  private readonly processPath = (transactionId: string, processId: string) =>
    path.join(
      this.transactionPath(transactionId),
      encodeURIComponent(processId),
    );
  private readonly filePath = (
    transactionId: string,
    processId: string,
    fileId: string,
  ) =>
    path.join(
      this.processPath(transactionId, processId),
      encodeURIComponent(fileId),
    );

  constructor() {
    let datadir;
    if (process.env.DATADIR) datadir = process.env.DATADIR;
    else datadir = 'data';
    this.transactionsDir = path.join(datadir, 'transactions');
    fs.mkdirSync(this.transactionsDir, { recursive: true });
    const transactionIds: string[] = fs
      .readdirSync(this.transactionsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => decodeURIComponent(dirent.name));
    transactionIds.forEach((transactionId) => {
      const transaction: Transaction = deserialize<Transaction>(
        Transaction,
        fs.readFileSync(this.transactionMetadataPath(transactionId)).toString(),
      );
      this.cacheTransaction(transactionId, transaction);
    });
  }

  private cacheTransaction(
    transactionId: string,
    transaction: Transaction,
  ): void {
    transaction.processes.forEach((process) => {
      process.files.forEach((file) => {
        file.accessableBy.forEach((domain: string) => {
          let aclMap: Map<string, Transaction>;
          if (this.acl.has(domain)) aclMap = this.acl.get(domain);
          else aclMap = new Map<string, Transaction>();
          aclMap.set(transactionId, transaction);
          this.acl.set(domain, aclMap);
        });
      });
    });
    this.transactions.set(transactionId, transaction);
  }

  async setTransaction(transactionId: string, transaction: Transaction) {
    this.cacheTransaction(transactionId, transaction);
    await fs.promises.mkdir(this.transactionPath(transactionId), {
      recursive: true,
    });
    await fs.promises.writeFile(
      this.transactionMetadataPath(transactionId),
      serialize<Transaction>(transaction, { enableCircularCheck: true }),
    );
  }

  getTransaction(transactionId: string): Transaction {
    return this.transactions.get(transactionId);
  }

  getAclTransactions(domain: string): Map<string, Transaction> {
    const t = this.acl.get(domain);
    if (t) return t;
    else return new Map<string, Transaction>();
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    this.transactions.delete(transactionId);
    await fs.promises.rm(this.transactionPath(transactionId), {
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
