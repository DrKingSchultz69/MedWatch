import mongoose, { Document, Schema } from 'mongoose';

export interface IVitalReading extends Document {
  patientId: mongoose.Types.ObjectId;
  patientName?: string;
  timestamp: number;
  heart_rate: number;
  spo2: number;
  temperature: number;
  respiration_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
}

const vitalReadingSchema = new Schema<IVitalReading>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientName: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Number,
      required: true,
    },
    heart_rate: {
      type: Number,
      required: true,
    },
    spo2: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    respiration_rate: {
      type: Number,
      required: true,
    },
    bp_systolic: {
      type: Number,
      required: true,
    },
    bp_diastolic: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient time-series queries
vitalReadingSchema.index({ patientId: 1, timestamp: -1 });

// Transform for JSON output
vitalReadingSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret._id;
    delete ret.__v;
    ret.patientId = ret.patientId.toString();
    return ret;
  },
});

export const VitalReading = mongoose.model<IVitalReading>('VitalReading', vitalReadingSchema);
export default VitalReading;
