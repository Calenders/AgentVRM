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
  const { messages, apiKey, model } = req.body as {
    messages: ChatMessage[];
    apiKey: string;
    model?: string;
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

  // ★指数バックオフ付きの待機用関数
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const MAX_RETRIES = 4;
  const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000]; // 1秒, 2秒, 4秒, 8秒

  try {
    let response: Response | null = null;
    let lastErrorBody = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: model || "gemini-3.5-flash",
          input: conversationText,
          //      tools: [{ type: "google_search" }], // ★Google Search Groundingを有効化
        }),
      });

      if (response.ok) {
        break; // ★成功したらリトライループを抜ける
      }

      // 503（一時的な過負荷）の場合のみリトライ、それ以外は即座にエラー扱い
      if (response.status !== 503) {
        break;
      }

      lastErrorBody = await response.text();
      console.error(
        `Gemini API 503エラー（${attempt + 1}回目の試行）:`,
        lastErrorBody
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }

    if (!response || !response.ok) {
      const errorBody = lastErrorBody || (response ? await response.text() : "");
      console.error("Gemini Interactions API error body:", errorBody);
      res
        .status(response?.status || 500)
        .json({ error: "Gemini API側でエラーが発生しました。しばらくしてから再度お試しください。" });
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
