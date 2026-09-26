import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
  splitSentence,
} from "@/features/messages/messages";
import { speakCharacterWithVoicevox } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { Meta } from "@/components/meta";
import { Settings } from "@/components/settings";
import { Menu } from "@/components/menu"; // Menuをインポート
import { Subtitle } from "@/components/subtitle";
export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [userName, setUserName] = useState(""); // ★追加
  const [openAiKey, setOpenAiKey] = useState("");
  const [koeiromapKey, setKoeiromapKey] = useState("");
  const [voicevoxApiKey, setVoicevoxApiKey] = useState(""); // ★追加
  const [geminiModel, setGeminiModel] = useState("gemini-3.5-flash-lite"); // ★デフォルトを軽量版に
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);

  const [subtitle, setSubtitle] = useState("");
  const [showSubtitle, setShowSubtitle] = useState(false); // ★ 字幕表示state追加

  const [showSettings, setShowSettings] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); // ★マイク入力中フラグ
  const [season, setSeason] = useState<"summer" | "winter">("summer"); // ★追加
    // ★季節×時間帯に応じた背景を計算する関数（_document.tsxのロジックと同じ内容）
  const applySeasonalBg = useCallback(() => {
    const month = new Date().getMonth() + 1;
    const hour = new Date().getHours();

    const DAY = "/bg_daytime_house.jpg";
    const NIGHT = "/bg_night_house.jpg";

    let seasonImage = "/bg_spring.jpg";
    let seasonKey = "spring";
    if (month === 3 || month === 4) { seasonImage = "/bg_spring.jpg"; seasonKey = "spring"; }
    else if (month === 5 || month === 6) { seasonImage = "/bg_early_summer.jpg"; seasonKey = "early_summer"; }
    else if (month === 7 || month === 8) { seasonImage = "/bg_summer.jpg"; seasonKey = "summer"; }
    else if (month === 9 || month === 10) { seasonImage = "/bg_autumn.jpg"; seasonKey = "autumn"; }
    else if (month === 11) { seasonImage = "/bg_late_autumn.jpg"; seasonKey = "late_autumn"; }
    else { seasonImage = "/bg_winter1.jpg"; seasonKey = "winter"; }

    type Period = [number, number, "day" | "season" | "night"];
    const schedules: Record<string, Period[]> = {
      spring:       [[6,10,"day"], [10,15,"season"], [15,18,"day"], [18,30,"night"]],
      early_summer: [[6,7,"day"],  [7,10,"season"],  [10,18,"day"], [18,30,"night"]],
      summer:       [[6,15,"day"], [15,19,"season"], [19,30,"night"]],
      autumn:       [[6,15,"day"], [15,17,"season"], [17,30,"night"]],
      late_autumn:  [[6,10,"day"], [10,15,"season"], [15,17,"day"], [17,30,"night"]],
      winter:       [[6,18,"day"], [18,22,"season"], [22,30,"night"]],
    };

    const h = hour < 6 ? hour + 24 : hour;
    const periods = schedules[seasonKey];
    let type: "day" | "season" | "night" = "night";
    for (const [start, end, t] of periods) {
      if (h >= start && h < end) {
        type = t;
        break;
      }
    }

    let bg = DAY;
    if (type === "season") bg = seasonImage;
    else if (type === "night") bg = NIGHT;

    document.documentElement.style.setProperty("--seasonal-bg", `url(${bg})`);
  }, []);

  // ★今の季節・時間帯・屋内外の状況を、AIに伝える説明文を作る関数
  const getSceneInstruction = useCallback((): string => {
    const month = new Date().getMonth() + 1;
    const hour = new Date().getHours();

    let seasonKey = "spring";
    if (month === 3 || month === 4) seasonKey = "spring";
    else if (month === 5 || month === 6) seasonKey = "early_summer";
    else if (month === 7 || month === 8) seasonKey = "summer";
    else if (month === 9 || month === 10) seasonKey = "autumn";
    else if (month === 11) seasonKey = "late_autumn";
    else seasonKey = "winter";

    type Period = [number, number, "day" | "season" | "night"];
    const schedules: Record<string, Period[]> = {
      spring:       [[6,10,"day"], [10,15,"season"], [15,18,"day"], [18,30,"night"]],
      early_summer: [[6,7,"day"],  [7,10,"season"],  [10,18,"day"], [18,30,"night"]],
      summer:       [[6,15,"day"], [15,19,"season"], [19,30,"night"]],
      autumn:       [[6,15,"day"], [15,17,"season"], [17,30,"night"]],
      late_autumn:  [[6,10,"day"], [10,15,"season"], [15,17,"day"], [17,30,"night"]],
      winter:       [[6,18,"day"], [18,22,"season"], [22,30,"night"]],
    };

    const h = hour < 6 ? hour + 24 : hour;
    const periods = schedules[seasonKey];
    let type: "day" | "season" | "night" = "night";
    for (const [start, end, t] of periods) {
      if (h >= start && h < end) {
        type = t;
        break;
      }
    }

    // 季節ごとの屋外の景色の説明（★実際の画像の内容に合わせて、必要なら文言を調整してください）
    const seasonDescriptions: Record<string, string> = {
      spring: "春、桜吹雪の一本道、青空から花びらが舞い、霞んで見える道の先（晴れています。雨は降っていません）",
      early_summer: "初夏、湖面から立ち上がる朝靄で、山と空が幻想的に映る静かな湖（晴れています。雨は降っていません）",
      summer: "真夏の夕暮れ、入道雲と茜色の空、静かな水辺と石畳の小道（晴れています。雨は降っていません）",
      autumn: "秋、紅葉した山々と澄んだ青空、夕方の柔らかい光（晴れています。雨は降っていません）",
      late_autumn: "晩秋、霧に沈む山道、白い靄の奥に消えていく落ち葉の積もった道（晴れていません。雨は降っていません）",
      winter: "冬、満月の夜、雪に覆われた森の奥へ一本の小径が続き、木々の間から青白い月光が差し込んでいる。空には無数の星、足元では雪が淡く輝いている（晴れています。雪は降っていません）",
    };

    if (type === "day") {
      return "今、あなたは自宅の部屋の中にいて、日中の明るい時間を過ごしています。";
    } else if (type === "night") {
      return "今、あなたは自宅の部屋の中にいて、夜の落ち着いた時間を過ごしています。";
    } else {
      return `今、あなたは屋外にいて、${seasonDescriptions[seasonKey]}を眺めています。`;
    }
  }, []);

  // ★1分ごとに背景を再チェックする
  useEffect(() => {
    applySeasonalBg(); // ページ表示後すぐに1回実行（_document.tsxの結果を上書き確認）
    const timer = setInterval(applySeasonalBg, 60 * 1000); // 60秒ごと
    return () => clearInterval(timer);
  }, [applySeasonalBg]);


  
  // ▼▼▼ AudioContext状態監視用 ▼▼▼
  const [audioState, setAudioState] = useState<"suspended" | "running" | "closed" | "uninitialized">("uninitialized");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(() => {
      const state =
        viewer.model && (viewer.model as any)._lipSync && (viewer.model as any)._lipSync.audio
          ? (viewer.model as any)._lipSync.audio.state
          : "uninitialized";
      setAudioState(state);
    }, 500);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [viewer]);
  // ▲▲▲ AudioContext状態監視用 ▲▲▲

  // ★ WebSocket処理追加
  useEffect(() => {
    if (!viewer.model) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => console.log("WebSocket接続");
    ws.onclose = () => console.log("WebSocket切断");

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        // JSON形式のメッセージ（テキストと音声データ）を処理
        try {
          const messageData = JSON.parse(event.data);
          if (messageData.type === 'speak' && messageData.audio && messageData.text) {
            setSubtitle(messageData.text);

            const base64 = messageData.audio.split(",")[1];
            const binary = atob(base64);
            const len = binary.length;
            const buffer = new Uint8Array(len);
            for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);

            const dummyScreenplay = {
              expression: "neutral" as const,
              talk: { style: "talk" as const, speakerX: 0, speakerY: 0, message: messageData.text },
            };
            await viewer.model!.speak(buffer.buffer, dummyScreenplay);

            setSubtitle(""); // 再生完了後に字幕を消す
          } else if (messageData.type === 'play_animation' && messageData.name) {
            // アニメーション再生メッセージを処理
            const animation = messageData.name;
            const fileType = animation.split('.').pop()?.toLowerCase();
            if (fileType === 'vrma') {
              viewer.playVrma(animation);
            } else if (fileType === 'fbx') {
              viewer.playFbx(animation);
            }
          }
        } catch (error) {
          console.error("WebSocketメッセージの解析に失敗:", error);
        }
      } else if (event.data instanceof ArrayBuffer) {
        // バイナリデータ（音声のみ）を処理
        const buffer = event.data;
        const dummyScreenplay = {
          expression: "neutral" as const,
          talk: { style: "talk" as const, speakerX: 0, speakerY: 0, message: "" },
        };
        await viewer.model!.speak(buffer, dummyScreenplay);
      }
    };

    return () => ws.close();
  }, [viewer, viewer.model]);

  // 修正後
  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
      setKoeiroParam(params.koeiroParam ?? DEFAULT_PARAM);
      setOpenAiKey(params.openAiKey ?? "");           // ★追加
      setVoicevoxApiKey(params.voicevoxApiKey ?? ""); // ★追加
      setGeminiModel(params.geminiModel ?? "gemini-3.5-flash-lite"); // ★追加
      setUserName(params.userName ?? "");             // ★追加
      setSeason(params.season ?? "summer");            // ★追加
    }
  }, []);

  useEffect(() => {
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({
          systemPrompt,
          koeiroParam,
          openAiKey,        // ★追加
          voicevoxApiKey,   // ★追加
          geminiModel,      // ★追加
          userName,         // ★追加
          season,           // ★追加
        })
      )
    );
  }, [systemPrompt, koeiroParam, openAiKey, voicevoxApiKey, geminiModel, userName, season]); // ★season追加

  /**
   * 文ごとに音声を直列でリクエストしながら再生する
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      console.log("[DEBUG] handleSpeakAi called", screenplay);
      // VOICEVOXで喋らせる
      speakCharacterWithVoicevox(screenplay, viewer, { speakerId: 20, speedScale: 1.0, apiKey: voicevoxApiKey }, onStart, onEnd);
    },
    [viewer]
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string, isVoiceInput?: boolean) => {

      setIsVoiceMode(!!isVoiceInput); // ★今回の会話が音声経由かを記録

      // 最初のインタラクションでAudioContextを再開する
      if (isFirstInteraction) {
        viewer.resumeAudio();
        setIsFirstInteraction(false);
      }

      if (!openAiKey) {
        setAssistantMessage("APIキーが入力されていません");
        return;
      }
      const newMessage = text;
      if (newMessage == null) return;

      setChatProcessing(true);
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // 修正後
            // 修正後
      const nameInstruction = userName
        ? `\n\n話している相手の名前は「${userName}」です。会話の中で自然に名前を呼びかけてください。`
        : "";
      const sceneInstruction = `\n\n${getSceneInstruction()}この状況を踏まえて、実際に見えている景色と異なる質問をされた場合は、正しい状況をやんわり伝えてください。`;
      const messages: Message[] = [
        {
          role: "system",
          content: systemPrompt + nameInstruction + sceneInstruction,
        },
        ...messageLog,
      ];

      
       // Gemini APIから一括で返答テキストを取得します

      // 修正後
      const replyText = await getChatResponseStream(messages, openAiKey, geminiModel).catch(
        (e) => {
          console.error(e);
          return null;
        }
      );

      if (replyText == null || typeof replyText !== "string") {
        setChatProcessing(false);
        return;
      }

      try {
        // テキストをキャラクターのセリフ（台本）データに変換します
        // 修正後
        const aiTalks = textsToScreenplay(splitSentence(replyText), koeiroParam);
        // タグ除去後のクリーンなテキストを画面表示用に使う
        const cleanText = aiTalks.map((talk) => talk.talk.message).join("");
        

        

        // 修正後
        if (aiTalks && aiTalks.length > 0) {
          // Voicevox等を使って、文章ごとに順番にキャラクターに声を喋らせます
          await Promise.all(
            aiTalks.map((talk, i) =>
              speakCharacterWithVoicevox(
                talk,
                viewer,
                { speakerId: 20, speedScale: 1.0, apiKey: voicevoxApiKey },
                i === 0
                  ? () => {
                      // 最初の音声の再生開始と同時にテキスト表示する
                      setAssistantMessage(cleanText);
                      setSubtitle(cleanText);
                    }
                  : undefined
              )
            )
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChatProcessing(false);
        setSubtitle(""); // 発話が終わったら字幕を消します
      }


      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: replyText },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    },
    // 修正後
    [systemPrompt, chatLog, openAiKey, koeiroParam, viewer, isFirstInteraction, voicevoxApiKey, geminiModel]
  );

  return (
    <div
      className={"font-kaisei"}
      onClick={() => {
        if (isFirstInteraction) {
          viewer.resumeAudio();
          setIsFirstInteraction(false);

          // ★音声認識の接続を裏側で「暖機」しておく（体感の初回遅延を軽減）
          const SpeechRecognitionCtor =
            (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          if (SpeechRecognitionCtor) {
            try {
              const warmupRecognition = new SpeechRecognitionCtor();
              warmupRecognition.lang = "ja-JP";
              warmupRecognition.continuous = true;
              warmupRecognition.start();
              // 1秒後には停止する（ユーザーには見せず、裏側で接続だけ済ませる）
              setTimeout(() => {
                try {
                  warmupRecognition.stop();
                } catch (e) {
                  // 既に停止している場合等は無視
                }
              }, 1000);
            } catch (e) {
              console.error("[DEBUG] 音声認識の暖機に失敗しました", e);
            }
          }
        }
      }}
    >
      <Meta />
      <VrmViewer season={season} /> {/* ★season追加 */}
      {showSubtitle && <Subtitle text={subtitle} />}
      {!isVoiceMode && <Menu assistantMessage={assistantMessage} />}
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
        onOpenSettings={() => setShowSettings(true)}
        showSubtitle={showSubtitle}
        onToggleSubtitle={() => setShowSubtitle((v) => !v)}
        audioState={audioState}
      />
       {showSettings && (
        <Settings
          openAiKey={openAiKey}
          systemPrompt={systemPrompt}
          koeiroParam={koeiroParam}
          koeiromapKey={koeiromapKey}
          voicevoxApiKey={voicevoxApiKey}                                          // ★追加
          geminiModel={geminiModel}                                                // ★追加
          userName={userName}                                   // ★追加
          season={season}                                           // ★追加
          onChangeSeason={setSeason}                                // ★追加
          onChangeUserName={(e) => setUserName(e.target.value)} // ★追加
          onClickClose={() => setShowSettings(false)}
          onChangeAiKey={(e) => setOpenAiKey(e.target.value)}
          onChangeSystemPrompt={(e) => setSystemPrompt(e.target.value)}
          onChangeKoeiroParam={(x, y) => setKoeiroParam({ speakerX: x, speakerY: y })}
          onClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
          onChangeKoeiromapKey={(e) => setKoeiromapKey(e.target.value)}
          onChangeVoicevoxApiKey={(e) => setVoicevoxApiKey(e.target.value)}        // ★追加
          onChangeGeminiModel={(e) => setGeminiModel(e.target.value)}              // ★追加
        />
      )}
    </div>
  );
}
