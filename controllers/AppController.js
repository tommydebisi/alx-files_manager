import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export function getStatus(req, res) {
  const redisAlive = redisClient.isAlive();
  const dbAlive = dbClient.isAlive();

  res.status(200).json({
    redis: redisAlive,
    db: dbAlive,
  });
}

export async function getStats(req, res) {
  const userCount = await dbClient.nbUsers();
  const fileCount = await dbClient.nbFiles();

  res.status(200).json({
    users: userCount,
    files: fileCount,
  });
}
