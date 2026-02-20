import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Validate input
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid password format" },
        { status: 400 }
      );
    }

    // Get hashed password from environment
    const hashedPassword = process.env.AUTH_PASSWORD_HASH;

    if (!hashedPassword) {
      console.error("AUTH_PASSWORD_HASH not configured");
      return NextResponse.json(
        { success: false, message: "Authentication not configured" },
        { status: 500 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, hashedPassword);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
