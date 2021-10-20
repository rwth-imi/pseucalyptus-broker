import { Client } from '../entities/client.entity';

export const getClientHeaders = (headers: {
  'x-client-id': string;
  'x-client-domain': string;
}): Client => {
  if (!headers['x-client-id'] || !headers['x-client-domain']) return undefined;
  const client = new Client();
  client.id = headers['x-client-id'];
  client.domain = headers['x-client-domain'];
  return client;
};
