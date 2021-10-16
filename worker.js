const imageThumbnail = require('image-thumbnail');
const Bull = require('bull');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const dbClient = require('./utils/db');

const fileQueue = new Bull();

fileQueue.process(async (job) => {
  const { userId, fileId } = job;
  if (!fileId) throw Error('Missing fileId');
  if (!userId) throw Error('Missing userId');
  const file = await dbClient.db
    .collection('files')
    .findOne({ _id: ObjectId(fileId), userId });
  if (!file) throw Error('File not found');
  try {
    const thumbnail100 = await imageThumbnail(file.localPath, { width: 100 });
    const thumbnail250 = await imageThumbnail(file.localPath, { width: 250 });
    const thumbnail500 = await imageThumbnail(file.localPath, { width: 500 });
    await fs.writeFile(`${file.localPath}_100`, thumbnail100);
    await fs.writeFile(`${file.localPath}_250`, thumbnail250);
    await fs.writeFile(`${file.localPath}_500`, thumbnail500);
  } catch (err) {
    console.error(err);
  }
});
