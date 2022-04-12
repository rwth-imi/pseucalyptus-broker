import { Test, TestingModule } from '@nestjs/testing';
import { deserialize } from 'class-transformer';
import * as fs from 'fs';
import * as mock from 'mock-fs';
import * as path from 'path';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Readable } from 'stream';
import {
  fileBlob,
  getClient,
  getDataStructure,
  getFile,
  getProcess,
  getTransaction,
  resource,
  transactionMetadata,
} from 'test/common';
import { StorageService } from './storage.service';

describe.each([undefined, 'data2'])('StorageService', (datadir: string) => {
  if (!datadir) datadir = 'data';
  const tpath: string = path.join(datadir, 'transactions');

  let storageService: StorageService;

  beforeEach(async () => {
    if (datadir) process.env.DATADIR = datadir;

    const tdir: string = path.join(tpath, resource.transactionId);
    const mockFs = {};
    mockFs[tdir] = {};
    mockFs[tdir]['metadata.json'] = transactionMetadata;
    mockFs[tdir][resource.processId] = {};
    mockFs[tdir][resource.processId][resource.fileId] = fileBlob;
    mock(mockFs);

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    mock.restore();
  });

  it('should be defined', () => {
    expect(storageService).toBeDefined();
  });

  it('should read initial state from fs', () => {
    const { transaction } = getDataStructure();
    expect(storageService.getTransaction(resource.transactionId)).toEqual(
      transaction,
    );
  });

  it('should get ACL Transactions', () => {
    const { transaction } = getDataStructure();
    const map = new Map<string, Transaction>();
    map.set(resource.transactionId, transaction);
    expect(storageService.getAclTransactions(getClient.valid().domain)).toEqual(
      map,
    );
    expect(
      storageService.getAclTransactions(getClient.invalid().domain),
    ).toEqual(new Map<string, Transaction>());
  });

  it('should set transaction', async () => {
    const { transaction } = getDataStructure();
    const transactionId = 'eb87bf97-eb5e-4f36-9da8-8e708aea8b28';
    await storageService.setTransaction(transactionId, transaction);
    expect(
      fs.promises.access(path.join(tpath, transactionId)),
    ).resolves.not.toThrowError();
    expect(
      JSON.parse(
        (
          await fs.promises.readFile(
            path.join(tpath, transactionId, 'metadata.json'),
          )
        ).toString('utf-8'),
      ),
    ).toEqual(JSON.parse(transactionMetadata));
  });

  it('should delete transaction', async () => {
    await storageService.deleteTransaction(resource.transactionId);
    expect(
      fs.promises.access(path.join(tpath, resource.transactionId)),
    ).rejects.toThrowError();
  });

  it('should create file', async () => {
    await storageService.setFile(
      resource.transactionId,
      resource.processId,
      resource.fileId,
      Readable.from('This is some file blob.'),
    );
    expect(
      (
        await fs.promises.readFile(
          path.join(
            tpath,
            resource.transactionId,
            resource.processId,
            resource.fileId,
          ),
        )
      ).toString('utf-8'),
    ).toEqual('This is some file blob.');
  });

  it('should get file', async () => {
    expect(
      (
        await storageService.getFile(
          resource.transactionId,
          resource.processId,
          resource.fileId,
        )
      ).toString('utf-8'),
    ).toEqual('FILE BLOB!');
  });

  it('should be URI encoded', async () => {
    const id = ['transaction', 'process', 'file'].map(
      (v) => 'some ' + v + '/id',
    );
    const file = getFile(id[2]);
    const process = getProcess([{ fileId: id[2], file }]);
    const transaction = getTransaction([{ processId: id[1], process }]);
    await storageService.setTransaction(id[0], transaction);
    await storageService.setFile(id[0], id[1], id[2], Readable.from(fileBlob));
    expect(
      deserialize<Transaction>(
        Transaction,
        (
          await fs.promises.readFile(
            path.join(tpath, encodeURIComponent(id[0]), 'metadata.json'),
          )
        ).toString('utf-8'),
      ),
    ).toMatchObject(transaction);
    expect(
      fs.promises.access(
        path.join(
          tpath,
          encodeURIComponent(id[0]),
          encodeURIComponent(id[1]),
          encodeURIComponent(id[2]),
        ),
      ),
    ).resolves.not.toThrowError();
  });
});
