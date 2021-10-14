/* eslint-disable comma-dangle */
const { ObjectId } = require('mongodb');
const { v4 } = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(request, response) {
    const { 'x-token': xToken } = request.headers;
    const id = await redisClient.get(`auth_${xToken}`);
    const result = await dbClient.db
      .collection('users')
      .findOne({ _id: ObjectId(id) });
    if (!result) return response.status(401).send({ error: 'Unauthorized' });

    const {
      name,
      type,
      parentId = null,
      isPublic = false,
      data,
    } = request.body;
    const allowedTypes = ['folder', 'image', 'file'];
    if (!name) return response.status(400).send({ error: 'Missing name' });
    if (!type || !allowedTypes.includes(type)) {
      return response.status(400).send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return response.status(400).send({ error: 'Missing data' });
    }

    if (parentId !== null) {
      const parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return response.status(400).send({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return response.status(400).send({ error: 'Parent is not a folder' });
      }
    }
    // await dbClient.db.collection('files').findOneAndUpdate(
    //   { _id: ObjectId(parentId) },
    //   {
    //     userId: id,
    //   }
    // );

    if (type === 'folder') {
      const newFile = await dbClient.db.collection('files').insertOne({
        userId: id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });

      return response.status(201).send({
        id: newFile.insertedId,
        userId: id,
        name,
        type,
        isPublic,
        parentId,
      });
    }
    const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    const buff = Buffer.from(data, 'base64');
    const text = buff.toString('ascii');
    const localPath = `${filePath}/${v4()}`;
    await fs.writeFile(localPath, text, (err) => {
      if (err) throw err;
    });

    const newFile = await dbClient.db.collection('files').insertOne({
      userId: id,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
      localPath,
    });
    return response.status(201).send({
      id: newFile.insertedId,
      userId: id,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    });
  }
}
module.exports = FilesController;
