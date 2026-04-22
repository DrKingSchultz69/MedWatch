import mongoose, { Document, Schema } from 'mongoose';

export interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface IPrescription extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  doctorId: mongoose.Types.ObjectId;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: IMedication[];
  status: 'pending' | 'dispensed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const medicationSchema = new Schema<IMedication>(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
  },
  { _id: false }
);

const prescriptionSchema = new Schema<IPrescription>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    medications: {
      type: [medicationSchema],
      required: true,
      validate: {
        validator: (v: IMedication[]) => v.length > 0,
        message: 'At least one medication is required',
      },
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'dispensed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ status: 1 });

// Transform _id to id to match frontend Prescription interface
prescriptionSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    ret.patientId = ret.patientId.toString();
    ret.doctorId = ret.doctorId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Prescription = mongoose.model<IPrescription>('Prescription', prescriptionSchema);
export default Prescription;
