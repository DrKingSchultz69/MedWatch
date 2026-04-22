import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  userId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  assignedDoctorId?: mongoose.Types.ObjectId;
  medicalHistory?: string[];
}

const patientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    phone: String,
    address: String,
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    assignedDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    medicalHistory: [String],
  },
  {
    timestamps: true,
  }
);

patientSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Patient = mongoose.model<IPatient>('Patient', patientSchema);
export default Patient;
