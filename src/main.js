import { app } from "./app/app.js";
import { logger } from "./app/logger.js";

app.listen(4000, () => {
  logger.info("Run");
});
