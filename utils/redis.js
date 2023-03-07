import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this._get = promisify(this.client.get).bind(this.client);
    this._set = promisify(this.client.set).bind(this.client);
    this._del = promisify(this.client.del).bind(this.client);

    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  /**
   * checks if client has connected to database and returns
   * a boolean
   * @returns {boolean} true if client as connected to database
   * false
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * gets the value of a key from the database
   * @param {string} key
   * @returns {any}
   */
  async get(key) {
    return this._get(key);
  }

  /**
   * sets a key and value with specified duration in
   * seconds in the database
   *
   * @param {string} key
   * @param {string} value
   * @param {number} duration
   */
  async set(key, value, duration) {
    // set key with expiration
    await this._set(key, value, 'EX', duration);
  }

  /**
   * deletes the key passed from the database
   * @param {string} key
   */
  async del(key) {
    await this._del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
