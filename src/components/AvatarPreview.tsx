import { useMemo, useState, useEffect } from "react";

interface AvatarPreviewProps {
  selections: Record<string, string>;
}

const HAIR_COLORS: Record<string, string> = {
  "Preto": "#1a1a1a",
  "Castanho escuro": "#3b2314",
  "Castanho claro": "#8b5e3c",
  "Loiro": "#e8c840",
  "Ruivo": "#c44020",
  "Platinado": "#e8e0d0",
  "Rosa": "#f472b6",
  "Azul": "#3b82f6",
  "Branco": "#f0eded",
};

const HAIR_SHADOW: Record<string, string> = {
  "Preto": "#0d0d0d",
  "Castanho escuro": "#2a1810",
  "Castanho claro": "#6b4a2e",
  "Loiro": "#c8a830",
  "Ruivo": "#a03018",
  "Platinado": "#d0c8b8",
  "Rosa": "#d45a9a",
  "Azul": "#2a60c0",
  "Branco": "#d8d0d0",
};

const SKIN_COLORS: Record<string, string> = {
  "Pele clara": "#fde8d0",
  "Pele branca": "#fceee0",
  "Pele morena clara": "#d4a574",
  "Pele morena": "#b07840",
  "Pele negra": "#6b4226",
  "Pele asiática": "#f0d0a0",
};

const SKIN_SHADOW: Record<string, string> = {
  "Pele clara": "#e8cdb5",
  "Pele branca": "#e8d5c5",
  "Pele morena clara": "#b88a5e",
  "Pele morena": "#946030",
  "Pele negra": "#52311c",
  "Pele asiática": "#d8b888",
};

const EYE_COLORS: Record<string, string> = {
  "Castanho": "#5c3317",
  "Verde": "#2d8a4e",
  "Azul": "#3b82f6",
  "Mel": "#c49a3c",
  "Cinza": "#8899aa",
  "Preto": "#1a1a1a",
};

const HEIGHT_SCALE: Record<string, number> = {
  "Baixa": 0.9,
  "Média": 1,
  "Alta": 1.1,
};

const BODY_WIDTH: Record<string, number> = {
  "Magra": 0.82,
  "Atlética": 0.92,
  "Mediana": 1,
  "Curvilínea": 1.1,
  "Plus size": 1.22,
};

