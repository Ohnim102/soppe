interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FACEBOOK_COMMENT_TARGET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "react-dom/client" {
  export interface Root {
    render(children: unknown): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}
