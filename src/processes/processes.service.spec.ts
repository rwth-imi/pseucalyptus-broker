import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from 'src/storage/storage.service';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { TransactionsService } from 'src/transactions/transactions.service';
import { getClient, getDataStructure, getProcess, resource } from 'test/common';
import { Process } from './entities/process.entity';
import { ProcessesService } from './processes.service';

describe('ProcessesService', () => {
  let transactionsService: TransactionsService;
  let processesService: ProcessesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TransactionsModule],
      providers: [ProcessesService],
    })
      .overrideProvider(StorageService)
      .useValue({})
      .compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    processesService = module.get<ProcessesService>(ProcessesService);
  });

  it('should be defined', () => {
    expect(processesService).toBeDefined();
  });

  const { transaction, process, file } = getDataStructure();
  const processWoFiles: Process = getProcess();

  it('should create', async () => {
    jest
      .useFakeTimers('modern')
      .setSystemTime(new Date('2011-06-06T18:00:00.000Z').getTime());
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    const transactionsServiceSetProcess = jest
      .spyOn(transactionsService, 'setProcess')
      .mockImplementation(async () => {
        /* do nothing */
      });
    await processesService.create(
      resource.transactionId,
      resource.processId,
      getClient.valid(),
    );
    expect(transactionsServiceSetProcess).toHaveBeenCalledWith(
      resource.transactionId,
      resource.processId,
      processWoFiles,
    );
    expect(transactionsServiceSetProcess).toHaveBeenCalledTimes(1);
  });

  it('should get', () => {
    jest.spyOn(transactionsService, 'findOne').mockReturnValue(transaction);
    expect(
      processesService.findOne(resource.transactionId, resource.processId),
    ).toEqual(process);
  });

  it('should setFile', async () => {
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    const transactionsServiceSetProcess = jest
      .spyOn(transactionsService, 'setProcess')
      .mockImplementation(async () => {
        /* do nothing */
      });
    const processFilesSet = jest.spyOn(process.files, 'set');
    await processesService.setFile(
      resource.transactionId,
      resource.processId,
      resource.fileId,
      file,
    );
    expect(transactionsServiceSetProcess).toHaveBeenCalledWith(
      resource.transactionId,
      resource.processId,
      process,
    );
    expect(transactionsServiceSetProcess).toHaveBeenCalledTimes(1);
    expect(processFilesSet).toHaveBeenCalledWith(resource.fileId, file);
    expect(processFilesSet).toHaveBeenCalledTimes(1);
  });
});
