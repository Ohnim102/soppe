import pino from "pino";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../config/env.js";

const isProduction = process.env.NODE_ENV === "production";
const prettyLogs = process.env.LOG_PRETTY === "true";
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(currentDirectory, "../..");
const configuredLogFile = process.env.LOG_FILE?.trim();
const logFile = configuredLogFile === "" ? null : path.resolve(backendDirectory, configuredLogFile ?? "logs/backend.log");

const targets: pino.TransportTargetOptions[] = [
  prettyLogs
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          destination: 1,
        },
      }
    : {
        target: "pino/file",
        options: {
          destination: 1,
        },
      },
];

if (logFile) {
  targets.push({
    target: "pino/file",
    options: {
      destination: logFile,
      mkdir: true,
    },
  });
}

export const logger = pino({
  level: process.env.LOG_LEVEL?.trim() || (isProduction ? "info" : "debug"),
  base: {
    service: "convertlink-backend",
    environment: process.env.NODE_ENV ?? "development",
  },
  redact: {
    paths: [
      "affiliateId",
      "subId",
      "affiliateUrl",
      "req.body",
      "req.headers.authorization",
      "req.headers.cookie",
      "request.headers.authorization",
      "request.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport: {
    targets,
  },
});

export function normalizeError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  return new Error(typeof value === "string" ? value : "Unknown error");
}
