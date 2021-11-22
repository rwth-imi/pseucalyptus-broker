import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createRequest, createResponse } from 'node-mocks-http';
import { Client } from 'src/clients/entities/client.entity';
import { Process } from 'src/processes/entities/process.entity';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { getClient, getDataStructure, resource } from 'test/common';
import { Transaction } from './entities/transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsGateway } from './transactions.gateway';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let transactionsService: TransactionsService;
  let transactionsController: TransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule],
      controllers: [TransactionsController],
      providers: [TransactionsService, TransactionsGateway],
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
    const transactionsServiceCreate = jest
      .spyOn(transactionsService, 'create')
      .mockResolvedValue(resource.transactionId);
    const client = getClient.valid();
    const res = createResponse();
    res.req = createRequest();
    res.req.url = '/api/v1/transactions';
    await transactionsController.create(client, res);
    expect(res.getHeader('Location')).toEqual(
      res.req.url + '/' + resource.transactionId,
    );
    expect(transactionsServiceCreate).toHaveBeenCalledWith(client);
    expect(transactionsServiceCreate).toHaveBeenCalledTimes(1);
  });

  describe('should findMy', () => {
    let client: Client;
    let map: Map<string, Transaction>;
    let transactionsServiceFindFiltered;

    beforeEach(() => {
      client = getClient.valid();
      map = new Map<string, Transaction>();
      map.set(resource.transactionId, getDataStructure().transaction);
      transactionsServiceFindFiltered = jest
        .spyOn(transactionsService, 'findFiltered')
        .mockReturnValue(map);
    });

    afterEach(() => {
      expect(transactionsServiceFindFiltered).toHaveBeenCalledTimes(1);
    });

    it('without filter', () => {
      expect(transactionsController.findMy(client)).resolves.toEqual(map);
      expect(transactionsServiceFindFiltered).toHaveBeenCalledWith(client, []);
    });

    it('filter set', () => {
      expect(transactionsController.findMy(client, 'noPID')).resolves.toEqual(map);
      expect(transactionsServiceFindFiltered).toHaveBeenCalledWith(client, ['noPID']);
    });
  });

  describe('findOne', () => {
    let transaction: Transaction, process: Process;

    beforeEach(() => {
      ({ transaction, process } = getDataStructure());
      jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    });

    describe('should findOne as', () => {
      afterEach(() => {
        expect(
          transactionsController.findOne(
            resource.transactionId,
            getClient.valid(),
          ),
        ).resolves.toEqual(transaction);
      });

      it('TransactionOwner', () => {
        /* Nothing todo */
      });

      it('should findOne ProcessOwner', () => {
        transaction.createdBy = getClient.invalid();
      });

      it('should findOne FileOwner', () => {
        transaction.createdBy = getClient.invalid();
        process.createdBy = getClient.invalid();
      });
    });

    it('should not findOne NotFound', () => {
      jest.spyOn(transactionsService, 'findOne').mockReturnValue(undefined);
      expect(
        transactionsController.findOne(
          resource.transactionId,
          getClient.valid(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not findOne Forbidden', () => {
      expect(
        transactionsController.findOne(
          resource.transactionId,
          getClient.attacker(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  it('should delete', async () => {
    const { transaction } = getDataStructure();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    const transactionsServiceDelete = jest
      .spyOn(transactionsService, 'delete')
      .mockImplementation(async () => {
        /* do nothing */
      });
    await transactionsController.delete(
      resource.transactionId,
      getClient.valid(),
    );
    expect(transactionsServiceDelete).toHaveBeenCalledWith(
      resource.transactionId,
    );
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
      transactionsController.delete(
        resource.transactionId,
        getClient.attacker(),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(transactionsServiceDelete).toHaveBeenCalledTimes(0);
  });
});
