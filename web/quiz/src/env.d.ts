// quiz/src/env.d.ts

interface ImportMetaEnv {
  VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
