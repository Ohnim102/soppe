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

export async function convertShopeeLink(request: ConvertLinkRequest): Promise<ConvertLinkResponse> {
  const response = await fetch("/api/convert", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(errorBody.message ?? "Khong the chuyen doi link Shopee.");
  }

  return (await response.json()) as ConvertLinkResponse;
}
