const { MongoClient } = require('mongodb');
class DBClient {
  constructor(host = 'localhost', port = 27017, database = 'files_manager') {
    MongoClient.connect(`mongodb://${host}:${port}`, { useUnifiedTopology: true, authSource: 'admin' }, (err, client) => {
      if (err) throw err;
      this.connect = client.isConnected();
      this.db = client.db(database);
    });
  }

  isAlive() {
    if (this.db) return true;
    return false;
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
  process.env.DB_DATABASE,
);
module.exports = dbClient;
