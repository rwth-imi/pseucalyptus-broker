import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from 'src/app.module';
import { File } from 'src/files/entities/file.entity';
import * as request from 'supertest';
import {
  fileBlob,
  fileCreateProp,
  getClient,
  resource,
  transactionMetadata,
} from './common';

describe('AppController (e2e)', () => {
  let datadir: string;

  let app: INestApplication;

  afterAll(async () => {
    await fs.promises.rm(path.join('test', 'data'), { recursive: true });
  });

  beforeEach(async () => {
    datadir = path.join('test', 'data', process.env.JEST_WORKER_ID);
    const tdir: string = path.join(
      datadir,
      'transactions',
      resource.transactionId,
    );
    await fs.promises.mkdir(path.join(tdir, resource.processId), {
      recursive: true,
    });
    await fs.promises.writeFile(
      path.join(tdir, 'metadata.json'),
      transactionMetadata,
    );
    await fs.promises.writeFile(
      path.join(tdir, resource.processId, resource.fileId),
      fileBlob,
    );

    process.env.DATADIR = datadir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await fs.promises.rm(datadir, { recursive: true });
  });

  it('/transactions (POST)', () => {
    return request(app.getHttpServer())
      .post('/transactions')
      .set('x-client-id', getClient.valid().id)
      .set('x-client-domain', getClient.valid().domain)
      .expect(201)
      .expect('Location', /\/transactions\/(.+)/);
  });

  it('/transactions/UUID (GET)', () => {
    return request(app.getHttpServer())
      .get('/transactions/' + resource.transactionId)
      .set('x-client-id', getClient.valid().id)
      .set('x-client-domain', getClient.valid().domain)
      .expect(200)
      .expect(JSON.parse(transactionMetadata));
  });

  it('/transactions/UUID (GET) ATTACK', () => {
    return request(app.getHttpServer())
      .get('/transactions/' + resource.transactionId)
      .set('x-client-id', getClient.attacker().id)
      .set('x-client-domain', getClient.attacker().domain)
      .expect(403);
  });

  it('/transactions/UUID (DELETE)', () => {
    return request(app.getHttpServer())
      .delete('/transactions/' + resource.transactionId)
      .set('x-client-id', getClient.valid().id)
      .set('x-client-domain', getClient.valid().domain)
      .expect(204)
      .then(() => {
        expect(
          fs.promises.access(
            path.join(datadir, 'transactions', resource.transactionId),
          ),
        ).rejects.toThrowError();
      });
  });

  it('/transactions/UUID (DELETE) ATTACK', () => {
    return request(app.getHttpServer())
      .delete('/transactions/' + resource.transactionId)
      .set('x-client-id', getClient.attacker().id)
      .set('x-client-domain', getClient.attacker().domain)
      .expect(403);
  });

  it('/transactions/UUID/processes/PID2 (POST)', () => {
    return request(app.getHttpServer())
      .post('/transactions/' + resource.transactionId + '/processes/PID2')
      .set('x-client-id', getClient.valid().id)
      .set('x-client-domain', getClient.valid().domain)
      .expect(201);
  });

  it('/transactions/UUID/processes/PID2 (POST) ATTACK', () => {
    return request(app.getHttpServer())
      .post('/transactions/' + resource.transactionId + '/processes/PID2')
      .set('x-client-id', getClient.attacker().id)
      .set('x-client-domain', getClient.attacker().domain)
      .expect(403);
  });

  it('/transactions/UUID/processes/PID (GET)', () => {
    return request(app.getHttpServer())
      .get(
        '/transactions/' +
          resource.transactionId +
          '/processes/' +
          resource.processId,
      )
      .set('x-client-id', getClient.valid().id)
      .set('x-client-domain', getClient.valid().domain)
      .expect(200)
      .expect(JSON.parse(transactionMetadata).processes[resource.processId]);
  });

  it('/transactions/UUID/processes/PID (GET) ATTACK', () => {
    return request(app.getHttpServer())
      .get(
        '/transactions/' +
          resource.transactionId +
          '/processes/' +
          resource.processId,
      )
      .set('x-client-id', getClient.attacker().id)
      .set('x-client-domain', getClient.attacker().domain)
      .expect(403);
  });

  it('/transactions/UUID/processes/PID/files/FID2 (POST)', () => {
    return request(app.getHttpServer())
      .post(
        '/transactions/' +
          resource.transactionId +
          '/processes/' +
          resource.processId +
          '/files/FID2',
      )
      .send(fileBlob)
      .set('x-client-id', getClient.valid().id)
      .set('x-client-domain', getClient.valid().domain)
      .set('x-accessable-by', JSON.stringify(fileCreateProp.accessableBy))
      .set('content-type', fileCreateProp.mime)
      .expect(201);
  });

  it('/transactions/UUID/processes/PID/files/FID2 (POST) ATTACK', () => {
    return request(app.getHttpServer())
      .post(
        '/transactions/' +
          resource.transactionId +
          '/processes/' +
          resource.processId +
          '/files/FID2',
      )
      .send(fileBlob)
      .set('x-client-id', getClient.attacker().id)
      .set('x-client-domain', getClient.attacker().domain)
      .set('x-accessable-by', JSON.stringify(fileCreateProp.accessableBy))
      .set('content-type', fileCreateProp.mime)
      .expect(403);
  });

  it('/transactions/UUID/processes/PID/files/FID (GET)', () => {
    const f: File =
      JSON.parse(transactionMetadata).processes[resource.processId].files[
        resource.fileId
      ];
    return request(app.getHttpServer())
      .get(
        '/transactions/' +
          resource.transactionId +
          '/processes/' +
          resource.processId +
          '/files/' +
          resource.fileId,
      )
      .set('x-client-id', getClient.valid().id)
      .set('x-client-domain', getClient.valid().domain)
      .expect(200)
      .expect('content-type', f.mime)
      .expect('content-disposition', 'attachment; filename="' + f.name + '"')
      .expect('last-modified', new Date(f.createdAt).toUTCString())
      .expect(fileBlob);
  });

  it('/transactions/UUID/processes/PID/files/FID (GET) ATTACK', () => {
    return request(app.getHttpServer())
      .get(
        '/transactions/' +
          resource.transactionId +
          '/processes/' +
          resource.processId +
          '/files/' +
          resource.fileId,
      )
      .set('x-client-id', getClient.attacker().id)
      .set('x-client-domain', getClient.attacker().domain)
      .expect(403);
  });
});
