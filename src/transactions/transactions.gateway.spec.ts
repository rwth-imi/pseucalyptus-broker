import { Test, TestingModule } from '@nestjs/testing';
import { serialize } from 'class-transformer';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { getClient, getDataStructure, resource } from 'test/common';
import { WebSocket } from 'ws';
import { Transaction } from './entities/transaction.entity';
import { TransactionsGateway } from './transactions.gateway';

describe('TransactionsGateway', () => {
  let transactionsGateway: TransactionsGateway;
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
      providers: [TransactionsGateway],
    })
      .setLogger(logger)
      .compile();

    transactionsGateway = module.get<TransactionsGateway>(TransactionsGateway);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(transactionsGateway).toBeDefined();
  });

  it('should log initialization', () => {
    const loggerLog = jest.spyOn(logger, 'log');
    transactionsGateway.afterInit();
    expect(loggerLog).toHaveBeenCalledWith(
      'TransactionsGateway initialized.',
      'TransactionsGateway',
    );
  });

  it('should handleConnection', () => {
    const client = getClient.valid();
    const socket = <WebSocket>(<unknown>jest.fn());
    transactionsGateway.handleConnection(socket, {
      headers: { 'x-client-id': client.id, 'x-client-domain': client.domain },
    });
    expect(socket['clientDomain']).toBe(client.domain);
  });

  it('should handleConnection emitting transactions changed since date (header)', () => {
    const { transaction } = getDataStructure();
    const client = getClient.valid();
    const socket = <WebSocket>(<unknown>jest.fn());
    socket.send = jest.fn();
    const storageServiceGetAclTransactions = jest
      .spyOn(storageService, 'getAclTransactions')
      .mockImplementation((domain: string) => {
        const map = new Map<string, Transaction>();
        if (
          transaction.processes
            .get(resource.processId)
            .files.get(resource.fileId)
            .accessableBy.includes(domain)
        ) {
          map.set(resource.transactionId, transaction);
          return map;
        } else return map;
      });
    const socketSend = jest.spyOn(socket, 'send').mockImplementation(() => {
      // do nothing
    });
    transactionsGateway.handleConnection(socket, {
      headers: {
        'x-client-id': client.id,
        'x-client-domain': client.domain,
        date: transaction.createdAt.toUTCString(),
      },
    });
    expect(storageServiceGetAclTransactions).toHaveBeenCalledTimes(1);
    expect(storageServiceGetAclTransactions).toHaveBeenCalledWith(
      client.domain,
    );
    expect(socketSend).toHaveBeenCalledTimes(1);
    expect(socketSend).toHaveBeenCalledWith(
      serialize<{ transactionId: string; transaction: Transaction }>(
        {
          transactionId: resource.transactionId,
          transaction: transaction,
        },
        { enableCircularCheck: true },
      ),
    );
  });

  it('should handleConnection emitting transactions changed since date (header) with none available', () => {
    const { transaction, process, file } = getDataStructure();
    const date = transaction.createdAt;
    file.createdAt = new Date(+file.createdAt - 1000);
    process.createdAt = new Date(+process.createdAt - 1000);
    transaction.createdAt = new Date(+transaction.createdAt - 1000);
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
    transactionsGateway.handleConnection(socket, {
      headers: {
        'x-client-id': client.id,
        'x-client-domain': client.domain,
        date: date,
      },
    });
    expect(storageServiceGetAclTransactions).toHaveBeenCalledTimes(1);
    expect(storageServiceGetAclTransactions).toHaveBeenCalledWith(
      client.domain,
    );
    expect(socketSend).toHaveBeenCalledTimes(0);
  });

  it('should handleConnection close unauthorized', () => {
    const socket = <WebSocket>(<unknown>jest.fn());
    socket.close = jest.fn();
    transactionsGateway.handleConnection(socket, { headers: {} });
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it('should handleDisconnect unauthorized', () => {
    const socket = <WebSocket>(<unknown>jest.fn());
    expect(() =>
      transactionsGateway.handleDisconnect(socket),
    ).not.toThrowError();
  });

  it('should emit nothing without error', () => {
    const { transaction } = getDataStructure();
    expect(() =>
      transactionsGateway.emit(resource.transactionId, transaction),
    ).not.toThrowError();
  });

  it('should emit', () => {
    const client = getClient.valid();
    const socket = <WebSocket>(<unknown>jest.fn());
    socket.send = jest.fn();
    const socket2 = <WebSocket>(<unknown>jest.fn());
    socket2.send = jest.fn();

    transactionsGateway.handleConnection(socket, {
      headers: { 'x-client-id': client.id, 'x-client-domain': client.domain },
    });
    transactionsGateway.handleConnection(socket2, {
      headers: { 'x-client-id': client.id, 'x-client-domain': client.domain },
    });

    const { transaction } = getDataStructure();
    expect(() =>
      transactionsGateway.emit(resource.transactionId, transaction),
    ).not.toThrowError();
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(
      serialize<{ transactionId: string; transaction: Transaction }>(
        { transactionId: resource.transactionId, transaction: transaction },
        { enableCircularCheck: true },
      ),
    );
    expect(socket2.send).toHaveBeenCalledTimes(1);
    expect(socket2.send).toHaveBeenCalledWith(
      serialize<{ transactionId: string; transaction: Transaction }>(
        { transactionId: resource.transactionId, transaction: transaction },
        { enableCircularCheck: true },
      ),
    );
    expect(() =>
      transactionsGateway.handleDisconnect(socket),
    ).not.toThrowError();
    expect(() =>
      transactionsGateway.emit(resource.transactionId, transaction),
    ).not.toThrowError();
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket2.send).toHaveBeenCalledTimes(2);
    expect(() =>
      transactionsGateway.handleDisconnect(socket2),
    ).not.toThrowError();
    expect(() =>
      transactionsGateway.emit(resource.transactionId, transaction),
    ).not.toThrowError();
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket2.send).toHaveBeenCalledTimes(2);
  });

  it('should echo', () => {
    const socket = <WebSocket>(<unknown>jest.fn());
    const payload = 'ECHO!';
    expect(transactionsGateway.echo(socket, payload)).toEqual({
      event: 'echo',
      data: payload,
    });
  });
});
