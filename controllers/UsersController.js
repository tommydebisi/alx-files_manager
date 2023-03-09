import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

export default class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400)
        .json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400)
        .json({ error: 'Missing password' });
    }

    const fieldObj = await dbClient.getField('users', { email });

    if (fieldObj) {
      return res.status(400)
        .json({ error: 'Already exist' });
    }

    const result = await dbClient.insertCol('users', {
      email,
      password: sha1(password),
    });
    const newObj = result;
    return res.status(201)
      .json({
        id: newObj._id,
        email: newObj.email,
      });
  }

  static async getMe(req, res) {
    // change userId gotten to ObjectId
    const fieldObj = await dbClient.getField('users',
      { _id: ObjectId(req.userId) });

    return res.status(200).json({
      id: fieldObj._id.toString(),
      email: fieldObj.email,
    });
  }
}
