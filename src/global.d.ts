/** Plasmo inlines `PLASMO_PUBLIC_*` at build time via static `process.env.*` access */
declare const process: {
  env: {
    PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN?: string
  }
}

declare module "~/styles/globals.css" {
  const content: Record<string, string>
  export default content
}

declare module "*.css" {
  const content: Record<string, string>
  export default content
}