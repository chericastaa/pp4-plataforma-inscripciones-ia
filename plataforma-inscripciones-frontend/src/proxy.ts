import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const pathname = req.nextUrl.pathname;

    const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");

    const isDashboardPage = pathname.startsWith("/dashboard");

    if (pathname === "/" && token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isAuthPage && token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isDashboardPage && !token) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/register", "/"],
};