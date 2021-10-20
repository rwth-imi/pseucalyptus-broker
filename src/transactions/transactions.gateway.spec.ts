import { Test, TestingModule } from '@nestjs/testing';
import { serialize } from 'class-transformer';
import { getClient, getDataStructure, resource } from 'test/common';
import { WebSocket } from 'ws';
import { Transaction } from './entities/transaction.entity';
import { TransactionsGateway } from './transactions.gateway';

describe('TransactionsGateway', () => {
  let transactionsGateway: TransactionsGateway;
  let logger;

  beforeEach(async () => {
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionsGateway],
    })
      .setLogger(logger)
      .compile();

    transactionsGateway = module.get<TransactionsGateway>(TransactionsGateway);
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