function HairPath({ type, color, shadow }: { type: string; color: string; shadow: string }) {
  const style = { fill: color, transition: "all 0.4s ease" };
  const shadowStyle = { fill: shadow, transition: "all 0.4s ease" };

  switch (type) {
    case "Liso":
      return (
        <g>
          <path d="M28 38 Q26 15 50 10 Q74 15 72 38 L74 65 Q72 58 70 62 L70 40 Q70 22 50 18 Q30 22 30 40 L30 62 Q28 58 26 65 Z" style={style} />
          <path d="M30 40 Q30 22 50 18 Q30 24 30 42 L30 55 Q28 50 26 55 L28 42 Z" style={shadowStyle} opacity="0.4" />
        </g>
      );
    case "Ondulado":
      return (
        <g>
          <path d="M27 38 Q25 12 50 9 Q75 12 73 38 L76 55 Q74 48 72 54 Q70 47 68 56 L68 40 Q68 22 50 17 Q32 22 32 40 L32 56 Q30 47 28 54 Q26 48 24 55 Z" style={style} />
          <path d="M32 40 Q32 22 50 17 Q34 24 34 42 L34 50 Q32 44 30 50 Z" style={shadowStyle} opacity="0.35" />
        </g>
      );
    case "Cacheado":
      return (
        <g>
          <path d="M25 40 Q22 8 50 6 Q78 8 75 40 L78 48 Q76 42 78 52 Q74 46 76 56 Q72 48 70 58 L70 38 Q70 20 50 15 Q30 20 30 38 L30 58 Q28 48 24 56 Q26 46 22 52 Q24 42 22 48 Z" style={style} />
          <ellipse cx="24" cy="50" rx="4" ry="5" style={style} />
          <ellipse cx="76" cy="50" rx="4" ry="5" style={style} />
          <ellipse cx="22" cy="42" rx="3" ry="4" style={shadowStyle} opacity="0.3" />
        </g>
      );
    case "Crespo":
      return (
        <g>
          <path d="M23 42 Q18 5 50 3 Q82 5 77 42 L80 48 Q82 40 80 54 Q78 46 80 56 Q76 48 74 58 Q72 48 70 56 L70 36 Q70 18 50 13 Q30 18 30 36 L30 56 Q28 48 26 56 Q24 46 20 54 Q22 40 18 48 Q20 38 18 44 Z" style={style} />
          <ellipse cx="20" cy="46" rx="5" ry="6" style={style} />
          <ellipse cx="80" cy="46" rx="5" ry="6" style={style} />
          <circle cx="22" cy="36" r="4" style={style} />
          <circle cx="78" cy="36" r="4" style={style} />
        </g>
      );
    case "Curto":
      return (
        <g>
          <path d="M30 35 Q28 14 50 10 Q72 14 70 35 L72 42 Q70 38 70 36 Q70 22 50 18 Q30 22 30 36 Q30 38 28 42 Z" style={style} />
          <path d="M30 36 Q30 22 50 18 Q32 24 32 38 L30 42 Z" style={shadowStyle} opacity="0.3" />
        </g>
      );
    case "Raspado":
      return (
        <g>
          <path d="M32 32 Q30 16 50 12 Q70 16 68 32 L68 34 Q68 22 50 18 Q32 22 32 34 Z" style={style} />
        </g>
      );
    case "Trançado":
      return (
        <g>
          <path d="M28 36 Q26 12 50 9 Q74 12 72 36 L72 40 Q72 22 50 17 Q28 22 28 40 Z" style={style} />
          {/* Left braid */}
          <path d="M26 40 Q24 48 25 56 Q26 60 27 64 Q28 68 27 72 Q26 76 27 80" stroke={color} strokeWidth="5" fill="none" style={{ transition: "all 0.4s ease" }} />
          <path d="M26 40 Q28 48 27 56 Q26 60 25 64" stroke={shadow} strokeWidth="2" fill="none" opacity="0.3" style={{ transition: "all 0.4s ease" }} />
          {/* Right braid */}
          <path d="M74 40 Q76 48 75 56 Q74 60 73 64 Q72 68 73 72 Q74 76 73 80" stroke={color} strokeWidth="5" fill="none" style={{ transition: "all 0.4s ease" }} />
        </g>
      );
    default:
      return (
        <g>
          <path d="M28 38 Q26 15 50 10 Q74 15 72 38 L74 65 Q72 58 70 62 L70 40 Q70 22 50 18 Q30 22 30 40 L30 62 Q28 58 26 65 Z" style={style} />
        </g>
      );
  }
}

