import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    const authorize = req.get('Authorization');

    const base64Str = authorize.match(/Basic\s(.*=)/);
    let field;
    if (base64Str) {
      // eslint-disable-next-line new-cap
      const buff = new Buffer.from(base64Str[1], 'base64');
      const convStr = buff.toString('utf8');

      const splitStr = convStr.split(':');
      field = {
        email: splitStr[0],
        password: sha1(splitStr[1]),
      };
    }
    const dbObj = await dbClient.getField('users', field);

    if (!dbObj || !field) {
      return res.status(401)
        .json({ error: 'Unauthorized' });
    }

    // get string representation of objectId
    const dbObjId = dbObj._id.toString();
    const token = uuidv4();
    const tokKey = `auth_${token}`;

    // set the token to userId for 24hours
    await redisClient.set(tokKey, dbObjId, 86400);
    return res.status(200)
      .json({ token });
  }

  static async getDisconnect(req, res) {
    // userId is present, delete tokenKey
    await redisClient.del(req.tokenKey);
    return res.status(204).send('\n');
  }
}
