import { Message } from "../messages/messages";

export async function getChatResponseStream(messages: Message[], apiKey: string) {
  // 画面の設定欄から入力されたキーを使用します
  if (!apiKey) {
    console.error("Gemini API Key is missing.");
    return "設定画面からGeminiのAPIキーを入力してください。";
  }

// ⭕️  gemini-1.5-flash を指定
const MODEL = "gemini-1.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  //　 チャット履歴をGeminiの形式に変換
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
       // ⭕️ マニュアル通り、安全な通信データ枠（ヘッダー）に変数として渡します
        "x-goog-api-key": apiKey, 
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
