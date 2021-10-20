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

  afterInit() {
    this.log.log('TransactionsGateway initialized.');
  }

  handleConnection(socket: WebSocket, req: any) {
    const client: Client = getClientHeaders(req.headers);
    if (!client) {
      socket.close();
      return;
    }
    socket['clientDomain'] = client.domain;
    const set = this.sockets.has(client.domain)
      ? this.sockets.get(client.domain)
      : new Set<WebSocket>();
    set.add(socket);
    this.sockets.set(client.domain, set);
  }

  handleDisconnect(socket: WebSocket) {
    if (socket['clientDomain']) {
      const set = this.sockets.get(socket['clientDomain']);
      set.delete(socket);
      this.sockets.set(socket['clientDomain'], set);
    }
  }

  emit(transactionId: string, transaction: Transaction) {
    const msg = {
      transactionId: transactionId,
      transaction: transaction,
    };
    transaction.processes.forEach((process) => {
      process.files.forEach((file) => {
        file.accessableBy.forEach((domain: string) => {
          const socketSet = this.sockets.get(domain);
          if (socketSet)
            socketSet.forEach((socket: WebSocket) => {
              socket.send(
                serialize<{ transactionId: string; transaction: Transaction }>(
                  msg,
                  { enableCircularCheck: true },
                ),
              );
            });
        });
      });
    });
  }

  @SubscribeMessage('echo')
  echo(socket: WebSocket, payload: string): WsResponse<string> {
    return {
      event: 'echo',
      data: payload,
    };
  }
}
