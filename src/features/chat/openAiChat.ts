import { Message } from "../messages/messages";

// 利用者ごとのAPIキーを設定画面から受け取り、messagesと一緒に自分のサーバー(/api/gemini)へ送る。
// ★ここではキーをGoogleへ直接送らない。必ず自分のサーバー(/api/gemini)経由にすることで、
//   JSバンドルにキーを焼き込む必要がなくなる（＝全訪問者に共通鍵が見える事故を防げる）。
export async function getChatResponseStream(messages: Message[], apiKey: string) {
  if (!apiKey) {
    console.error("Gemini API Key is missing.");
    return "設定画面からGeminiのAPIキーを入力してください。";
  }

  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, apiKey }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API route error:", errorData);
      return errorData.error || "通信エラーが発生しました。";
    }

    const data = await response.json();
    return data.reply as string;
  } catch (error) {
    console.error("Error calling /api/gemini:", error);
    return "通信エラーが発生しました。";
  }
}
