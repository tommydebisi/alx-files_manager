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

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return this._get(key);
  }

  async set(key, value, duration) {
    // set key with expiration
    await this._set(key, value, 'EX', duration);
  }

  async del(key) {
    await this._del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
