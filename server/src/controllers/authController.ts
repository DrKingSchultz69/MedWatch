import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { ApiError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'medwatch-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for a user
 */
const generateToken = (user: { id: string; email: string; name: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, role, specialty } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      specialty,
    });

    const userJson = user.toJSON();
    const token = generateToken({ id: userJson.id, email: userJson.email, name: userJson.name, role: userJson.role });

    res.status(201).json({
      token,
      user: userJson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email (include passwordHash for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const userJson = user.toJSON();
    const token = generateToken({ id: userJson.id, email: userJson.email, name: userJson.name, role: userJson.role });

    res.json({
      token,
      user: userJson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout user (client-side token deletion; optionally implement blacklist)
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // JWT is stateless — client should delete the token
  // For production, implement a token blacklist with Redis
  res.json({ message: 'Logged out successfully' });
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};
