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
  transactionId: string,
  withProcesses: Array<Process> = [],
): Transaction => {
  const transaction: Transaction = new Transaction();
  transaction.id = transactionId;
  transaction.createdAt = new Date('2011-06-06T18:00:00.000Z');
  transaction.createdBy = getClient.valid();
  transaction.processes = new Map<string, Process>();
  withProcesses.forEach((process: Process) => {
    transaction.processes.set(process.id, process);
  });
  return transaction;
};
export const getProcess = (
  transactionId: string,
  processId: string,
  withFiles: Array<File> = [],
): Process => {
  const process: Process = new Process();
  process.id = processId;
  process.createdAt = new Date('2011-06-06T18:00:00.000Z');
  process.createdBy = getClient.valid();
  process.files = new Map<string, File>();
  withFiles.forEach((file: File) => {
    process.files.set(file.id, file);
  });
  return process;
};
export const getFile = (
  transactionId: string,
  processId: string,
  fileId: string,
): File => {
  const file: File = new File();
  (file.id = fileId), (file.name = fileId);
  file.createdAt = new Date('2011-06-06T18:00:00.000Z');
  file.accessableBy = [getClient.valid().domain];
  file.mime = 'text/plain';
  return file;
};

export const getDataStructure = (): {
  transaction: Transaction;
  process: Process;
  file: File;
} => {
  const file = getFile(
    resource.transactionId,
    resource.processId,
    resource.fileId,
  );
  const process = getProcess(resource.transactionId, resource.processId, [
    file,
  ]);
  const transaction = getTransaction(resource.transactionId, [process]);
  return {
    transaction,
    process,
    file,
  };
};
