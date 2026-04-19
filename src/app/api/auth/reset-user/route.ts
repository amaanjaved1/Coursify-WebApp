import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { email } = requestData;

    if (!email || !email.endsWith("@queensu.ca")) {
      return NextResponse.json(
        { error: "Invalid or missing email" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Auth state reset, you can now create a new account",
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.signOut();
    return response;
  } catch (error: any) {
    console.error("Error in reset-user API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset user" },
      { status: 500 }
    );
  }
}
