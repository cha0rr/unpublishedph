import { useMemo, useState, useEffect } from "react";

interface AvatarPreviewProps {
  selections: Record<string, string>;
}

const HAIR_COLORS: Record<string, { base: string; light: string; dark: string; shine: string }> = {
  "Preto": { base: "#1a1a2e", light: "#2d2d44", dark: "#0a0a15", shine: "#4a4a6a" },
  "Castanho escuro": { base: "#3b2314", light: "#5a3a28", dark: "#1f1208", shine: "#7a5a40" },
  "Castanho claro": { base: "#8b5e3c", light: "#a87a55", dark: "#6a4528", shine: "#c49a70" },
  "Loiro": { base: "#d4a840", light: "#e8c860", dark: "#b08828", shine: "#f0dd88" },
  "Ruivo": { base: "#b84420", light: "#d45a30", dark: "#8a2e14", shine: "#e87850" },
  "Platinado": { base: "#ddd5c8", light: "#f0ebe0", dark: "#c0b8a8", shine: "#ffffff" },
  "Rosa": { base: "#d45a9a", light: "#e878b0", dark: "#b04080", shine: "#f0a0cc" },
  "Azul": { base: "#3060c0", light: "#4878d8", dark: "#2040a0", shine: "#6898f0" },
  "Branco": { base: "#e8e0e0", light: "#f8f4f4", dark: "#ccc4c4", shine: "#ffffff" },
};

const SKIN_COLORS: Record<string, { base: string; light: string; dark: string; blush: string }> = {
  "Pele clara": { base: "#fde0c8", light: "#fff0e0", dark: "#e8c0a0", blush: "#f0a0a0" },
  "Pele branca": { base: "#fce8d8", light: "#fff5ee", dark: "#ecd0b8", blush: "#eeaaaa" },
  "Pele morena clara": { base: "#d4a574", light: "#e0b888", dark: "#b88858", blush: "#c08070" },
  "Pele morena": { base: "#b07840", light: "#c48a50", dark: "#906030", blush: "#a06858" },
  "Pele negra": { base: "#6b4226", light: "#7d5434", dark: "#52301a", blush: "#7a4a3a" },
  "Pele asiática": { base: "#f0d0a0", light: "#f8e0b8", dark: "#d8b888", blush: "#e0a0a0" },
};

const EYE_COLORS: Record<string, { base: string; light: string; ring: string }> = {
  "Castanho": { base: "#5c3317", light: "#8a5a30", ring: "#3a2010" },
  "Verde": { base: "#2d8a4e", light: "#50b870", ring: "#1a6030" },
  "Azul": { base: "#3b82f6", light: "#70a8ff", ring: "#2060c0" },
  "Mel": { base: "#c49a3c", light: "#e0b850", ring: "#a07828" },
  "Cinza": { base: "#7888a0", light: "#a0b0c0", ring: "#586878" },
  "Preto": { base: "#1a1a2a", light: "#3a3a4a", ring: "#080810" },
};

const HEIGHT_SCALE: Record<string, number> = {
  "Baixa": 0.92,
  "Média": 1,
  "Alta": 1.08,
};

const BODY_WIDTH: Record<string, number> = {
  "Magra": 0.84,
  "Atlética": 0.92,
  "Mediana": 1,
  "Curvilínea": 1.1,
  "Plus size": 1.2,
};

