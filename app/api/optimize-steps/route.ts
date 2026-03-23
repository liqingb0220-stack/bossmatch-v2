import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { resumeText, job } = await request.json();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `简历深度优化建议。职位："${job.title} @ ${job.company}"。
简历原文：${resumeText.substring(0, 3000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              section: { type: Type.STRING },
              original: { type: Type.STRING },
              improved: { type: Type.STRING },
              reasoning: { type: Type.STRING },
            },
            required: ["section", "original", "improved", "reasoning"],
          },
        },
      },
    });
    return NextResponse.json(JSON.parse(response.text || "[]"));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}