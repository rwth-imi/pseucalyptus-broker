import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Client as ClientEntity } from '../entities/client.entity';

export const Client = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const client = new ClientEntity();
    client.id = request.headers['x-client-id'];
    client.domain = request.headers['x-client-domain'];
    return client;
  },
);
