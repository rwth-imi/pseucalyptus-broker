import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Client } from 'src/clients/decorators/client.decorator';
import { Client as ClientEntity } from 'src/clients/entities/client.entity';
import { File } from './entities/file.entity';
import { FilesService } from './files.service';

@ApiBearerAuth('Client-ID')
@ApiBearerAuth('Client-Domain')
@Controller({
  version: '1',
  path: 'files',
})
export class FilesListingController {
  constructor(private readonly filesService: FilesService) {}

  @ApiQuery({
    name: 'filterUnprocessed',
    required: false,
    style: 'simple',
    schema: { type: 'array', items: { type: 'string' } },
  })
  @Get()
  findMy(
    @Client() client: ClientEntity,
    @Query('filterUnprocessed') filterUnprocessed = '',
  ): Array<{
    transactionId: string;
    processId: string;
    fileId: string;
    file: File;
  }> {
    return this.filesService.findFiltered(
      client,
      filterUnprocessed
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    );
  }
}
