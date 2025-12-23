/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLATFORM_URL: string
  readonly VITE_CAPTURE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
