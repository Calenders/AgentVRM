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
            <div className="my-16 typography-20 font-bold">OpenAI API キー</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="sk-..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
            <div>
              APIキーは
              <Link
                url="https://platform.openai.com/account/api-keys"
                label="OpenAIのサイト"
              />
              で取得できます。取得したAPIキーをフォームに入力してください。
            </div>
            <div className="my-16">
              ChatGPT
              APIはブラウザから直接アクセスしています。また、APIキーや会話内容はピクシブのサーバには保存されません。
              <br />
              ※利用しているモデルはChatGPT API (GPT-3.5)です。
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
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">声の調整</div>
            <div>
              KoemotionのKoeiromap APIを使用しています。詳しくは
              <Link
                url="https://koemotion.rinna.co.jp"
                label="https://koemotion.rinna.co.jp"
              />
              をご覧ください。
            </div>
            <div className="mt-16 font-bold">API キー</div>
            <div className="mt-8">
              <input
                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                type="text"
                placeholder="..."
                value={koeiromapKey}
                onChange={onChangeKoeiromapKey}
              />
            </div>

            <div className="mt-16 font-bold">プリセット</div>
            <div className="my-8 grid grid-cols-2 gap-[8px]">
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_A.speakerX, PRESET_A.speakerY)
                }
              >
                かわいい
              </TextButton>
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_B.speakerX, PRESET_B.speakerY)
                }
              >
                元気
              </TextButton>
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_C.speakerX, PRESET_C.speakerY)
                }
              >
                かっこいい
              </TextButton>
              <TextButton
                onClick={() =>
                  onChangeKoeiroParam(PRESET_D.speakerX, PRESET_D.speakerY)
                }
              >
                渋い
              </TextButton>
            </div>
            <div className="my-24">
              <div className="select-none">x : {koeiroParam.speakerX}</div>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.001}
                value={koeiroParam.speakerX}
                className="mt-8 mb-16 input-range"
                onChange={(e) => {
                  onChangeKoeiroParam(
                    Number(e.target.value),
                    koeiroParam.speakerY
                  );
                }}
              ></input>
              <div className="select-none">y : {koeiroParam.speakerY}</div>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.001}
                value={koeiroParam.speakerY}
                className="mt-8 mb-16 input-range"
                onChange={(e) => {
                  onChangeKoeiroParam(
                    koeiroParam.speakerX,
                    Number(e.target.value)
                  );
                }}
              ></input>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
