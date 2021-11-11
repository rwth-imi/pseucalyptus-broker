import { UnauthorizedException } from '@nestjs/common';
import { Client } from '../entities/client.entity';

export const getClientHeaders = (headers: {
  'x-client-id': string;
  'x-client-domain': string;
}): Client => {
  if (!headers['x-client-id'] || !headers['x-client-domain'])
    throw new UnauthorizedException();
  const client = new Client();
  client.id = headers['x-client-id'];
  client.domain = headers['x-client-domain'];
  return client;
};
