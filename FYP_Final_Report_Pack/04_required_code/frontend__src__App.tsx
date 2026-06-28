import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import AvatarExact from "./components/AvatarExact";
import { answerCourseQuestion } from "./courseKnowledge";

type AskResponse = {
  question: string;
  route: string;
  used_rag: boolean;
  answer: string;
  sources: string[];
  confidence: number | null;
};

type BackendResponse = Partial<AskResponse> & {
  response?: string;
  type?: string;
};

class BackendOfflineError extends Error {
  constructor(message = "Hive AI service is offline.") {
    super(message);
    this.name = "BackendOfflineError";
  }
}

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  meta?: {
    route?: string;
    used_rag?: boolean;
    confidence?: number | null;
    sources?: string[];
  };
};

type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error";
type LayoutMode = "portrait" | "landscape";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const API_LABEL = API_BASE || "the configured Hive backend";
const REQUEST_TIMEOUT_MS = 45000;
const GREETING_RESPONSE = "Hi, I'm Hive.";
const WELCOME_RESPONSE =
  "Hi, welcome to Hive. I can help with Intelligent Robotics prerequisites, BYOC choices, Project I/II, study plans, progression rules, and programme structure.";
const SUGGESTED_PROMPTS = [
  "What BYOC subjects are offered in March/April?",
  "How should I choose a BYOC elective?",
  "What are the prerequisites for Project II?",
];

function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

function normalizeSource(source: unknown) {
  if (typeof source === "string") return source;
  if (!source || typeof source !== "object") return String(source ?? "");

  const value = source as Record<string, unknown>;
  return [
    value.source,
    value.source_file,
    value.file,
    value.course_code,
    value.layer,
  ]
    .filter(Boolean)
    .map(String)
    .join(" ");
}

