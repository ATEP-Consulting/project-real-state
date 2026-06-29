import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const expected = process.env.PREVIEW_BASIC_AUTH; // "user:pass" — unset in production
  if (!expected) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header) {
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded && atob(encoded) === expected) {
      return NextResponse.next();
    }
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Herrera preview"' },
  });
}

// Gate everything except Next internals and robots.txt (so crawlers can still read the disallow).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
