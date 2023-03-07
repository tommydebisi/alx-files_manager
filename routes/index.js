import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import postNew from '../controllers/UsersController';

const router = express.Router();

router.route('/status').get(getStatus);
router.route('/stats').get(getStats);
router.route('/users').post(postNew);

export default router;
