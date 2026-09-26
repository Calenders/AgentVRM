import { MessageInput } from "@/components/messageInput";
import { useState, useEffect, useCallback, useContext } from "react";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string, isVoiceInput?: boolean) => void;
  onOpenSettings: () => void;
  showSubtitle: boolean;
  onToggleSubtitle: () => void;
  audioState: "suspended" | "running" | "closed" | "uninitialized";
};

/**
 * テキスト入力と音声入力を提供する
 *
 * 音声認識の完了時は自動で送信し、返答文の生成中は入力を無効化する
 *
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
  onOpenSettings,
  showSubtitle,
  onToggleSubtitle,
  audioState,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognition>();
  const [isMicRecording, setIsMicRecording] = useState(false);
  const { viewer } = useContext(ViewerContext);

  // 音声認識の結果を処理する
  // 修正後
  const handleRecognitionResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      console.log("[DEBUG] onresult 発火", event.results.length); // ★調査用
      // すべての認識結果（確定分＋認識中の分）をつなげて表示する
      let combinedText = "";
      for (let i = 0; i < event.results.length; i++) {
        combinedText += event.results[i][0].transcript;
      }
      setUserMessage(combinedText);
    // ★ここでは自動送信しない。ユーザーがマイクボタンを再度押すまで待つ
    },
    []
  );

  // 修正後
  const handleRecognitionEnd = useCallback(() => {
    console.log("[DEBUG] onend 発火（音声認識が終了しました）"); // ★調査用
    setIsMicRecording(false);
    setIsFinalizingSpeech(false); // ★処理中の見た目を解除
    setUserMessage((currentText) => {
      if (currentText.trim() !== "") {
        onChatProcessStart(currentText, true);
      }
      return currentText;
    });
  }, [onChatProcessStart]);
// 修正後
  const [isFinalizingSpeech, setIsFinalizingSpeech] = useState(false); // ★停止ボタン後、onend待ちの間trueにする

  const handleClickMicButton = useCallback(() => {
    if (isMicRecording) {
      console.log("[DEBUG] マイク停止ボタン押下 → recognition.stop()を呼びます"); // ★調査用
      setIsFinalizingSpeech(true); // ★ここから「処理中」の見た目にする
      speechRecognition?.stop();
      setIsMicRecording(false);
      return;
    }

    console.log("[DEBUG] マイク開始ボタン押下 → recognition.start()を呼びます"); // ★調査用
    setUserMessage("");
    speechRecognition?.start();
    setIsMicRecording(true);
  }, [isMicRecording, speechRecognition]);
  const handleClickSendButton = useCallback(() => {
    onChatProcessStart(userMessage, false); // ★テキスト入力なのでfalse
  }, [onChatProcessStart, userMessage]);

  // 音声ファイルがアップロードされた時の処理
  const handleAudioFileSelected = useCallback(async (file: File) => {
    if (!viewer.model) {
      console.error("VRMモデルが読み込まれていません");
      return;
    }

    try {
      // APIにバイナリPOST
      const res = await fetch("/api/speak_external_audio", {
        method: "POST",
        headers: {
          "Content-Type": file.type || "audio/wav",
        },
        body: file,
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const buffer = await res.arrayBuffer();

      // ダミーScreenplay
      const dummyScreenplay = {
        expression: "neutral" as const,
        talk: { style: "talk" as const, speakerX: 0, speakerY: 0, message: "" },
      };

      await viewer.model.speak(buffer, dummyScreenplay);
      console.log("音声ファイルの再生が完了しました:", file.name);
    } catch (error) {
      console.error("音声ファイルの処理中にエラーが発生しました:", error);
    }
  }, [viewer.model]);

  useEffect(() => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    // FirefoxなどSpeechRecognition非対応環境対策
    if (!SpeechRecognition) {
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true; // 認識の途中結果を返す
    recognition.continuous = true; // 少し間が空いても認識を継続する

    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);

    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);

  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  return (
    <>
      <MessageInput
        userMessage={userMessage}
        isChatProcessing={isChatProcessing || isFinalizingSpeech}
        isMicRecording={isMicRecording}
        onChangeUserMessage={(e) => setUserMessage(e.target.value)}
        onClickMicButton={handleClickMicButton}
        onClickSendButton={handleClickSendButton}
        onAudioFileSelected={handleAudioFileSelected}
        onOpenSettings={onOpenSettings}
        showSubtitle={showSubtitle}
        onToggleSubtitle={onToggleSubtitle}
        audioState={audioState}
      />
    </>
  );
};
