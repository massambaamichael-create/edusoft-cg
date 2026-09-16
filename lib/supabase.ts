/**
 * Browser Supabase client (cookie-based via @supabase/ssr).
 * Use this in Client Components.
 *
 * For Server Components / Route Handlers, prefer:
 *   import { createClient } from "@/lib/supabase/server"
 */
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export const supabase = createBrowserClient();
