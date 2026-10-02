import { parentPort, workerData } from 'node:worker_threads';
import { Readable } from 'node:stream';
import * as path from 'node:path';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { ImportRecord, ImportWorkerResult } from './import.types';

interface WorkerPayload {
  buffer: Uint8Array;
  filename: string;
}

async function normalizeXlsxNamespaces(input: Uint8Array): Promise<Uint8Array> {
  const archive = await JSZip.loadAsync(input);
  for (const [name, entry] of Object.entries(archive.files)) {
    if (entry.dir || !name.endsWith('.xml')) continue;
    const xml = await entry.async('string');
    const normalized = xml
      .replace(/xmlns:x=/g, 'xmlns=')
      .replace(/(<\/?\s*)x:/g, '$1');
    if (normalized !== xml) archive.file(name, normalized);
  }
  return archive.generateAsync({ type: 'uint8array' });
}

const aliases: Record<keyof ImportRecord, string[]> = {
  agentName: ['agent name', 'agent', 'agentName'],
  firstName: ['first name', 'user', 'username', 'firstName'],
  dob: ['DOB', 'date of birth'],
  address: ['address'],
  phoneNumber: ['phone number', 'phone', 'phoneNumber'],
  state: ['state'],
  zipCode: ['zip code', 'zip', 'postal code', 'zipCode'],
  email: ['email'],
  gender: ['gender'],
  userType: ['user type', 'userType'],
  accountName: ['account name', 'account'],
  categoryName: ['category name', 'category_name', 'policy category', 'LOB'],
  companyName: ['company name', 'company_name', 'policy carrier', 'carrier'],
  policyNumber: ['policy number', 'policyNumber'],
  policyStartDate: ['policy start date', 'start date', 'policyStartDate'],
  policyEndDate: ['policy end date', 'end date', 'policyEndDate'],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cellText(value: ExcelJS.CellValue): unknown {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'text' in value) return value.text;
  return value;
}

function asText(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}

function asDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const text = asText(value);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function parse(): Promise<ImportRecord[]> {
  const payload = workerData as WorkerPayload;
  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.from(payload.buffer);
  if (path.extname(payload.filename).toLowerCase() === '.csv') {
    await workbook.csv.read(Readable.from([buffer]));
  } else {
    const normalized = await normalizeXlsxNamespaces(buffer);
    await workbook.xlsx.load(normalized as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The workbook has no worksheet.');
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, column) => headers.set(normalizeHeader(cellText(cell.value)), column));

  const records: ImportRecord[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {} as ImportRecord;
    for (const [field, names] of Object.entries(aliases) as [keyof ImportRecord, string[]][]) {
      const column = names.map(normalizeHeader).map((name) => headers.get(name)).find((index) => index !== undefined);
      if (column === undefined) continue;
      const value = cellText(row.getCell(column).value);
      if (field === 'dob' || field === 'policyStartDate' || field === 'policyEndDate') {
        const date = asDate(value);
        if (date) Object.assign(record, { [field]: date });
      } else {
        const text = asText(value);
        if (text) Object.assign(record, { [field]: text });
      }
    }
    if (!Object.values(record).some((value) => value !== undefined)) return;
    if (!record.firstName) throw new Error('Row ' + rowNumber + ': First Name is required.');
    records.push(record);
  });
  return records;
}

void parse()
  .then((records) => parentPort?.postMessage({ records } satisfies ImportWorkerResult))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Could not parse the spreadsheet.';
    parentPort?.postMessage({ error: message } satisfies ImportWorkerResult);
  });
