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

  /**
   * isAlive - checks if the database client is connected
   *
   * @returns true if the client is connected else false
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * nbUsers - returns the number of users present in the db
   * @returns the number of users present
   */
  async nbUsers() {
    const collection = this.client.db().collection('users');
    return collection.countDocuments();
  }

  /**
   * nbFiles - returns the number of files present in the db
   * @returns the number of users present
   */
  async nbFiles() {
    const collection = this.client.db().collection('files');
    return collection.countDocuments();
  }

  /**
 * fieldPresent - checks if the field passed in
 * is present
 *
 * @collectn: collection to check in
 * @field: field to check for (field is an object)
 *
 * @returns true if collection is present or false if not
  */
  async fieldPresent(collectn, field) {
    const collection = this.client.db().collection(collectn);
    return collection.findOne(field);
  }

  /**
   * insetCol - inserts the obj passed into the collection
   * given
   *
   * @collectn: collection to check in
   * @obj: field obj to insert in the database
   *
   * @returns the stored object with id
   */
  async insertCol(collectn, obj) {
    const collection = this.client.db().collection(collectn);
    const result = await collection.insertOne(obj);
    return result.ops[0];
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
