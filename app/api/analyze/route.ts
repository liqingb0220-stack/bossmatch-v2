import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 从前端接收数据
    const { resumeText, expectations } = await request.json();

    if (!resumeText || !expectations) {
      return NextResponse.json(
        { error: "缺少简历或职业期待" },
        { status: 400 }
      );
    }

    // API Key 在服务器端读取，用户看不到！
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一名资深的职业顾问。请深度分析以下求职者的简历与期望，输出结构化分析报告。
请在 summary 中包含一个类似"(已识别 XX 条核心经历)"的说明。
简历内容：${resumeText}
职业期望：${expectations}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            suggestedRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["keywords", "summary", "suggestedRoles", "strengths"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("analyze API error:", error);
    return NextResponse.json(
      { error: error.message || "AI 分析失败" },
      { status: 500 }
    );
  }
}