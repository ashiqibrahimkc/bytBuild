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
      // Check if user exists but has wrong password or is inactive
      const existingUser = await prisma.appUser.findFirst({
        where: {
          OR: [
            { username: { equals: cleanIdentifier, mode: "insensitive" } },
            { email: { equals: cleanIdentifier, mode: "insensitive" } },
          ],
        },
      });

      if (existingUser && !existingUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            status: 403,
            message: "This account has been deactivated. Please contact your system administrator.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Invalid username or password. Please check your credentials.",
        },
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
  } catch (error: any) {
    console.error("Auth login API error:", error);
    const errorMsg = String(error?.message || "");
    if (errorMsg.includes("Can't reach database") || error?.code === "P1001") {
      return NextResponse.json(
        {
          success: false,
          status: 503,
          message: "Database connection failed. Please ensure your PostgreSQL database is reachable.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Authentication service error. Please try again.",
      },
      { status: 500 }
    );
  }
}

