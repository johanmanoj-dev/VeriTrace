import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/verify", "/history"];

// Routes only for unauthenticated users (redirect if already signed in)
const AUTH_ONLY_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Firebase Auth stores the session in a cookie named "__session" when using
  // server-side session cookies. For client-side auth we check a lightweight
  // presence cookie we set on sign-in. If missing, redirect to /login.
  const sessionCookie = request.cookies.get("__session")?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthOnly = AUTH_ONLY_ROUTES.includes(pathname);

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - api routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
