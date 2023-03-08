import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import connectionCheck from '../middlewares/DbConnection';
import authToken from '../middlewares/authToken';

const router = express.Router();

router.route('/status').get(connectionCheck, AppController.getStatus);
router.route('/stats').get(connectionCheck, AppController.getStats);
router.route('/users/me').get(connectionCheck, authToken, UsersController.getMe);
router.route('/connect').get(connectionCheck, AuthController.getConnect);
router.route('/disconnect').get(connectionCheck, authToken, AuthController.getDisconnect);
router.route('/users').post(connectionCheck, UsersController.postNew);
router.route('/files').post(connectionCheck, authToken, FilesController.postUpload)
  .get(connectionCheck, authToken, FilesController.getindex);
router.route('/files/:id').get(connectionCheck, authToken, FilesController.getShow);

export default router;
