import { Test, TestingModule } from '@nestjs/testing';
import { serialize } from 'class-transformer';
import { getClient, getDataStructure, getFile, resource } from 'test/common';
import { WebSocket } from 'ws';
import { FilesGateway } from './files.gateway';
import { File } from './entities/file.entity';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';

describe('FilesGateway', () => {
  let filesGateway: FilesGateway;
  let storageService: StorageService;
  let logger;

  beforeEach(async () => {
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [StorageModule],
      providers: [FilesGateway],
    })
      .setLogger(logger)
      .compile();

    filesGateway = module.get<FilesGateway>(FilesGateway);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(filesGateway).toBeDefined();
  });

  it('should log initialization', () => {
    const loggerLog = jest.spyOn(logger, 'log');
    filesGateway.afterInit();
    expect(loggerLog).toHaveBeenCalledWith(
      'FilesGateway initialized.',
      'FilesGateway',
    );
  });

  it('should handleConnection', () => {
    const client = getClient.valid();
    const socket = <WebSocket>(<unknown>jest.fn());
    filesGateway.handleConnection(socket, {
      headers: {
        'x-client-id': client.id,
        'x-client-domain': client.domain,
      },
    });
    expect(socket['clientDomain']).toBe(client.domain);
  });

  it('should handleConnection emitting files since date (header)', () => {
    const { transaction, process, file } = getDataStructure();
    const file2 = getFile('FID2');
    file2.createdAt = new Date(+file.createdAt - 1000);
    process.files.set('FID2', file2);
    const client = getClient.valid();
    const socket = <WebSocket>(<unknown>jest.fn());
    socket.send = jest.fn();
    const storageServiceGetAclTransactions = jest
      .spyOn(storageService, 'getAclTransactions')
      .mockImplementation((domain: string) => {
        const map = new Map<string, Transaction>();
        if (file.accessableBy.includes(domain)) {
          map.set(resource.transactionId, transaction);
          return map;
        } else return map;
      });
    const socketSend = jest.spyOn(socket, 'send').mockImplementation(() => {
      // do nothing
    });
    filesGateway.handleConnection(socket, {
      headers: {
        'x-client-id': client.id,
        'x-client-domain': client.domain,
        date: file.createdAt.toUTCString(),
      },
    });
    expect(storageServiceGetAclTransactions).toHaveBeenCalledTimes(1);
    expect(storageServiceGetAclTransactions).toHaveBeenCalledWith(
      client.domain,
    );
    expect(socketSend).toHaveBeenCalledTimes(1);
    expect(socketSend).toHaveBeenCalledWith(
      serialize<{
        transactionId: string;
        processId: string;
        fileId: string;
        file: File;
      }>(
        {
          transactionId: resource.transactionId,
          processId: resource.processId,
          fileId: resource.fileId,
          file: file,
        },
        { enableCircularCheck: true },
      ),
    );
  });

  it('should handleConnection close unauthorized', () => {
    const socket = <WebSocket>(<unknown>jest.fn());
    socket.close = jest.fn();
    filesGateway.handleConnection(socket, { headers: {} });
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it('should handleDisconnect unauthorized', () => {
    const socket = <WebSocket>(<unknown>jest.fn());
    expect(() => filesGateway.handleDisconnect(socket)).not.toThrowError();
  });

  it('should emit nothing without error', () => {
    const { file } = getDataStructure();
    expect(() =>
      filesGateway.emit(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        file,
      ),
    ).not.toThrowError();
  });

  it('should emit', () => {
    const client = getClient.valid();
    const socket = <WebSocket>(<unknown>jest.fn());
    socket.send = jest.fn();
    const socket2 = <WebSocket>(<unknown>jest.fn());
    socket2.send = jest.fn();

    filesGateway.handleConnection(socket, {
      headers: { 'x-client-id': client.id, 'x-client-domain': client.domain },
    });
    filesGateway.handleConnection(socket2, {
      headers: { 'x-client-id': client.id, 'x-client-domain': client.domain },
    });

    const { file } = getDataStructure();
    expect(() =>
      filesGateway.emit(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        file,
      ),
    ).not.toThrowError();
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(
      serialize<{
        transactionId: string;
        processId: string;
        fileId: string;
        file: File;
      }>(
        {
          transactionId: resource.transactionId,
          processId: resource.processId,
          fileId: resource.fileId,
          file: file,
        },
        { enableCircularCheck: true },
      ),
    );
    expect(socket2.send).toHaveBeenCalledTimes(1);
    expect(socket2.send).toHaveBeenCalledWith(
      serialize<{
        transactionId: string;
        processId: string;
        fileId: string;
        file: File;
      }>(
        {
          transactionId: resource.transactionId,
          processId: resource.processId,
          fileId: resource.fileId,
          file: file,
        },
        { enableCircularCheck: true },
      ),
    );
    expect(() => filesGateway.handleDisconnect(socket)).not.toThrowError();
    expect(() =>
      filesGateway.emit(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        file,
      ),
    ).not.toThrowError();
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket2.send).toHaveBeenCalledTimes(2);
    expect(() => filesGateway.handleDisconnect(socket2)).not.toThrowError();
    expect(() =>
      filesGateway.emit(
        resource.transactionId,
        resource.processId,
        resource.fileId,
        file,
      ),
    ).not.toThrowError();
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket2.send).toHaveBeenCalledTimes(2);
  });

  it('should echo', () => {
    const socket = <WebSocket>(<unknown>jest.fn());
    const payload = 'ECHO!';
    expect(filesGateway.echo(socket, payload)).toEqual({
      event: 'echo',
      data: payload,
    });
  });
});
