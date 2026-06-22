import { Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { ShopeeAffiliateForm } from "@/components/ShopeeAffiliateForm";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return (window.localStorage.getItem("theme") as Theme | null) ?? "dark";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(238,77,45,0.18),_transparent_34%),linear-gradient(135deg,_rgba(20,184,166,0.12),_transparent_38%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <span className="text-base font-bold">S</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Shopee Link Converter</p>
              <p className="text-xs text-muted-foreground">ConvertLink</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Đổi giao diện sang dark hoặc light mode"
          >
            {isDark ? <SunMedium /> : <Moon />}
          </Button>
        </header>

        <div className="flex flex-1 items-center">
          <ShopeeAffiliateForm />
        </div>
      </div>
      <Toaster richColors position="top-center" theme={theme} />
    </main>
  );
}
