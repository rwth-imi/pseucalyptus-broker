import { Stream } from 'stream';
import { Client } from '../src/clients/entities/client.entity';
import { File } from '../src/files/entities/file.entity';
import { Process } from '../src/processes/entities/process.entity';
import { Transaction } from '../src/transactions/entities/transaction.entity';

export const transactionMetadata =
  '{"processes":{"PID":{"files":{"FID":{"name":"FID","accessableBy":["ClientDomain"],"createdAt":"2011-06-06T18:00:00.000Z","mime":"text/plain"}},"createdBy":{"id":"ClientID","domain":"ClientDomain"},"createdAt":"2011-06-06T18:00:00.000Z"}},"createdBy":{"id":"ClientID","domain":"ClientDomain"},"createdAt":"2011-06-06T18:00:00.000Z"}';
export const fileBlob = 'FILE BLOB!';

export const resource = {
  transactionId: '6f1dfa65-f92f-4c83-94ce-c2c2e5c3d79c',
  processId: 'PID',
  fileId: 'FID',
};

export const fileCreateProp = {
  accessableBy: ['Next1', 'Next2'],
  mime: 'text/plain',
  file: new Stream(),
  createdAt: '2011-06-06T18:00:00.000Z',
};

export const getClient = {
  valid: (): Client => {
    const client = new Client();
    client.id = 'ClientID';
    client.domain = 'ClientDomain';
    return client;
  },
  invalid: (): Client => {
    const client = new Client();
    client.id = 'invalidClientID';
    client.domain = 'invalidClientDomain';
    return client;
  },
  attacker: (): Client => {
    const client = new Client();
    client.id = 'Eve';
    client.domain = 'Attack!';
    return client;
  },
};

export const getTransaction = (
  withProcesses: Array<{ processId: string; process: Process }> = [],
): Transaction => {
  const transaction: Transaction = new Transaction();
  transaction.createdAt = new Date(fileCreateProp.createdAt);
  transaction.createdBy = getClient.valid();
  transaction.processes = new Map<string, Process>();
  for (const p of withProcesses) {
    transaction.processes.set(p.processId, p.process);
  }
  return transaction;
};
export const getProcess = (
  withFiles: Array<{ fileId: string; file: File }> = [],
): Process => {
  const process: Process = new Process();
  process.createdAt = new Date(fileCreateProp.createdAt);
  process.createdBy = getClient.valid();
  process.files = new Map<string, File>();
  for (const f of withFiles) {
    process.files.set(f.fileId, f.file);
  }
  return process;
};
export const getFile = (fileId: string): File => {
  const file: File = new File();
  file.name = fileId;
  file.createdAt = new Date(fileCreateProp.createdAt);
  file.accessableBy = [getClient.valid().domain];
  file.mime = fileCreateProp.mime;
  return file;
};

export const getDataStructure = (): {
  transaction: Transaction;
  process: Process;
  file: File;
} => {
  const processId = resource.processId;
  const fileId = resource.fileId;

  const file = getFile(fileId);
  const process = getProcess([{ fileId, file }]);
  const transaction = getTransaction([{ processId, process }]);
  return {
    transaction,
    process,
    file,
  };
};
