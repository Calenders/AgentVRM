import { Message } from "./messages";

// Gemini APIの基本設定
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://googleapis.com{GEMINI_API_KEY}`;

export async function getOpenAiChatResponse(messages: Message[]) {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API Key is missing.");
    return "APIキーが設定されていません。";
  }

  // チャット履歴をGeminiの形式に変換
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "返答を得られませんでした。";
    return reply;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "通信エラーが発生しました。";
  }
}
