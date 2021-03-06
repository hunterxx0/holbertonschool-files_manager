const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });
    if (!dbClient.db) return response.status(400).send({ error: 'Already exist' });
    const result = await dbClient.db.collection('users').findOne({ email });
    if (result) {
      return response.status(400).send({ error: 'Already exist' });
    }
    const res = await dbClient.db.collection('users').insertOne({
      email,
      password: sha1(password),
    });

    return response.status(201).send({ id: res.insertedId, email });
  }
}

module.exports = UsersController;
