import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User';
import Appointment from '../models/Appointment';
import Prescription from '../models/Prescription';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medwatch';

// ═══════════════════════════════════════════════════════
// Demo Users (matching frontend exactly)
// ═══════════════════════════════════════════════════════
const DEMO_USERS = [
  {
    email: 'doctor@hospital.com',
    password: 'doctor123',
    name: 'Dr. Sarah Chen',
    role: 'DOCTOR' as const,
  },
  {
    email: 'receptionist@hospital.com',
    password: 'reception123',
    name: 'Maria Santos',
    role: 'RECEPTIONIST' as const,
  },
  {
    email: 'patient@hospital.com',
    password: 'patient123',
    name: 'John Doe',
    role: 'PATIENT' as const,
  },
  {
    email: 'pharmacist@hospital.com',
    password: 'pharma123',
    name: 'James Wilson',
    role: 'PHARMACIST' as const,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting seed...');
    console.log(`📦 Connecting to: ${MONGO_URI}`);

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Seed Users ─────────────────────────────────
    const userIds: Record<string, mongoose.Types.ObjectId> = {};

    for (const userData of DEMO_USERS) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`  ⏭️  User already exists: ${userData.email}`);
        userIds[userData.role] = existing._id as mongoose.Types.ObjectId;
        continue;
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      const user = await User.create({
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
      });

      userIds[userData.role] = user._id as mongoose.Types.ObjectId;
      console.log(`  ✅ Created user: ${userData.name} (${userData.role})`);
    }

    // If users existed already, ensure we have all IDs
    if (!userIds['DOCTOR']) {
      const doc = await User.findOne({ email: 'doctor@hospital.com' });
      if (doc) userIds['DOCTOR'] = doc._id as mongoose.Types.ObjectId;
    }
    if (!userIds['PATIENT']) {
      const pat = await User.findOne({ email: 'patient@hospital.com' });
      if (pat) userIds['PATIENT'] = pat._id as mongoose.Types.ObjectId;
    }

    // ── Seed Appointments ──────────────────────────
    const appointmentCount = await Appointment.countDocuments();
    if (appointmentCount === 0) {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      const appointments = [
        {
          patientName: 'John Doe',
          patientId: userIds['PATIENT'],
          doctorName: 'Dr. Sarah Chen',
          doctorId: userIds['DOCTOR'],
          date: today,
          time: '09:00',
          status: 'scheduled' as const,
          type: 'Check-up',
        },
        {
          patientName: 'Jane Smith',
          patientId: userIds['PATIENT'], // Using same patient for demo
          doctorName: 'Dr. Sarah Chen',
          doctorId: userIds['DOCTOR'],
          date: today,
          time: '10:30',
          status: 'in-progress' as const,
          type: 'Follow-up',
        },
        {
          patientName: 'Robert Brown',
          patientId: userIds['PATIENT'],
          doctorName: 'Dr. Sarah Chen',
          doctorId: userIds['DOCTOR'],
          date: today,
          time: '14:00',
          status: 'scheduled' as const,
          type: 'Consultation',
        },
        {
          patientName: 'Emily Davis',
          patientId: userIds['PATIENT'],
          doctorName: 'Dr. Sarah Chen',
          doctorId: userIds['DOCTOR'],
          date: today,
          time: '15:30',
          status: 'completed' as const,
          type: 'Lab Review',
        },
      ];

      await Appointment.insertMany(appointments);
      console.log(`  ✅ Created ${appointments.length} sample appointments`);
    } else {
      console.log(`  ⏭️  Appointments already exist (${appointmentCount} found)`);
    }

    // ── Seed Prescriptions ─────────────────────────
    const prescriptionCount = await Prescription.countDocuments();
    if (prescriptionCount === 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const prescriptions = [
        {
          patientName: 'John Doe',
          patientId: userIds['PATIENT'],
          doctorName: 'Dr. Sarah Chen',
          doctorId: userIds['DOCTOR'],
          date: today,
          diagnosis: 'Upper respiratory infection',
          medications: [
            { name: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '7 days' },
            { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', duration: '5 days' },
          ],
          status: 'pending' as const,
        },
        {
          patientName: 'Jane Smith',
          patientId: userIds['PATIENT'],
          doctorName: 'Dr. Sarah Chen',
          doctorId: userIds['DOCTOR'],
          date: yesterday,
          diagnosis: 'Type 2 Diabetes management',
          medications: [
            { name: 'Metformin', dosage: '1000mg', frequency: '2x daily', duration: '30 days' },
          ],
          status: 'dispensed' as const,
        },
      ];

      await Prescription.insertMany(prescriptions);
      console.log(`  ✅ Created ${prescriptions.length} sample prescriptions`);
    } else {
      console.log(`  ⏭️  Prescriptions already exist (${prescriptionCount} found)`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('  ┌─────────────────────────────┬───────────────┬──────────────┐');
    console.log('  │ Email                       │ Password      │ Role         │');
    console.log('  ├─────────────────────────────┼───────────────┼──────────────┤');
    console.log('  │ doctor@hospital.com         │ doctor123     │ DOCTOR       │');
    console.log('  │ receptionist@hospital.com   │ reception123  │ RECEPTIONIST │');
    console.log('  │ patient@hospital.com        │ patient123    │ PATIENT      │');
    console.log('  │ pharmacist@hospital.com     │ pharma123     │ PHARMACIST   │');
    console.log('  └─────────────────────────────┴───────────────┴──────────────┘');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
