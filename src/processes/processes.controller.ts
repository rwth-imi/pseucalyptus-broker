import {
  ClassSerializerInterceptor,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Client } from 'src/clients/decorators/client.decorator';
import { Client as ClientEntity } from 'src/clients/entities/client.entity';
import { File } from 'src/files/entities/file.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Process } from './entities/process.entity';
import { ProcessesService } from './processes.service';

@ApiBearerAuth('Client-ID')
@ApiBearerAuth('Client-Domain')
@UseInterceptors(ClassSerializerInterceptor)
@Controller({
  version: '1',
  path: 'transactions/:transactionId/processes/:processId',
})
export class ProcessesController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly processesService: ProcessesService,
  ) {}

  // Guard: client == transaction.createdBy || client in any file.accessableBy of the transactions processes
  @Post()
  async create(
    @Param('transactionId') transactionId: string,
    @Param('processId') processId: string,
    @Client() client: ClientEntity,
  ): Promise<void> {
    const transaction: Transaction =
      this.transactionsService.findOne(transactionId);

    if (!transaction) throw new NotFoundException();

    if (
      !(
        transaction.createdBy.domain == client.domain ||
        Array.from(transaction.processes.values()).some((p: Process) => {
          return Array.from(p.files.values()).some((f: File) => {
            return f.accessableBy.some((a) => a == client.domain);
          });
        })
      )
    )
      throw new ForbiddenException();

    this.processesService.create(transactionId, processId, client);
  }

  // Guard: client == transaction.createdBy || client == process.createdBy || client in any file.accessableBy
  @Get()
  async findOne(
    @Param('transactionId') transactionId: string,
    @Param('processId') processId: string,
    @Client() client: ClientEntity,
  ): Promise<Process> {
    const transaction: Transaction =
      this.transactionsService.findOne(transactionId);
    const process: Process = this.processesService.findOne(
      transactionId,
      processId,
    );

    if (!process) throw new NotFoundException();

    if (
      !(
        transaction.createdBy.domain == client.domain ||
        process.createdBy.domain == client.domain ||
        Array.from(process.files.values()).some((f: File) => {
          return f.accessableBy.some((a) => a == client.domain);
        })
      )
    )
      throw new ForbiddenException();

    return this.processesService.findOne(transactionId, processId);
  }
}
