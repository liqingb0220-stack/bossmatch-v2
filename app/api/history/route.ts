import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 保存历史记录
export async function POST(request: NextRequest) {
  try {
    const { userId, resumeText, expectations, analysis, jobs } = await request.json();

    const { data, error } = await supabaseAdmin
      .from("history")
      .insert({
        user_id: userId,
        resume_text: resumeText,
        expectations,
        analysis,
        jobs,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("history POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 读取历史记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("history GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}