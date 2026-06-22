import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Link2, RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { convertShopeeLink } from "@/services/convertApi";
import { isSupportedShopeeDomain, parseShopeeUrl } from "@/services/shopeeAffiliate";
import type { ConverterFormValues } from "@/types/converter";

const converterSchema = z.object({
  productUrl: z
    .string()
    .trim()
    .min(1, "Vui long nhap URL Shopee.")
    .refine((value) => parseShopeeUrl(value) !== null, "URL khong dung dinh dang.")
    .refine((value) => {
      const url = parseShopeeUrl(value);

      return Boolean(url && isSupportedShopeeDomain(url.hostname));
    }, "Chi ho tro shopee.vn, www.shopee.vn hoac s.shopee.vn."),
});

export function ShopeeAffiliateForm() {
  const [result, setResult] = useState("");
  const [originLink, setOriginLink] = useState("");
  const [resolved, setResolved] = useState(false);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
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
      setOriginLink(nextResult.originLink);
      setResolved(nextResult.resolved);
      toast.success("Da tao link Affiliate.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Khong the chuyen doi link Shopee.";
      setResult("");
      setOriginLink("");
      setResolved(false);
      toast.error(message);
    }
  }

  async function copyResult() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
    toast.success("Da copy link vao clipboard.");
  }

  function clearForm() {
    reset({
      productUrl: "",
    });
    setResult("");
    setOriginLink("");
    setResolved(false);
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.85fr]">
      <form
        className="rounded-lg border border-border bg-card p-5 shadow-2xl shadow-black/15 sm:p-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Shopee Affiliate</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Chuyen doi link Shopee
            </h1>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={clearForm} aria-label="Xoa form">
            <RotateCcw />
          </Button>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="productUrl">URL Shopee</Label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
              <Input
                id="productUrl"
                placeholder="https://shopee.vn/product/xxx/yyy"
                className="pl-9"
                {...register("productUrl")}
              />
            </div>
            <FormMessage>{errors.productUrl?.message}</FormMessage>
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-11 w-full sm:w-fit">
            <Wand2 />
            {isSubmitting ? "Dang chuyen doi" : "Chuyen doi"}
          </Button>
        </div>
      </form>

      <aside className="rounded-lg border border-border bg-card p-5 shadow-2xl shadow-black/15 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Ket qua</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Link Affiliate</h2>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={copyResult} disabled={!result} aria-label="Copy link">
            <Copy />
          </Button>
        </div>

        <Textarea
          className="mt-5 font-mono text-xs leading-5"
          readOnly
          value={result || "Link Affiliate se hien thi tai day sau khi chuyen doi."}
        />

        {resolved ? (
          <p className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            Link rut gon da duoc resolve thanh: <span className="break-all font-mono">{originLink}</span>
          </p>
        ) : null}

      </aside>
    </section>
  );
}
