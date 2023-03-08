import redisClient from '../utils/redis';

export default async function authToken(req, res, next) {
  const tokenKey = `auth_${req.get('X-Token')}`;

  const userId = await redisClient.get(tokenKey);
  if (!userId) {
    return res.status(401)
      .json({ error: 'Unauthorized' });
  }
  req.tokenKey = tokenKey;
  req.userId = userId;
  return next();
}
