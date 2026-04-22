import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/express';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'medwatch-dev-secret';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: { message: 'Access denied. No token provided.', code: 'NO_TOKEN' },
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Verify user still exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({
        error: { message: 'User no longer exists.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: { message: 'Token expired.', code: 'TOKEN_EXPIRED' },
      });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: { message: 'Invalid token.', code: 'INVALID_TOKEN' },
      });
      return;
    }
    next(error);
  }
};

export default authMiddleware;
