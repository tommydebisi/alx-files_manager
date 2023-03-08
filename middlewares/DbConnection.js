import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function waitConnection() {
  return new Promise((resolve, reject) => {
    let i = 0;
    const repeatFct = async () => {
      await setTimeout(() => {
        i += 1;
        if (i >= 10) {
          reject(Error('database not available'));
        } else if (!dbClient.isAlive() || !redisClient.isAlive()) {
          repeatFct();
        } else {
          resolve('good');
        }
      }, 1000);
    };
    repeatFct();
  });
}

/**
 * checks connection status of redis and mongodb database
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {*} next - next function
 */
export default async function conCheck(req, res, next) {
  try {
    const result = await waitConnection();
    if (result === 'good') next();
  } catch (e) {
    res.status(501).json({ error: 'Database not running' });
  }
}
