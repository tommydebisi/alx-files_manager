import Queue from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

fileQueue.process('fileQueue', (job) => {
  const { fileId, userId } = job.data;

  async function checkImage() {
    if (!fileId) throw Error('Missing fileId');

    if (!userId) throw Error('Missing userId');

    const fieldObj = await dbClient.getField('files', {
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!fieldObj) throw Error('File not found');
  }
});

