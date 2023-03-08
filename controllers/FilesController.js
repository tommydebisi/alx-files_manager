import { mkdir, access, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { v4 } from 'uuid';
import { join } from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

const fileTypes = ['folder', 'file', 'image'];
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
      userId: ObjectId(req.userId),
      name,
      type,
      parentId: parentId === 0 ? parentId : ObjectId(parentId),
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

  static async getShow(req, res) {
    const { id } = req.params;
    const checkObj = { _id: ObjectId(id), userId: ObjectId(req.userId) };
    const fileObj = await dbClient.getField('files', checkObj);

    if (!fileObj) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({
      id: fileObj._id,
      userId: fileObj.userId,
      name: fileObj.name,
      type: fileObj.type,
      isPublic: fileObj.isPublic,
      parentId: fileObj.parentId,
    });
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
}
