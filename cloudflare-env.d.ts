declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  }
}
