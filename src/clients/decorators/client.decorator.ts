import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getClientHeaders } from '../utils/get-client-headers.utils';

export const Client = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return getClientHeaders(request.headers);
  },
);
