import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./AvatarExact.css";
import ebeeImg from "../assets/ebee-exact-transparent.png";

type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error";

type Props = {
  state: AvatarState;
  subtitle?: string;
};

const statusText: Record<AvatarState, string> = {
  idle: "READY",
  listening: "LISTENING",
  thinking: "CHECKING",
  speaking: "SPEAKING",
  error: "REVIEW",
};

const videoByState: Record<AvatarState, string[]> = {
  idle: [
    "/avatar/exact/videos/ebee_idle_5s.mp4",
    "/avatar/exact/videos/ebee_idle_5s_2.mp4",
    "/avatar/exact/videos/ebee_idle_5s_3.mp4",
  ],
  listening: [
    "/avatar/exact/videos/ebee_listening_5s.mp4",
    "/avatar/exact/videos/ebee_listening_5s_2.mp4",
  ],
  thinking: [
    "/avatar/exact/videos/ebee_listening_5s.mp4",
    "/avatar/exact/videos/ebee_listening_5s_2.mp4",
  ],
  speaking: [
    "/avatar/exact/videos/ebee_speaking_5s.mp4",
    "/avatar/exact/videos/ebee_speaking_5s_2.mp4",
    "/avatar/exact/videos/ebee_speaking_5s_3.mp4",
  ],
  error: [
    "/avatar/exact/videos/ebee_idle_5s.mp4",
    "/avatar/exact/videos/ebee_idle_5s_2.mp4",
    "/avatar/exact/videos/ebee_idle_5s_3.mp4",
  ],
};

const enableVideo = import.meta.env.VITE_ENABLE_AVATAR_VIDEO !== "false";
const enablePngSequences = import.meta.env.VITE_ENABLE_AVATAR_SEQUENCES === "true";
const VIDEO_HANDOFF_SECONDS = 0.45;
const IDLE_REPEATS_BEFORE_ADVANCE = 3;

const poseByState: Record<AvatarState, string> = {
  idle: "/avatar/exact/idle.png",
  listening: "/avatar/exact/listening.png",
  thinking: "/avatar/exact/thinking.png",
  speaking: "/avatar/exact/idle.png",
  error: "/avatar/exact/error.png",
};

const sequenceFramesByState: Record<AvatarState, string[]> = {
  idle: Array.from({ length: 8 }, (_, index) => `/avatar/exact/idle/frame-${String(index).padStart(2, "0")}.png`),
  listening: Array.from({ length: 8 }, (_, index) => `/avatar/exact/listening/frame-${String(index).padStart(2, "0")}.png`),
  thinking: Array.from({ length: 8 }, (_, index) => `/avatar/exact/thinking/frame-${String(index).padStart(2, "0")}.png`),
  speaking: Array.from({ length: 8 }, (_, index) => `/avatar/exact/speaking/frame-${String(index).padStart(2, "0")}.png`),
  error: Array.from({ length: 8 }, (_, index) => `/avatar/exact/error/frame-${String(index).padStart(2, "0")}.png`),
};

function getCaption(state: AvatarState, subtitle = "") {
  if (state === "listening") return "I am listening.";
  if (state === "thinking") return "Checking programme rules.";
  if (state === "speaking") return subtitle || "Here is the answer.";
  if (state === "error") return "I need verified programme information for that.";
  return "Ready to help with academic advising.";
}

