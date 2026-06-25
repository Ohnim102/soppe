import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import { logger } from "../lib/logger.js";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const logIpAddress = process.env.LOG_IP === "true";

function getRequestId(headerValue: string | string[] | undefined): string {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (candidate && REQUEST_ID_PATTERN.test(candidate)) {
    return candidate;
  }

  return randomUUID();
}

export const requestLogger = pinoHttp({
  logger,
  genReqId(request, response) {
    const requestId = getRequestId(request.headers["x-request-id"]);
    response.setHeader("X-Request-Id", requestId);
    return requestId;
  },
  serializers: {
    req(request) {
      const url = typeof request.url === "string" ? request.url : "";

      return {
        id: request.id,
        method: request.method,
        path: url.split("?")[0],
        userAgent: request.headers?.["user-agent"],
        ...(logIpAddress ? { remoteAddress: request.remoteAddress } : {}),
      };
    },
    res(response) {
      return {
        statusCode: response.statusCode,
      };
    },
  },
  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
  customSuccessMessage() {
    return "Request completed";
  },
  customErrorMessage() {
    return "Request failed";
  },
  customSuccessObject(_request, _response, value) {
    return {
      ...value,
      event: "http_request",
    };
  },
  customErrorObject(_request, _response, _error, value) {
    return {
      ...value,
      event: "http_request",
    };
  },
});