function Hair3D({ type, colors }: { type: string; colors: { base: string; light: string; dark: string; shine: string } }) {
  const t = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

  const commonDefs = (id: string) => (
    <>
      <linearGradient id={`hairGrad${id}`} x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor={colors.light} />
        <stop offset="40%" stopColor={colors.base} />
        <stop offset="100%" stopColor={colors.dark} />
      </linearGradient>
      <radialGradient id={`hairShine${id}`} cx="0.35" cy="0.2" r="0.5">
        <stop offset="0%" stopColor={colors.shine} stopOpacity="0.6" />
        <stop offset="100%" stopColor={colors.shine} stopOpacity="0" />
      </radialGradient>
    </>
  );

  switch (type) {
    case "Liso":
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("liso")}</defs>
          {/* Main hair volume */}
          <path d="M26 36 Q24 10 50 5 Q76 10 74 36 L76 70 Q74 62 72 66 L72 38 Q72 18 50 13 Q28 18 28 38 L28 66 Q26 62 24 70 Z" 
            fill={`url(#hairGradliso)`} style={{ transition: t }} />
          {/* Shine layer */}
          <path d="M30 34 Q28 14 50 9 Q60 12 64 20 Q56 14 50 13 Q34 18 32 36 L32 55 Q30 50 28 55 Z"
            fill={`url(#hairShineliso)`} style={{ transition: t }} />
          {/* Strand details */}
          <path d="M36 16 Q42 12 50 11" stroke={colors.shine} strokeWidth="0.5" fill="none" opacity="0.3" />
          <path d="M40 14 Q46 11 52 10" stroke={colors.shine} strokeWidth="0.3" fill="none" opacity="0.2" />
          {/* Bangs */}
          <path d="M30 24 Q35 15 50 12 Q65 15 70 24 Q63 18 50 16 Q37 18 30 24 Z" 
            fill={colors.base} style={{ transition: t }} />
          <path d="M32 22 Q38 16 50 14 Q55 15 58 17" 
            fill={colors.light} opacity="0.4" style={{ transition: t }} />
        </g>
      );
    case "Ondulado":
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("ond")}</defs>
          <path d="M25 36 Q23 8 50 4 Q77 8 75 36 L78 58 Q76 50 74 56 Q72 48 70 58 Q68 50 66 56 L68 36 Q68 18 50 13 Q32 18 32 36 L34 56 Q32 48 30 56 Q28 50 26 58 Q24 50 22 58 Z"
            fill={`url(#hairGradond)`} style={{ transition: t }} />
          <path d="M28 34 Q26 12 50 7 Q58 10 62 16 Q54 10 50 10 Q34 16 34 38 L34 48 Q32 42 30 48 Z"
            fill={`url(#hairShineond)`} style={{ transition: t }} />
          {/* Wave highlights */}
          <path d="M74 42 Q76 48 75 54" stroke={colors.shine} strokeWidth="0.8" fill="none" opacity="0.25" />
          <path d="M26 44 Q24 50 25 56" stroke={colors.shine} strokeWidth="0.8" fill="none" opacity="0.25" />
          {/* Bangs */}
          <path d="M30 24 Q35 14 50 11 Q65 14 70 24 Q62 17 50 15 Q38 17 30 24 Z" 
            fill={colors.base} style={{ transition: t }} />
        </g>
      );
    case "Cacheado":
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("cach")}</defs>
          <path d="M23 38 Q20 5 50 2 Q80 5 77 38 L80 52 Q78 44 80 54 Q76 48 78 58 Q74 50 72 60 L72 36 Q72 16 50 11 Q28 16 28 36 L28 60 Q26 50 22 58 Q24 48 20 54 Q22 44 18 52 Z"
            fill={`url(#hairGradcach)`} style={{ transition: t }} />
          {/* Curl volumes */}
          <ellipse cx="22" cy="52" rx="5" ry="6" fill={colors.base} style={{ transition: t }} />
          <ellipse cx="78" cy="52" rx="5" ry="6" fill={colors.base} style={{ transition: t }} />
          <ellipse cx="20" cy="42" rx="4" ry="5" fill={colors.dark} opacity="0.5" style={{ transition: t }} />
          <ellipse cx="80" cy="42" rx="4" ry="5" fill={colors.dark} opacity="0.5" style={{ transition: t }} />
          {/* Curl shine */}
          <ellipse cx="24" cy="48" rx="2" ry="3" fill={colors.shine} opacity="0.2" style={{ transition: t }} />
          <ellipse cx="76" cy="48" rx="2" ry="3" fill={colors.shine} opacity="0.2" style={{ transition: t }} />
          <path d="M28 26 Q34 14 50 10 Q66 14 72 26 Q64 16 50 14 Q36 16 28 26 Z" 
            fill={colors.base} style={{ transition: t }} />
        </g>
      );
    case "Crespo":
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("cres")}</defs>
          <path d="M20 40 Q16 0 50 -2 Q84 0 80 40 L82 50 Q84 42 82 56 Q80 48 82 58 Q78 50 76 60 Q74 50 72 58 L72 34 Q72 14 50 9 Q28 14 28 34 L28 58 Q26 50 24 58 Q22 48 18 56 Q20 42 16 50 Q18 38 16 46 Z"
            fill={`url(#hairGradcres)`} style={{ transition: t }} />
          <ellipse cx="18" cy="44" rx="5" ry="7" fill={colors.base} style={{ transition: t }} />
          <ellipse cx="82" cy="44" rx="5" ry="7" fill={colors.base} style={{ transition: t }} />
          <circle cx="20" cy="34" r="5" fill={colors.base} style={{ transition: t }} />
          <circle cx="80" cy="34" r="5" fill={colors.base} style={{ transition: t }} />
          <circle cx="16" cy="38" r="3" fill={colors.light} opacity="0.2" style={{ transition: t }} />
          <circle cx="84" cy="38" r="3" fill={colors.light} opacity="0.2" style={{ transition: t }} />
          <path d="M26 28 Q32 12 50 8 Q68 12 74 28 Q66 14 50 12 Q34 14 26 28 Z" 
            fill={colors.base} style={{ transition: t }} />
        </g>
      );
    case "Curto":
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("cur")}</defs>
          <path d="M28 32 Q26 10 50 6 Q74 10 72 32 L74 40 Q72 36 72 34 Q72 18 50 13 Q28 18 28 34 Q28 36 26 40 Z"
            fill={`url(#hairGradcur)`} style={{ transition: t }} />
          <path d="M30 30 Q28 14 50 9 Q56 11 60 15 Q52 10 50 10 Q32 16 32 34 L30 38 Z"
            fill={`url(#hairShinecur)`} style={{ transition: t }} />
          <path d="M30 22 Q36 14 50 11 Q64 14 70 22 Q62 16 50 14 Q38 16 30 22 Z" 
            fill={colors.base} style={{ transition: t }} />
        </g>
      );
    case "Raspado":
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("ras")}</defs>
          <path d="M30 30 Q28 14 50 10 Q72 14 70 30 L70 32 Q70 20 50 16 Q30 20 30 32 Z"
            fill={`url(#hairGradras)`} style={{ transition: t }} />
        </g>
      );
    case "Trançado":
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("tran")}</defs>
          <path d="M26 34 Q24 8 50 5 Q76 8 74 34 L74 38 Q74 18 50 13 Q26 18 26 38 Z"
            fill={`url(#hairGradtran)`} style={{ transition: t }} />
          {/* Left braid with 3D effect */}
          <path d="M24 38 Q22 46 23 54 Q24 58 25 62 Q26 66 25 70 Q24 74 25 78 Q24 82 25 86"
            stroke={colors.base} strokeWidth="6" fill="none" strokeLinecap="round" style={{ transition: t }} />
          <path d="M24 38 Q22 46 23 54 Q24 58 25 62"
            stroke={colors.light} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" style={{ transition: t }} />
          {/* Right braid */}
          <path d="M76 38 Q78 46 77 54 Q76 58 75 62 Q74 66 75 70 Q76 74 75 78 Q76 82 75 86"
            stroke={colors.base} strokeWidth="6" fill="none" strokeLinecap="round" style={{ transition: t }} />
          <path d="M76 38 Q78 46 77 54 Q76 58 75 62"
            stroke={colors.light} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" style={{ transition: t }} />
          <path d="M28 24 Q34 14 50 11 Q66 14 72 24 Q64 16 50 14 Q36 16 28 24 Z" 
            fill={colors.base} style={{ transition: t }} />
        </g>
      );
    default:
      return (
        <g style={{ transition: t }}>
          <defs>{commonDefs("def")}</defs>
          <path d="M26 36 Q24 10 50 5 Q76 10 74 36 L76 70 Q74 62 72 66 L72 38 Q72 18 50 13 Q28 18 28 38 L28 66 Q26 62 24 70 Z"
            fill={`url(#hairGraddef)`} style={{ transition: t }} />
          <path d="M30 24 Q35 15 50 12 Q65 15 70 24 Q63 18 50 16 Q37 18 30 24 Z"
            fill={colors.base} style={{ transition: t }} />
        </g>
      );
  }
}

