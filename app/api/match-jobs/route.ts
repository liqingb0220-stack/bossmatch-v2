import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { profile, analysis, excludeTitles = [] } = await request.json();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const excludePart = excludeTitles.length > 0
      ? `请避开以下已检索过的职位：${excludeTitles.join("、")}`
      : "";

    const prompt = `
      作为资深猎头，利用 Google Search 实时确认当前在招的岗位。
      用户背景：${analysis.summary}
      求职期望：${profile.expectations}
      ${excludePart}
      
      要求：
      1. 必须一次性返回正好 5 个最匹配的岗位。
      2. 每个岗位必须包含真实链接（招聘平台、公司官网等）。
      3. 在 reason 字段中，必须包含"已找到 X 条高度相关经历"字样。
      4. 结果请翻译为中文。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              salary: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              url: { type: Type.STRING },
              skillsMatch: { type: Type.ARRAY, items: { type: Type.STRING } },
              requirementsMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
              jdSummary: { type: Type.STRING },
            },
            required: ["title", "company", "matchScore", "reason", "url", "location", "salary", "jdSummary"],
          },
        },
      },
    });

    const rawText = response.text || "[]";
    const results = JSON.parse(rawText);
    return NextResponse.json(results.filter((job: any) => job.url).slice(0, 5));

  } catch (error: any) {
    console.error("match-jobs API error:", error);
    return NextResponse.json(
      { error: error.message || "岗位匹配失败" },
      { status: 500 }
    );
  }
}