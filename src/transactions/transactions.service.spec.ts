import { Test, TestingModule } from '@nestjs/testing';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { TransactionsService } from './transactions.service';
import { v4 as uuidv4 } from 'uuid';
import { getClient, getProcess, getTransaction, resource } from 'test/common';
import { Transaction } from './entities/transaction.entity';
import { Process } from 'src/processes/entities/process.entity';
jest.mock('uuid');

describe('TransactionsService', () => {
  let storageService: StorageService;
  let transactionsService: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule],
      providers: [TransactionsService],
    })
      .overrideProvider(StorageService)
      .useValue({
        getTransaction: jest.fn(),
        setTransaction: jest.fn(),
        deleteTransaction: jest.fn(),
      })
      .compile();

    storageService = module.get<StorageService>(StorageService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(transactionsService).toBeDefined();
  });

  it('should create', async () => {
    const transaction: Transaction = getTransaction(resource.transactionId);
    uuidv4.mockReturnValue(transaction.id);
    jest
      .useFakeTimers('modern')
      .setSystemTime(new Date('2011-06-06T18:00:00.000Z').getTime());
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(undefined);
    const storageServiceSetTransaction = jest
      .spyOn(storageService, 'setTransaction')
      .mockImplementation(async () => {
        /* do nothing */
      });
    expect(transactionsService.create(getClient.valid())).resolves.toEqual(
      transaction,
    );
    expect(storageServiceSetTransaction).toHaveBeenCalledWith(transaction);
    expect(storageServiceSetTransaction).toHaveBeenCalledTimes(1);
  });

  it('should findOne', () => {
    jest
      .spyOn(storageService, 'getTransaction')
      .mockImplementation(getTransaction);
    expect(transactionsService.findOne(resource.transactionId)).toEqual(
      getTransaction(resource.transactionId),
    );
  });

  it('should delete', async () => {
    const storageServiceDeleteTransaction = jest
      .spyOn(storageService, 'deleteTransaction')
      .mockReturnValue(undefined);
    const transaction: Transaction = getTransaction(resource.transactionId);
    await transactionsService.delete(transaction);
    expect(storageServiceDeleteTransaction).toHaveBeenCalledWith(transaction);
    expect(storageServiceDeleteTransaction).toHaveBeenCalledTimes(1);
  });

  it('should setProcess', async () => {
    const transaction: Transaction = getTransaction(resource.transactionId);
    const process: Process = getProcess(transaction.id, resource.processId);
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    const storageServiceSetTransaction = jest
      .spyOn(storageService, 'setTransaction')
      .mockImplementation(async () => {
        /* do nothing */
      });
    const transactionProcessesSet = jest
      .spyOn(transaction.processes, 'set')
      .mockImplementation(() => {
        return null;
      });
    await transactionsService.setProcess(transaction.id, process);
    expect(storageServiceSetTransaction).toHaveBeenCalledWith(transaction);
    expect(storageServiceSetTransaction).toHaveBeenCalledTimes(1);
    expect(transactionProcessesSet).toHaveBeenCalledWith(process.id, process);
    expect(transactionProcessesSet).toHaveBeenCalledTimes(1);
  });
});
