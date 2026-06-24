import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite"

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     proxy: {
//       "/api": "http://localhost:3000",
//     },
//   },
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_API_URL || "http://localhost:3000"

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const originalOrigin = req.headers.origin;
              if (originalOrigin) {
                try {
                  const url = new URL(originalOrigin);
                  url.hostname = "localhost";
                  proxyReq.setHeader("origin", url.origin);
                  proxyReq.setHeader("referer", url.origin + "/");
                } catch {
                  proxyReq.setHeader("origin", "http://localhost:5174");
                  proxyReq.setHeader("referer", "http://localhost:5174/");
                }
              } else {
                proxyReq.setHeader("origin", "http://localhost:5174");
                proxyReq.setHeader("referer", "http://localhost:5174/");
              }
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})