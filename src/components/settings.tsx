import React from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import {
  KoeiroParam,
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { Link } from "./link";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  koeiroParam: KoeiroParam;
  koeiromapKey: string;
  voicevoxApiKey: string;                                              // ★追加
  geminiModel: string;                                                            // ★追加
  // Propsに追加
  userName: string;
  onChangeUserName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeKoeiroParam: (x: number, y: number) => void;
  onClickResetSystemPrompt: () => void;
  onChangeKoeiromapKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeVoicevoxApiKey: (event: React.ChangeEvent<HTMLInputElement>) => void; // ★追加
  onChangeGeminiModel: (event: React.ChangeEvent<HTMLSelectElement>) => void;      // ★追加
};
export const Settings = ({
  openAiKey,
  systemPrompt,
  koeiroParam,
  koeiromapKey,
  voicevoxApiKey,           // ★追加
  geminiModel,              // ★追加
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeKoeiroParam,
  onClickResetSystemPrompt,
  onChangeKoeiromapKey,
  onChangeVoicevoxApiKey,   // ★追加
  onChangeGeminiModel,      // ★追加
}: Props) => {
  return (
    <div className="absolute z-40 w-full h-full bg-white/95 backdrop-blur ">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
      <div className="max-h-full overflow-auto">
        <div className="text-gray-900 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">設定</div>
          <div className="my-24">
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">あなたのお名前</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="例）太郎"
              value={userName}
              onChange={onChangeUserName}
            />
            <div className="my-16">
              お名前を入力すると、会話の中で名前を呼んでくれるようになります。
            </div>
          </div>
            <div className="my-16 typography-20 font-bold">Google Gemini API キー</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="AIza..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
            <div>
              APIキーは
              <Link
                url="https://aistudio.google.com/apikey"
                label="Google AI Studio"
              />
              で取得できます。取得したAPIキーをフォームに入力してください。
            </div>
            <div className="my-16">
              Gemini APIはサーバー経由でアクセスしています。APIキーはサーバーに保存されません。
            </div>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">使用するAIモデル</div>
            <select
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              value={geminiModel}
              onChange={onChangeGeminiModel}
            >
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite（軽量・制限が緩い・おすすめ）</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash（標準）</option>
            </select>
            <div className="my-16">
              会話がすぐエラーになる場合は、制限の緩い「Flash-Lite」をお試しください。
            </div>
          </div>
          <div className="my-40">
            <div className="my-8">
              <div className="my-16 typography-20 font-bold">
                キャラクター設定（システムプロンプト）
              </div>
              <TextButton onClick={onClickResetSystemPrompt}>
                キャラクター設定リセット
              </TextButton>
            </div>

            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-16 py-8  bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
            ></textarea>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">VOICEVOX API キー</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="..."
              value={voicevoxApiKey}
              onChange={onChangeVoicevoxApiKey}
            />
            <div className="my-16">
              <Link
                url="https://su-shiki.com/api/"
                label="こちらのサイト"
              />
              でGoogleアカウントを使ってAPIキーを取得し、入力してください。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
