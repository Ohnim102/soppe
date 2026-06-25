import type { ErrorRequestHandler } from "express";
import { normalizeError } from "../lib/logger.js";

interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

function isInvalidJsonError(error: unknown): error is BodyParserError {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const bodyParserError = error as BodyParserError;
  return bodyParserError.status === 400 && bodyParserError.type === "entity.parse.failed";
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (isInvalidJsonError(error)) {
    request.log.warn(
      {
        event: "invalid_json",
        statusCode: 400,
      },
      "Request body is not valid JSON",
    );
    response.status(400).json({ message: "Dữ liệu gửi lên không phải JSON hợp lệ." });
    return;
  }

  request.log.error(
    {
      event: "unhandled_request_error",
      err: normalizeError(error),
      statusCode: 500,
    },
    "Unhandled request error",
  );
  response.status(500).json({ message: "Đã có lỗi xảy ra khi xử lý yêu cầu." });
};
