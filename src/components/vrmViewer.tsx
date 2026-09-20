import { useContext, useCallback, useState } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";

const VRM_FILES = {
  summer: "/Kiyoka_summer.vrm",
  winter: "/Kiyoka_winter.vrm",
};

export default function VrmViewer() {
  const { viewer } = useContext(ViewerContext);
  const [season, setSeason] = useState<"summer" | "winter">("summer");

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        viewer.loadVrm(buildUrl(VRM_FILES.summer));

        // Drag and DropでVRMを差し替え
        canvas.addEventListener("dragover", function (event) {
          event.preventDefault();
        });

        canvas.addEventListener("drop", function (event) {
          event.preventDefault();

          const files = event.dataTransfer?.files;
          if (!files) {
            return;
          }

          const file = files[0];
          if (!file) {
            return;
          }

          const file_type = file.name.split(".").pop()?.toLowerCase();
          const blob = new Blob([file], { type: "application/octet-stream" });
          const url = window.URL.createObjectURL(blob);

          if (file_type === "vrm") {
            viewer.loadVrm(url);
          } else if (file_type === "vrma") {
            viewer.playVrma(url);
          } else if (file_type === "fbx") {
            viewer.playFbx(url);
          }
        });
      }
    },
    [viewer]
  );

  const handleSeasonToggle = useCallback(() => {
    const nextSeason = season === "summer" ? "winter" : "summer";
    setSeason(nextSeason);
    viewer.loadVrm(buildUrl(VRM_FILES[nextSeason]));
  }, [season, viewer]);

  return (
    <div className={"absolute top-0 left-0 w-screen h-[100svh] -z-10"}>
      <canvas ref={canvasRef} className={"h-full w-full"}></canvas>

      <button
        onClick={handleSeasonToggle}
        className={
          "absolute top-4 right-4 z-10 rounded-full bg-white/80 px-4 py-2 text-sm font-medium shadow-md hover:bg-white"
        }
      >
        {season === "summer" ? "❄️ 冬服にする" : "☀️ 夏服にする"}
      </button>
    </div>
  );
}
