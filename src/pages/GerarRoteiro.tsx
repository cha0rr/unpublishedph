import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, FileText, Trash2, ImagePlus, X, Flame, Users, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const EXAMPLE_CATEGORIES: {
  label: string;
  icon: typeof Flame;
  prompts: string[];
}[] = [
  {
    label: "Vídeos Virais",
    icon: Flame,
    prompts: [
      "Gere um roteiro de Notícias Virais com gancho nos primeiros 3 segundos",
      "Crie um prompt de vídeo de Frutas Falantes para viralizar no TikTok",
    ],
  },
  {
    label: "Vídeos UGC",
    icon: Users,
    prompts: [
      "Gere um roteiro UGC de unboxing autêntico para Instagram Reels",
      "Crie um prompt de UGC estilo 'POV: testei esse produto por 7 dias'",
    ],
  },
  {
    label: "Criativos para Vendas",
    icon: ShoppingBag,
    prompts: [
      "Gere um roteiro de criativo de vendas com gatilho de escassez",
      "Crie um prompt de anúncio de produto com CTA forte para TikTok Shop",
    ],
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 data URL
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const GerarRoteiro = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = profile?.plan === "pro" && profile?.status === "approved";

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && user && !isPro && !isAdmin) {
      toast.error("Acesso restrito ao plano Pro.");
      navigate("/");
    }
  }, [user, isPro, isAdmin, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas.");
      return;
    }
    setAttachedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setAttachedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (predefinedPrompt?: string) => {
    const trimmed = (predefinedPrompt || input).trim();
    if (!trimmed || isLoading) return;
    if (!predefinedPrompt) setInput("");

    let imageBase64: string | undefined;
    if (attachedImage) {
      imageBase64 = await fileToBase64(attachedImage);
      removeImage();
    }

    const userMsg: Message = { role: "user", content: trimmed, image: imageBase64 };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();

      // Build payload — include image only for the last user message
      const payloadMessages = newMessages.map((m) => {
        const base: any = { role: m.role, content: m.content };
        if (m.image) base.image = m.image;
        return base;
      });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      const contentType = resp.headers.get("Content-Type") || "";

      // JSON response (DeepSeek non-streaming path)
      if (contentType.includes("application/json")) {
        const data = await resp.json();
        const full = (data?.content as string) || "";
        if (!full) throw new Error("Resposta vazia");
        assistantContent = full;
        setMessages((prev) => [...prev, { role: "assistant", content: full }]);
        return;
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
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) { assistantContent += delta; upsertAssistant(assistantContent); }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

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
            if (delta) { assistantContent += delta; upsertAssistant(assistantContent); }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao gerar resposta.");
      if (!assistantContent) setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setInput(""); removeImage(); };

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
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gerador de Roteiros & Prompts</h1>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive gap-1">
              <Trash2 className="h-4 w-4" /> Limpar
            </Button>
          )}
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <FileText className="h-10 w-10 text-primary/30 mb-3" />
              <h2 className="text-lg font-semibold text-foreground/70 mb-1">Gerador de Roteiros & Prompts</h2>
              <p className="text-sm text-muted-foreground mb-2 text-center max-w-md">
                Crie roteiros e prompts para <span className="text-foreground font-medium">vídeos virais</span>, <span className="text-foreground font-medium">vídeos UGC</span> e <span className="text-foreground font-medium">criativos para vendas</span>.
              </p>
              <p className="text-xs text-muted-foreground mb-6">Toque em um exemplo para começar ou anexe uma imagem de produto.</p>
              <div className="flex flex-col gap-5 w-full max-w-md">
                {EXAMPLE_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                      <cat.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">{cat.label}</span>
                    </div>
                    {cat.prompts.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => sendMessage(example)}
                        className="text-left flex items-start gap-2 rounded-lg border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-card hover:text-foreground transition-colors"
                      >
                        <span>{example}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "glass-card text-foreground rounded-bl-md"}`}>
                {msg.image && (
                  <img src={msg.image} alt="Imagem anexada" className="max-w-[200px] max-h-[200px] rounded-lg mb-2 object-cover" />
                )}
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

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-2 flex items-center gap-2">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-border" />
              <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">{attachedImage?.name}</span>
          </div>
        )}

        {/* Input */}
        <div className="glass-card rounded-2xl p-3 flex gap-2 items-end">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 shrink-0 text-muted-foreground hover:text-primary" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o roteiro ou prompt que deseja..."
            className="flex-1 min-h-[44px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            rows={1}
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} size="sm" className="h-10 w-10 p-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GerarRoteiro;
