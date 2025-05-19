import express from 'express';
import router from './routes/transaction.router';
import logger from './shared/logger';
const app = express();

app.use(router);

// @todo use config file
app.listen(3000, () => {
  logger.info("Server running on port 3000");
})
