import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this._host = process.env.DB_HOST || 'localhost';
    this._port = process.env.DB_PORT || 27017;
    this._db = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(
      `mongodb://${this._host}:${this._port}/${this._db}`,
      { useUnifiedTopology: true },
    );
    // start connection
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const collection = this.client.db().collection('users');
    return collection.countDocuments();
  }

  async nbFiles() {
    const collection = this.client.db().collection('files');
    return collection.countDocuments();
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
