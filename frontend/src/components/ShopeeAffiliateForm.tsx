import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, ExternalLink, Info, Link2, RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import facebookVoucherImage from "@/assets/facebook-voucher.png";
import { convertShopeeLink, getLinkA } from "@/services/convertApi";
import { isSupportedShopeeDomain, parseShopeeUrl } from "@/services/shopeeAffiliate";
import type { ConverterFormValues } from "@/types/converter";

const FACEBOOK_COMMENT_TARGET_URL =
  import.meta.env.VITE_FACEBOOK_COMMENT_TARGET_URL ?? "https://www.facebook.com/";

function ShopeeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M5.5 8.5h13l1 12h-15l1-12Z" />
      <path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
      <path d="M14.8 12.4c-.7-.5-1.6-.7-2.5-.7-1.2 0-2.1.6-2.1 1.5 0 2.3 4.7 1.2 4.7 4 0 1.1-1 1.9-2.5 1.9-1 0-2-.3-2.8-.9" />
    </svg>
  );
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command was rejected.");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

const converterSchema = z.object({
  productUrl: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập URL Shopee.")
    .refine((value) => parseShopeeUrl(value) !== null, "URL không đúng định dạng.")
    .refine((value) => {
      const url = parseShopeeUrl(value);

      return Boolean(url && isSupportedShopeeDomain(url.hostname));
    }, "Chỉ hỗ trợ shopee.vn, www.shopee.vn, s.shopee.vn hoặc vn.shp.ee."),
});

type ShopeeAffiliateFormProps = {
  showGuide?: boolean;
};

export function ShopeeMainPage() {
  return <ShopeeAffiliateForm showGuide={false} />;
}

