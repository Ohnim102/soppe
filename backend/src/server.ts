import express, { type NextFunction, type Request, type Response as ExpressResponse } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Logger } from "pino";
import { z } from "zod";
import { logger, normalizeError } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPPORTED_SHOPEE_DOMAINS = ["shopee.vn", "www.shopee.vn", "s.shopee.vn", "vn.shp.ee"] as const;
const SHORT_LINK_DOMAINS = ["s.shopee.vn", "vn.shp.ee"] as const;
const DEFAULT_ALLOWED_ORIGINS = ["https://sopee.gc.edu.vn"];

type SupportedShopeeDomain = (typeof SUPPORTED_SHOPEE_DOMAINS)[number];

const convertRequestSchema = z.object({
  productUrl: z.string().trim().min(1),
});

interface ConvertResponse {
  affiliateUrl: string;
  originLink: string;
  resolved: boolean;
}

type ConversionMode = "affiliate" | "dashboard";
type LinkConverter = (productUrl: string, log: Logger) => Promise<ConvertResponse>;

class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isSupportedShopeeDomain(hostname: string): hostname is SupportedShopeeDomain {
  return SUPPORTED_SHOPEE_DOMAINS.includes(hostname.toLowerCase() as SupportedShopeeDomain);
}

function isShortShopeeLinkDomain(hostname: string): boolean {
  return SHORT_LINK_DOMAINS.includes(hostname.toLowerCase() as (typeof SHORT_LINK_DOMAINS)[number]);
}

