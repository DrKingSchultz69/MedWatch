import { Router } from 'express';
import { getUsers } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Require authentication for all user routes
router.use(authMiddleware);

// Routes
router.get('/', getUsers);

export default router;
