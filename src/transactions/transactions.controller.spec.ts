import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createRequest, createResponse } from 'node-mocks-http';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import {
  getClient,
  getDataStructure,
  getTransaction,
  resource,
} from 'test/common';
import { Transaction } from './entities/transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let transactionsService: TransactionsService;
  let transactionsController: TransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule],
      controllers: [TransactionsController],
      providers: [TransactionsService],
    })
      .overrideProvider(StorageService)
      .useValue({})
      .compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    transactionsController = module.get<TransactionsController>(
      TransactionsController,
    );
  });

  it('should be defined', () => {
    expect(transactionsController).toBeDefined();
  });

  it('should create', async () => {
    const transaction: Transaction = getTransaction(resource.transactionId);
    const transactionsServiceCreate = jest
      .spyOn(transactionsService, 'create')
      .mockResolvedValue(transaction);
    const client = getClient.valid();
    const res = createResponse();
    res.req = createRequest();
    res.req.url = '/api/v1/transactions';
    await transactionsController.create(client, res);
    expect(res.getHeader('Location')).toEqual(
      res.req.url + '/' + transaction.id,
    );
    expect(transactionsServiceCreate).toHaveBeenCalledWith(client);
    expect(transactionsServiceCreate).toHaveBeenCalledTimes(1);
  });

  it('should findOne TransactionOwner', () => {
    const { transaction } = getDataStructure();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    expect(
      transactionsController.findOne(transaction.id, getClient.valid()),
    ).resolves.toEqual(transaction);
  });

  it('should findOne ProcessOwner', () => {
    const { transaction } = getDataStructure();
    transaction.createdBy = getClient.invalid();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    expect(
      transactionsController.findOne(transaction.id, getClient.valid()),
    ).resolves.toEqual(transaction);
  });

  it('should findOne FileOwner', () => {
    const { transaction, process } = getDataStructure();
    transaction.createdBy = getClient.invalid();
    process.createdBy = getClient.invalid();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    expect(
      transactionsController.findOne(transaction.id, getClient.valid()),
    ).resolves.toEqual(transaction);
  });

  it('should not findOne NotFound', () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(undefined);
    expect(
      transactionsController.findOne(resource.transactionId, getClient.valid()),
    ).rejects.toThrow(NotFoundException);
  });

  it('should not findOne Forbidden', () => {
    const { transaction } = getDataStructure();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    expect(
      transactionsController.findOne(transaction.id, getClient.attacker()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should delete', async () => {
    const { transaction } = getDataStructure();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    const transactionsServiceDelete = jest
      .spyOn(transactionsService, 'delete')
      .mockImplementation(async () => {
        /* do nothing */
      });
    await transactionsController.delete(transaction.id, getClient.valid());
    expect(transactionsServiceDelete).toHaveBeenCalledWith(transaction);
    expect(transactionsServiceDelete).toHaveBeenCalledTimes(1);
  });

  it('should not delete NotFound', async () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(undefined);
    expect(
      transactionsController.delete(
        resource.transactionId,
        getClient.attacker(),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should not delete Forbidden', async () => {
    const { transaction } = getDataStructure();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    const transactionsServiceDelete = jest
      .spyOn(transactionsService, 'delete')
      .mockImplementation(async () => {
        /* do nothing */
      });
    expect(
      transactionsController.delete(transaction.id, getClient.attacker()),
    ).rejects.toThrow(ForbiddenException);
    expect(transactionsServiceDelete).toHaveBeenCalledTimes(0);
  });
});
