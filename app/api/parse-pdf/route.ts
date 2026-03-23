import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { text } = await extractText(buffer, { mergePages: true });
    const cleanText = text.trim();

    return NextResponse.json({ text: cleanText });

  } catch (error: any) {
    console.error("parse-pdf error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}