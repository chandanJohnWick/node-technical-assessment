import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Policy, User } from '../database/schemas';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectModel(Policy.name) private readonly policyModel: Model<Policy>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async searchByFirstName(username: string) {
    const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await this.userModel.find({ firstName: new RegExp('^' + escaped + '$', 'i') }).exec();
    const policies = await this.policyModel
      .find({ userId: { $in: users.map((user) => user._id) } })
      .populate('policyCategoryId')
      .populate('companyId')
      .populate('userId')
      .exec();
    return { username, count: policies.length, policies };
  }

  aggregateByUser() {
    return this.policyModel
      .aggregate([
        { $group: { _id: '$userId', policyCount: { $sum: 1 }, policies: { $push: '$$ROOT' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, user: 1, policyCount: 1, policies: 1 } },
      ])
      .exec();
  }
}
