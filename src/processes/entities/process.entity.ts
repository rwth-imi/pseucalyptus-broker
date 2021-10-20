import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { Client } from 'src/clients/entities/client.entity';
import { File } from 'src/files/entities/file.entity';

export class Process {
  @ApiHideProperty()
  @Exclude()
  id: string;

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Client)
  createdBy: Client;

  @ApiProperty({ type: File, isArray: true })
  @Type(() => File)
  files: Map<string, File> = new Map<string, File>();
}
