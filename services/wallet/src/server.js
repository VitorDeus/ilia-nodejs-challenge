require('dotenv').config();

const app = require('./app');
const config = require('./config');
const migrate = require('./db/migrate');

(async () => {
  await migrate();
  app.listen(config.port, () => {
    console.log(`[wallet] listening on port ${config.port}`);
  });
})();
