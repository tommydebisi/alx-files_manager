import { mkdir, access, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { v4 } from 'uuid';
import { join } from 'path';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default async function postUpload(req, res) {
  const tokenKey = `auth_${req.get('X-Token')}`;

  const userId = await redisClient.get(tokenKey);
  if (!userId) {
    return res.status(401)
      .json({ error: 'Unauthorized' });
  }

  const {
    name, type, parentId, isPublic, data,
  } = req.body;

  if (!name) { return res.status(400).json({ error: 'Missing name' }); }

  if (!type || !(['folder', 'file', 'image'].includes(type))) {
    return res.status(400)
      .json({ error: 'Missing type' });
  }

  if (!data && type !== 'folder') { return res.status(400).json({ error: 'Missing data' }); }

  if (parentId) {
    const fileObj = await dbClient.getField('files', { _id: ObjectId(parentId) });
    if (!fileObj) { return res.status(400).json({ error: 'Parent not found' }); }
    if (fileObj.type !== 'folder') { return res.status(400).json({ error: 'Parent is not a folder' }); }
  }

  if (type === 'folder') {
    const insertResult = await dbClient.insertCol('files', {
      userId: ObjectId(userId),
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
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
    console.log('here');
    await mkdir(folderPath, { recursive: true });
  }

  // eslint-disable-next-line new-cap
  const buff = new Buffer.from(data, 'base64');
  const content = buff.toString('utf8');

  const uniqueFile = v4();
  const filePath = join(folderPath, uniqueFile);
  await writeFile(filePath, content);

  const result = await dbClient.insertCol('files', {
    userId: ObjectId(userId),
    name,
    type,
    parentId: parentId || 0,
    isPublic: isPublic || false,
    localPath: filePath,
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
