import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  canRoleAccessPath,
  getHomePathForRole,
  getSpaceForPath,
} from "@/lib/auth/routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const isFirstLoginCompletionRoute =
    pathname === "/api/auth/complete-first-login";
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/api/test-email") ||
    isFirstLoginCompletionRoute;

  if (!user && !isPublicRoute) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: "Non authentifié." },
        { status: 401 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user) {
    let role: string | null = null;
    try {
      const { data } = await supabase.rpc("get_my_role");
      role = (data as string | null) ?? null;
    } catch {
      role = null;
    }

    const home = getHomePathForRole(role);

    // First-login enforcement is authoritative in public.users, not in
    // client-editable Auth user metadata.
    let mustChangePassword = false;
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("must_change_password, is_active")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profile?.is_active === false) {
        if (isApiRoute) {
          return NextResponse.json(
            { success: false, error: "Compte désactivé." },
            { status: 403 }
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      mustChangePassword = profile?.must_change_password === true;
    } catch {
      // Keep existing routing behavior if the optional column is not yet
      // available while the migration is being deployed.
      mustChangePassword = false;
    }

    if (mustChangePassword && pathname !== "/change-password") {
      if (isApiRoute) {
        return NextResponse.json(
          {
            success: false,
            error: "Changement de mot de passe requis.",
            code: "PASSWORD_CHANGE_REQUIRED",
          },
          { status: 403 }
        );
      }

      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      url.searchParams.set("next", getHomePathForRole(role));
      return NextResponse.redirect(url);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    if (!isApiRoute && role && !canRoleAccessPath(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    // Optional: keep space label for future headers / logging
    void getSpaceForPath(pathname);
  }

  return supabaseResponse;
}
