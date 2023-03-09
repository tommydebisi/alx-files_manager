import {
  mkdir, access, writeFile, readFile,
} from 'fs/promises';
import { constants, access as checkExists } from 'fs';
import { v4 } from 'uuid';
import { join } from 'path';
import { ObjectId } from 'mongodb';
import { lookup } from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fileTypes = ['folder', 'file', 'image'];

function _screenFile(objField) {
  const field = { ...objField };
  field.id = field._id;
  delete field._id;
  delete field.localPath;
  return field;
}

export default class FilesController {
  static async postUpload(req, res) {
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
        userId: ObjectId(req.userId),
        name,
        type,
        parentId: parentId === 0 ? parentId : ObjectId(parentId),
        isPublic,
      });

      return res.status(201).json(_screenFile(insertResult));
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
      userId: ObjectId(req.userId),
      name,
      type,
      parentId: parentId === 0 ? parentId : ObjectId(parentId),
      isPublic,
      localPath,
    });

    return res.status(201).json(_screenFile(result));
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const checkObj = { _id: ObjectId(id), userId: ObjectId(req.userId) };
    const fileObj = await dbClient.getField('files', checkObj);

    if (!fileObj) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json(_screenFile(fileObj));
  }

  static async getindex(req, res) {
    const { parentId, page } = req.query;

    if (parentId) {
      // get one field to check if user has a folder with parentId
      const checkObj = { _id: ObjectId(parentId), userId: ObjectId(req.userId), type: 'folder' };
      const oneField = await dbClient.getField('files', checkObj);

      // no folder present
      if (!oneField) return res.status(200).json([]);

      const allParentId = await dbClient.getAll('files', {
        parentId: ObjectId(parentId), userId: ObjectId(req.userId),
      },
      { page: 0 });

      return res.status(200).json(allParentId);
    }

    // paginate the files present for a user
    const pageCount = page || 0;
    const allFiles = await dbClient.getAll('files', { userId: ObjectId(req.userId) }, { page: pageCount });
    return res.status(200).json(allFiles);
  }

  static async putPublish(req, res) {
    const { id } = req.params;

    const objField = await dbClient.getField('files',
      { _id: ObjectId(id), userId: ObjectId(req.userId) });

    if (!objField) return res.status(404).json({ error: 'Not found' });

    await dbClient.updateField('files',
      { _id: ObjectId(id), userId: ObjectId(req.userId) }, { isPublic: true });

    objField.isPublic = true;

    return res.status(200).json(_screenFile(objField));
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;

    const objField = await dbClient.getField('files',
      { _id: ObjectId(id), userId: ObjectId(req.userId) });

    if (!objField) return res.status(404).json({ error: 'Not found' });

    await dbClient.updateField('files',
      { _id: ObjectId(id), userId: ObjectId(req.userId) }, { isPublic: false });

    objField.isPublic = false;

    return res.status(200).json(_screenFile(objField));
  }

  // eslint-disable-next-line consistent-return
  static async getFile(req, res) {
    const { id } = req.params;
    const tokenKey = `auth_${req.get('X-Token')}`;

    const userId = await redisClient.get(tokenKey);

    const fieldObj = await dbClient.getField('files', { _id: ObjectId(id) });

    if (!fieldObj) return res.status(404).json({ error: 'Not found' });

    if (!fieldObj.isPublic && !userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (fieldObj.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!fieldObj.localPath) return res.status(400).json({ error: 'Not found' });
    // eslint-disable-next-line consistent-return
    checkExists(fieldObj.localPath, constants.F_OK, (err) => {
      if (err) return res.status(400).json({ error: 'Not found' });
    });
    try {
      const mimetype = lookup(fieldObj.name);
      const readData = await readFile(fieldObj.localPath);

      res.setHeader('Content-Length', readData.length);
      return res.type(mimetype).send(readData);
    } catch (error) {
      res.status(404).json({ error: "File couldn't be read" });
    }
  }
}
