import express from 'express';
import { createGroup, getGroups, joinGroup, getGroupMembers, leaveGroup } from '../controllers/groupController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createGroup);
router.get('/', getGroups);
router.post('/join', joinGroup);
router.delete('/:id/leave', leaveGroup);
router.get('/:id/members', getGroupMembers);

export default router;
