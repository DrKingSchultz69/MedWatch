import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

/**
 * GET /api/users
 * Get users, optionally filtered by role
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.query;
    
    const filter: any = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-passwordHash').sort({ name: 1 });
    
    res.json(users);
  } catch (error) {
    next(error);
  }
};
