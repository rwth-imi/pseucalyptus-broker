import { Test, TestingModule } from '@nestjs/testing';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { TransactionsService } from './transactions.service';
import { v4 as uuidv4 } from 'uuid';
import {
  getClient,
  getDataStructure,
  getProcess,
  getTransaction,
  resource,
} from 'test/common';
import { Transaction } from './entities/transaction.entity';
import { Process } from 'src/processes/entities/process.entity';
import { TransactionsGateway } from './transactions.gateway';
jest.mock('uuid');

describe('TransactionsService', () => {
  let storageService: StorageService;
  let transactionsService: TransactionsService;
  let transactionsGateway: TransactionsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule],
      providers: [TransactionsService, TransactionsGateway],
    })
      .overrideProvider(StorageService)
      .useValue({
        getTransaction: jest.fn(),
        getAclTransactions: jest.fn(),
        setTransaction: jest.fn(),
        deleteTransaction: jest.fn(),
      })
      .compile();

    storageService = module.get<StorageService>(StorageService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    transactionsGateway = module.get<TransactionsGateway>(TransactionsGateway);
  });

  it('should be defined', () => {
    expect(transactionsService).toBeDefined();
  });

  it('should create', async () => {
    const transaction: Transaction = getTransaction();
    uuidv4.mockReturnValue(resource.transactionId);
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
      resource.transactionId,
    );
    expect(storageServiceSetTransaction).toHaveBeenCalledWith(
      resource.transactionId,
      transaction,
    );
    expect(storageServiceSetTransaction).toHaveBeenCalledTimes(1);
  });

  it('should findMy', () => {
    const map = new Map<string, Transaction>();
    map.set(resource.transactionId, getDataStructure().transaction);
    jest.spyOn(storageService, 'getAclTransactions').mockReturnValue(map);
    expect(
      transactionsService.findFiltered(getClient.valid(), ['noPID']),
    ).toEqual(map);
    expect(
      transactionsService.findFiltered(getClient.valid(), ['PID']),
    ).toEqual(new Map<string, Transaction>());
  });

  it('should findOne', () => {
    jest
      .spyOn(storageService, 'getTransaction')
      .mockReturnValue(getTransaction());
    expect(transactionsService.findOne(resource.transactionId)).toEqual(
      getTransaction(),
    );
  });

  it('should delete', async () => {
    const storageServiceDeleteTransaction = jest
      .spyOn(storageService, 'deleteTransaction')
      .mockReturnValue(undefined);
    await transactionsService.delete(resource.transactionId);
    expect(storageServiceDeleteTransaction).toHaveBeenCalledWith(
      resource.transactionId,
    );
    expect(storageServiceDeleteTransaction).toHaveBeenCalledTimes(1);
  });

  it('should setProcess', async () => {
    const transaction: Transaction = getTransaction();
    const process: Process = getProcess();
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
    const transactionsGatewayEmit = jest
      .spyOn(transactionsGateway, 'emit')
      .mockImplementation(() => {
        /* do nothing */
      });
    await transactionsService.setProcess(
      resource.transactionId,
      resource.processId,
      process,
    );
    expect(storageServiceSetTransaction).toHaveBeenCalledWith(
      resource.transactionId,
      transaction,
    );
    expect(storageServiceSetTransaction).toHaveBeenCalledTimes(1);
    expect(transactionProcessesSet).toHaveBeenCalledWith(
      resource.processId,
      process,
    );
    expect(transactionProcessesSet).toHaveBeenCalledTimes(1);
    expect(transactionsGatewayEmit).toHaveBeenCalledWith(
      resource.transactionId,
      transaction,
    );
    expect(transactionsGatewayEmit).toHaveBeenCalledTimes(1);
  });
});
