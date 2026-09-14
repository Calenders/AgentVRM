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

  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
      setKoeiroParam(params.koeiroParam ?? DEFAULT_PARAM);
    }
  }, []);

  useEffect(() => {
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, koeiroParam })
      )
    );
  }, [systemPrompt, koeiroParam]);


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
    async (text: string) => {

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

      const messages: Message[] = [
        {
          role: "system",
          content: systemPrompt,
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
        setAssistantMessage(cleanText);
        setSubtitle(cleanText);

        

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
                      // 最初の一文の再生開始時の処理（必要に応じて記述）
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
        }
      }}
    >
      <Meta />
      <VrmViewer />
      {showSubtitle && <Subtitle text={subtitle} />}
      <Menu assistantMessage={assistantMessage} />
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
