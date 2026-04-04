import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, FileText, Trash2, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const EXAMPLE_PROMPTS = [
  "Gere um roteiro de Frutas Falantes",
  "Gere um roteiro de Fazendeira Hot",
  "Gere um roteiro de Cartomante",
  "Gere um roteiro de Notícias Virais",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;

const GerarRoteiro = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPro = profile?.plan === "pro" && profile?.status === "approved";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && user && !isPro && !isAdmin) {
      toast.error("Acesso restrito ao plano Pro.");
      navigate("/");
    }
  }, [user, isPro, isAdmin, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (predefinedPrompt?: string) => {
    const trimmed = (predefinedPrompt || input).trim();
    if (!trimmed || isLoading) return;
    if (!predefinedPrompt) setInput("");
    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (content: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              upsertAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              upsertAssistant(assistantContent);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao gerar resposta.");
      // Remove the user message if no assistant response was generated
      if (!assistantContent) {
        setMessages(messages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isPro && !isAdmin)) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col mx-auto w-full max-w-3xl px-4 pt-24 sm:pt-28 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Gerador de Roteiros & Prompts
            </h1>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive gap-1">
              <Trash2 className="h-4 w-4" /> Limpar
            </Button>
          )}
        </motion.div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <FileText className="h-10 w-10 text-primary/30 mb-3" />
              <h2 className="text-lg font-semibold text-foreground/70 mb-1">Escolha um roteiro</h2>
              <p className="text-sm text-muted-foreground mb-6">Clique em um modelo ou digite seu próprio prompt abaixo.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
                {PREDEFINED_TEMPLATES.map((t) => (
                  <motion.button
                    key={t.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(t.prompt)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <img src={t.image} alt={t.label} loading="lazy" width={512} height={512} className="w-full aspect-square object-cover rounded-lg" />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{t.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass-card text-foreground rounded-bl-md"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && isLoading && i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-1 align-middle rounded-sm" />
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="glass-card rounded-2xl p-3 flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o roteiro ou prompt que deseja..."
            className="flex-1 min-h-[44px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            rows={1}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="h-10 w-10 p-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GerarRoteiro;
