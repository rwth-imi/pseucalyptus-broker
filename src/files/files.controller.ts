import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Client } from 'src/clients/decorators/client.decorator';
import { Client as ClientEntity } from 'src/clients/entities/client.entity';
import { Process } from 'src/processes/entities/process.entity';
import { ProcessesService } from 'src/processes/processes.service';
import { Stream } from 'stream';
import { File } from './entities/file.entity';
import { FilesService } from './files.service';

@ApiBearerAuth('Client-ID')
@ApiBearerAuth('Client-Domain')
@Controller({
  version: '1',
  path: 'transactions/:transactionId/processes/:processId/files/:fileId',
})
export class FilesController {
  constructor(
    private readonly processesService: ProcessesService,
    private readonly filesService: FilesService,
  ) {}

  // Guard: client == process.createdBy
  @Post()
  @ApiConsumes('application/octet-stream')
  @ApiBody({})
  @ApiHeader({
    name: 'x-accessable-by',
    schema: { type: 'array', items: { type: 'string' } },
  })
  async create(
    @Param('transactionId') transactionId: string,
    @Param('processId') processId: string,
    @Param('fileId') fileId: string,
    @Client() client: ClientEntity,
    @Headers('x-accessable-by') accessableBy: string,
    @Headers('content-type') mime: string,
    @Req() file: Stream,
  ): Promise<void> {
    const process: Process = this.processesService.findOne(
      transactionId,
      processId,
    );

    if (!process) throw new NotFoundException();

    if (!(process.createdBy.domain == client.domain))
      throw new ForbiddenException();

    // Check for JSON-Array, otherwise interpret as comma-separated list
    let _accessableBy: Array<string>;
    try {
      if (
        !(_accessableBy = JSON.parse(accessableBy)) ||
        !Array.isArray(_accessableBy)
      )
        throw new Error();
    } catch (e) {
      _accessableBy = (<string>accessableBy).split(',').map((v) => v.trim());
    }

    await this.filesService.create(
      transactionId,
      processId,
      fileId,
      fileId,
      _accessableBy,
      mime,
      file,
    );
  }

  // Guard: client == process.createdBy || client == file.accessableBy
  @Get()
  async findOne(
    @Param('transactionId') transactionId: string,
    @Param('processId') processId: string,
    @Param('fileId') fileId: string,
    @Client() client: ClientEntity,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file: File = this.filesService.findOne(
      transactionId,
      processId,
      fileId,
    );

    if (!file) throw new NotFoundException();

    const process: Process = this.processesService.findOne(
      transactionId,
      processId,
    );
    if (
      !(
        process.createdBy.domain == client.domain ||
        file.accessableBy.some((a) => {
          return a == client.domain;
        })
      )
    )
      throw new ForbiddenException();

    res.setHeader('content-type', file.mime);
    res.setHeader(
      'content-disposition',
      'attachment; filename="' + file.name + '"',
    );
    res.setHeader('last-modified', file.createdAt.toUTCString());
    return new StreamableFile(
      await this.filesService.getBlob(transactionId, processId, fileId),
    );
  }
}
