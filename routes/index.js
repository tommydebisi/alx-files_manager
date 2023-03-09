import express from 'express';
import AppController from '../controllers/AppController';
import UserController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import connectionCheck from '../middlewares/DbConnection';
import authToken from '../middlewares/authToken';

const router = express.Router();

router.route('/status').get(AppController.getStatus);
router.get('/stats', AppController.getStats);
router.route('/users/me').get(connectionCheck, authToken, UserController.getMe);
router.route('/connect').get(connectionCheck, AuthController.getConnect);
router.route('/disconnect').get(connectionCheck, authToken, AuthController.getDisconnect);
router.route('/users').post(connectionCheck, UserController.postNew);
router.route('/files').post(connectionCheck, authToken, FilesController.postUpload)
  .get(connectionCheck, authToken, FilesController.getindex);
router.route('/files/:id').get(connectionCheck, authToken, FilesController.getShow);
router.route('/files/:id/publish').put(connectionCheck, authToken, FilesController.putPublish);
router.route('/files/:id/unpublish').put(connectionCheck, authToken, FilesController.putUnpublish);
router.route('/files/:id/data').get(connectionCheck, FilesController.getFile);

export default router;
