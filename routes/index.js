import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';

const router = express.Router();

router.route('/status').get(getStatus);
router.route('/stats').get(getStats);

export default router;
