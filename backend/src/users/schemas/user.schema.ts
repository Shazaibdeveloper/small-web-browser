// ============================================================================
// FILE: src/users/schemas/user.schema.ts
// ============================================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

/**
 * A person. The same collection holds both the people you can browse *as*
 * and the people who wrote the sites. There is no auth, no roles, no password.
 */
@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  name: string;

  @Prop({ trim: true, default: '' })
  bio: string;
}

export const UserSchema = SchemaFactory.createForClass(User);