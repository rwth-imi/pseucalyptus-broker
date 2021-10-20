import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as mock from 'mock-fs';
import * as path from 'path';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Readable } from 'stream';
import {
  fileBlob,
  getDataStructure,
  getTransaction,
  resource,
  transactionMetadata,
} from 'test/common';
import { StorageService } from './storage.service';

describe.each([undefined, 'data2'])('StorageService', (datadir: string) => {
  const tpath: string = path.join(datadir ? datadir : 'data', 'transactions');

  let storageService: StorageService;

  beforeEach(async () => {
    if (datadir) process.env.DATADIR = datadir;

    const tdir: string = path.join(
      tpath,
      '6f1dfa65-f92f-4c83-94ce-c2c2e5c3d79c',
    );
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
    expect(storageService.getTransaction(transaction.id)).toEqual(transaction);
  });

  it('should set transaction', async () => {
    const { transaction } = getDataStructure();
    transaction.id = 'eb87bf97-eb5e-4f36-9da8-8e708aea8b28';
    await storageService.setTransaction(transaction);
    expect(
      fs.promises.access(
        path.join(tpath, 'eb87bf97-eb5e-4f36-9da8-8e708aea8b28'),
      ),
    ).resolves.not.toThrowError();
    expect(
      JSON.parse(
        (
          await fs.promises.readFile(
            path.join(
              tpath,
              'eb87bf97-eb5e-4f36-9da8-8e708aea8b28',
              'metadata.json',
            ),
          )
        ).toString('utf-8'),
      ),
    ).toEqual(JSON.parse(transactionMetadata));
  });

  it('should delete transaction', async () => {
    const transaction: Transaction = getTransaction(
      '6f1dfa65-f92f-4c83-94ce-c2c2e5c3d79c',
    );
    await storageService.deleteTransaction(transaction);
    expect(
      fs.promises.access(
        path.join(tpath, '6f1dfa65-f92f-4c83-94ce-c2c2e5c3d79c'),
      ),
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
});
