import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.route('/status').get(AppController.getStatus);
router.route('/stats').get(AppController.getStats);
router.route('/users/me').get(UsersController.getMe);
router.route('/connect').get(AuthController.getConnect);
router.route('/disconnect').get(AuthController.getDisconnect);
router.route('/users').post(UsersController.postNew);
router.route('/files').post(FilesController.postUpload);

export default router;
