"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

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

      if (data.error) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: `Something went wrong: ${data.error}`,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.message },
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Failed to reach the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                <div className="w-4 h-4 rounded bg-amber-500/90" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-medium text-zinc-200">
                  What can I help you with?
                </h2>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  I can read your emails, check your calendar, draft replies,
                  and create events.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  "Summarize my unread emails",
                  "What's on my calendar today?",
                  "How many unread emails do I have?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div key={i} className="flex gap-3">
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
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  {message.role === "user" ? "You" : "Axon"}
                </p>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-3 h-3 rounded bg-amber-500/90" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs font-medium text-zinc-500 mb-1">Axon</p>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Working on it...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-700 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Axon to do something..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
              disabled={loading}
            />
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
          <p className="text-[10px] text-zinc-700 mt-2 text-center">
            Every action goes through Auth0 Token Vault. Scopes enforced per request.
          </p>
        </div>
      </div>
    </div>
  );
}