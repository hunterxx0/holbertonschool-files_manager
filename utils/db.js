/* eslint-disable comma-dangle */
const { MongoClient } = require('mongodb');

// const url =
//   'mongodb+srv://m001-student:m001-mongodb-basics@sandbox.w9kej.mongodb.net';
// `mongodb://${host}:${port}`
class DBClient {
  constructor(host = 'localhost', port = 27017, database = 'files_manager') {
    (async () => {
      this.client = await MongoClient.connect(
        `mongodb://${host}:${port}`,
        { useUnifiedTopology: true, authSource: 'admin' },
        (err, client) => {
          if (err) throw err;
          this.connect = client.isConnected();
          this.db = client.db(database);
        }
      );
    })();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient(
  process.env.DB_HOST,
  process.env.DB_PORT,
  process.env.DB_DATABASE
);
module.exports = dbClient;