export function AvatarPreview({ selections }: AvatarPreviewProps) {
  const hair = HAIR_COLORS[selections.hairColor] || HAIR_COLORS["Preto"];
  const skin = SKIN_COLORS[selections.skinColor] || SKIN_COLORS["Pele morena clara"];
  const eye = EYE_COLORS[selections.eyeColor] || EYE_COLORS["Castanho"];
  const heightScale = HEIGHT_SCALE[selections.height] || 1;
  const bodyW = BODY_WIDTH[selections.bodyType] || 1;

  const [pulse, setPulse] = useState(false);
  const selKey = useMemo(() => JSON.stringify(selections), [selections]);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 400);
    return () => clearTimeout(t);
  }, [selKey]);

  const t = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

  // Lip color based on skin tone
  const lipColor = skin.base === "#6b4226" ? "#8b4555" : 
                   skin.base === "#b07840" ? "#c06575" : "#d46580";
  const lipHighlight = skin.base === "#6b4226" ? "#a05565" : 
                       skin.base === "#b07840" ? "#d87888" : "#e88898";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="-5 -5 110 180"
        className="w-56 h-auto"
        style={{
          transform: `scale(${pulse ? 1.03 : 1})`,
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))",
        }}
      >
        <defs>
          {/* Skin gradients - 3D lighting */}
          <radialGradient id="skinMain" cx="0.45" cy="0.35" r="0.6">
            <stop offset="0%" stopColor={skin.light} />
            <stop offset="60%" stopColor={skin.base} />
            <stop offset="100%" stopColor={skin.dark} />
          </radialGradient>
          <radialGradient id="skinHighlight" cx="0.4" cy="0.25" r="0.35">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cheekBlush" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={skin.blush} stopOpacity="0.35" />
            <stop offset="100%" stopColor={skin.blush} stopOpacity="0" />
          </radialGradient>
          
          {/* Eye gradients */}
          <radialGradient id="irisGrad" cx="0.45" cy="0.4" r="0.5">
            <stop offset="0%" stopColor={eye.light} />
            <stop offset="70%" stopColor={eye.base} />
            <stop offset="100%" stopColor={eye.ring} />
          </radialGradient>
          <radialGradient id="eyeWhite" cx="0.45" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e8e8ee" />
          </radialGradient>
          
          {/* Body/clothing gradient */}
          <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.95)" />
            <stop offset="50%" stopColor="hsl(var(--primary) / 0.8)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
          </linearGradient>
          <linearGradient id="pantsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="100%" stopColor="#2d3748" />
          </linearGradient>
          <radialGradient id="shoeGrad3d" cx="0.4" cy="0.3" r="0.6">
            <stop offset="0%" stopColor="#5a5a6a" />
            <stop offset="100%" stopColor="#2a2a35" />
          </radialGradient>
          
          {/* Ambient shadow */}
          <radialGradient id="groundShadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          
          {/* Neck shadow */}
          <linearGradient id="neckGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skin.dark} />
            <stop offset="100%" stopColor={skin.base} />
          </linearGradient>
          
          {/* Nose shadow */}
          <linearGradient id="noseShadow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={skin.base} stopOpacity="0" />
            <stop offset="100%" stopColor={skin.dark} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="50" cy="168" rx={22 * bodyW} ry="4" fill="url(#groundShadow)" style={{ transition: t }} />

        <g style={{ transform: `scale(1, ${heightScale})`, transformOrigin: "50px 90px", transition: t }}>
          
          {/* ====== HAIR BEHIND ====== */}
          <Hair3D type={selections.hairType} colors={hair} />

          {/* ====== EARS with 3D depth ====== */}
          <g>
            <ellipse cx="30" cy="37" rx="4" ry="5.5" fill={skin.base} style={{ transition: t }} />
            <ellipse cx="30" cy="37" rx="2.5" ry="4" fill={skin.dark} opacity="0.25" style={{ transition: t }} />
            <ellipse cx="30.5" cy="36" rx="1.5" ry="2.5" fill={skin.light} opacity="0.3" style={{ transition: t }} />
            <ellipse cx="70" cy="37" rx="4" ry="5.5" fill={skin.base} style={{ transition: t }} />
            <ellipse cx="70" cy="37" rx="2.5" ry="4" fill={skin.dark} opacity="0.25" style={{ transition: t }} />
            <ellipse cx="69.5" cy="36" rx="1.5" ry="2.5" fill={skin.light} opacity="0.3" style={{ transition: t }} />
          </g>

          {/* ====== HEAD - 3D oval with lighting ====== */}
          <ellipse cx="50" cy="35" rx="20" ry="23" fill="url(#skinMain)" style={{ transition: t }} />
          <ellipse cx="50" cy="35" rx="20" ry="23" fill="url(#skinHighlight)" style={{ transition: t }} />
          
          {/* Jaw/chin contour for 3D */}
          <path d="M32 42 Q36 58 50 60 Q64 58 68 42" fill="none" stroke={skin.dark} strokeWidth="0.6" opacity="0.15" style={{ transition: t }} />
          
          {/* Forehead highlight */}
          <ellipse cx="48" cy="22" rx="10" ry="6" fill="white" opacity="0.06" style={{ transition: t }} />

          {/* ====== EYEBROWS - thick and expressive ====== */}
          <path d="M37 24 Q40 20.5 46 22.5" fill="none" stroke={hair.dark} strokeWidth="1.6" strokeLinecap="round" style={{ transition: t }} />
          <path d="M54 22.5 Q60 20.5 63 24" fill="none" stroke={hair.dark} strokeWidth="1.6" strokeLinecap="round" style={{ transition: t }} />
          {/* Brow highlight */}
          <path d="M38 24.5 Q41 21.5 45 23" fill="none" stroke={hair.base} strokeWidth="0.6" strokeLinecap="round" opacity="0.3" style={{ transition: t }} />
          <path d="M55 23 Q59 21.5 62 24.5" fill="none" stroke={hair.base} strokeWidth="0.6" strokeLinecap="round" opacity="0.3" style={{ transition: t }} />

          {/* ====== EYES - 3D with depth ====== */}
          {/* Eye sockets shadow */}
          <ellipse cx="42" cy="31.5" rx="5.5" ry="4" fill={skin.dark} opacity="0.08" style={{ transition: t }} />
          <ellipse cx="58" cy="31.5" rx="5.5" ry="4" fill={skin.dark} opacity="0.08" style={{ transition: t }} />
          
          {/* Eye whites with gradient */}
          <ellipse cx="42" cy="31" rx="4.5" ry="3.5" fill="url(#eyeWhite)" style={{ transition: t }} />
          <ellipse cx="58" cy="31" rx="4.5" ry="3.5" fill="url(#eyeWhite)" style={{ transition: t }} />
          
          {/* Iris with gradient */}
          <circle cx="42.5" cy="31.2" r="2.5" fill="url(#irisGrad)" style={{ transition: t }} />
          <circle cx="58.5" cy="31.2" r="2.5" fill="url(#irisGrad)" style={{ transition: t }} />
          
          {/* Iris detail ring */}
          <circle cx="42.5" cy="31.2" r="2.5" fill="none" stroke={eye.ring} strokeWidth="0.4" opacity="0.5" />
          <circle cx="58.5" cy="31.2" r="2.5" fill="none" stroke={eye.ring} strokeWidth="0.4" opacity="0.5" />
          
          {/* Pupil */}
          <circle cx="42.5" cy="31.2" r="1.2" fill="#050510" />
          <circle cx="58.5" cy="31.2" r="1.2" fill="#050510" />
          
          {/* Eye reflections - main highlight */}
          <circle cx="43.5" cy="30" r="0.9" fill="white" opacity="0.9" />
          <circle cx="59.5" cy="30" r="0.9" fill="white" opacity="0.9" />
          {/* Secondary reflection */}
          <circle cx="41.8" cy="32" r="0.4" fill="white" opacity="0.5" />
          <circle cx="57.8" cy="32" r="0.4" fill="white" opacity="0.5" />
          
          {/* Upper eyelid with thickness */}
          <path d="M37.5 29.5 Q42 27 46.5 29.5" fill="none" stroke={skin.dark} strokeWidth="0.9" opacity="0.5" style={{ transition: t }} />
          <path d="M53.5 29.5 Q58 27 62.5 29.5" fill="none" stroke={skin.dark} strokeWidth="0.9" opacity="0.5" style={{ transition: t }} />
          
          {/* Lower eyelid subtle */}
          <path d="M38 33 Q42 34.5 46 33" fill="none" stroke={skin.dark} strokeWidth="0.3" opacity="0.2" style={{ transition: t }} />
          <path d="M54 33 Q58 34.5 62 33" fill="none" stroke={skin.dark} strokeWidth="0.3" opacity="0.2" style={{ transition: t }} />

          {/* Eyelashes - thicker and more prominent */}
          <path d="M37.5 29.5 Q36 28 35.5 26.5" fill="none" stroke="#1a1a2a" strokeWidth="0.6" opacity="0.5" />
          <path d="M46.5 29.5 Q47.5 28 48 27" fill="none" stroke="#1a1a2a" strokeWidth="0.5" opacity="0.4" />
          <path d="M42 27.5 Q42 26 41.5 25" fill="none" stroke="#1a1a2a" strokeWidth="0.4" opacity="0.3" />
          <path d="M53.5 29.5 Q52.5 28 52 27" fill="none" stroke="#1a1a2a" strokeWidth="0.5" opacity="0.4" />
          <path d="M62.5 29.5 Q63.5 28 64 26.5" fill="none" stroke="#1a1a2a" strokeWidth="0.6" opacity="0.5" />
          <path d="M58 27.5 Q58 26 58.5 25" fill="none" stroke="#1a1a2a" strokeWidth="0.4" opacity="0.3" />

          {/* ====== NOSE - 3D with shadow ====== */}
          <path d="M50 34 L48.5 41 Q47.5 43.5 50 43.5 Q52.5 43.5 51.5 41 Z" fill="url(#noseShadow)" style={{ transition: t }} />
          <path d="M48 42.5 Q50 44 52 42.5" fill="none" stroke={skin.dark} strokeWidth="0.6" opacity="0.3" strokeLinecap="round" style={{ transition: t }} />
          {/* Nostril shadows */}
          <ellipse cx="48.2" cy="42.5" rx="1.2" ry="0.7" fill={skin.dark} opacity="0.15" style={{ transition: t }} />
          <ellipse cx="51.8" cy="42.5" rx="1.2" ry="0.7" fill={skin.dark} opacity="0.15" style={{ transition: t }} />
          {/* Nose bridge highlight */}
          <path d="M49.5 35 L49.5 40" stroke="white" strokeWidth="0.5" opacity="0.1" strokeLinecap="round" />

          {/* ====== CHEEK BLUSH - soft 3D ====== */}
          <circle cx="36" cy="39" r="5.5" fill="url(#cheekBlush)" style={{ transition: t }} />
          <circle cx="64" cy="39" r="5.5" fill="url(#cheekBlush)" style={{ transition: t }} />

          {/* ====== MOUTH - 3D lips ====== */}
          {/* Upper lip */}
          <path d="M43 47 Q45.5 44.5 50 45 Q54.5 44.5 57 47 Q54 46 50 46.5 Q46 46 43 47 Z" 
            fill={lipColor} style={{ transition: t }} />
          {/* Lower lip */}
          <path d="M43 47 Q50 51.5 57 47 Q54 49 50 49.5 Q46 49 43 47 Z" 
            fill={lipColor} style={{ transition: t }} />
          {/* Lip highlight */}
          <path d="M46 46 Q50 44.8 54 46" fill="none" stroke={lipHighlight} strokeWidth="0.5" opacity="0.5" />
          <ellipse cx="50" cy="48.5" rx="3" ry="1" fill={lipHighlight} opacity="0.15" />
          {/* Lip line */}
          <path d="M43.5 47 Q50 47.5 56.5 47" fill="none" stroke={skin.dark} strokeWidth="0.3" opacity="0.3" />

          {/* ====== CHIN shadow ====== */}
          <ellipse cx="50" cy="56" rx="7" ry="2.5" fill={skin.dark} opacity="0.08" style={{ transition: t }} />

          {/* ====== NECK with 3D shadow ====== */}
          <path d={`M44 56 L44 66 Q50 68 56 66 L56 56 Q53 58 50 58 Q47 58 44 56 Z`}
            fill="url(#neckGrad)" style={{ transition: t }} />
          {/* Neck shadow from chin */}
          <ellipse cx="50" cy="58" rx="6" ry="2" fill={skin.dark} opacity="0.15" style={{ transition: t }} />

          {/* ====== BODY / TORSO - 3D clothing ====== */}
          {/* Collar / neckline */}
          <path
            d={`M${50 - 8 * bodyW} 65 Q${50 - 4 * bodyW} 70 50 71 Q${50 + 4 * bodyW} 70 ${50 + 8 * bodyW} 65`}
            fill="none" stroke="hsl(var(--primary) / 0.8)" strokeWidth="2" strokeLinecap="round"
            style={{ transition: t }}
          />
          
          {/* Main torso */}
          <path
            d={`M${50 - 14 * bodyW} 65 
                Q${50 - 16 * bodyW} 65 ${50 - 15 * bodyW} 70 
                L${50 - 13 * bodyW} 88 
                Q${50 - 11 * bodyW} 104 ${50 - 8 * bodyW} 106 
                Q50 110 ${50 + 8 * bodyW} 106 
                Q${50 + 11 * bodyW} 104 ${50 + 13 * bodyW} 88 
                L${50 + 15 * bodyW} 70 
                Q${50 + 16 * bodyW} 65 ${50 + 14 * bodyW} 65 Z`}
            fill="url(#shirtGrad)" style={{ transition: t }}
          />
          
          {/* Torso 3D shadow - center fold */}
          <path
            d={`M${50 - 2 * bodyW} 70 
                Q50 74 ${50 + 2 * bodyW} 70 
                L${50 + 1 * bodyW} 100 
                Q50 102 ${50 - 1 * bodyW} 100 Z`}
            fill="hsl(var(--primary) / 0.12)"
            style={{ transition: t }}
          />
          
          {/* Torso highlight - left chest */}
          <path
            d={`M${50 - 12 * bodyW} 70 
                Q${50 - 8 * bodyW} 68 ${50 - 4 * bodyW} 72 
                L${50 - 6 * bodyW} 85 
                Q${50 - 10 * bodyW} 80 ${50 - 12 * bodyW} 75 Z`}
            fill="white" opacity="0.06"
            style={{ transition: t }}
          />

          {/* ====== ARMS with 3D shading ====== */}
          {/* Left arm */}
          <path
            d={`M${50 - 14 * bodyW} 68 
                Q${50 - 18 * bodyW} 78 ${50 - 20 * bodyW} 88 
                Q${50 - 22 * bodyW} 94 ${50 - 20 * bodyW} 96
                L${50 - 18 * bodyW} 96
                Q${50 - 17 * bodyW} 92 ${50 - 16 * bodyW} 86
                Q${50 - 14 * bodyW} 78 ${50 - 12 * bodyW} 70 Z`}
            fill={skin.base} style={{ transition: t }}
          />
          <path
            d={`M${50 - 14 * bodyW} 69 
                Q${50 - 17 * bodyW} 76 ${50 - 18 * bodyW} 84`}
            stroke={skin.light} strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round"
            style={{ transition: t }}
          />
          
          {/* Right arm */}
          <path
            d={`M${50 + 14 * bodyW} 68 
                Q${50 + 18 * bodyW} 78 ${50 + 20 * bodyW} 88 
                Q${50 + 22 * bodyW} 94 ${50 + 20 * bodyW} 96
                L${50 + 18 * bodyW} 96
                Q${50 + 17 * bodyW} 92 ${50 + 16 * bodyW} 86
                Q${50 + 14 * bodyW} 78 ${50 + 12 * bodyW} 70 Z`}
            fill={skin.base} style={{ transition: t }}
          />
          
          {/* Hands - 3D spheres */}
          <circle cx={50 - 20 * bodyW} cy="97" r="3.5" fill={skin.base} style={{ transition: t }} />
          <circle cx={50 - 20 * bodyW} cy="96" r="2" fill={skin.light} opacity="0.2" style={{ transition: t }} />
          <circle cx={50 + 20 * bodyW} cy="97" r="3.5" fill={skin.base} style={{ transition: t }} />
          <circle cx={50 + 20 * bodyW} cy="96" r="2" fill={skin.light} opacity="0.2" style={{ transition: t }} />

          {/* ====== LEGS with pants - 3D ====== */}
          {/* Left leg */}
          <path d="M42 105 Q40 120 39 135 Q38.5 138 41 138 L45 138 Q46 138 45.5 135 Q45 120 44 105 Z"
            fill="url(#pantsGrad)" style={{ transition: t }} />
          <path d="M42.5 108 L42 130" stroke="#5a6578" strokeWidth="0.8" opacity="0.3" fill="none" />
          
          {/* Right leg */}
          <path d="M56 105 Q55 120 54.5 135 Q54 138 57 138 L61 138 Q62 138 61.5 135 Q60 120 58 105 Z"
            fill="url(#pantsGrad)" style={{ transition: t }} />
          <path d="M57.5 108 L57 130" stroke="#5a6578" strokeWidth="0.8" opacity="0.3" fill="none" />
          
          {/* Belt detail */}
          <path d={`M${50 - 10 * bodyW} 105 Q50 107 ${50 + 10 * bodyW} 105`}
            fill="none" stroke="#3a3a45" strokeWidth="1.2" style={{ transition: t }} />
          <rect x="48" y="104" width="4" height="2.5" rx="0.5" fill="#6a6a78" style={{ transition: t }} />

          {/* ====== SHOES - 3D styled ====== */}
          <ellipse cx="40" cy="140" rx="7.5" ry="3.5" fill="url(#shoeGrad3d)" style={{ transition: t }} />
          <ellipse cx="60" cy="140" rx="7.5" ry="3.5" fill="url(#shoeGrad3d)" style={{ transition: t }} />
          {/* Shoe tops */}
          <path d="M33.5 139 Q40 135.5 46.5 139" fill="#4a4a58" style={{ transition: t }} />
          <path d="M53.5 139 Q60 135.5 66.5 139" fill="#4a4a58" style={{ transition: t }} />
          {/* Shoe highlight */}
          <path d="M35 138 Q40 136.5 44 138" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
          <path d="M55 138 Q60 136.5 64 138" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
          {/* Sole line */}
          <path d="M33 141 Q40 143 47 141" fill="none" stroke="#1a1a25" strokeWidth="0.6" opacity="0.4" />
          <path d="M53 141 Q60 143 67 141" fill="none" stroke="#1a1a25" strokeWidth="0.6" opacity="0.4" />
        </g>
      </svg>
      <p className="text-xs text-muted-foreground text-center">Preview em tempo real</p>
    </div>
  );
}
