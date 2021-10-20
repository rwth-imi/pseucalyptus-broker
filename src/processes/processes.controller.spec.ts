import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from 'src/storage/storage.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { TransactionsService } from 'src/transactions/transactions.service';
import { getClient, getDataStructure } from 'test/common';
import { Process } from './entities/process.entity';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';

describe('ProcessesController', () => {
  let transactionsService: TransactionsService;
  let processesService: ProcessesService;
  let processesController: ProcessesController;

  let transaction: Transaction, process: Process;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TransactionsModule],
      controllers: [ProcessesController],
      providers: [ProcessesService],
    })
      .overrideProvider(StorageService)
      .useValue({})
      .compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    processesService = module.get<ProcessesService>(ProcessesService);
    processesController = module.get<ProcessesController>(ProcessesController);

    ({ transaction, process } = getDataStructure());
  });

  it('should be defined', () => {
    expect(processesController).toBeDefined();
  });

  it('should create TransactionOwner', async () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    const processesServiceCreate = jest
      .spyOn(processesService, 'create')
      .mockImplementation(async () => {
        /* do nothing */
      });
    await processesController.create(
      transaction.id,
      process.id,
      getClient.valid(),
    );
    expect(processesServiceCreate).toHaveBeenCalledWith(
      transaction.id,
      process.id,
      getClient.valid(),
    );
    expect(processesServiceCreate).toHaveBeenCalledTimes(1);
  });

  it('should create FileOwner', async () => {
    transaction.createdBy = getClient.invalid();
    process.createdBy = getClient.invalid();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    const processesServiceCreate = jest
      .spyOn(processesService, 'create')
      .mockImplementation(async () => {
        /* do nothing */
      });
    await processesController.create(
      transaction.id,
      process.id,
      getClient.valid(),
    );
    expect(processesServiceCreate).toHaveBeenCalledWith(
      transaction.id,
      process.id,
      getClient.valid(),
    );
    expect(processesServiceCreate).toHaveBeenCalledTimes(1);
  });

  it('should not create NotFound', () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(undefined);
    const processesServiceCreate = jest
      .spyOn(processesService, 'create')
      .mockImplementation(async () => {
        /* do nothing */
      });
    expect(
      processesController.create(transaction.id, process.id, getClient.valid()),
    ).rejects.toThrow(NotFoundException);
    expect(processesServiceCreate).toHaveBeenCalledTimes(0);
  });

  it('should not create Forbidden', () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    const processesServiceCreate = jest
      .spyOn(processesService, 'create')
      .mockImplementation(async () => {
        /* do nothing */
      });
    expect(
      processesController.create(
        transaction.id,
        process.id,
        getClient.attacker(),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(processesServiceCreate).toHaveBeenCalledTimes(0);
  });

  it('should findOne TransactionOwner', () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    expect(
      processesController.findOne(
        transaction.id,
        process.id,
        getClient.valid(),
      ),
    ).resolves.toEqual(process);
  });

  it('should findOne ProcessOwner', () => {
    transaction.createdBy = getClient.invalid();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    expect(
      processesController.findOne(
        transaction.id,
        process.id,
        getClient.valid(),
      ),
    ).resolves.toEqual(process);
  });

  it('should findOne FileOwner', () => {
    transaction.createdBy = getClient.invalid();
    process.createdBy = getClient.invalid();
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    expect(
      processesController.findOne(
        transaction.id,
        process.id,
        getClient.valid(),
      ),
    ).resolves.toEqual(process);
  });

  it('should not findOne NotFound', () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(undefined);
    jest.spyOn(processesService, 'findOne').mockReturnValue(undefined);
    expect(
      processesController.findOne(
        transaction.id,
        process.id,
        getClient.attacker(),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should not findOne Forbidden', () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    expect(
      processesController.findOne(
        transaction.id,
        process.id,
        getClient.attacker(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
