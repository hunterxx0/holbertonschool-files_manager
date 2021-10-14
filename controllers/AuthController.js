const sha1 = require('sha1');
const { v4 } = require('uuid');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(request, response) {
    const { authorization } = request.headers;
    const logBase = authorization.split(' ')[1];
    const buff = Buffer.from(logBase, 'base64');
    const text = buff.toString('ascii');
    const [email, password] = text.split(':');
    let result;
    if (email && password) {
      const pass = sha1(password);
      result = await dbClient.db
        .collection('users')
        .findOne({ email, password: pass });
    }
    if (!result) return response.status(401).send({ error: 'Unauthorized' });
    const token = v4();
    const key = `auth_${token}`;
    await redisClient.set(key, result._id.toString(), 86400);

    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    const { 'x-token': xToken } = request.headers;
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    await redisClient.del(`auth_${xToken}`);
    return response.status(204).send('');
  }

  static async getMe(request, response) {
    const { 'x-token': xToken } = request.headers;
    const id = await redisClient.get(`auth_${xToken}`);
    const result = await dbClient.db
      .collection('users')
      .findOne({ _id: ObjectId(id) });
    if (!result) return response.status(401).send({ error: 'Unauthorized' });
    return response.status(200).send({ id, email: result.email });
  }
}

module.exports = AuthController;