export function AvatarPreview({ selections }: AvatarPreviewProps) {
  const hairColor = HAIR_COLORS[selections.hairColor] || "#1a1a1a";
  const hairShadow = HAIR_SHADOW[selections.hairColor] || "#0d0d0d";
  const skinColor = SKIN_COLORS[selections.skinColor] || "#d4a574";
  const skinShadow = SKIN_SHADOW[selections.skinColor] || "#b88a5e";
  const eyeColor = EYE_COLORS[selections.eyeColor] || "#5c3317";
  const heightScale = HEIGHT_SCALE[selections.height] || 1;
  const bodyW = BODY_WIDTH[selections.bodyType] || 1;

  const [pulse, setPulse] = useState(false);
  const selKey = useMemo(() => JSON.stringify(selections), [selections]);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 350);
    return () => clearTimeout(t);
  }, [selKey]);

  const trans = "all 0.4s ease";

  // Lip colors based on skin tone
  const lipColor = skinColor === "#6b4226" ? "#8b4050" : skinColor === "#b07840" ? "#c06070" : "#d96080";
  const blushColor = skinColor === "#6b4226" ? "rgba(180,80,80,0.15)" : "rgba(220,100,100,0.18)";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 100 170"
        className="w-52 h-auto drop-shadow-xl"
        style={{
          transform: `scale(${pulse ? 1.02 : 1})`,
          transition: "transform 0.3s ease",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
        }}
      >
        <defs>
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor={skinColor} />
            <stop offset="100%" stopColor={skinShadow} />
          </radialGradient>
          <radialGradient id="cheekL" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={blushColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
          </linearGradient>
          <linearGradient id="shoeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground) / 0.5)" />
          </linearGradient>
        </defs>

        <g style={{ transform: `scale(1, ${heightScale})`, transformOrigin: "50px 85px", transition: trans }}>
          {/* Hair behind head */}
          <HairPath type={selections.hairType} color={hairColor} shadow={hairShadow} />

          {/* Ears */}
          <ellipse cx="31" cy="36" rx="3.5" ry="5" style={{ fill: skinColor, transition: trans }} />
          <ellipse cx="31" cy="36" rx="2" ry="3.5" style={{ fill: skinShadow, transition: trans, opacity: 0.3 }} />
          <ellipse cx="69" cy="36" rx="3.5" ry="5" style={{ fill: skinColor, transition: trans }} />
          <ellipse cx="69" cy="36" rx="2" ry="3.5" style={{ fill: skinShadow, transition: trans, opacity: 0.3 }} />

          {/* Head - more oval/realistic */}
          <ellipse cx="50" cy="35" rx="19" ry="22" style={{ fill: "url(#skinGrad)", transition: trans }} />

          {/* Jaw definition */}
          <path d="M33 40 Q35 56 50 58 Q65 56 67 40" fill="none" stroke={skinShadow} strokeWidth="0.5" opacity="0.2" style={{ transition: trans }} />

          {/* Eyebrows - more arched and natural */}
          <path d="M38 25 Q41 22 46 24" fill="none" stroke={hairColor} strokeWidth="1.2" strokeLinecap="round" style={{ transition: trans }} />
          <path d="M54 24 Q59 22 62 25" fill="none" stroke={hairColor} strokeWidth="1.2" strokeLinecap="round" style={{ transition: trans }} />

          {/* Eye whites with subtle shape */}
          <ellipse cx="42" cy="31" rx="4" ry="3" fill="white" style={{ transition: trans }} />
          <ellipse cx="58" cy="31" rx="4" ry="3" fill="white" style={{ transition: trans }} />

          {/* Iris */}
          <circle cx="42.5" cy="31" r="2.2" style={{ fill: eyeColor, transition: trans }} />
          <circle cx="58.5" cy="31" r="2.2" style={{ fill: eyeColor, transition: trans }} />

          {/* Pupil */}
          <circle cx="42.5" cy="31" r="1" fill="#0a0a0a" />
          <circle cx="58.5" cy="31" r="1" fill="#0a0a0a" />

          {/* Eye highlight/reflection */}
          <circle cx="43.3" cy="30.2" r="0.6" fill="white" opacity="0.85" />
          <circle cx="59.3" cy="30.2" r="0.6" fill="white" opacity="0.85" />

          {/* Upper eyelid line */}
          <path d="M38 29.5 Q42 27.5 46 29.5" fill="none" stroke={skinShadow} strokeWidth="0.6" opacity="0.5" />
          <path d="M54 29.5 Q58 27.5 62 29.5" fill="none" stroke={skinShadow} strokeWidth="0.6" opacity="0.5" />

          {/* Eyelashes (subtle) */}
          <path d="M38 29.5 Q37 28 36.5 27.5" fill="none" stroke="#2a2a2a" strokeWidth="0.4" opacity="0.4" />
          <path d="M46 29.5 Q47 28 47.5 27.5" fill="none" stroke="#2a2a2a" strokeWidth="0.4" opacity="0.4" />
          <path d="M54 29.5 Q53 28 52.5 27.5" fill="none" stroke="#2a2a2a" strokeWidth="0.4" opacity="0.4" />
          <path d="M62 29.5 Q63 28 63.5 27.5" fill="none" stroke="#2a2a2a" strokeWidth="0.4" opacity="0.4" />

          {/* Nose - more defined */}
          <path d="M50 34 L49 40 Q48 42 50 42 Q52 42 51 40 Z" fill="none" stroke={skinShadow} strokeWidth="0.7" opacity="0.45" style={{ transition: trans }} />
          <circle cx="48" cy="41.5" r="1" fill={skinShadow} opacity="0.15" style={{ transition: trans }} />
          <circle cx="52" cy="41.5" r="1" fill={skinShadow} opacity="0.15" style={{ transition: trans }} />

          {/* Cheek blush */}
          <circle cx="37" cy="39" r="5" fill={blushColor} style={{ transition: trans }} />
          <circle cx="63" cy="39" r="5" fill={blushColor} style={{ transition: trans }} />

          {/* Mouth - fuller lips */}
          <path d="M44 46 Q47 44 50 44.5 Q53 44 56 46" fill="none" stroke={lipColor} strokeWidth="1" strokeLinecap="round" style={{ transition: trans }} />
          <path d="M44 46 Q50 50 56 46" fill={lipColor} opacity="0.5" style={{ transition: trans }} />

          {/* Chin subtle shadow */}
          <ellipse cx="50" cy="54" rx="6" ry="2" fill={skinShadow} opacity="0.1" style={{ transition: trans }} />

          {/* Neck with shadow */}
          <rect x="45" y="55" width="10" height="10" rx="3" style={{ fill: skinColor, transition: trans }} />
          <rect x="45" y="55" width="10" height="4" rx="2" style={{ fill: skinShadow, transition: trans, opacity: 0.15 }} />

          {/* Collar/neckline */}
          <path
            d={`M${50 - 10 * bodyW} 64 Q50 70 ${50 + 10 * bodyW} 64`}
            fill="none"
            stroke="hsl(var(--primary) / 0.6)"
            strokeWidth="1.5"
            style={{ transition: trans }}
          />

          {/* Body / torso - more shaped */}
          <path
            d={`M${50 - 13 * bodyW} 64 
                Q${50 - 15 * bodyW} 64 ${50 - 14 * bodyW} 68 
                L${50 - 12 * bodyW} 85 
                Q${50 - 10 * bodyW} 100 ${50 - 8 * bodyW} 102 
                Q50 106 ${50 + 8 * bodyW} 102 
                Q${50 + 10 * bodyW} 100 ${50 + 12 * bodyW} 85 
                L${50 + 14 * bodyW} 68 
                Q${50 + 15 * bodyW} 64 ${50 + 13 * bodyW} 64 Z`}
            style={{ fill: "url(#bodyGrad)", transition: trans, opacity: 0.9 }}
          />

          {/* Torso shadow for depth */}
          <path
            d={`M${50 - 5 * bodyW} 68 
                Q50 72 ${50 + 5 * bodyW} 68 
                L${50 + 3 * bodyW} 95 
                Q50 98 ${50 - 3 * bodyW} 95 Z`}
            fill="hsl(var(--primary) / 0.15)"
            style={{ transition: trans }}
          />

          {/* Arms with hands */}
          <line
            x1={50 - 14 * bodyW} y1="68"
            x2={50 - 22 * bodyW} y2="95"
            stroke={skinColor} strokeWidth="4.5" strokeLinecap="round"
            style={{ transition: trans }}
          />
          <line
            x1={50 + 14 * bodyW} y1="68"
            x2={50 + 22 * bodyW} y2="95"
            stroke={skinColor} strokeWidth="4.5" strokeLinecap="round"
            style={{ transition: trans }}
          />
          {/* Hands */}
          <circle cx={50 - 22 * bodyW} cy="96" r="3" style={{ fill: skinColor, transition: trans }} />
          <circle cx={50 + 22 * bodyW} cy="96" r="3" style={{ fill: skinColor, transition: trans }} />

          {/* Legs with pants */}
          <line x1="44" y1="102" x2="41" y2="138" stroke="hsl(var(--muted-foreground) / 0.6)" strokeWidth="6" strokeLinecap="round" style={{ transition: trans }} />
          <line x1="56" y1="102" x2="59" y2="138" stroke="hsl(var(--muted-foreground) / 0.6)" strokeWidth="6" strokeLinecap="round" style={{ transition: trans }} />

          {/* Shoes - more defined */}
          <ellipse cx="39" cy="140" rx="7" ry="3.5" style={{ fill: "url(#shoeGrad)", transition: trans, opacity: 0.85 }} />
          <ellipse cx="61" cy="140" rx="7" ry="3.5" style={{ fill: "url(#shoeGrad)", transition: trans, opacity: 0.85 }} />
          {/* Shoe tops */}
          <path d="M33 139 Q39 136 45 139" fill="hsl(var(--muted-foreground) / 0.7)" style={{ transition: trans }} />
          <path d="M55 139 Q61 136 67 139" fill="hsl(var(--muted-foreground) / 0.7)" style={{ transition: trans }} />

          {/* Hair front/bangs overlay */}
          {(selections.hairType === "Liso" || selections.hairType === "Ondulado" || !selections.hairType) && (
            <path d="M32 26 Q36 18 50 16 Q64 18 68 26 Q62 22 50 20 Q38 22 32 26 Z" style={{ fill: hairColor, transition: trans }} />
          )}
          {selections.hairType === "Cacheado" && (
            <path d="M30 28 Q34 16 50 14 Q66 16 70 28 Q64 20 50 18 Q36 20 30 28 Z" style={{ fill: hairColor, transition: trans }} />
          )}
          {selections.hairType === "Crespo" && (
            <path d="M28 30 Q32 14 50 12 Q68 14 72 30 Q66 18 50 16 Q34 18 28 30 Z" style={{ fill: hairColor, transition: trans }} />
          )}
        </g>
      </svg>
      <p className="text-xs text-muted-foreground text-center">Preview em tempo real</p>
    </div>
  );
}
