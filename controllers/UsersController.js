import sha1 from 'sha1';
import dbClient from '../utils/db';

export default async function postNew(req, res) {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400)
      .json({ error: 'Missing email' });
  }

  if (!password) {
    return res.status(400)
      .json({ error: 'Missing password' });
  }

  const isPresent = await dbClient.fieldPresent('users', { email });

  if (isPresent) {
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
