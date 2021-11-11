import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Client } from 'src/clients/decorators/client.decorator';
import { Client as ClientEntity } from 'src/clients/entities/client.entity';
import { File } from 'src/files/entities/file.entity';
import { Process } from 'src/processes/entities/process.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

@ApiBearerAuth('Client-ID')
@ApiBearerAuth('Client-Domain')
@UseInterceptors(ClassSerializerInterceptor)
@Controller({
  version: '1',
  path: 'transactions',
})
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiQuery({
    name: 'filterUnprocessed',
    required: false,
    style: 'simple',
    schema: { type: 'array', items: { type: 'string' } },
  })
  @Get()
  async findMy(
    @Client() client: ClientEntity,
    @Query('filterUnprocessed') filterUnprocessed = '',
  ): Promise<Map<string, Transaction>> {
    return this.transactionsService.findFiltered(
      client,
      filterUnprocessed
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    );
  }

  @Post()
  async create(
    @Client() client: ClientEntity,
    @Res() res: Response,
  ): Promise<void> {
    const transactionId = await this.transactionsService.create(client);
    res.setHeader('Location', res.req.url + '/' + transactionId);
    res.send();
  }

  // Guard: Any occurence in transaction
  @Get(':transactionId')
  async findOne(
    @Param('transactionId') transactionId: string,
    @Client() client: ClientEntity,
  ): Promise<Transaction> {
    const transaction: Transaction =
      this.transactionsService.findOne(transactionId);

    if (!transaction) throw new NotFoundException();

    if (
      !(
        transaction.createdBy.domain == client.domain ||
        Array.from(transaction.processes.values()).some((p: Process) => {
          if (p.createdBy.domain == client.domain) return true;
          return Array.from(p.files.values()).some((f: File) => {
            return f.accessableBy.includes(client.domain);
          });
        })
      )
    )
      throw new ForbiddenException();

    return this.transactionsService.findOne(transactionId);
  }

  // Guard: createdBy == client
  @Delete(':transactionId')
  @HttpCode(204)
  async delete(
    @Param('transactionId') transactionId: string,
    @Client() client: ClientEntity,
  ): Promise<void> {
    const transaction: Transaction =
      this.transactionsService.findOne(transactionId);

    if (!transaction) throw new NotFoundException();

    if (transaction.createdBy.domain != client.domain)
      throw new ForbiddenException();

    await this.transactionsService.delete(transactionId);
  }
}
