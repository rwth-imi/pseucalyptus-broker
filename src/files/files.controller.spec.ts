import {
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createResponse } from 'node-mocks-http';
import { ProcessesModule } from 'src/processes/processes.module';
import { ProcessesService } from 'src/processes/processes.service';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { Stream } from 'stream';
import { fileBlob, getClient, getDataStructure, resource } from 'test/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let filesController: FilesController;
  let filesService: FilesService;
  let processesService: ProcessesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule, ProcessesModule],
      controllers: [FilesController],
      providers: [FilesService],
    })
      .overrideProvider(StorageService)
      .useValue({})
      .compile();

    filesController = module.get<FilesController>(FilesController);
    filesService = module.get<FilesService>(FilesService);
    processesService = module.get<ProcessesService>(ProcessesService);
  });

  it('should be defined', () => {
    expect(filesController).toBeDefined();
  });

  describe('create', () => {
    const createProp = {
      accessableBy: ['Next1', 'Next2'],
      mime: 'text/plain',
      file: new Stream(),
    };

    it('should succeed', async () => {
      const { process } = getDataStructure();
      jest.spyOn(processesService, 'findOne').mockReturnValue(process);
      const filesServiceCreate = jest
        .spyOn(filesService, 'create')
        .mockImplementation(async () => {
          /* do nothing */
        });
      await filesController.create(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        getClient.valid(),
        createProp.accessableBy,
        createProp.mime,
        createProp.file,
      );
      expect(filesServiceCreate).toHaveBeenCalledTimes(1);
      expect(filesServiceCreate).toBeCalledWith(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        resource.fileId,
        createProp.accessableBy,
        createProp.mime,
        createProp.file,
      );
    });

    it('should succeed with workaround accessableBy as comma separated list', async () => {
      const { process } = getDataStructure();
      jest.spyOn(processesService, 'findOne').mockReturnValue(process);
      const fileServiceCreate = jest
        .spyOn(filesService, 'create')
        .mockImplementation(async () => {
          /* do nothing */
        });
      await filesController.create(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        getClient.valid(),
        createProp.accessableBy.join(','),
        createProp.mime,
        createProp.file,
      );
      expect(fileServiceCreate).toHaveBeenCalledTimes(1);
      expect(fileServiceCreate).toHaveBeenCalledWith(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        resource.fileId,
        createProp.accessableBy,
        createProp.mime,
        createProp.file,
      );
    });

    it('should not create NotFound', () => {
      jest.spyOn(processesService, 'findOne').mockReturnValue(undefined);
      const fileServiceCreate = jest
        .spyOn(filesService, 'create')
        .mockImplementation(async () => {
          /* do nothing */
        });
      expect(
        filesController.create(
          resource.transactionId,
          resource.processId,
          resource.fileId,
          getClient.valid(),
          createProp.accessableBy,
          createProp.mime,
          createProp.file,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(fileServiceCreate).toHaveBeenCalledTimes(0);
    });

    it('should not create Forbidden', () => {
      const { process } = getDataStructure();
      jest.spyOn(processesService, 'findOne').mockReturnValue(process);
      const fileServiceCreate = jest
        .spyOn(filesService, 'create')
        .mockImplementation(async () => {
          /* do nothing */
        });
      expect(
        filesController.create(
          resource.transactionId,
          resource.processId,
          resource.fileId,
          getClient.attacker(),
          createProp.accessableBy,
          createProp.mime,
          createProp.file,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(fileServiceCreate).toHaveBeenCalledTimes(0);
    });
  });

  describe('findOne', () => {
    it('should succeed', async () => {
      function streamToString(stream: Stream): Promise<string> {
        const chunks = [];
        return new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('error', (err) => reject(err));
          stream.on('end', () =>
            resolve(Buffer.concat(chunks).toString('utf8')),
          );
        });
      }
      const { process, file } = getDataStructure();
      jest.spyOn(processesService, 'findOne').mockReturnValue(process);
      jest.spyOn(filesService, 'findOne').mockReturnValue(file);
      jest
        .spyOn(filesService, 'getBlob')
        .mockResolvedValue(Buffer.from(fileBlob));
      const response = createResponse();
      const retVal: StreamableFile = await filesController.findOne(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        getClient.valid(),
        response,
      );
      const retStream: Stream = retVal.getStream();
      expect(streamToString(retStream)).resolves.toEqual(fileBlob);
      expect(response.getHeader('content-type')).toEqual('text/plain');
      expect(response.getHeader('content-disposition')).toEqual(
        'attachment; filename="' + resource.fileId + '"',
      );
      expect(response.getHeader('last-modified')).toEqual(
        file.createdAt.toUTCString(),
      );
    });

    it('should not findOne NotFound', () => {
      jest.spyOn(filesService, 'findOne').mockReturnValue(undefined);
      expect(
        filesController.findOne(
          resource.transactionId,
          resource.processId,
          resource.fileId,
          getClient.valid(),
          createResponse(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not findOne Forbidden', () => {
      const { process, file } = getDataStructure();
      jest.spyOn(processesService, 'findOne').mockReturnValue(process);
      jest.spyOn(filesService, 'findOne').mockReturnValue(file);
      expect(
        filesController.findOne(
          resource.transactionId,
          resource.processId,
          resource.fileId,
          getClient.attacker(),
          createResponse(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
