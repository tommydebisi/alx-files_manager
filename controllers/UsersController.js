import sha1 from 'sha1';
import dbClient from '../utils/db';

export default async function postNew(req, res) {
  const { email, password } = req.body;
  if (!email) {
    res.status(400)
      .json({ error: 'Missing email' });
  }

  if (!password) {
    res.status(400)
      .json({ error: 'Missing password' });
  }

  const isPresent = await dbClient.fieldPresent('users', { email });

  if (isPresent) {
    res.status(400)
      .json({ error: 'Already exist' });
  } else {
    const result = await dbClient.insertCol('users', {
      email,
      password: sha1(password),
    });

    const newObj = result;
    res.status(201)
      .json({
        id: newObj._id,
        email: newObj.email,
      });
  }
}
