/* eslint-disable object-curly-newline */
/* eslint-disable comma-dangle */
const { ObjectId } = require('mongodb');
const { v4 } = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async retrieveUserId(request, response) {
    const { 'x-token': xToken } = request.headers;
    const id = await redisClient.get(`auth_${xToken}`);
    const result = await dbClient.db
      .collection('users')
      .findOne({ _id: ObjectId(id) });
    if (!result) return response.status(401).send({ error: 'Unauthorized' });
    return id;
  }

  static async postUpload(request, response) {
    const id = await FilesController.retrieveUserId(request, response);
    const { name, type, parentId = 0, isPublic = false, data } = request.body;
    const allowedTypes = ['folder', 'image', 'file'];
    if (!name) return response.status(400).send({ error: 'Missing name' });
    if (!type || !allowedTypes.includes(type)) {
      return response.status(400).send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return response.status(400).send({ error: 'Missing data' });
    }

    if (parentId) {
      const parentFolder = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parentFolder) {
        return response.status(400).send({ error: 'Parent not found' });
      }
      if (parentFolder.type !== 'folder') {
        return response.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    const bodyObj = { userId: id, name, type, isPublic, parentId };

    if (type === 'folder') {
      const folder = await dbClient.db.collection('files').insertOne(bodyObj);

      return response.status(201).send({
        id: folder.insertedId,
        ...bodyObj,
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

    const newFile = await dbClient.db
      .collection('files')
      .insertOne({ ...bodyObj, localPath });
    return response.status(201).send({
      id: newFile.insertedId,
      ...bodyObj,
      localPath,
    });
  }

  static async getShow(request, response) {
    const userId = await FilesController.retrieveUserId(request, response);
    const { id = '' } = request.params;
    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(id), userId });
    if (!file) return response.status(404).send({ error: 'Not found' });

    const { _id, userId: uid, name, type, isPublic, parentId } = file;
    return response
      .status(201)
      .send({ id: _id, userId: uid, name, type, isPublic, parentId });
  }

  static async getIndex(request, response) {
    const { parentId = 0, page = 0 } = request.query;
    await FilesController.retrieveUserId(request, response);
    const results = await dbClient.db
      .collection('files')
      .aggregate([
        { $match: { parentId } },
        { $skip: page * 20 },
        { $limit: 20 },
      ])
      .toArray();
    const cleanResults = results.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));
    return response.status(201).send(cleanResults);
  }
}
module.exports = FilesController;
