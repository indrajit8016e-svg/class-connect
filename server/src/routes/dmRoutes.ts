import express from 'express';
import { getDMFeed, getDMsWithUser, sendDM } from '../controllers/dmController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/feed', getDMFeed);
router.get('/:otherUserId', getDMsWithUser);
router.post('/', sendDM);

export default router;
