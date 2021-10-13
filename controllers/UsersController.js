const crypto = require('crypto');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });
    const result = await dbClient.db.collection('users').findOne({ email });
    if (result && result.email === email) {
      return response.status(400).send({ error: 'Already exist' });
    }
    const shasum = crypto.createHash('sha1');
    shasum.update(password);
    const pass = shasum.digest('hex');
  	let _id;
  	await dbClient.db.collection('users').insertOne({ email, password: pass }, (err, res) => {
  		_id = res.insertedId;
  	});

    return response.status(201).send({ id: _id, email });
  }
}

module.exports = UsersController;
