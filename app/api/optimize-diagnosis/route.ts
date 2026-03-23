import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { resumeText, job } = await request.json();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `对比岗位 "${job.title} @ ${job.company}" 与简历。
JD：${job.jdSummary}
简历：${resumeText.substring(0, 3000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchOverview: { type: Type.STRING },
            score: { type: Type.NUMBER },
            coreGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            quickWins: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["matchOverview", "score", "coreGaps", "quickWins"],
        },
      },
    });
    return NextResponse.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}