function validateShopeeUrl(value: string): URL {
  const url = parseUrl(value);

  if (!url || !isSupportedShopeeDomain(url.hostname)) {
    throw new HttpError(400, "URL Shopee không hợp lệ hoặc domain không được hỗ trợ.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new HttpError(400, "URL Shopee phải dùng giao thức http hoặc https.");
  }

  return url;
}

function extractProductIds(url: URL): { shopId: string; itemId: string } | null {
  const productPathMatch = url.pathname.match(/^\/product\/(\d+)\/(\d+)\/?$/);

  if (productPathMatch) {
    return {
      shopId: productPathMatch[1],
      itemId: productPathMatch[2],
    };
  }

  const seoPathMatch = url.pathname.match(/-i\.(\d+)\.(\d+)\/?$/);

  if (seoPathMatch) {
    return {
      shopId: seoPathMatch[1],
      itemId: seoPathMatch[2],
    };
  }

  const usernamePathMatch = url.pathname.match(/^\/[^/]+\/(\d+)\/(\d+)\/?$/);

  if (usernamePathMatch) {
    return {
      shopId: usernamePathMatch[1],
      itemId: usernamePathMatch[2],
    };
  }

  return null;
}

function cleanShopeeOriginLink(value: string): string {
  const url = validateShopeeUrl(value);
  const productIds = extractProductIds(url);

  if (productIds) {
    return `https://shopee.vn/product/${productIds.shopId}/${productIds.itemId}`;
  }

  url.search = "";
  url.hash = "";

  if (url.hostname.toLowerCase() === "www.shopee.vn") {
    url.hostname = "shopee.vn";
  }

  return url.toString();
}

function getAffiliateConfig() {
  const affiliateId = process.env.SHOPEE_AFFILIATE_ID?.trim() ?? "";
  const subId = process.env.SHOPEE_SUB_ID?.trim() ?? "";

  if (!affiliateId) {
    throw new HttpError(500, "Chưa cấu hình SHOPEE_AFFILIATE_ID.");
  }

  return { affiliateId, subId };
}

function getAffiliateDashboard(): URL {
  const value = process.env.SHOPEE_AFFILIATE_DASHBOARD?.trim() ?? "";
  const dashboardUrl = parseUrl(value);

  if (!dashboardUrl || (dashboardUrl.protocol !== "https:" && dashboardUrl.protocol !== "http:")) {
    throw new HttpError(500, "Chưa cấu hình SHOPEE_AFFILIATE_DASHBOARD hợp lệ.");
  }

  return dashboardUrl;
}

async function resolveShortShopeeLink(inputUrl: string, log: Logger): Promise<string> {
  const startedAt = performance.now();
  let response: globalThis.Response;

  try {
    response = await fetch(inputUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    log.error(
      {
        event: "short_link_resolve_failed",
        err: normalizeError(error),
        inputDomain: parseUrl(inputUrl)?.hostname,
        durationMs: Math.round(performance.now() - startedAt),
      },
      "Could not resolve Shopee short link",
    );
    throw new HttpError(502, "Không resolve được link rút gọn Shopee.");
  }

  const resolvedUrl = response.url;
  const finalUrl = parseUrl(resolvedUrl);

  if (
    !finalUrl ||
    !isSupportedShopeeDomain(finalUrl.hostname) ||
    (finalUrl.protocol !== "https:" && finalUrl.protocol !== "http:") ||
    isShortShopeeLinkDomain(finalUrl.hostname)
  ) {
    log.warn(
      {
        event: "short_link_resolve_failed",
        inputDomain: parseUrl(inputUrl)?.hostname,
        resolvedDomain: finalUrl?.hostname,
        durationMs: Math.round(performance.now() - startedAt),
        reason: "invalid_redirect_target",
      },
      "Shopee short link returned an invalid target",
    );
    throw new HttpError(502, "Link rút gọn Shopee không trả về link sản phẩm gốc.");
  }

  const originLink = cleanShopeeOriginLink(resolvedUrl);
  const productIds = extractProductIds(new URL(originLink));

  log.info(
    {
      event: "short_link_resolved",
      fromLink: inputUrl,
      toLink: originLink,
      inputDomain: parseUrl(inputUrl)?.hostname,
      resolvedDomain: finalUrl.hostname,
      shopId: productIds?.shopId,
      itemId: productIds?.itemId,
      durationMs: Math.round(performance.now() - startedAt),
    },
    "Shopee short link resolved",
  );

  return originLink;
}

async function getOriginLink(productUrl: string, log: Logger) {
  const inputUrl = validateShopeeUrl(productUrl.trim());

  if (!isShortShopeeLinkDomain(inputUrl.hostname)) {
    return {
      originLink: cleanShopeeOriginLink(productUrl.trim()),
      resolved: false,
    };
  }

  return {
    originLink: await resolveShortShopeeLink(productUrl.trim(), log),
    resolved: true,
  };
}

function createAffiliateUrl(originLink: string, affiliateId: string, subId: string) {
  return (
    "https://s.shopee.vn/an_redir" +
    `?origin_link=${encodeURIComponent(originLink)}` +
    `&affiliate_id=${encodeURIComponent(affiliateId)}` +
    `&sub_id=${encodeURIComponent(subId)}`
  );
}

function createDashboardAffiliateUrl(originLink: string): string {
  const productIds = extractProductIds(validateShopeeUrl(originLink));

  if (!productIds) {
    throw new HttpError(400, "URL Shopee không chứa mã sản phẩm hợp lệ.");
  }

  const affiliateUrl = getAffiliateDashboard();
  affiliateUrl.pathname = `${affiliateUrl.pathname.replace(/\/+$/, "")}/${productIds.itemId}`;
  affiliateUrl.search = "";
  affiliateUrl.hash = "";

  return affiliateUrl.toString();
}

function getAllowedOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const allowedOrigins = new Set(getAllowedOrigins());

function applyCors(request: Request, response: ExpressResponse, next: NextFunction) {
  const origin = request.headers.origin?.replace(/\/$/, "");

  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Max-Age", "86400");

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
}

async function convertShopeeLink(productUrl: string, log: Logger): Promise<ConvertResponse> {
  const { affiliateId, subId } = getAffiliateConfig();
  const { originLink, resolved } = await getOriginLink(productUrl, log);

  return {
    affiliateUrl: createAffiliateUrl(originLink, affiliateId, subId),
    originLink,
    resolved,
  };
}

async function convertShopeeDashboardLink(productUrl: string, log: Logger): Promise<ConvertResponse> {
  const { originLink, resolved } = await getOriginLink(productUrl, log);

  return {
    affiliateUrl: createDashboardAffiliateUrl(originLink),
    originLink,
    resolved,
  };
}

function createConvertHandler(mode: ConversionMode, convert: LinkConverter) {
  return async (request: Request, response: ExpressResponse) => {
    const startedAt = performance.now();
    const parsedBody = convertRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      request.log.warn(
        {
          event: "conversion_failed",
          mode,
          statusCode: 400,
          reason: "invalid_request_body",
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Conversion request validation failed",
      );
      response.status(400).json({ message: "Vui lòng nhập URL Shopee." });
      return;
    }

    const inputDomain = parseUrl(parsedBody.data.productUrl)?.hostname;
    request.log.info(
      {
        event: "conversion_started",
        mode,
        inputDomain,
      },
      "Link conversion started",
    );

    try {
      const result = await convert(parsedBody.data.productUrl, request.log);
      const productIds = extractProductIds(new URL(result.originLink));
      const fromLink = parsedBody.data.productUrl.trim();
      const toLink = result.affiliateUrl;

      request.log.info(
        {
          event: "conversion_succeeded",
          mode,
          fromLink,
          toLink,
          originLink: result.originLink,
          inputDomain,
          resolved: result.resolved,
          shopId: productIds?.shopId,
          itemId: productIds?.itemId,
          statusCode: 200,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Link conversion succeeded",
      );
      response.json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        const logMethod = error.statusCode >= 500 ? request.log.error.bind(request.log) : request.log.warn.bind(request.log);
        logMethod(
          {
            event: "conversion_failed",
            mode,
            inputDomain,
            statusCode: error.statusCode,
            errorType: error.name,
            ...(error.statusCode >= 500 ? { err: error } : {}),
            durationMs: Math.round(performance.now() - startedAt),
          },
          "Link conversion failed",
        );
        response.status(error.statusCode).json({ message: error.message });
        return;
      }

      request.log.error(
        {
          event: "conversion_failed",
          mode,
          inputDomain,
          statusCode: 500,
          err: normalizeError(error),
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Unexpected link conversion error",
      );
      response.status(500).json({ message: "Đã có lỗi xảy ra khi chuyển đổi link." });
    }
  };
}

const app = express();
app.use(requestLogger);
app.use(applyCors);
app.use(express.json({ limit: "16kb" }));

app.post("/api/convert", createConvertHandler("affiliate", convertShopeeLink));
app.post("/api/getlinkA", createConvertHandler("dashboard", convertShopeeDashboardLink));

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (_request, response) => {
    response.sendFile(frontendIndexPath);
  });
}

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  logger.info(
    {
      event: "server_started",
      port,
    },
    "ConvertLink server started",
  );
});

process.on("unhandledRejection", (reason) => {
  logger.fatal(
    {
      event: "unhandled_rejection",
      err: normalizeError(reason),
    },
    "Unhandled promise rejection",
  );
});

process.on("uncaughtException", (error) => {
  logger.fatal(
    {
      event: "uncaught_exception",
      err: error,
    },
    "Uncaught exception",
  );
  logger.flush();
  process.exit(1);
});
