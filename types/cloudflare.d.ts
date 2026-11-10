interface Fetcher { fetch(request: Request): Promise<Response>; }
// Minimal build-time global supplied by the Cloudflare runtime.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface D1Database {}

declare module "cloudflare:workers" {
  // Runtime bindings are injected dynamically by Sites.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: Record<string, any>;
}
