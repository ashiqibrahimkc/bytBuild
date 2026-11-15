import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Username/Email and Password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query seeded/registered user in database
    const user = await prisma.appUser.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: "insensitive" } },
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
        ],
        password: password,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const roleName = user.role?.name?.toUpperCase() || "OWNER";

    const sessionData = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email || user.username,
      role: roleName,
    };

    const encoded = encodeURIComponent(JSON.stringify(sessionData));

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    // Set auth session cookies for Next.js middleware
    response.cookies.set("bytbuild_session", encoded, {
      path: "/",
      maxAge: 604800, // 7 days
      sameSite: "lax",
    });

    response.cookies.set("buildflow_session", encoded, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    console.error("Auth login API error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication service error. Please try again." },
      { status: 500 }
    );
  }
}

