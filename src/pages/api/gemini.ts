// 配置先: pages/api/gemini.ts
// (Next.js の App Router を使っている場合は app/api/gemini/route.ts に別形式で書く必要があります。
//  ご使用のプロジェクト構成が pages/ か app/ かを教えていただければ、その形式でも作成します。)

import type { NextApiRequest, NextApiResponse } from "next";

type ChatMessage = { role: string; content: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // 1. 利用者ごとのAPIキーはリクエストのたびにクライアントから受け取る。
  //    ★このキーはサーバー側でログに出さない・DBやファイルに保存しない・
  //      リクエスト処理が終わったら破棄する（メモリに残さない）ことが鉄則。
  const { messages, apiKey } = req.body as {
    messages: ChatMessage[];
    apiKey: string;
  };

  if (!apiKey) {
    // ここで apiKey の中身を絶対にログ出力しないこと
    res.status(400).json({ error: "APIキーが送信されていません。設定画面から入力してください。" });
    return;
  }

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages が不正です。" });
    return;
  }

  // 2. 会話履歴を1本のテキストにまとめる（前回のInteractions API対応と同じ方式）
  const conversationText = messages
    .map((msg) => `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`)
    .join("\n");

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/interactions`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.5-flash",
        input: conversationText,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini Interactions API error body:", errorBody);
      res.status(response.status).json({ error: "Gemini API側でエラーが発生しました。" });
      return;
    }

    const data = await response.json();
    const modelOutputStep = data.steps?.find(
      (step: any) => step.type === "model_output"
    );
    const reply =
      modelOutputStep?.content?.find((c: any) => c.type === "text")?.text ||
      "返答を得られませんでした。";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Error calling Gemini Interactions API:", error);
    res.status(500).json({ error: "通信エラーが発生しました。" });
  }
}
