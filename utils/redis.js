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
    this.asyn = promisify(this.client.get).bind(this.client);
  }

  isAlive() {
    return this.client.connect;
  }

  async get(key) {
    return this.asyn(key);
  }

  async set(key, value, lmt) {
    this.client.set(key, value);
    this.client.expire(key, lmt);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
