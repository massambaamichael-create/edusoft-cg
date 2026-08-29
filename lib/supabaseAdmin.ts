import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("SUPABASE URL présente :", !!supabaseUrl);
console.log("SERVICE ROLE KEY présente :", !!serviceRoleKey);
console.log(
  "SERVICE ROLE KEY longueur :",
  serviceRoleKey?.length ?? 0
);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase Admin manquantes");
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey
);