import { Test, TestingModule } from '@nestjs/testing';
import { ProcessesModule } from 'src/processes/processes.module';
import { ProcessesService } from 'src/processes/processes.service';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { TransactionsService } from 'src/transactions/transactions.service';
import { fileCreateProp, getClient, getDataStructure, getFile, getProcess, resource } from 'test/common';
import { FilesGateway } from './files.gateway';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let filesService: FilesService;
  let processesService: ProcessesService;
  let transactionsService: TransactionsService;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule, ProcessesModule, TransactionsModule],
      providers: [FilesService, FilesGateway],
    })
      .overrideProvider(StorageService)
      .useValue({
        setFile: jest.fn(),
        getFile: jest.fn(),
      })
      .compile();

    filesService = module.get<FilesService>(FilesService);
    processesService = module.get<ProcessesService>(ProcessesService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(filesService).toBeDefined();
  });

  it('should create', async () => {
    jest
      .useFakeTimers('modern')
      .setSystemTime(new Date('2011-06-06T18:00:00.000Z').getTime());
    jest.spyOn(processesService, 'findOne').mockReturnValue(getProcess());
    const processesServiceSetFile = jest
      .spyOn(processesService, 'setFile')
      .mockImplementation(async () => {
        /* do nothing */
      });
    const storageServiceSetFile = jest
      .spyOn(storageService, 'setFile')
      .mockImplementation(async () => {
        /* do nothing */
      });
    const file = getFile(resource.fileId);
    await filesService.create(
      resource.transactionId,
      resource.processId,
      resource.fileId,
      file.name,
      file.accessableBy,
      file.mime,
      fileCreateProp.file,
    );
    expect(processesServiceSetFile).toHaveBeenCalledWith(
      resource.transactionId,
      resource.processId,
      resource.fileId,
      file,
    );
    expect(processesServiceSetFile).toHaveBeenCalledTimes(1);
    expect(storageServiceSetFile).toHaveBeenCalledWith(
      resource.transactionId,
      resource.processId,
      resource.fileId,
      fileCreateProp.file,
    );
    expect(storageServiceSetFile).toHaveBeenCalledTimes(1);
  });

  it('should get', () => {
    const file = getFile(resource.fileId);
    const process = getProcess([{ fileId: resource.fileId, file: file }]);
    jest.spyOn(processesService, 'findOne').mockReturnValue(process);
    expect(
      filesService.findOne(
        resource.transactionId,
        resource.processId,
        resource.fileId,
      ),
    ).toEqual(file);
    expect(
      filesService.findOne(
        resource.transactionId,
        resource.processId,
        'NOT EXISTANT',
      ),
    ).toBeUndefined();
  });

  it('should findFiltered', () => {
    const client = getClient.valid();
    const map = new Map<string, Transaction>();
    map.set(resource.transactionId, getDataStructure().transaction);
    const resArr = [{
      transactionId: resource.transactionId,
      processId: resource.processId,
      fileId: resource.fileId,
      file: getFile(resource.fileId)
    }];
    jest.spyOn(transactionsService, 'findFiltered').mockReturnValue(map);
    expect(
      filesService.findFiltered(getClient.valid(), ['noPID']),
    ).toEqual(resArr);
    expect(
      filesService.findFiltered(getClient.valid(), ['PID']),
    ).toEqual([]);
    expect(
      filesService.findFiltered(getClient.invalid(), []),
    ).toEqual([]);
  });

  it('should getBlob', async () => {
    const fileBlob = 'FILE BLOB!';
    jest
      .spyOn(storageService, 'getFile')
      .mockResolvedValue(Buffer.from(fileBlob));
    const retVal: Buffer = await filesService.getBlob(
      resource.transactionId,
      resource.processId,
      resource.fileId,
    );
    expect(retVal.toString()).toEqual(fileBlob);
  });
});
