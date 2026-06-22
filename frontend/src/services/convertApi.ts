export interface ConvertLinkRequest {
  productUrl: string;
}

export interface ConvertLinkResponse {
  affiliateUrl: string;
  originLink: string;
  resolved: boolean;
}

interface ErrorResponse {
  message?: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function convertShopeeLink(request: ConvertLinkRequest): Promise<ConvertLinkResponse> {
  const response = await fetch(`${apiBaseUrl}/api/convert`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(errorBody.message ?? "Không thể chuyển đổi link Shopee.");
  }

  return (await response.json()) as ConvertLinkResponse;
}
