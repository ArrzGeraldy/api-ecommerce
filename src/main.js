import { app } from "./app/app.js";
import { logger } from "./app/logger.js";

const PORT = 4000;
app.listen(PORT, () => {
  logger.info(`Server run on: http://127.0.0.1:${PORT}`);
});
