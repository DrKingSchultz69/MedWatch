import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  doctorId: mongoose.Types.ObjectId;
  doctorName: string;
  date: string;    // YYYY-MM-DD
  time: string;    // HH:mm
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
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
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

// Transform _id to id to match frontend Appointment interface
appointmentSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    ret.patientId = ret.patientId.toString();
    ret.doctorId = ret.doctorId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
export default Appointment;
