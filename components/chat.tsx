"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  User,
  Trash2,
  Mic,
  MicOff,
  Plus,
  Copy,
  Check,
  ChevronDown,
  X,
  ArrowDown,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
}

const SESSIONS_KEY = "axon-chat-sessions";
const CURRENT_SESSION_KEY = "axon-current-session";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function createNewSession(): ChatSession {
  return {
    id: generateId(),
    name: "New chat",
    messages: [],
    createdAt: Date.now(),
  };
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteSessionDialog, setShowDeleteSessionDialog] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(SESSIONS_KEY);
      const savedCurrentId = localStorage.getItem(CURRENT_SESSION_KEY);

      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(
            savedCurrentId &&
              parsed.find((s: ChatSession) => s.id === savedCurrentId)
              ? savedCurrentId
              : parsed[0].id
          );
          setMounted(true);
          return;
        }
      }

      const oldMessages = localStorage.getItem("axon-chat-messages");
      if (oldMessages) {
        const msgs = JSON.parse(oldMessages);
        const migrated: ChatSession = {
          id: generateId(),
          name:
            msgs.length > 0
              ? msgs[0].content.substring(0, 30)
              : "Chat",
          messages: msgs.map((m: any) => ({
            ...m,
            timestamp: m.timestamp || Date.now(),
          })),
          createdAt: Date.now(),
        };
        setSessions([migrated]);
        setCurrentSessionId(migrated.id);
        localStorage.removeItem("axon-chat-messages");
      } else {
        const fresh = createNewSession();
        setSessions([fresh]);
        setCurrentSessionId(fresh.id);
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && sessions.length > 0) {
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
        localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
      } catch {}
    }
  }, [sessions, currentSessionId, mounted]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, loading, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 150) + "px";
    }
  }, [input]);

  function handleScroll() {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  }

  function updateMessages(newMessages: Message[]) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        const name =
          s.name === "New chat" && newMessages.length > 0
            ? newMessages[0].content.substring(0, 35) +
              (newMessages[0].content.length > 35 ? "..." : "")
            : s.name;
        return { ...s, messages: newMessages, name };
      })
    );
  }

  function startNewSession() {
    const fresh = createNewSession();
    setSessions((prev) => [fresh, ...prev]);
    setCurrentSessionId(fresh.id);
    setShowSessions(false);
    setInput("");
  }

  function switchSession(id: string) {
    setCurrentSessionId(id);
    setShowSessions(false);
    setInput("");
  }

  function confirmDeleteSession(id: string) {
    setShowDeleteSessionDialog(id);
    setShowSessions(false);
  }

  function deleteSession(id: string) {
    if (sessions.length <= 1) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
    } else {
      const filtered = sessions.filter((s) => s.id !== id);
      setSessions(filtered);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
    }
    setShowDeleteSessionDialog(null);
  }

  function clearCurrentChat() {
    updateMessages([]);
    setShowClearDialog(false);
  }

  async function copyMessage(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(`${currentSessionId}-${index}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    sendingRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      if (sendingRef.current) return;
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    sendingRef.current = true;
    stopListening();

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    const newMessages = [...messages, userMessage];
    updateMessages(newMessages);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      sendingRef.current = false;
    }, 500);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();

      updateMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.error
            ? "I could not process that request right now. This is usually a temporary issue with the AI service. Please try again in a moment."
            : data.message,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      updateMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Could not reach the server. Please check your connection and try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <div
        className="flex flex-col"
        style={{ height: "calc(100dvh - 3.5rem)" }}
      >
        <div className="shrink-0 px-4 h-10 border-b border-zinc-800/50 flex items-center justify-between relative">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors min-w-0"
          >
            <span className="truncate max-w-[200px]">
              {currentSession?.name || "New chat"}
            </span>
            <ChevronDown
              className={`w-3 h-3 shrink-0 transition-transform ${
                showSessions ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            onClick={startNewSession}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-amber-500 transition-colors shrink-0"
            title="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>

          {showSessions && (
            <>
              <button
                className="fixed inset-0 z-10"
                onClick={() => setShowSessions(false)}
              />
              <div className="absolute top-full left-0 right-0 z-20 mt-px bg-zinc-950 border border-zinc-800 rounded-b-xl shadow-xl max-h-64 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                      session.id === currentSessionId
                        ? "bg-zinc-800/50 text-zinc-200"
                        : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
                    }`}
                  >
                    <button
                      onClick={() => switchSession(session.id)}
                      className="flex-1 text-left truncate min-w-0"
                    >
                      {session.name}
                    </button>
                    <span className="text-[10px] text-zinc-700 shrink-0">
                      {session.messages.length} msgs
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteSession(session.id);
                      }}
                      className="text-zinc-700 hover:text-red-400 transition-colors shrink-0 p-0.5"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 relative"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-10 md:py-14 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                  <div className="w-4 h-4 rounded bg-amber-500/90" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-medium text-zinc-200">
                    What can I help you with?
                  </h2>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                    I can read your emails, check your calendar, search your
                    Drive, manage GitHub repos, draft replies, and create events.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {[
                    "Summarize my unread emails",
                    "What's on my calendar today?",
                    "Show my GitHub repos",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, i) => {
              const msgId = `${currentSessionId}-${i}`;
              const isCopied = copiedId === msgId;

              return (
                <div key={i} className="flex gap-3 group">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      message.role === "user"
                        ? "bg-zinc-800 border border-zinc-700"
                        : "bg-amber-500/10 border border-amber-500/20"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <div className="w-3 h-3 rounded bg-amber-500/90" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-zinc-500">
                        {message.role === "user" ? "You" : "Axon"}
                      </p>
                      <span className="text-[10px] text-zinc-700">
                        {formatTime(message.timestamp)}
                      </span>
                      <button
                        onClick={() => copyMessage(message.content, i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-zinc-400 ml-auto"
                        title="Copy"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-3 h-3 rounded bg-amber-500/90" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium text-zinc-500 mb-1">
                    Axon
                  </p>
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Working on it...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors shadow-lg"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="shrink-0 px-4 pb-4 pt-2 border-t border-zinc-800/50 bg-zinc-950">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2">
              {messages.length > 0 && (
                <button
                  onClick={() => setShowClearDialog(true)}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600 hover:text-red-400 hover:border-red-400/30 transition-colors mb-[2px]"
                  title="Clear this chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex-1 flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 focus-within:border-zinc-700 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? "Listening..."
                      : "Ask Axon to do something..."
                  }
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none py-1 leading-relaxed"
                  disabled={loading}
                  rows={1}
                  style={{ maxHeight: "150px" }}
                />
                <div className="flex items-center gap-1 shrink-0 pb-0.5">
                  <button
                    onClick={toggleListening}
                    disabled={loading}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isListening
                        ? "text-red-400 bg-red-400/10"
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="text-xs font-medium bg-amber-500 text-zinc-950 px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-30 disabled:hover:bg-amber-500"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 text-center">
              Every action goes through Auth0 Token Vault. Scopes enforced per
              request.
            </p>
          </div>
        </div>
      </div>

      {showClearDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowClearDialog(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-medium text-zinc-100">
              Clear chat messages
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              This will delete all messages in this chat. The session will
              remain. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowClearDialog(false)}
                className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearCurrentChat}
                className="text-xs font-medium text-zinc-950 bg-red-500 rounded-lg px-3.5 py-2 hover:bg-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSessionDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDeleteSessionDialog(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-medium text-zinc-100">
              Delete chat session
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              This will permanently delete this chat session and all its
              messages. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowDeleteSessionDialog(null)}
                className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSession(showDeleteSessionDialog)}
                className="text-xs font-medium text-zinc-950 bg-red-500 rounded-lg px-3.5 py-2 hover:bg-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}