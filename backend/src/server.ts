import { config } from "dotenv";
import express, { type NextFunction, type Request, type Response as ExpressResponse } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, "../.env") });

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

async function resolveShortShopeeLink(inputUrl: string): Promise<string> {
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
  } catch {
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
    throw new HttpError(502, "Link rút gọn Shopee không trả về link sản phẩm gốc.");
  }

  return cleanShopeeOriginLink(resolvedUrl);
}

async function getOriginLink(productUrl: string) {
  const inputUrl = validateShopeeUrl(productUrl.trim());

  if (!isShortShopeeLinkDomain(inputUrl.hostname)) {
    return {
      originLink: cleanShopeeOriginLink(productUrl.trim()),
      resolved: false,
    };
  }

  return {
    originLink: await resolveShortShopeeLink(productUrl.trim()),
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

async function convertShopeeLink(productUrl: string): Promise<ConvertResponse> {
  const { affiliateId, subId } = getAffiliateConfig();
  const { originLink, resolved } = await getOriginLink(productUrl);

  return {
    affiliateUrl: createAffiliateUrl(originLink, affiliateId, subId),
    originLink,
    resolved,
  };
}

const app = express();
app.use(applyCors);
app.use(express.json({ limit: "16kb" }));

app.post("/api/convert", async (request: Request, response: ExpressResponse) => {
  const parsedBody = convertRequestSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({ message: "Vui lòng nhập URL Shopee." });
    return;
  }

  try {
    response.json(await convertShopeeLink(parsedBody.data.productUrl));
  } catch (error) {
    if (error instanceof HttpError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }

    response.status(500).json({ message: "Đã có lỗi xảy ra khi chuyển đổi link." });
  }
});


app.post("/api/getlinkA", async (request: Request, response: ExpressResponse) => {
  const parsedBody = convertRequestSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({ message: "Vui lòng nhập URL Shopee." });
    return;
  }

  try {
    const { originLink, resolved } = await getOriginLink(parsedBody.data.productUrl);
    const url = validateShopeeUrl(originLink);
    const productIds = extractProductIds(url);

    const affiliateDashboard = process.env.SHOPEE_AFFILIATE_DASHBOARD?.trim() ?? "";
    const affiliateUrl = `${affiliateDashboard}/${productIds?.itemId}`;
    response.json({
      affiliateUrl: affiliateUrl,
      originLink,
      resolved,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }

    response.status(500).json({ message: "Đã có lỗi xảy ra khi chuyển đổi link." });
  }
});

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (_request, response) => {
    response.sendFile(frontendIndexPath);
  });
}

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`ConvertLink server listening on http://localhost:${port}`);
});
