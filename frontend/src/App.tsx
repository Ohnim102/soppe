import { Toaster } from "sonner";

import { ShopeeAffiliateForm } from "@/components/ShopeeAffiliateForm";

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f04f2a] text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.18),_rgba(255,255,255,0)_26%),radial-gradient(circle_at_50%_-10%,_rgba(255,255,255,0.4),_rgba(255,255,255,0)_34%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-7 sm:px-6">
        {/* <header className="mb-6 flex items-center justify-center">
          <div className="flex flex-col items-center text-center text-white">
            <div className="grid size-16 place-items-center rounded-full bg-white text-3xl font-black text-[#f04f2a] shadow-xl shadow-red-900/20">
              S
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/80">Săn sale</p>
          </div>
        </header> */}

        <ShopeeAffiliateForm />
      </div>
      <Toaster richColors position="top-center" theme="light" />
    </main>
  );
}
