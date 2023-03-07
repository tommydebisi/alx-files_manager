import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { postNew, getMe } from '../controllers/UsersController';
import { getConnect, getDisconnect } from '../controllers/AuthController';
import postUpload from '../controllers/FilesController';

const router = express.Router();

router.route('/status').get(getStatus);
router.route('/stats').get(getStats);
router.route('/users/me').get(getMe);
router.route('/connect').get(getConnect);
router.route('/disconnect').get(getDisconnect);
router.route('/users').post(postNew);
router.route('/files').post(postUpload);

export default router;
