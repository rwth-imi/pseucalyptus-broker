import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Client } from 'src/clients/entities/client.entity';
import { Process } from 'src/processes/entities/process.entity';

export class Transaction {
  @Type(() => Date)
  createdAt: Date;

  @Type(() => Client)
  createdBy: Client;

  @ApiProperty({ type: Process, isArray: true })
  @Type(() => Process)
  processes: Map<string, Process> = new Map<string, Process>();
}
