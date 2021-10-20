import { Test, TestingModule } from '@nestjs/testing';
import { ProcessesModule } from 'src/processes/processes.module';
import { ProcessesService } from 'src/processes/processes.service';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { fileCreateProp, getFile, getProcess, resource } from 'test/common';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let filesService: FilesService;
  let processesService: ProcessesService;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule, ProcessesModule],
      providers: [FilesService],
    })
      .overrideProvider(StorageService)
      .useValue({
        setFile: jest.fn(),
        getFile: jest.fn(),
      })
      .compile();

    filesService = module.get<FilesService>(FilesService);
    processesService = module.get<ProcessesService>(ProcessesService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(filesService).toBeDefined();
  });

  it('should create', async () => {
    jest
      .useFakeTimers('modern')
      .setSystemTime(new Date('2011-06-06T18:00:00.000Z').getTime());
    jest.spyOn(processesService, 'findOne').mockImplementation(getProcess);
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
    const file = getFile(
      resource.transactionId,
      resource.processId,
      resource.fileId,
    );
    await filesService.create(
      resource.transactionId,
      resource.processId,
      file.id,
      file.name,
      file.accessableBy,
      file.mime,
      fileCreateProp.file,
    );
    expect(processesServiceSetFile).toHaveBeenCalledWith(
      resource.transactionId,
      resource.processId,
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
    const file = getFile(
      resource.transactionId,
      resource.processId,
      resource.fileId,
    );
    const process = getProcess(resource.transactionId, resource.processId, [
      file,
    ]);
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
