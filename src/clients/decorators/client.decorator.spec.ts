import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { createRequest, createResponse } from 'node-mocks-http';
import 'reflect-metadata';
import { getClient } from 'test/common';
import { Client } from '../decorators/client.decorator';
import { Client as ClientEntity } from '../entities/client.entity';

describe('@Client', () => {
  // eslint-disable-next-line
  function getParamDecoratorFactory(_decorator: Function) {
    class TestDecorator {
      // eslint-disable-next-line
      public test(@_decorator() _value) {}
    }

    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestDecorator,
      'test',
    );
    return args[Object.keys(args)[0]].factory;
  }

  it('should extract client from request header', () => {
    const client: ClientEntity = getClient.valid();
    const req = createRequest();
    const res = createResponse();
    req.headers['x-client-id'] = client.id;
    req.headers['x-client-domain'] = client.domain;
    const ctx = new ExecutionContextHost([req, res], undefined, undefined);
    const factory = getParamDecoratorFactory(Client);
    expect(factory(undefined, ctx)).toEqual(client);
  });
});
