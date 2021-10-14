import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.connect = true;
    this.client.on('error', (err) => {
      this.connect = false;
      console.log(err);
    });
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.connect;
  }

  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  async set(key, value, duration) {
    this.setAsync(key, value);
    this.expireAsync(key, duration);
  }

  async del(key) {
    this.delAsync(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
