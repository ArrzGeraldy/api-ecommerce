import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export const prismaClient = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

prismaClient.$on("query", (e) => {
  logger.debug(`[PRISMA QUERY] ${e.query} -- ${e.params}`);
});

// prismaClient.$on("info", (e) => {
//   const msg =
//     typeof e.message === "object" ? JSON.stringify(e.message) : e.message;
//   logger.info(`[PRISMA INFO] ${msg}`);
// });

// prismaClient.$on("warn", (e) => {
//   const msg =
//     typeof e.message === "object" ? JSON.stringify(e.message) : e.message;
//   logger.warn(`[PRISMA WARN] ${msg}`);
// });

// prismaClient.$on("error", (e) => {
//   const msg =
//     typeof e.message === "object" ? JSON.stringify(e.message) : e.message;
//   logger.error(`[PRISMA ERROR] ${msg}`);
// });
