import { Request, Response, NextFunction } from 'express';
import VitalReading from '../models/VitalReading';
import mongoose from 'mongoose';
import { ApiError } from '../middleware/errorHandler';
import { generateVitals } from '../services/vitalsSimulator';

/**
 * GET /api/vitals/:patientId/history?limit=60
 * Get the last N vital readings for a patient
 */
export const getVitalsHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 60, 500);

    if (!patientId) {
      throw new ApiError('Patient ID is required', 400, 'MISSING_PATIENT_ID');
    }

    const readings = await VitalReading.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // Return in chronological order (oldest first) for chart display
    const chronological = readings.reverse().map((r) => ({
      timestamp: r.timestamp,
      heart_rate: r.heart_rate,
      spo2: r.spo2,
      temperature: r.temperature,
      respiration_rate: r.respiration_rate,
      bp_systolic: r.bp_systolic,
      bp_diastolic: r.bp_diastolic,
      patientName: (r as any).patientName || '',
    }));

    res.json(chronological);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vitals/all?limit=100
 * Get the latest vital readings across ALL patients (for doctor dashboard)
 */
export const getAllVitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const readings = await VitalReading.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const result = readings.map((r) => ({
      patientId: (r.patientId as any).toString(),
      patientName: (r as any).patientName || '',
      timestamp: r.timestamp,
      heart_rate: r.heart_rate,
      spo2: r.spo2,
      temperature: r.temperature,
      respiration_rate: r.respiration_rate,
      bp_systolic: r.bp_systolic,
      bp_diastolic: r.bp_diastolic,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vitals
 * Record a new vital reading (used by receptionist "Enter Vitals" form)
 */
export const recordVitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      patientId,
      patientName,
      heart_rate,
      spo2,
      temperature,
      respiration_rate,
      bp_systolic,
      bp_diastolic,
    } = req.body;

    if (!patientId) {
      throw new ApiError('Patient ID is required', 400, 'MISSING_PATIENT_ID');
    }

    const reading = await VitalReading.create({
      patientId,
      patientName,
      timestamp: Date.now(),
      heart_rate: heart_rate || 0,
      spo2: spo2 || 0,
      temperature: temperature || 0,
      respiration_rate: respiration_rate || 0,
      bp_systolic: bp_systolic || 0,
      bp_diastolic: bp_diastolic || 0,
    });

    res.status(201).json(reading);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vitals/:patientId/live
 * Generate the next simulated reading for a patient (polled by the frontend;
 * replaces the WebSocket stream, which serverless hosting can't keep open).
 */
export const getLiveVitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = String(req.params.patientId);
    const vitals = generateVitals(patientId);

    // Persist only if patientId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      try {
        await VitalReading.create({ patientId, ...vitals });
      } catch (err: any) {
        console.error('Failed to persist vital reading:', err.message);
      }
    }

    res.json(vitals);
  } catch (error) {
    next(error);
  }
};
