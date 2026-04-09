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
  "Baixa": 0.93,
  "Média": 1,
  "Alta": 1.07,
};

const BODY_WIDTH: Record<string, number> = {
  "Magra": 0.85,
  "Atlética": 0.92,
  "Mediana": 1,
  "Curvilínea": 1.1,
  "Plus size": 1.2,
};

/* ─── Pixar-style hair component ─── */
function PixarHair({ type, colors }: { type: string; colors: { base: string; light: string; dark: string; shine: string } }) {
  const t = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

  const defs = (id: string) => (
    <>
      <linearGradient id={`hg-${id}`} x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor={colors.light} />
        <stop offset="35%" stopColor={colors.base} />
        <stop offset="100%" stopColor={colors.dark} />
      </linearGradient>
      <radialGradient id={`hs-${id}`} cx="0.35" cy="0.15" r="0.45">
        <stop offset="0%" stopColor={colors.shine} stopOpacity="0.55" />
        <stop offset="100%" stopColor={colors.shine} stopOpacity="0" />
      </radialGradient>
    </>
  );

  switch (type) {
    case "Liso":
      return (
        <g style={{ transition: t }}>
          <defs>{defs("liso")}</defs>
          {/* Volume behind */}
          <path d="M22 42 Q18 6 50 -2 Q82 6 78 42 L80 90 Q78 96 76 92 L76 48 Q76 18 50 10 Q24 18 24 48 L24 92 Q22 96 20 90 Z"
            fill={`url(#hg-liso)`} style={{ transition: t }} />
          {/* Shine streak */}
          <path d="M30 12 Q40 6 50 4 L50 10 Q42 11 34 18 L32 40 Z"
            fill={`url(#hs-liso)`} style={{ transition: t }} />
          <path d="M34 20 L33 80" stroke={colors.shine} strokeWidth="1" fill="none" opacity="0.12" />
          <path d="M66 20 L67 80" stroke={colors.shine} strokeWidth="0.6" fill="none" opacity="0.08" />
          {/* Side-swept bangs */}
          <path d="M24 34 Q30 10 50 5 Q70 10 76 34 L74 28 Q66 14 50 10 Q34 14 26 28 Z"
            fill={colors.base} style={{ transition: t }} />
          <path d="M28 30 Q38 16 50 12" stroke={colors.light} strokeWidth="1" fill="none" opacity="0.25" />
        </g>
      );

    case "Ondulado":
      return (
        <g style={{ transition: t }}>
          <defs>{defs("ond")}</defs>
          <path d="M20 44 Q16 4 50 -4 Q84 4 80 44
                   L82 58 Q80 64 78 58 Q76 66 74 60 Q72 68 70 62 L72 48 Q72 18 50 10
                   Q28 18 28 48 L30 62 Q28 68 26 60 Q24 66 22 58 Q20 64 18 58 Z"
            fill={`url(#hg-ond)`} style={{ transition: t }} />
          {/* Wave strands left */}
          <path d="M22 58 Q20 68 22 76 Q24 84 22 92 Q20 98 22 104"
            stroke={colors.base} strokeWidth="6" fill="none" strokeLinecap="round" style={{ transition: t }} />
          <path d="M28 60 Q26 70 28 78 Q30 86 28 94 Q26 100 28 106"
            stroke={colors.base} strokeWidth="5" fill="none" strokeLinecap="round" style={{ transition: t }} />
          {/* Wave strands right */}
          <path d="M78 58 Q80 68 78 76 Q76 84 78 92 Q80 98 78 104"
            stroke={colors.base} strokeWidth="6" fill="none" strokeLinecap="round" style={{ transition: t }} />
          <path d="M72 60 Q74 70 72 78 Q70 86 72 94 Q74 100 72 106"
            stroke={colors.base} strokeWidth="5" fill="none" strokeLinecap="round" style={{ transition: t }} />
          {/* Shine */}
          <path d="M24 60 Q22 70 24 78" stroke={colors.shine} strokeWidth="1.2" fill="none" opacity="0.18" />
          <path d="M76 60 Q78 70 76 78" stroke={colors.shine} strokeWidth="1.2" fill="none" opacity="0.18" />
          {/* Bangs */}
          <path d="M26 32 Q34 10 50 6 Q66 10 74 32 Q68 18 58 14 Q50 18 42 14 Q32 18 26 32 Z"
            fill={colors.base} style={{ transition: t }} />
        </g>
      );

    case "Cacheado":
      return (
        <g style={{ transition: t }}>
          <defs>{defs("cach")}</defs>
          <path d="M14 46 Q10 -2 50 -8 Q90 -2 86 46 L88 62 Q86 68 84 60 Q82 68 80 62
                   L80 44 Q80 16 50 8 Q20 16 20 44
                   L20 62 Q18 68 16 60 Q14 68 12 62 Z"
            fill={`url(#hg-cach)`} style={{ transition: t }} />
          {/* Curl clusters left */}
          {[44, 54, 64, 72, 80].map((y, i) => (
            <circle key={`cl${i}`} cx={14 + (i % 2) * 4} cy={y} r={5.5 - i * 0.3} fill={i % 2 ? colors.dark : colors.base} style={{ transition: t }} />
          ))}
          {/* Curl clusters right */}
          {[44, 54, 64, 72, 80].map((y, i) => (
            <circle key={`cr${i}`} cx={86 - (i % 2) * 4} cy={y} r={5.5 - i * 0.3} fill={i % 2 ? colors.dark : colors.base} style={{ transition: t }} />
          ))}
          {/* Highlights */}
          <circle cx="15" cy="42" r="2.2" fill={colors.shine} opacity="0.18" />
          <circle cx="85" cy="42" r="2.2" fill={colors.shine} opacity="0.18" />
          {/* Curly bangs */}
          <path d="M22 34 Q30 10 50 4 Q70 10 78 34 Q70 16 58 12 Q50 18 42 12 Q30 16 22 34 Z"
            fill={colors.base} style={{ transition: t }} />
        </g>
      );

    case "Crespo":
      return (
        <g style={{ transition: t }}>
          <defs>{defs("cres")}</defs>
          <ellipse cx="50" cy="30" rx="36" ry="34" fill={`url(#hg-cres)`} style={{ transition: t }} />
          {/* Perimeter texture */}
          {[
            [16, 22], [84, 22], [12, 34], [88, 34], [14, 48], [86, 48],
            [18, 58], [82, 58], [24, 0], [76, 0], [36, -6], [64, -6], [50, -8],
          ].map(([cx, cy], i) => (
            <circle key={`af${i}`} cx={cx} cy={cy} r={5} fill={colors.base} style={{ transition: t }} />
          ))}
          {/* Inner texture */}
          <circle cx="30" cy="12" r="3.5" fill={colors.dark} opacity="0.12" />
          <circle cx="70" cy="12" r="3.5" fill={colors.dark} opacity="0.12" />
          <ellipse cx="44" cy="10" rx="7" ry="5" fill={colors.shine} opacity="0.06" />
        </g>
      );

    case "Curto":
      return (
        <g style={{ transition: t }}>
          <defs>{defs("cur")}</defs>
          <path d="M24 40 Q20 10 50 2 Q80 10 76 40 L78 46 Q76 42 76 38 Q76 18 50 10 Q24 18 24 38 Q24 42 22 46 Z"
            fill={`url(#hg-cur)`} style={{ transition: t }} />
          <path d="M22 46 Q22 50 24 52 Q26 48 26 42 Z" fill={colors.base} style={{ transition: t }} />
          <path d="M78 46 Q78 50 76 52 Q74 48 74 42 Z" fill={colors.base} style={{ transition: t }} />
          <path d="M32 16 Q42 8 50 6 Q56 8 62 12" stroke={colors.shine} strokeWidth="1.2" fill="none" opacity="0.2" />
          <path d="M26 30 Q34 12 50 7 Q66 12 74 30 Q68 18 58 14 Q50 18 42 14 Q32 18 26 30 Z"
            fill={colors.base} style={{ transition: t }} />
        </g>
      );

    case "Raspado":
      return (
        <g style={{ transition: t }}>
          <defs>{defs("ras")}</defs>
          <path d="M26 38 Q24 14 50 6 Q76 14 74 38 L74 40 Q74 20 50 14 Q26 20 26 40 Z"
            fill={`url(#hg-ras)`} style={{ transition: t }} />
          {[36, 42, 50, 58, 64, 40, 46, 54, 60].map((cx, i) => (
            <circle key={`bz${i}`} cx={cx} cy={16 + (i % 3) * 4} r={0.5} fill={colors.dark} opacity={0.25} />
          ))}
        </g>
      );

    case "Trançado":
      return (
        <g style={{ transition: t }}>
          <defs>{defs("tran")}</defs>
          <path d="M22 40 Q20 6 50 0 Q80 6 78 40 L78 44 Q78 18 50 10 Q22 18 22 44 Z"
            fill={`url(#hg-tran)`} style={{ transition: t }} />
          {/* Left braid */}
          <path d="M24 44 L22 52 L26 56 L22 60 L26 64 L22 68 L26 72 L22 76 L26 80 L22 84 L26 88 L22 92 L24 100"
            stroke={colors.base} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: t }} />
          <path d="M24 44 L26 52 L22 56 L26 60 L22 64 L26 68 L22 72 L26 76 L22 80 L26 84 L22 88 L26 92 L24 100"
            stroke={colors.dark} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" style={{ transition: t }} />
          {/* Right braid */}
          <path d="M76 44 L78 52 L74 56 L78 60 L74 64 L78 68 L74 72 L78 76 L74 80 L78 84 L74 88 L78 92 L76 100"
            stroke={colors.base} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: t }} />
          <path d="M76 44 L74 52 L78 56 L74 60 L78 64 L74 68 L78 72 L74 76 L78 80 L74 84 L78 88 L74 92 L76 100"
            stroke={colors.dark} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" style={{ transition: t }} />
          {/* Tips */}
          <circle cx="24" cy="102" r="2.5" fill={colors.base} style={{ transition: t }} />
          <circle cx="76" cy="102" r="2.5" fill={colors.base} style={{ transition: t }} />
          {/* Part line */}
          <line x1="50" y1="2" x2="50" y2="14" stroke={colors.dark} strokeWidth="0.7" opacity="0.25" />
          {/* Slick bangs */}
          <path d="M24 34 Q32 12 50 6 Q68 12 76 34 Q68 18 50 12 Q32 18 24 34 Z"
            fill={colors.base} style={{ transition: t }} />
        </g>
      );

    default:
      return (
        <g style={{ transition: t }}>
          <defs>{defs("def")}</defs>
          <path d="M22 42 Q18 6 50 -2 Q82 6 78 42 L80 90 Q78 96 76 92 L76 48 Q76 18 50 10 Q24 18 24 48 L24 92 Q22 96 20 90 Z"
            fill={`url(#hg-def)`} style={{ transition: t }} />
          <path d="M24 34 Q30 10 50 5 Q70 10 76 34 L74 28 Q66 14 50 10 Q34 14 26 28 Z"
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

  // Lip color derived from skin
  const lipColor = skin.base === "#6b4226" ? "#8b4555" :
                   skin.base === "#b07840" ? "#c06575" : "#d46580";
  const lipLight = skin.base === "#6b4226" ? "#a05565" :
                   skin.base === "#b07840" ? "#d87888" : "#e88898";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="-10 -15 120 200"
        className="w-56 h-auto"
        style={{
          transform: `scale(${pulse ? 1.03 : 1})`,
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.22))",
        }}
      >
        <defs>
          {/* Skin radial – 3D lighting */}
          <radialGradient id="sk" cx="0.45" cy="0.32" r="0.58">
            <stop offset="0%" stopColor={skin.light} />
            <stop offset="55%" stopColor={skin.base} />
            <stop offset="100%" stopColor={skin.dark} />
          </radialGradient>
          <radialGradient id="skHi" cx="0.42" cy="0.22" r="0.32">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blush" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={skin.blush} stopOpacity="0.4" />
            <stop offset="100%" stopColor={skin.blush} stopOpacity="0" />
          </radialGradient>

          {/* Eyes */}
          <radialGradient id="iris" cx="0.42" cy="0.38" r="0.52">
            <stop offset="0%" stopColor={eye.light} />
            <stop offset="65%" stopColor={eye.base} />
            <stop offset="100%" stopColor={eye.ring} />
          </radialGradient>
          <radialGradient id="ew" cx="0.45" cy="0.38" r="0.6">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e6e6ee" />
          </radialGradient>

          {/* Body */}
          <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.95)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
          </linearGradient>
          <linearGradient id="pants" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="100%" stopColor="#2d3748" />
          </linearGradient>
          <radialGradient id="shoe" cx="0.4" cy="0.3" r="0.6">
            <stop offset="0%" stopColor="#5a5a6a" />
            <stop offset="100%" stopColor="#2a2a35" />
          </radialGradient>

          {/* Misc */}
          <radialGradient id="gndSh" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="neckG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skin.dark} />
            <stop offset="100%" stopColor={skin.base} />
          </linearGradient>
          <linearGradient id="noseSh" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={skin.base} stopOpacity="0" />
            <stop offset="100%" stopColor={skin.dark} stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="50" cy="172" rx={24 * bodyW} ry="5" fill="url(#gndSh)" style={{ transition: t }} />

        <g style={{ transform: `scale(1, ${heightScale})`, transformOrigin: "50px 90px", transition: t }}>

          {/* ── HAIR (behind head) ── */}
          <PixarHair type={selections.hairType} colors={hair} />

          {/* ── EARS ── */}
          <g>
            {/* Left ear */}
            <ellipse cx="26" cy="44" rx="4.5" ry="6" fill={skin.base} style={{ transition: t }} />
            <ellipse cx="26" cy="44" rx="3" ry="4.5" fill={skin.dark} opacity="0.2" style={{ transition: t }} />
            <ellipse cx="26.5" cy="43" rx="1.8" ry="3" fill={skin.light} opacity="0.25" style={{ transition: t }} />
            {/* Right ear */}
            <ellipse cx="74" cy="44" rx="4.5" ry="6" fill={skin.base} style={{ transition: t }} />
            <ellipse cx="74" cy="44" rx="3" ry="4.5" fill={skin.dark} opacity="0.2" style={{ transition: t }} />
            <ellipse cx="73.5" cy="43" rx="1.8" ry="3" fill={skin.light} opacity="0.25" style={{ transition: t }} />
          </g>

          {/* ── HEAD – large rounded Pixar shape ── */}
          <ellipse cx="50" cy="40" rx="22" ry="26" fill="url(#sk)" style={{ transition: t }} />
          <ellipse cx="50" cy="40" rx="22" ry="26" fill="url(#skHi)" style={{ transition: t }} />
          {/* Jaw contour */}
          <path d="M30 50 Q36 68 50 70 Q64 68 70 50" fill="none" stroke={skin.dark} strokeWidth="0.5" opacity="0.12" style={{ transition: t }} />
          {/* Forehead glow */}
          <ellipse cx="48" cy="24" rx="11" ry="7" fill="white" opacity="0.05" />

          {/* ── EYEBROWS – thick expressive arcs ── */}
          <path d="M34 28 Q38 23 46 26" fill="none" stroke={hair.dark} strokeWidth="2" strokeLinecap="round" style={{ transition: t }} />
          <path d="M54 26 Q62 23 66 28" fill="none" stroke={hair.dark} strokeWidth="2" strokeLinecap="round" style={{ transition: t }} />
          <path d="M35 28.5 Q39 24 45 26.5" fill="none" stroke={hair.base} strokeWidth="0.7" strokeLinecap="round" opacity="0.25" style={{ transition: t }} />
          <path d="M55 26.5 Q61 24 65 28.5" fill="none" stroke={hair.base} strokeWidth="0.7" strokeLinecap="round" opacity="0.25" style={{ transition: t }} />

          {/* ── EYES – BIG Pixar style ── */}
          {/* Socket shadows */}
          <ellipse cx="40" cy="37" rx="7.5" ry="5.5" fill={skin.dark} opacity="0.07" style={{ transition: t }} />
          <ellipse cx="60" cy="37" rx="7.5" ry="5.5" fill={skin.dark} opacity="0.07" style={{ transition: t }} />

          {/* Sclera */}
          <ellipse cx="40" cy="37" rx="7" ry="5" fill="url(#ew)" style={{ transition: t }} />
          <ellipse cx="60" cy="37" rx="7" ry="5" fill="url(#ew)" style={{ transition: t }} />

          {/* Iris */}
          <circle cx="41" cy="37.5" r="3.8" fill="url(#iris)" style={{ transition: t }} />
          <circle cx="61" cy="37.5" r="3.8" fill="url(#iris)" style={{ transition: t }} />
          {/* Iris ring */}
          <circle cx="41" cy="37.5" r="3.8" fill="none" stroke={eye.ring} strokeWidth="0.5" opacity="0.45" />
          <circle cx="61" cy="37.5" r="3.8" fill="none" stroke={eye.ring} strokeWidth="0.5" opacity="0.45" />
          {/* Iris detail lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
            const rad = (a * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            return (
              <g key={a}>
                <line x1={41 + cos * 1.6} y1={37.5 + sin * 1.6} x2={41 + cos * 3.4} y2={37.5 + sin * 3.4}
                  stroke={eye.light} strokeWidth="0.3" opacity="0.25" />
                <line x1={61 + cos * 1.6} y1={37.5 + sin * 1.6} x2={61 + cos * 3.4} y2={37.5 + sin * 3.4}
                  stroke={eye.light} strokeWidth="0.3" opacity="0.25" />
              </g>
            );
          })}

          {/* Pupil */}
          <circle cx="41" cy="37.5" r="1.8" fill="#050510" />
          <circle cx="61" cy="37.5" r="1.8" fill="#050510" />

          {/* Main highlight */}
          <circle cx="43" cy="35.5" r="1.4" fill="white" opacity="0.92" />
          <circle cx="63" cy="35.5" r="1.4" fill="white" opacity="0.92" />
          {/* Secondary highlight */}
          <circle cx="39.5" cy="39" r="0.7" fill="white" opacity="0.5" />
          <circle cx="59.5" cy="39" r="0.7" fill="white" opacity="0.5" />
          {/* Tertiary tiny sparkle */}
          <circle cx="42" cy="36.2" r="0.35" fill="white" opacity="0.6" />
          <circle cx="62" cy="36.2" r="0.35" fill="white" opacity="0.6" />

          {/* Upper eyelid */}
          <path d="M33 35 Q40 31 47 35" fill="none" stroke={skin.dark} strokeWidth="1.1" opacity="0.45" style={{ transition: t }} />
          <path d="M53 35 Q60 31 67 35" fill="none" stroke={skin.dark} strokeWidth="1.1" opacity="0.45" style={{ transition: t }} />
          {/* Lower eyelid */}
          <path d="M34 39.5 Q40 42 46 39.5" fill="none" stroke={skin.dark} strokeWidth="0.35" opacity="0.18" style={{ transition: t }} />
          <path d="M54 39.5 Q60 42 66 39.5" fill="none" stroke={skin.dark} strokeWidth="0.35" opacity="0.18" style={{ transition: t }} />

          {/* Eyelashes – prominent Pixar lashes */}
          <path d="M33 35 Q31.5 33 31 30" fill="none" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
          <path d="M35 33.5 Q34 32 33.5 30" fill="none" stroke="#1a1a2e" strokeWidth="0.6" opacity="0.4" />
          <path d="M37 32.5 Q36.5 31 36 29.5" fill="none" stroke="#1a1a2e" strokeWidth="0.5" opacity="0.35" />
          <path d="M47 35 Q48.5 33 49 30" fill="none" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
          <path d="M45 33.5 Q46 32 46.5 30" fill="none" stroke="#1a1a2e" strokeWidth="0.6" opacity="0.4" />
          <path d="M53 35 Q51.5 33 51 30" fill="none" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
          <path d="M55 33.5 Q54 32 53.5 30" fill="none" stroke="#1a1a2e" strokeWidth="0.6" opacity="0.4" />
          <path d="M57 32.5 Q56.5 31 56 29.5" fill="none" stroke="#1a1a2e" strokeWidth="0.5" opacity="0.35" />
          <path d="M67 35 Q68.5 33 69 30" fill="none" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
          <path d="M65 33.5 Q66 32 66.5 30" fill="none" stroke="#1a1a2e" strokeWidth="0.6" opacity="0.4" />

          {/* ── NOSE – tiny Pixar button ── */}
          <path d="M50 42 L48.5 49 Q47.5 51.5 50 51.5 Q52.5 51.5 51.5 49 Z" fill="url(#noseSh)" style={{ transition: t }} />
          <path d="M48 50.5 Q50 52 52 50.5" fill="none" stroke={skin.dark} strokeWidth="0.6" opacity="0.3" strokeLinecap="round" style={{ transition: t }} />
          {/* Nostrils */}
          <ellipse cx="48.5" cy="50.5" rx="1.2" ry="0.7" fill={skin.dark} opacity="0.12" style={{ transition: t }} />
          <ellipse cx="51.5" cy="50.5" rx="1.2" ry="0.7" fill={skin.dark} opacity="0.12" style={{ transition: t }} />
          {/* Nose bridge light */}
          <path d="M49.8 43 L49.8 48" stroke="white" strokeWidth="0.5" opacity="0.1" strokeLinecap="round" />

          {/* ── CHEEK BLUSH ── */}
          <circle cx="32" cy="47" r="6.5" fill="url(#blush)" style={{ transition: t }} />
          <circle cx="68" cy="47" r="6.5" fill="url(#blush)" style={{ transition: t }} />

          {/* ── MOUTH – Pixar smile ── */}
          {/* Upper lip */}
          <path d="M41 55 Q44 52 50 53 Q56 52 59 55 Q56 54 50 54.5 Q44 54 41 55 Z"
            fill={lipColor} style={{ transition: t }} />
          {/* Lower lip */}
          <path d="M41 55 Q50 60 59 55 Q56 57.5 50 58 Q44 57.5 41 55 Z"
            fill={lipColor} style={{ transition: t }} />
          {/* Lip highlight */}
          <path d="M44 54 Q50 52.5 56 54" fill="none" stroke={lipLight} strokeWidth="0.6" opacity="0.45" />
          <ellipse cx="50" cy="56.8" rx="3.5" ry="1" fill={lipLight} opacity="0.12" />
          {/* Lip line */}
          <path d="M42 55 Q50 55.8 58 55" fill="none" stroke={skin.dark} strokeWidth="0.3" opacity="0.25" />

          {/* ── CHIN shadow ── */}
          <ellipse cx="50" cy="66" rx="8" ry="3" fill={skin.dark} opacity="0.07" style={{ transition: t }} />

          {/* ── NECK ── */}
          <path d="M43 66 L43 78 Q50 80 57 78 L57 66 Q54 68 50 68 Q46 68 43 66 Z"
            fill="url(#neckG)" style={{ transition: t }} />
          <ellipse cx="50" cy="68" rx="7" ry="2.2" fill={skin.dark} opacity="0.12" style={{ transition: t }} />

          {/* ── BODY / TORSO ── */}
          <path
            d={`M${50 - 8 * bodyW} 76 Q${50 - 4 * bodyW} 82 50 83 Q${50 + 4 * bodyW} 82 ${50 + 8 * bodyW} 76`}
            fill="none" stroke="hsl(var(--primary) / 0.8)" strokeWidth="2.2" strokeLinecap="round"
            style={{ transition: t }}
          />
          <path
            d={`M${50 - 15 * bodyW} 76
                Q${50 - 17 * bodyW} 76 ${50 - 16 * bodyW} 82
                L${50 - 14 * bodyW} 100
                Q${50 - 12 * bodyW} 116 ${50 - 8 * bodyW} 118
                Q50 122 ${50 + 8 * bodyW} 118
                Q${50 + 12 * bodyW} 116 ${50 + 14 * bodyW} 100
                L${50 + 16 * bodyW} 82
                Q${50 + 17 * bodyW} 76 ${50 + 15 * bodyW} 76 Z`}
            fill="url(#shirt)" style={{ transition: t }}
          />
          {/* Center fold shadow */}
          <path
            d={`M${50 - 2 * bodyW} 82 Q50 86 ${50 + 2 * bodyW} 82 L${50 + 1 * bodyW} 112 Q50 114 ${50 - 1 * bodyW} 112 Z`}
            fill="hsl(var(--primary) / 0.12)" style={{ transition: t }}
          />
          {/* Chest highlight */}
          <path
            d={`M${50 - 13 * bodyW} 82 Q${50 - 9 * bodyW} 80 ${50 - 5 * bodyW} 84 L${50 - 7 * bodyW} 96 Q${50 - 11 * bodyW} 92 ${50 - 13 * bodyW} 86 Z`}
            fill="white" opacity="0.05" style={{ transition: t }}
          />

          {/* ── ARMS ── */}
          <path
            d={`M${50 - 15 * bodyW} 80
                Q${50 - 19 * bodyW} 90 ${50 - 21 * bodyW} 100
                Q${50 - 23 * bodyW} 106 ${50 - 21 * bodyW} 108
                L${50 - 19 * bodyW} 108
                Q${50 - 18 * bodyW} 104 ${50 - 17 * bodyW} 98
                Q${50 - 15 * bodyW} 90 ${50 - 13 * bodyW} 82 Z`}
            fill={skin.base} style={{ transition: t }}
          />
          <path
            d={`M${50 + 15 * bodyW} 80
                Q${50 + 19 * bodyW} 90 ${50 + 21 * bodyW} 100
                Q${50 + 23 * bodyW} 106 ${50 + 21 * bodyW} 108
                L${50 + 19 * bodyW} 108
                Q${50 + 18 * bodyW} 104 ${50 + 17 * bodyW} 98
                Q${50 + 15 * bodyW} 90 ${50 + 13 * bodyW} 82 Z`}
            fill={skin.base} style={{ transition: t }}
          />
          {/* Hands */}
          <circle cx={50 - 21 * bodyW} cy="109" r="4" fill={skin.base} style={{ transition: t }} />
          <circle cx={50 - 21 * bodyW} cy="108" r="2.2" fill={skin.light} opacity="0.18" style={{ transition: t }} />
          <circle cx={50 + 21 * bodyW} cy="109" r="4" fill={skin.base} style={{ transition: t }} />
          <circle cx={50 + 21 * bodyW} cy="108" r="2.2" fill={skin.light} opacity="0.18" style={{ transition: t }} />

          {/* ── LEGS ── */}
          <path d="M40 117 Q38 132 37 148 Q36.5 152 39 152 L44 152 Q45 152 44.5 148 Q44 132 43 117 Z"
            fill="url(#pants)" style={{ transition: t }} />
          <path d="M57 117 Q56 132 55 148 Q54.5 152 57 152 L62 152 Q63 152 62.5 148 Q61 132 60 117 Z"
            fill="url(#pants)" style={{ transition: t }} />
          {/* Belt */}
          <path d={`M${50 - 11 * bodyW} 117 Q50 119 ${50 + 11 * bodyW} 117`}
            fill="none" stroke="#3a3a45" strokeWidth="1.4" style={{ transition: t }} />
          <rect x="48" y="116" width="4" height="2.8" rx="0.5" fill="#6a6a78" style={{ transition: t }} />

          {/* ── SHOES ── */}
          <ellipse cx="38" cy="154" rx="8" ry="4" fill="url(#shoe)" style={{ transition: t }} />
          <ellipse cx="60" cy="154" rx="8" ry="4" fill="url(#shoe)" style={{ transition: t }} />
          <path d="M31 153 Q38 149 45 153" fill="#4a4a58" style={{ transition: t }} />
          <path d="M53 153 Q60 149 67 153" fill="#4a4a58" style={{ transition: t }} />
          <path d="M33 152 Q38 150.5 43 152" fill="none" stroke="white" strokeWidth="0.4" opacity="0.12" />
          <path d="M55 152 Q60 150.5 65 152" fill="none" stroke="white" strokeWidth="0.4" opacity="0.12" />
        </g>
      </svg>
      <p className="text-xs text-muted-foreground text-center">Preview em tempo real</p>
    </div>
  );
}
