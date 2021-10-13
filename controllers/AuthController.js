const sha1 = require('sha1');
import decode from 'decode-base64';
const { uuid } = require('uuidv4');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');


class AuthController {
  static async getConnect(request, response) {
    const { authorization } = request.headers;
    const logBase = authorization.split(' ')[1]
    //const log = decode(logBase);
    let buff = new Buffer(logBase, 'base64');
    let text = buff.toString('ascii');
    const [email, password] = text.split(':'); 
    const pass = sha1(password);
    const result = await dbClient.db.collection('users').findOne({ email, password: pass });
    if (!result) return response.status(401).send({ error: 'Unauthorized' });
    const token = uuid();
    const key = `auth_${token}`;
    await redisClient.set(key, result.insertedId, 60*60*24);

    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    const { email, password } = request.body;
  }
}

module.exports = AuthController;
