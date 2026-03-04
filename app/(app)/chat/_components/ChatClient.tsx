"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { Course } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Message = { role: "user" | "assistant"; content: string };

interface Props {
  courses: Course[];
}

/* ─── Simple markdown renderer ───────────────────────────────────────── */
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
        {listItems.map((item, i) => (
          <li key={i} className="text-sand-300 text-sm leading-relaxed">
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of lines) {
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);

    if (numMatch) {
      listItems.push(numMatch[2]);
    } else if (bulletMatch) {
      listItems.push(bulletMatch[1]);
    } else {
      flushList();
      if (h2Match) {
        elements.push(<p key={key++} className="text-sand-200 text-sm font-semibold mt-2">{h2Match[1]}</p>);
      } else if (h3Match) {
        elements.push(<p key={key++} className="text-sand-300 text-sm font-medium mt-1">{h3Match[1]}</p>);
      } else if (line.trim() === "") {
        elements.push(<div key={key++} className="h-1.5" />);
      } else {
        elements.push(
          <p key={key++} className="text-sand-300 text-sm leading-relaxed">
            <InlineText text={line} />
          </p>
        );
      }
    }
  }
  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-sand-200 font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="font-mono text-xs bg-bark-900 text-ember-300 px-1 py-0.5 rounded">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */

export function ChatClient({ courses }: Props) {
  const t = useTranslation();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-10),
          courseId: selectedCourseId || undefined,
        }),
      });

      const payload = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !payload.reply) {
        setError(payload.error ?? t.chat.errorResponse);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: payload.reply as string }]);
    } catch {
      setError(t.chat.networkError);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    setInput("");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sand-200 text-xl font-semibold">{t.chat.title}</h2>
          <Badge variant="info">AI</Badge>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-sand-600 text-xs hover:text-sand-400 transition-colors">
            {t.chat.clearChat}
          </button>
        )}
      </div>

      {/* Course context picker */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            disabled={loading}
            className="w-full bg-card border border-warm rounded px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-400 disabled:opacity-50"
          >
            <option value="">{t.chat.noCourseContext}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {selectedCourse && (
          <p className="text-sand-600 text-xs">{t.chat.courseContext(selectedCourse.title)}</p>
        )}
      </div>

      {/* Message thread */}
      <Card padding="none" className="flex flex-col" style={{ minHeight: "420px" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[480px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <p className="text-sand-400 text-sm mb-1">{t.chat.askAnything}</p>
              <p className="text-sand-600 text-xs">
                {selectedCourse ? t.chat.courseContext(selectedCourse.title) : t.chat.selectCourseContext}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
                {t.chat.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-full border border-warm text-sand-500 text-xs hover:border-ember-400 hover:text-sand-200 transition-colors disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={[
                    "rounded-lg px-4 py-3",
                    msg.role === "assistant"
                      ? "bg-card border border-warm"
                      : "bg-ember-500/10 border border-ember-500/30 ml-6",
                  ].join(" ")}
                >
                  <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: msg.role === "assistant" ? "#A89070" : "#E8732A" }}>
                    {msg.role === "assistant" ? "PomAI" : "You"}
                  </p>
                  {msg.role === "assistant" ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    <p className="text-sand-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              ))}

              {loading && (
                <div className="rounded-lg px-4 py-3 bg-card border border-warm">
                  <p className="text-[10px] uppercase tracking-widest mb-2 text-sand-500">PomAI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-sand-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-sand-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-sand-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-warm p-3 space-y-2">
          {error && (
            <p className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder={t.chat.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1 bg-bark-900 border border-warm rounded px-3 py-2 text-sand-200 text-sm placeholder-sand-600 focus:outline-none focus:border-ember-400 resize-none disabled:opacity-50 transition-colors"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => sendMessage()}
              loading={loading}
              disabled={!input.trim() || loading}
              className="shrink-0"
            >
              {t.chat.sendBtn}
            </Button>
          </div>
          <p className="text-sand-600 text-[10px]">{t.chat.sendHint}</p>
        </div>
      </Card>
    </div>
  );
}
