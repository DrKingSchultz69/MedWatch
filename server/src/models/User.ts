import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
  avatar?: string;
  specialty?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['DOCTOR', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST'],
    },
    avatar: {
      type: String,
      default: undefined,
    },
    specialty: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Transform _id to id in JSON output and strip passwordHash
userSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
