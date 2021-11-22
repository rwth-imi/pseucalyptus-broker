import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'src/clients/entities/client.entity';
import { ProcessesModule } from 'src/processes/processes.module';
import { StorageModule } from 'src/storage/storage.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { getClient, getFile, resource } from 'test/common';
import { File } from './entities/file.entity';
import { FilesListingController } from './files-listing.controller';
import { FilesGateway } from './files.gateway';
import { FilesService } from './files.service';

describe('FilesListingController', () => {
  let filesService: FilesService;
  let filesListingController: FilesListingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule, ProcessesModule, TransactionsModule],
      controllers: [FilesListingController],
      providers: [FilesService, FilesGateway]
    }).compile();

    filesService = module.get<FilesService>(FilesService);
    filesListingController = module.get<FilesListingController>(FilesListingController);
  });

  it('should be defined', () => {
    expect(filesListingController).toBeDefined();
  });

  describe('should findMy', () => {
    let client: Client;
    let resArr: Array<{ transactionId: string, processId: string, fileId: string, file: File }>;
    let filesServiceFindFiltered;

    beforeEach(() => {
      client = getClient.valid();
      resArr = [{
        transactionId: resource.transactionId,
        processId: resource.processId,
        fileId: resource.fileId,
        file: getFile(resource.fileId)
      }];
      filesServiceFindFiltered = jest
        .spyOn(filesService, 'findFiltered')
        .mockReturnValue(resArr);
    });

    afterEach(() => {
      expect(filesServiceFindFiltered).toHaveBeenCalledTimes(1);
    });

    it('without filter', () => {
      expect(filesListingController.findMy(client)).toEqual(resArr);
      expect(filesServiceFindFiltered).toHaveBeenCalledWith(client, []);
    });

    it('filter set', () => {
      expect(filesListingController.findMy(client, 'noPID')).toEqual(resArr);
      expect(filesServiceFindFiltered).toHaveBeenCalledWith(client, ['noPID']);
    });
  });
});
