import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Worker } from 'node:worker_threads';
import { extname, join } from 'node:path';
import { Model } from 'mongoose';
import {
  Account,
  Agent,
  Carrier,
  Lob,
  Policy,
  User,
} from '../database/schemas';
import { ImportRecord, ImportWorkerResult } from './import.types';

@Injectable()
export class UploadsService {
  constructor(
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Lob.name) private readonly lobModel: Model<Lob>,
    @InjectModel(Carrier.name) private readonly carrierModel: Model<Carrier>,
    @InjectModel(Policy.name) private readonly policyModel: Model<Policy>,
  ) {}

  async importFile(buffer: Buffer, filename: string): Promise<{ imported: number }> {
    const extension = extname(filename).toLowerCase();
    if (!['.xlsx', '.csv'].includes(extension)) {
      throw new BadRequestException('Upload an .xlsx or .csv file.');
    }
    const records = await this.parseInWorker(buffer, filename);
    for (const record of records) await this.saveRecord(record);
    return { imported: records.length };
  }

  private parseInWorker(buffer: Buffer, filename: string): Promise<ImportRecord[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(join(__dirname, 'import.worker.js'), {
        workerData: { buffer: new Uint8Array(buffer), filename },
      });
      let completed = false;
      worker.once('message', (result: ImportWorkerResult) => {
        completed = true;
        if ('error' in result) reject(new BadRequestException(result.error));
        else resolve(result.records);
      });
      worker.once('error', reject);
      worker.once('exit', (code) => {
        if (!completed && code !== 0) reject(new Error('Spreadsheet worker exited with code ' + code));
      });
    });
  }

  private async saveRecord(record: ImportRecord): Promise<void> {
    const agent = record.agentName
      ? await this.agentModel.findOneAndUpdate(
          { agentName: record.agentName },
          { $set: { agentName: record.agentName } },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
        ).exec()
      : null;
    const account = record.accountName
      ? await this.accountModel.findOneAndUpdate(
          { accountName: record.accountName },
          { $set: { accountName: record.accountName } },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
        ).exec()
      : null;
    const lob = record.categoryName
      ? await this.lobModel.findOneAndUpdate(
          { categoryName: record.categoryName },
          { $set: { categoryName: record.categoryName } },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
        ).exec()
      : null;
    const carrier = record.companyName
      ? await this.carrierModel.findOneAndUpdate(
          { companyName: record.companyName },
          { $set: { companyName: record.companyName } },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
        ).exec()
      : null;

    const userData = Object.fromEntries(
      Object.entries({
        firstName: record.firstName,
        dob: record.dob,
        address: record.address,
        phoneNumber: record.phoneNumber,
        state: record.state,
        zipCode: record.zipCode,
        email: record.email,
        gender: record.gender,
        userType: record.userType,
        agentId: agent?._id,
        accountId: account?._id,
      }).filter(([, value]) => value !== undefined),
    );
    const user = await this.userModel.findOneAndUpdate(
      record.email ? { email: record.email } : { firstName: record.firstName },
      { $set: userData },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    ).exec();

    if (record.policyNumber) {
      await this.policyModel.findOneAndUpdate(
        { policyNumber: record.policyNumber },
        {
          $set: {
            policyNumber: record.policyNumber,
            policyStartDate: record.policyStartDate,
            policyEndDate: record.policyEndDate,
            policyCategoryId: lob?._id,
            companyId: carrier?._id,
            userId: user._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
      ).exec();
    }
  }
}
