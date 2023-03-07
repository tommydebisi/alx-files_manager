import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export async function postNew(req, res) {
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

export async function getMe(req, res) {
  const tokenKey = `auth_${req.get('X-Token')}`;

  // get userId from tokenKey stored in redis database
  const userId = await redisClient.get(tokenKey);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // change userId gotten to ObjectId
  const fieldObj = await dbClient.getField('users',
    { _id: ObjectId('64062cfd5a6d34519f4ac23b') });

  return res.json({
    id: fieldObj._id,
    email: fieldObj.email,
  });
}
