import { createApp } from './app.js';
import { setServers } from 'node:dns';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

setServers(['8.8.8.8', '1.1.1.1']);

const app = createApp();

connectDatabase()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`${env.SERVICE_NAME} listening on port ${env.PORT}`);
    });
  })
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
