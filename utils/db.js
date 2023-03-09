import { MongoClient } from 'mongodb';
import { promisify } from 'util';

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
   * checks if the database client is connected
   *
   * @returns {boolean} true if the client is connected else false
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * returns the number of users present in the db
   * @returns {number} the number of users present
   */
  async nbUsers() {
    const collection = this.client.db().collection('users');
    return collection.countDocuments();
  }

  /**
   * returns the number of files present in the db
   * @returns {number} the number of users present
   */
  async nbFiles() {
    const collection = this.client.db().collection('files');
    return collection.countDocuments();
  }

  /**
 * gets the obj matching the field passed if it's present
 * else null
 *
 * @param {string} collectn - collection to check in
 * @param {object} field - field to check for
 *
 * @returns {object|null} object matching field else null
  */
  async getField(collectn, field) {
    const collection = this.client.db().collection(collectn);
    const promFindOne = promisify(collection.findOne).bind(collection);
    return promFindOne(field);
  }

  /**
   * inserts the obj passed into the collection
   * given
   *
   * @param {string} collectn - collection to check in
   * @param {object} obj - field obj to insert in the database
   *
   * @returns {object} the stored object with id
   */
  async insertCol(collectn, obj) {
    const collection = this.client.db().collection(collectn);
    const result = await collection.insertOne(obj);
    return result.ops[0];
  }

  async getAll(collectn, obj, options) {
    const collection = this.client.db().collection(collectn);
    const { page } = options;
    const limit = 20;
    const pipe = [
      { $match: obj },
      { $skip: limit * page },
      { $limit: limit },
      { $addFields: { id: '$_id' } },
      { $project: { _id: 0, localPath: 0 } },
    ];

    const cursor = collection.aggregate(pipe);
    return cursor.toArray();
  }

  async updateField(collectn, field, objToUpdate) {
    const collection = this.client.db().collection(collectn);
    // const promUpdateOne = promisify(collection.updateOne).bind(collection);
    return collection.updateOne(field, { $set: objToUpdate });
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
