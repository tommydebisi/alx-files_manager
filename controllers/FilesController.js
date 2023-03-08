import { mkdir, access, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { v4 } from 'uuid';
import { join } from 'path';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fileTypes = ['folder', 'file', 'image'];
export default class FilesController {
  static async postUpload(req, res) {
    const tokenKey = `auth_${req.get('X-Token')}`;

    const userId = await redisClient.get(tokenKey);
    if (!userId) {
      return res.status(401)
        .json({ error: 'Unauthorized' });
    }

    const { name, type, data } = req.body;
    const isPublic = req.body.isPublic || false;
    const parentId = req.body.parentId || 0;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    if (!type || !(fileTypes.includes(type))) return res.status(400).json({ error: 'Missing type' });

    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (parentId) {
      const fileObj = await dbClient.getField('files', { _id: ObjectId(parentId) });

      if (!fileObj) return res.status(400).json({ error: 'Parent not found' });
      if (fileObj.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const insertResult = await dbClient.insertCol('files', {
        userId: ObjectId(userId),
        name,
        type,
        parentId,
        isPublic,
      });

      return res.status(201).json({
        id: insertResult._id.toString(),
        userId: insertResult.userId.toString(),
        name: insertResult.name,
        type: insertResult.type,
        isPublic: insertResult.isPublic,
        parentId: insertResult.parentId,
      });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    try {
      // check if folder is accessible, if not an error is raised
      // eslint-disable-next-line no-bitwise
      await access(folderPath, constants.R_OK | constants.W_OK | constants.X_OK);
    } catch (e) {
      // create directories recursively
      await mkdir(folderPath, { recursive: true });
    }

    // eslint-disable-next-line new-cap
    const buff = new Buffer.from(data, 'base64');
    const content = buff.toString('utf8');

    const uniqueFile = v4();
    const localPath = join(folderPath, uniqueFile);
    await writeFile(localPath, content);

    const result = await dbClient.insertCol('files', {
      userId: ObjectId(userId),
      name,
      type,
      parentId,
      isPublic,
      localPath,
    });

    return res.status(201)
      .json({
        id: result._id.toString(),
        userId: result.userId.toString(),
        name: result.name,
        type: result.type,
        isPublic: result.isPublic,
        parentId: result.parentId,
      });
  }
}
