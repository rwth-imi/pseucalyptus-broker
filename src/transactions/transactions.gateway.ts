import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { serialize } from 'class-transformer';
import { Client } from 'src/clients/entities/client.entity';
import { getClientHeaders } from 'src/clients/utils/get-client-headers.utils';
import { StorageService } from 'src/storage/storage.service';
import { WebSocket } from 'ws';
import { Transaction } from './entities/transaction.entity';

@WebSocketGateway({ path: '/v1/transactions' })
export class TransactionsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly log: Logger = new Logger(TransactionsGateway.name);

  private readonly sockets: Map<string, Set<WebSocket>> = new Map<
    string,
    Set<WebSocket>
  >();

  constructor(private readonly storageService: StorageService) {}

  afterInit() {
    this.log.log('TransactionsGateway initialized.');
  }

  handleConnection(socket: WebSocket, req: any) {
    try {
      const client: Client = getClientHeaders(req.headers);
      socket['clientDomain'] = client.domain;
      let set;
      if (this.sockets.has(client.domain))
        set = this.sockets.get(client.domain);
      else set = new Set<WebSocket>();
      set.add(socket);
      this.sockets.set(client.domain, set);
      if (req.headers['date']) {
        const date: Date = new Date(req.headers['date']);
        for (const [
          transactionId,
          transaction,
        ] of this.storageService.getAclTransactions(client.domain)) {
          if (
            transaction.createdAt >= date ||
            Array.from(transaction.processes.values()).some(
              (process) =>
                process.createdAt >= date ||
                Array.from(process.files.values()).some(
                  (file) => file.createdAt >= date,
                ),
            )
          )
            this.send(socket, transactionId, transaction);
        }
      }
    } catch (UnauthorizedException) {
      socket.close(4401, 'Unauthorized');
    }
  }

  handleDisconnect(socket: WebSocket) {
    if (socket['clientDomain']) {
      const set = this.sockets.get(socket['clientDomain']);
      set.delete(socket);
      this.sockets.set(socket['clientDomain'], set);
    }
  }

  emit(transactionId: string, transaction: Transaction) {
    const resultSet: Set<WebSocket> = new Set<WebSocket>();
    for (const [, process] of transaction.processes) {
      for (const [, file] of process.files) {
        for (const domain of file.accessableBy) {
          const socketSet = this.sockets.get(domain);
          if (socketSet)
            for (const socket of socketSet) {
              resultSet.add(socket);
            }
        }
      }
    }
    for (const socket of resultSet) {
      this.send(socket, transactionId, transaction);
    }
  }

  private send(
    socket: WebSocket,
    transactionId: string,
    transaction: Transaction,
  ) {
    socket.send(
      serialize<{ transactionId: string; transaction: Transaction }>(
        {
          transactionId: transactionId,
          transaction: transaction,
        },
        { enableCircularCheck: true },
      ),
    );
  }

  @SubscribeMessage('echo')
  echo(_socket: WebSocket, payload: string): WsResponse<string> {
    return {
      event: 'echo',
      data: payload,
    };
  }
}