export function ShopeeAffiliateForm({ showGuide = true }: ShopeeAffiliateFormProps) {
  const [result, setResult] = useState("");
  const [isOpeningLinkA, setIsOpeningLinkA] = useState(false);

  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    trigger,
  } = useForm<ConverterFormValues>({
    defaultValues: {
      productUrl: "",
    },
    resolver: zodResolver(converterSchema),
  });

  async function onSubmit(values: ConverterFormValues) {
    try {
      const nextResult = await convertShopeeLink(values);

      setResult(nextResult.affiliateUrl);
      toast.success("Đã tạo link Shopee.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể chuyển đổi link Shopee.";
      setResult("");
      toast.error(message);
    }
  }

  async function copyResult() {
    if (!result) {
      return;
    }

    try {
      await copyTextToClipboard(result);
      toast.success("Đã copy link vào clipboard.");
    } catch {
      toast.error("Không thể copy link. Vui lòng copy thủ công.");
    }
  }

  function openConvertedLink() {
    if (!result) {
      return;
    }

    const popup = window.open(result, "_blank");

    if (!popup) {
      toast.error("Trình duyệt đã chặn tab mới. Vui lòng cho phép popup rồi thử lại.");
      return;
    }

    popup.opener = null;
  }

  async function openLinkA() {
    if (isOpeningLinkA) {
      return;
    }

    const popup = window.open("about:blank", "_blank");

    if (!popup) {
      toast.error("Trình duyệt đã chặn tab mới. Vui lòng cho phép popup rồi thử lại.");
      return;
    }

    popup.opener = null;
    setIsOpeningLinkA(true);

    try {
      const isValid = await trigger("productUrl");

      if (!isValid) {
        popup.close();
        return;
      }

      const response = await getLinkA({
        productUrl: getValues("productUrl"),
      });

      popup.location.replace(response.affiliateUrl);
    } catch (error) {
      popup.close();
      const message = error instanceof Error ? error.message : "Không thể lấy link.";
      toast.error(message);
    } finally {
      setIsOpeningLinkA(false);
    }
  }

  function clearForm() {
    reset({
      productUrl: "",
    });
    setResult("");
  }

  return (
    <section className="flex flex-1 flex-col items-center pb-8 text-center">
      <div className="w-full rounded-lg bg-white px-4 py-7 shadow-2xl shadow-red-950/25 sm:px-7 sm:py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold tracking-normal text-[#222] sm:text-4xl">Get Voucher</h1>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearForm}
              aria-label="Xóa form"
              className="shrink-0 text-slate-500 hover:bg-orange-50 hover:text-[#f04f2a]"
            >
              <RotateCcw />
            </Button>
          </div>

          <div className="mt-7 grid gap-3 text-left">
            <Label htmlFor="productUrl" className="text-sm font-semibold text-slate-700">
              Link sản phẩm Shopee
            </Label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="productUrl"
                placeholder="Dán link sản phẩm Shopee vào đây"
                className="h-14 rounded-lg border-slate-200 bg-slate-50 pl-12 pr-4 text-base shadow-inner shadow-slate-200/40 focus-visible:ring-[#f04f2a]"
                {...register("productUrl")}
              />
            </div>
            <FormMessage>{errors.productUrl?.message}</FormMessage>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 h-12 w-full rounded-lg bg-[#f04f2a] text-base font-bold shadow-lg shadow-orange-600/25 hover:bg-[#df421f] sm:h-14"
          >
            <Wand2 />
            {isSubmitting ? "Đang tạo link" : "Tạo Link Ngay"}
          </Button>
        </form>

        <div className="mt-7 rounded-lg border border-orange-100 bg-[#fff7f3] p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="size-5 text-[#f04f2a]" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Link</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={copyResult}
              disabled={!result}
              aria-label="Copy link"
              className="h-10 border-orange-200 bg-white px-3 text-[#f04f2a] hover:bg-orange-50"
            >
              <Copy />
              Sao chép
            </Button>
          </div>

          <Textarea
            className="mt-4 min-h-24 resize-none rounded-lg border-orange-100 bg-white font-mono text-xs leading-5 text-slate-700 focus-visible:ring-[#f04f2a]"
            readOnly
            value={result || "Link có voucher sẽ hiển thị tại đây sau khi tạo."}
          />

          {/* {resolved ? (
            <p className="mt-3 rounded-md border border-orange-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
              Link rút gọn đã được resolve thành: <span className="break-all font-mono">{originLink}</span>
            </p>
          ) : null} */}
        </div>
      </div>

      {showGuide ? (
        <>
      <div className="mt-5 w-full rounded-lg bg-white/95 p-5 text-left shadow-xl shadow-red-950/15">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-[#f04f2a]" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Hướng dẫn</h2>
        </div>
        <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
          <li>1. Sau khi tạo link, nhấn "Copy Link".</li>
          <li>2. Mở một bài đăng facebook bất kỳ. <a
            className="mt-0 inline-flex items-center gap-2 text-sm font-semibold text-[#f04f2a] hover:text-[#c93618]"
            href={FACEBOOK_COMMENT_TARGET_URL}
            rel="noreferrer"
            target="_blank"
          >
            Mở Facebook
            <ExternalLink className="size-4" />
          </a>
          </li>
          <li>3. Sau đó dán link dưới bình luận bài đăng đó.</li>
          <li>4. Click vào link để mở Shopee và nhận mã.</li>
        </ol>

      </div>

      <figure className="mt-5 w-full overflow-hidden rounded-lg bg-white shadow-xl shadow-red-950/15">
        <img
          src={facebookVoucherImage}
          alt="Mã giảm giá và hoàn Xu Facebook"
          className="block h-auto w-full object-cover"
        />
      </figure>

      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || isOpeningLinkA}
        onClick={openLinkA}
        className="mt-5 h-12 w-full rounded-lg border-white bg-white text-base font-bold text-[#f04f2a] shadow-xl shadow-red-950/15 hover:bg-orange-50 hover:text-[#df421f] sm:h-14"
      >
        <ExternalLink />
        {isOpeningLinkA ? "Đang mở link" : "Mở Link A"}
      </Button>

        </>
      ) : null}

      <Button
        type="button"
        disabled={!result}
        onClick={openConvertedLink}
        className="mt-3 h-12 w-full rounded-lg bg-white text-base font-bold text-[#f04f2a] shadow-xl shadow-red-950/15 hover:bg-orange-50 hover:text-[#df421f] sm:h-14"
      >
        <ShopeeIcon />
        Mở Shopee
      </Button>
    </section>
  );
}
