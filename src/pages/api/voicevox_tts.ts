import type { NextApiRequest, NextApiResponse } from "next";

// クラウド版VOICEVOX API（非公式・su-shiki.com）のエンドポイント
const VOICEVOX_CLOUD_URL = "https://deprecatedapis.tts.quest/v2/voicevox/audio/";

type Data = {
  audio: string; // base64エンコードされた音声データ
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | { error: string }>
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { text, speakerId, speedScale, apiKey } = req.body;

  if (!text || typeof speakerId !== "number") {
    res.status(400).json({ error: "textとspeakerIdは必須です" });
    return;
  }

  // ★利用者ごとのAPIキーをリクエストのたびに受け取る。
  //   Geminiのキーと同様、サーバー側には保存しない・ログに出さない。
  if (!apiKey) {
    res.status(400).json({ error: "VOICEVOXのAPIキーが送信されていません。設定画面から入力してください。" });
    return;
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      speaker: String(speakerId),
      speed: String(speedScale ?? 1.0),
      text: text,
    });

    const response = await fetch(`${VOICEVOX_CLOUD_URL}?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("VOICEVOXクラウドAPI error:", errorText);
      res.status(response.status).json({ error: "音声合成に失敗しました。" });
      return;
    }

    // 音声データ(バイナリ)をbase64文字列に変換してフロントに返す
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // フロントエンドが期待する data:audio/xxx;base64,... の形式に変換
    res.status(200).json({ audio: `data:audio/wav;base64,${base64Audio}` });
  } catch (e: any) {
    console.error("VOICEVOXクラウドAPI 通信エラー:", e);
    res.status(500).json({ error: e.message || "VOICEVOX合成エラー" });
  }
}
