import { Request, Response, NextFunction } from 'express';

type UserRole = 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';

/**
 * Role-based access control middleware.
 * Usage: roleMiddleware('DOCTOR', 'RECEPTIONIST')
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
export const roleMiddleware = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { message: 'Authentication required.', code: 'NOT_AUTHENTICATED' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_ROLE',
        },
      });
      return;
    }

    next();
  };
};

export default roleMiddleware;