export default function AvatarExact({ state, subtitle = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleRepeatCountRef = useRef(0);
  const lastVideoCompletionAtRef = useRef(0);
  const [failedVideos, setFailedVideos] = useState<Record<string, boolean>>({});
  const [failedSequences, setFailedSequences] = useState<Partial<Record<AvatarState, boolean>>>({});
  const [failedPoses, setFailedPoses] = useState<Partial<Record<AvatarState, boolean>>>({});
  const [frameIndex, setFrameIndex] = useState(0);
  const [videoIndexByState, setVideoIndexByState] = useState<Record<AvatarState, number>>({
    idle: 0,
    listening: 0,
    thinking: 0,
    speaking: 0,
    error: 0,
  });
  const videoSources = videoByState[state].filter((src) => !failedVideos[src]);
  const videoIndex = videoSources.length > 0 ? videoIndexByState[state] % videoSources.length : 0;
  const videoSrc = videoSources.length > 0 ? videoSources[videoIndex] : "";
  const nextVideoSrc = videoSources.length > 1 ? videoSources[(videoIndex + 1) % videoSources.length] : "";
  const poseSrc = poseByState[state];
  const sequenceFrames = sequenceFramesByState[state];
  const shouldUseVideo = enableVideo && videoSources.length > 0;
  const shouldUseSequence = enablePngSequences && state !== "idle" && !shouldUseVideo && !failedSequences[state];
  const shouldUsePose = !shouldUseVideo && !shouldUseSequence && !failedPoses[state];
  const assetMode = shouldUseVideo ? "video" : shouldUseSequence ? "sequence" : shouldUsePose ? "pose" : "base";
  const caption = useMemo(() => getCaption(state, subtitle), [state, subtitle]);

  const advanceVideo = useCallback((currentState: AvatarState) => {
    if (currentState === "idle") {
      idleRepeatCountRef.current = 0;
    }

    setVideoIndexByState((current) => ({
      ...current,
      [currentState]: current[currentState] + 1,
    }));
  }, []);

  const completeVideoPlayback = useCallback((currentState: AvatarState) => {
    const now = window.performance.now();
    if (now - lastVideoCompletionAtRef.current < 1000) {
      return true;
    }
    lastVideoCompletionAtRef.current = now;

    const video = videoRef.current;
    if (currentState === "idle" && videoSources.length > 1 && idleRepeatCountRef.current < IDLE_REPEATS_BEFORE_ADVANCE - 1) {
      idleRepeatCountRef.current += 1;
      if (video) {
        video.currentTime = 0;
        void video.play();
      }
      return true;
    }

    advanceVideo(currentState);
    return false;
  }, [advanceVideo, videoSources.length]);

  useEffect(() => {
    idleRepeatCountRef.current = 0;
  }, [state, videoSrc]);

  useEffect(() => {
    if (!shouldUseSequence) return undefined;
    const frameDuration = state === "speaking" ? 135 : state === "error" ? 240 : 220;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % sequenceFrames.length);
    }, frameDuration);
    return () => window.clearInterval(timer);
  }, [sequenceFrames.length, shouldUseSequence, state]);

  useEffect(() => {
    if (!shouldUseVideo) return undefined;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!video || !canvas || !context) return undefined;

    const sourceCanvas = document.createElement("canvas");
    const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceContext) return undefined;

    const outputWidth = 840;
    const outputHeight = 1188;
    let cropBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    let animationFrame = 0;
    let videoFrameCallback = 0;
    let handoffStarted = false;
    let stopped = false;

    const renderFrame = () => {
      if (stopped) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width > 0 && height > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (handoffStarted && video.currentTime < VIDEO_HANDOFF_SECONDS) {
          handoffStarted = false;
        }

        if (
          videoSources.length > 1 &&
          !handoffStarted &&
          Number.isFinite(video.duration) &&
          video.duration > VIDEO_HANDOFF_SECONDS &&
          video.duration - video.currentTime <= VIDEO_HANDOFF_SECONDS
        ) {
          handoffStarted = true;
          completeVideoPlayback(state);
          return;
        }

        if (sourceCanvas.width !== width || sourceCanvas.height !== height) {
          sourceCanvas.width = width;
          sourceCanvas.height = height;
        }

        if (canvas.width !== outputWidth || canvas.height !== outputHeight) {
          canvas.width = outputWidth;
          canvas.height = outputHeight;
        }

        sourceContext.clearRect(0, 0, width, height);
        sourceContext.drawImage(video, 0, 0, width, height);

        const frame = sourceContext.getImageData(0, 0, width, height);
        const pixels = frame.data;
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const greenDominance = green - Math.max(red, blue);
          const pixelOffset = index / 4;
          const x = pixelOffset % width;
          const y = Math.floor(pixelOffset / width);

          if (green > 95 && greenDominance > 34) {
            pixels[index + 3] = 0;
          } else if (greenDominance > 16) {
            pixels[index + 1] = Math.max(red, blue);
          }

          if (pixels[index + 3] > 24) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }

        sourceContext.putImageData(frame, 0, 0);

        if (maxX > minX && maxY > minY) {
          const padding = Math.round(Math.max(width, height) * 0.035);
          const detectedBounds = {
            minX: Math.max(0, minX - padding),
            minY: Math.max(0, minY - padding),
            maxX: Math.min(width, maxX + padding),
            maxY: Math.min(height, maxY + padding),
          };

          cropBounds = cropBounds
            ? {
                minX: Math.min(cropBounds.minX, detectedBounds.minX),
                minY: Math.min(cropBounds.minY, detectedBounds.minY),
                maxX: Math.max(cropBounds.maxX, detectedBounds.maxX),
                maxY: Math.max(cropBounds.maxY, detectedBounds.maxY),
              }
            : detectedBounds;

          const cropWidth = cropBounds.maxX - cropBounds.minX;
          const cropHeight = cropBounds.maxY - cropBounds.minY;
          const outputRatio = outputWidth / outputHeight;
          const cropRatio = cropWidth / cropHeight;
          const drawWidth = cropRatio > outputRatio ? outputWidth : outputHeight * cropRatio;
          const drawHeight = cropRatio > outputRatio ? outputWidth / cropRatio : outputHeight;
          const drawX = (outputWidth - drawWidth) / 2;
          const drawY = (outputHeight - drawHeight) / 2;

          context.clearRect(0, 0, outputWidth, outputHeight);
          context.drawImage(
            sourceCanvas,
            cropBounds.minX,
            cropBounds.minY,
            cropWidth,
            cropHeight,
            drawX,
            drawY,
            drawWidth,
            drawHeight
          );
        }
      }

      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const startRendering = () => {
      window.cancelAnimationFrame(animationFrame);
      renderFrame();
    };

    const startVideo = () => {
      video.muted = true;
      video.playsInline = true;
      void video.play().then(startRendering).catch(() => {
        startRendering();
      });
    };

    const drawVideoFrame = () => {
      startRendering();
      if ("requestVideoFrameCallback" in video) {
        videoFrameCallback = video.requestVideoFrameCallback(drawVideoFrame);
      }
    };

    if ("requestVideoFrameCallback" in video) {
      videoFrameCallback = video.requestVideoFrameCallback(drawVideoFrame);
    }

    video.addEventListener("canplay", startVideo);
    video.addEventListener("loadeddata", startRendering);
    video.addEventListener("play", startRendering);
    startVideo();

    return () => {
      stopped = true;
      window.cancelAnimationFrame(animationFrame);
      if ("cancelVideoFrameCallback" in video && videoFrameCallback) {
        video.cancelVideoFrameCallback(videoFrameCallback);
      }
      video.removeEventListener("canplay", startVideo);
      video.removeEventListener("loadeddata", startRendering);
      video.removeEventListener("play", startRendering);
    };
  }, [completeVideoPlayback, shouldUseVideo, state, videoSources.length, videoSrc]);

  return (
    <section
      className={`avatar-exact avatar-exact-${state} avatar-exact-mode-${assetMode}`}
      data-asset-mode={assetMode}
      data-avatar-state={state}
    >
      <div className="avatar-exact-screen" />
      <div className="avatar-exact-grid" />
      <div className="avatar-exact-light" />

      <div className="avatar-exact-status">
        <span />
        {statusText[state]}
      </div>

      <div className="avatar-exact-stage" aria-label="Hive Ebee avatar">
        <div className="avatar-exact-shadow" />
        <div className="avatar-exact-rig">
          {shouldUseVideo && (
            <>
              <video
                ref={videoRef}
                key={videoSrc}
                className="avatar-exact-source-video"
                src={videoSrc}
                autoPlay
                muted
                playsInline
                preload="auto"
                poster={ebeeImg}
                onEnded={() => completeVideoPlayback(state)}
                onError={() => {
                  setFailedVideos((current) => ({ ...current, [videoSrc]: true }));
                  advanceVideo(state);
                }}
              />
              {nextVideoSrc && (
                <video
                  className="avatar-exact-preload-video"
                  src={nextVideoSrc}
                  muted
                  playsInline
                  preload="auto"
                  aria-hidden="true"
                />
              )}
              <canvas ref={canvasRef} className="avatar-exact-video avatar-exact-canvas" aria-hidden="true" />
            </>
          )}

          {shouldUsePose && (
            <img
              key={poseSrc}
              className="avatar-exact-image"
              src={poseSrc}
              alt="Hive Ebee avatar"
              onError={() => {
                setFailedPoses((current) => ({ ...current, [state]: true }));
              }}
            />
          )}

          {shouldUseSequence && (
            <img
              className="avatar-exact-image"
              src={sequenceFrames[frameIndex]}
              alt="Hive Ebee avatar"
              onError={() => {
                setFailedSequences((current) => ({ ...current, [state]: true }));
              }}
            />
          )}

          <img
            className={`avatar-exact-image ${shouldUseVideo || shouldUseSequence || shouldUsePose ? "avatar-exact-image-fallback" : ""}`}
            src={ebeeImg}
            alt="Hive Ebee avatar"
          />

          <div className="avatar-exact-mouth-mask" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>

      <div className="avatar-exact-caption">{caption}</div>
    </section>
  );
}
