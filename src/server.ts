import { server } from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
