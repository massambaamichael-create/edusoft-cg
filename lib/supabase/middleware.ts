import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getHomePathForRole, isTeacherSpacePath } from "@/lib/auth/routes";

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

  // IMPORTANT: do not add logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/api/test-email");

  // Not logged in
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

  // Logged in → resolve role and route to the right space
  if (user) {
    let role: string | null = null;
    try {
      const { data } = await supabase.rpc("get_my_role");
      role = (data as string | null) ?? null;
    } catch {
      role = null;
    }

    const home = getHomePathForRole(role);

    // Leave login page → role home
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    // Teacher must stay in teacher space (not full direction UI)
    if (role === "Enseignant" && !isTeacherSpacePath(pathname) && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/enseignant";
      return NextResponse.redirect(url);
    }

    // Non-teachers should not use teacher-only space
    if (role && role !== "Enseignant" && isTeacherSpacePath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