function cleanAnswer(answer: unknown) {
  return String(answer)
    .replace(/^\s*Q:[\s\S]*?\bA:\s*/i, "")
    .replace(/\b[A-Z]{2,4}\d{3,4}(?:-[A-Z0-9]+)?\b\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGreetingIntent(text: string) {
  return /^(hi|hello|hey|hai|helo|good morning|good afternoon|good evening)[!.?\s]*$/i.test(text.trim());
}

function getScreenLayout(): LayoutMode {
  return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
}

function App() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() =>
    getScreenLayout()
  );

  const [manualLayout, setManualLayout] = useState(false);
  const [input, setInput] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: WELCOME_RESPONSE,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [, setSpeechPulse] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [lastError, setLastError] = useState(false);

  const [apiStatus, setApiStatus] = useState<"unknown" | "online" | "offline">(
    "unknown"
  );

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef("");
  const hasSentRef = useRef(false);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const speechPulseTimerRef = useRef<number | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  const avatarState: AvatarState = lastError
    ? "error"
    : listening
      ? "listening"
      : loading
        ? "thinking"
        : speaking
          ? "speaking"
          : "idle";

  useEffect(() => {
    function syncLayoutToScreen() {
      if (manualLayout) return;
      setLayoutMode(getScreenLayout());
    }

    syncLayoutToScreen();
    window.addEventListener("resize", syncLayoutToScreen);

    return () => {
      window.removeEventListener("resize", syncLayoutToScreen);
    };
  }, [manualLayout]);

  useEffect(() => {
    return () => {
      if (speechPulseTimerRef.current) {
        window.clearTimeout(speechPulseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function loadVoices() {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      const preferred =
        availableVoices.find((v) => /natural|online/i.test(v.name) && v.lang.toLowerCase().startsWith("en")) ||
        availableVoices.find((v) => v.name.toLowerCase().includes("aria")) ||
        availableVoices.find((v) => v.name.toLowerCase().includes("jenny")) ||
        availableVoices.find((v) => v.name.toLowerCase().includes("ava")) ||
        availableVoices.find((v) => v.name.toLowerCase().includes("samantha")) ||
        availableVoices.find((v) => v.name.toLowerCase().includes("google us english")) ||
        availableVoices.find((v) => v.name.toLowerCase().includes("mark")) ||
        availableVoices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
        availableVoices[0];

      if (preferred) {
        setSelectedVoice(preferred.name);
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    chatPanelRef.current?.scrollTo({
      top: chatPanelRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, liveTranscript]);

  async function checkHealth() {
    try {
      const checks = ["/health", "/api/health"];
      let online = false;

      for (const path of checks) {
        const res = await fetch(apiUrl(path));
        if (res.ok) {
          online = true;
          break;
        }
      }

      if (!online) throw new Error("Health check failed");
      setApiStatus("online");
      setLastError(false);
    } catch {
      setApiStatus("offline");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkHealth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function getConnectionMessage(error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "The Hive advising engine took too long to respond. Please try again in a moment.";
    }

    if (error instanceof TypeError || error instanceof BackendOfflineError) {
      return `Hive AI service is offline. Start the FastAPI RAG/fine-tuned backend at ${API_LABEL}, then try again.`;
    }

    if (error instanceof Error && error.message) {
      return `Hive AI service returned an error: ${error.message}`;
    }

    return "Hive AI service is unavailable. Please try again after the backend is running.";
  }

  function normalizeBackendResponse(data: BackendResponse): AskResponse {
    const answer = data.answer ?? data.response ?? "I received a response, but it did not include an answer.";

    return {
      question: data.question ?? "",
      route: data.route ?? data.type ?? "academic_advising",
      used_rag: data.used_rag ?? true,
      answer: cleanAnswer(answer),
      sources: Array.isArray(data.sources) ? data.sources.map(normalizeSource).filter(Boolean) : [],
      confidence: typeof data.confidence === "number" ? data.confidence : null,
    };
  }

  async function postQuestion(question: string, history: { role: string; content: string }[], signal: AbortSignal) {
    const attempts = [
      {
        path: "/ask",
        body: {
          question,
          history,
        },
      },
      {
        path: "/api/chat",
        body: {
          user_id: "hive-kiosk",
          message: question,
        },
      },
    ];

    let lastStatus = "";

    for (const attempt of attempts) {
      const res = await fetch(apiUrl(attempt.path), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
        body: JSON.stringify(attempt.body),
      });

      if (res.ok) {
        return normalizeBackendResponse((await res.json()) as BackendResponse);
      }

      lastStatus = `${attempt.path} returned ${res.status}`;
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new BackendOfflineError();
      }

      if (res.status !== 404 && res.status !== 405) {
        break;
      }
    }

    throw new Error(lastStatus || "Request failed");
  }

  function cleanSpeechText(text: string) {
    return text
      .replace(/Route:\s?.*$/gis, "")
      .replace(/Sources?:\s?.*$/gis, "")
      .replace(/Confidence:\s?.*$/gis, "")
      .trim();
  }

  function normalizeSpeechText(text: string) {
    return text
      .replace(/\bproject one\b/gi, "Project I")
      .replace(/\bproject 1\b/gi, "Project I")
      .replace(/\bproject won\b/gi, "Project I")
      .replace(/\bproject ii\b/gi, "Project II")
      .replace(/\bproject two\b/gi, "Project II")
      .replace(/\bproject 2\b/gi, "Project II")
      .replace(/\bproject to\b/gi, "Project II")
      .replace(/\bpart one\b/gi, "Part I")
      .replace(/\bpart 1\b/gi, "Part I")
      .replace(/\bpart two\b/gi, "Part II")
      .replace(/\bpart 2\b/gi, "Part II")
      .replace(/\bfill my project\b/gi, "fail my Project")
      .replace(/\bfill project\b/gi, "fail Project")
      .replace(/\bfeel my project\b/gi, "fail my Project")
      .replace(/\bfeel project\b/gi, "fail Project")
      .replace(/\bmax one\b/gi, "Project I")
      .replace(/\bmax two\b/gi, "Project II")
      .replace(/\bmats one\b/gi, "Project I")
      .replace(/\bmats two\b/gi, "Project II")
      .replace(/\bmaps one\b/gi, "Project I")
      .replace(/\bmaps two\b/gi, "Project II")
      .replace(/\s+/g, " ")
      .trim();
  }

  function wantsFullDetail(text: string) {
    return /\b(all|complete|every|full|full list|full outline|show all|show me all)\b/i.test(text);
  }

  function shortenAssistantAnswer(question: string, answer: string) {
    if (wantsFullDetail(question) || answer.length <= 430) {
      return answer;
    }

    if (/IR4\.0 age/i.test(answer)) {
      return answer;
    }

    if (/ includes /i.test(answer)) {
      const [lead, rest] = answer.split(/ includes /i, 2);
      const items = rest
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.length > 5) {
        return `${lead} includes ${items.slice(0, 4).join(", ")}, and ${items.length - 4} more. Want the full list?`;
      }
    }

    const sentences = answer.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length > 2) {
      return `${sentences.slice(0, 2).join(" ")} Want more detail?`;
    }

    return `${answer.slice(0, 400).replace(/[,;:\s]+$/, "")}. Want more detail?`;
  }

  function prepareSpeechText(text: string) {
    return cleanSpeechText(text)
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/[*_#`]/g, "")
      .replace(/\b1\.\s*/g, "First, ")
      .replace(/\b2\.\s*/g, "Second, ")
      .replace(/\b3\.\s*/g, "Third, ")
      .replace(/\b4\.\s*/g, "Fourth, ")
      .replace(/\b5\.\s*/g, "Fifth, ")
      .replace(/\bProject I\b/g, "Project one")
      .replace(/\bProject II\b/g, "Project two")
      .replace(/\bBYOC\b/g, "B Y O C")
      .replace(/\bMQA\b/g, "M Q A")
      .replace(/\bFAIE\b/g, "F A I E")
      .replace(/&/g, "and")
      .replace(/\s+/g, " ")
      .trim();
  }

  function speak(text: string) {
    if (!voiceEnabled) return;

    window.speechSynthesis.cancel();
    if (speechPulseTimerRef.current) {
      window.clearTimeout(speechPulseTimerRef.current);
    }
    setSpeechPulse(0);

    const utterance = new SpeechSynthesisUtterance(prepareSpeechText(text));

    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setSpeaking(true);
      setSpeechPulse(0.55);
      setLastError(false);
    };

    utterance.onboundary = () => {
      setSpeechPulse(1);
      if (speechPulseTimerRef.current) {
        window.clearTimeout(speechPulseTimerRef.current);
      }
      speechPulseTimerRef.current = window.setTimeout(() => {
        setSpeechPulse(0.35);
      }, 120);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setSpeechPulse(0);
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setSpeechPulse(0);
      setLastError(true);
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeechPulse(0);
    if (speechPulseTimerRef.current) {
      window.clearTimeout(speechPulseTimerRef.current);
    }
  }

  function getSilenceDelay(text: string) {
    if (/\b(um|uh|erm|well|let me think)\b/i.test(text)) {
      return 1500;
    }
    if (/^(yes|no|hi|hello|thanks|thank you)[.!?\s]*$/i.test(text.trim())) {
      return 700;
    }
    return 1100;
  }

  function getHistoryWithUserMessage(userMessage: ChatMessage) {
    return [...messages, userMessage].slice(-6).map((m) => ({
      role: m.role,
      content: m.text,
    }));
  }

  async function sendMessageWithText(rawQuestion: string) {
    const question = normalizeSpeechText(rawQuestion).trim();
    if (!question || loading) return;

    stopSpeaking();
    setLastError(false);

    const userMessage: ChatMessage = { role: "user", text: question };
    const currentHistory = getHistoryWithUserMessage(userMessage);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLiveTranscript("");

    if (isGreetingIntent(question)) {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        text: GREETING_RESPONSE,
        meta: {
          route: "greeting",
          used_rag: false,
          confidence: 1,
          sources: [],
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setApiStatus("online");
      speak(GREETING_RESPONSE);
      return;
    }

    const localAnswer = answerCourseQuestion(question);
    if (localAnswer) {
      const answerText = shortenAssistantAnswer(question, cleanAnswer(localAnswer.answer));
      const assistantMessage: ChatMessage = {
        role: "assistant",
        text: answerText,
        meta: {
          route: localAnswer.route,
          used_rag: localAnswer.used_rag,
          confidence: localAnswer.confidence,
          sources: localAnswer.sources,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setApiStatus("online");
      speak(answerText);
      return;
    }

    setLoading(true);
    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const data = await postQuestion(question, currentHistory, controller.signal);
      setApiStatus("online");
      setLastError(false);
      const answerText = shortenAssistantAnswer(question, data.answer);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        text: answerText,
        meta: {
          route: data.route,
          used_rag: data.used_rag,
          confidence: data.confidence,
          sources: data.sources,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speak(answerText);
    } catch (error) {
      const message = getConnectionMessage(error);
      setApiStatus("offline");
      setLastError(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: message,
        },
      ]);
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  }

  async function sendMessage() {
    await sendMessageWithText(input);
  }

  function startListening() {
    stopSpeaking();
    setLastError(false);

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setLastError(true);
      alert("Speech recognition is not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = "";
    hasSentRef.current = false;
    setLiveTranscript("");
    setInput("");

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      const currentText = normalizeSpeechText(
        `${finalTranscriptRef.current} ${interim}`.trim()
      );

      setLiveTranscript(currentText);
      setInput(currentText);

      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
      }

      silenceTimerRef.current = window.setTimeout(() => {
        const textToSend = normalizeSpeechText(
          `${finalTranscriptRef.current} ${interim}`.trim()
        );

        if (textToSend && !hasSentRef.current) {
          hasSentRef.current = true;
          recognition.stop();
          setListening(false);
          void sendMessageWithText(textToSend);
        }
      }, getSilenceDelay(currentText));
    };

    recognition.onerror = () => {
      setListening(false);
      setLastError(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setListening(false);

    const textToSend = normalizeSpeechText(input || liveTranscript);

    if (textToSend && !hasSentRef.current) {
      hasSentRef.current = true;
      void sendMessageWithText(textToSend);
    }
  }

  function clearChat() {
    stopSpeaking();
    setMessages([
      {
        role: "assistant",
        text: WELCOME_RESPONSE,
      },
    ]);
    setInput("");
    setLiveTranscript("");
    setLastError(false);
  }

  function toggleLayout() {
    setManualLayout(true);
    setLayoutMode((mode) => (mode === "portrait" ? "landscape" : "portrait"));
  }

  function resetAutoLayout() {
    setManualLayout(false);
    setLayoutMode(getScreenLayout());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  function renderAvatar() {
    const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");
    return <AvatarExact state={avatarState} subtitle={latestAssistant?.text ?? ""} />;
  }

  function renderPromptChips() {
    return (
      <div className="prompt-chip-row" aria-label="Suggested questions">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="prompt-chip"
            type="button"
            onClick={() => setInput(prompt)}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>
    );
  }

  function renderChatMessages() {
    return (
      <>
        {listening && (
          <div className="live-transcript">
            <div className="live-label">Live transcript</div>
            <div className="live-text">
              {liveTranscript || "Listening... start speaking"}
            </div>
            <div className="live-hint">
              Auto-sends after a short pause.
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message-row ${message.role}`}>
            <div className={`message-bubble ${message.role}`}>
              <div className="message-role">
                {message.role === "user" ? "You" : "Hive"}
              </div>

              <div className="message-text">{message.text}</div>

              {debugMode && message.role === "assistant" && message.meta && (
                <div className="message-meta">
                  <div className="meta-line">
                    <span>Route:</span>
                    <strong>{message.meta.route ?? "-"}</strong>
                  </div>

                  <div className="meta-line">
                    <span>Used RAG:</span>
                    <strong>{String(message.meta.used_rag ?? false)}</strong>
                  </div>

                  <div className="meta-line">
                    <span>Confidence:</span>
                    <strong>
                      {message.meta.confidence === null ||
                        message.meta.confidence === undefined
                        ? "-"
                        : message.meta.confidence.toFixed(2)}
                    </strong>
                  </div>

                  {message.meta.sources && message.meta.sources.length > 0 && (
                    <div className="sources-block">
                      <span>Sources:</span>
                      <ul>
                        {message.meta.sources.map((source, i) => (
                          <li key={i}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="message-bubble assistant">
              <div className="message-role">Hive</div>
              <div className="message-text">Checking programme rules...</div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`hive-app hive-${layoutMode}`}>
      <div className="hive-bg-lines" />

      <div className="layout-button-stack">
        <button className="layout-toggle" onClick={toggleLayout} type="button">
          {layoutMode === "portrait" ? "Landscape" : "Portrait"}
        </button>

        {manualLayout && (
          <button className="layout-auto" onClick={resetAutoLayout} type="button">
            Auto Fit
          </button>
        )}
      </div>

      {layoutMode === "portrait" ? (
        <main className="portrait-shell">
          <header className="portrait-header">
            <div className="hive-logo-mark">H</div>
            <div>
              <h1>Hive Advisor</h1>
              <p>AI Academic Advisor</p>
              <span className={`api-status-inline ${apiStatus}`}>
                {apiStatus === "online" ? "AI Online" : apiStatus === "offline" ? "AI Offline" : "Checking AI"}
              </span>
            </div>
          </header>

          <section className="portrait-avatar-card">{renderAvatar()}</section>

          <section className="portrait-input-card">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about Intelligent Robotics, BYOC, or progression..."
              rows={3}
            />

            <button
              className="portrait-send"
              onClick={sendMessage}
              disabled={!canSend}
              type="button"
            >
              Send
            </button>
          </section>

          <section className="portrait-prompt-card">{renderPromptChips()}</section>

          <section className="portrait-mode-row">
            <button className="mode-card" onClick={stopSpeaking} type="button">
              <span>T</span>
              Text
            </button>

            <button
              className={`mode-card ${listening ? "active" : ""}`}
              onClick={listening ? stopListening : startListening}
              type="button"
              disabled={loading}
            >
              <span>V</span>
              {listening ? "Stop" : "Voice"}
            </button>
          </section>

          <section className="portrait-mini-chat" ref={chatPanelRef}>
            {renderChatMessages()}
          </section>
        </main>
      ) : (
        <main className="landscape-shell">
          <section className="landscape-chat-card">
            <header className="landscape-header">
              <div className="landscape-brand">
                <div className="hive-logo-mark">H</div>
                <div>
                  <h1>Hive</h1>
                  <p>AI Academic Advisor</p>
                </div>
              </div>

              <div className="landscape-header-actions">
                <span className={`api-status-inline ${apiStatus}`}>
                  {apiStatus === "online" ? "AI Online" : apiStatus === "offline" ? "AI Offline" : "Checking AI"}
                </span>
                <button
                  className={`header-voice-toggle ${voiceEnabled ? "active" : ""}`}
                  onClick={() => setVoiceEnabled((v) => !v)}
                  type="button"
                >
                  Voice {voiceEnabled ? "On" : "Off"}
                </button>
              </div>
            </header>

            <div className="landscape-chat-panel" ref={chatPanelRef}>
              {messages.length <= 1 && !listening && !loading && renderPromptChips()}
              {renderChatMessages()}
            </div>

            <div className="landscape-composer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about Intelligent Robotics, BYOC, or progression..."
                rows={3}
              />

              <div className="landscape-actions">
                <button
                  className={`mic-btn ${listening ? "active" : ""}`}
                  onClick={listening ? stopListening : startListening}
                  type="button"
                  disabled={loading}
                >
                  {listening ? "Stop" : "Mic"}
                </button>

                <button
                  className="primary-btn"
                  onClick={sendMessage}
                  disabled={!canSend}
                  type="button"
                >
                  Send
                </button>
              </div>
            </div>
          </section>

          <aside className="landscape-avatar-panel">
            <section className="avatar-showcase">
              <button
                className="landscape-settings-button"
                onClick={() => setDebugMode((v) => !v)}
                type="button"
                title="Toggle debug"
              >
                Settings
              </button>

              {renderAvatar()}
            </section>

            <section className="kiosk-control-strip">
              <div className="control-card status-control-card">
                <div className="status-row">
                  <span>Backend</span>
                  <strong className={`status-pill ${apiStatus}`}>
                    {apiStatus.toUpperCase()}
                  </strong>
                </div>

                <button className="secondary-btn" onClick={checkHealth}>
                  Check API
                </button>
              </div>

              <div className="control-card voice-control-card">
                <div className="status-row">
                  <span>Voice</span>
                  <strong>{voiceEnabled ? "ON" : "OFF"}</strong>
                </div>

                <select
                  className="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  {voices.length === 0 && (
                    <option value="">Loading voices...</option>
                  )}

                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>

                <div className="control-button-grid">
                  <button className="secondary-btn" onClick={stopSpeaking}>
                    Stop
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => setDebugMode((v) => !v)}
                  >
                    Debug {debugMode ? "On" : "Off"}
                  </button>

                  <button className="secondary-btn" onClick={clearChat}>
                    Clear
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </main>
      )}
    </div>
  );
}

export default App;
