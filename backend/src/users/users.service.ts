// ============================================================================
// FILE: src/users/users.service.ts
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll() {
    const users = await this.userModel
      .find({}, { name: 1, bio: 1 })
      .sort({ name: 1 })
      .lean();

    return users.map((u) => ({
      id: String(u._id),
      name: u.name,
      bio: u.bio ?? '',
    }));
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No such person.');
    }

    const user = await this.userModel.findById(id, { name: 1, bio: 1 }).lean();
    if (!user) {
      throw new NotFoundException('No such person.');
    }

    return { id: String(user._id), name: user.name, bio: user.bio ?? '' };
  }
}