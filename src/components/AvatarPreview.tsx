import { useMemo, useState, useEffect } from "react";

interface AvatarPreviewProps {
  selections: Record<string, string>;
}

const HAIR_COLORS: Record<string, string> = {
  "Preto": "#1a1a1a",
  "Castanho escuro": "#3b2314",
  "Castanho claro": "#8b5e3c",
  "Loiro": "#f0d060",
  "Ruivo": "#c44020",
  "Platinado": "#e8e0d0",
  "Rosa": "#f472b6",
  "Azul": "#3b82f6",
  "Branco": "#f0eded",
};

const SKIN_COLORS: Record<string, string> = {
  "Pele clara": "#fde8d0",
  "Pele branca": "#fceee0",
  "Pele morena clara": "#d4a574",
  "Pele morena": "#b07840",
  "Pele negra": "#6b4226",
  "Pele asiática": "#f0d0a0",
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
  "Baixa": 0.88,
  "Média": 1,
  "Alta": 1.12,
};

const BODY_WIDTH: Record<string, number> = {
  "Magra": 0.8,
  "Atlética": 0.9,
  "Mediana": 1,
  "Curvilínea": 1.12,
  "Plus size": 1.25,
};

function HairPath({ type, color }: { type: string; color: string }) {
  const style = { fill: color, transition: "all 0.4s ease" };
  switch (type) {
    case "Liso":
      return <path d="M30 28 Q30 10 50 8 Q70 10 70 28 L72 55 Q68 50 65 55 L65 35 Q65 20 50 18 Q35 20 35 35 L35 55 Q32 50 28 55 Z" style={style} />;
    case "Ondulado":
      return <path d="M30 28 Q30 10 50 8 Q70 10 70 28 L73 50 Q70 45 68 52 Q66 45 64 55 L64 35 Q64 20 50 18 Q36 20 36 35 L36 55 Q34 45 32 52 Q30 45 27 50 Z" style={style} />;
    case "Cacheado":
      return <path d="M28 30 Q25 8 50 6 Q75 8 72 30 L75 42 Q72 38 74 48 Q70 42 72 52 Q68 46 66 55 L66 35 Q66 18 50 16 Q34 18 34 35 L34 55 Q32 46 28 52 Q30 42 26 48 Q28 38 25 42 Z" style={style} />;
    case "Crespo":
      return <path d="M26 32 Q22 5 50 4 Q78 5 74 32 L76 40 Q78 35 76 46 Q74 40 76 50 Q72 44 70 54 Q68 44 66 55 L66 34 Q66 16 50 14 Q34 16 34 34 L34 55 Q32 44 28 54 Q30 44 26 50 Q28 40 24 46 Q26 35 24 40 Z" style={style} />;
    case "Curto":
      return <path d="M32 28 Q32 12 50 10 Q68 12 68 28 L70 38 Q66 34 66 32 Q66 20 50 18 Q34 20 34 32 Q34 34 30 38 Z" style={style} />;
    case "Raspado":
      return <path d="M34 28 Q34 14 50 12 Q66 14 66 28 L66 30 Q66 20 50 18 Q34 20 34 30 Z" style={style} />;
    case "Trançado":
      return (<>
        <path d="M30 28 Q30 10 50 8 Q70 10 70 28 L70 35 Q70 20 50 18 Q30 20 30 35 Z" style={style} />
        <path d="M28 35 Q27 45 28 60 Q30 65 32 60 Q31 45 30 35 Z" style={style} />
        <path d="M68 35 Q69 45 70 60 Q72 65 74 60 Q73 45 72 35 Z" style={style} />
      </>);
    default:
      return <path d="M30 28 Q30 10 50 8 Q70 10 70 28 L72 55 Q68 50 65 55 L65 35 Q65 20 50 18 Q35 20 35 35 L35 55 Q32 50 28 55 Z" style={style} />;
  }
}

export function AvatarPreview({ selections }: AvatarPreviewProps) {
  const hairColor = HAIR_COLORS[selections.hairColor] || "#1a1a1a";
  const skinColor = SKIN_COLORS[selections.skinColor] || "#d4a574";
  const eyeColor = EYE_COLORS[selections.eyeColor] || "#5c3317";
  const heightScale = HEIGHT_SCALE[selections.height] || 1;
  const bodyW = BODY_WIDTH[selections.bodyType] || 1;

  const [pulse, setPulse] = useState(false);
  const selKey = useMemo(() => JSON.stringify(selections), [selections]);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(t);
  }, [selKey]);

  const trans = "all 0.4s ease";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 100 160"
        className="w-48 h-auto drop-shadow-lg"
        style={{
          transform: `scale(${pulse ? 1.03 : 1})`,
          transition: "transform 0.3s ease",
        }}
      >
        <g style={{ transform: `scale(1, ${heightScale})`, transformOrigin: "50px 80px", transition: trans }}>
          {/* Hair behind */}
          <HairPath type={selections.hairType} color={hairColor} />

          {/* Head */}
          <ellipse cx="50" cy="32" rx="18" ry="20" style={{ fill: skinColor, transition: trans }} />

          {/* Eyes */}
          <ellipse cx="42" cy="30" rx="3" ry="2.5" fill="white" style={{ transition: trans }} />
          <ellipse cx="58" cy="30" rx="3" ry="2.5" fill="white" style={{ transition: trans }} />
          <circle cx="42" cy="30" r="1.5" style={{ fill: eyeColor, transition: trans }} />
          <circle cx="58" cy="30" r="1.5" style={{ fill: eyeColor, transition: trans }} />

          {/* Eyebrows */}
          <line x1="38" y1="25" x2="46" y2="25" stroke={hairColor} strokeWidth="1" style={{ transition: trans }} />
          <line x1="54" y1="25" x2="62" y2="25" stroke={hairColor} strokeWidth="1" style={{ transition: trans }} />

          {/* Nose */}
          <path d="M49 33 Q50 36 51 33" fill="none" stroke={skinColor} strokeWidth="0.8" style={{ transition: trans, filter: "brightness(0.85)" }} />

          {/* Mouth */}
          <path d="M44 38 Q50 42 56 38" fill="none" stroke="#e05070" strokeWidth="1.2" strokeLinecap="round" />

          {/* Neck */}
          <rect x="46" y="50" width="8" height="8" rx="2" style={{ fill: skinColor, transition: trans }} />

          {/* Body / torso */}
          <path
            d={`M${50 - 14 * bodyW} 58 Q${50 - 16 * bodyW} 58 ${50 - 15 * bodyW} 62 L${50 - 12 * bodyW} 95 Q50 100 ${50 + 12 * bodyW} 95 L${50 + 15 * bodyW} 62 Q${50 + 16 * bodyW} 58 ${50 + 14 * bodyW} 58 Z`}
            style={{ fill: "hsl(var(--primary))", transition: trans, opacity: 0.85 }}
          />

          {/* Arms */}
          <line x1={50 - 15 * bodyW} y1="62" x2={50 - 22 * bodyW} y2="88" stroke={skinColor} strokeWidth="4" strokeLinecap="round" style={{ transition: trans }} />
          <line x1={50 + 15 * bodyW} y1="62" x2={50 + 22 * bodyW} y2="88" stroke={skinColor} strokeWidth="4" strokeLinecap="round" style={{ transition: trans }} />

          {/* Legs */}
          <line x1="43" y1="95" x2="40" y2="130" stroke={skinColor} strokeWidth="5" strokeLinecap="round" style={{ transition: trans }} />
          <line x1="57" y1="95" x2="60" y2="130" stroke={skinColor} strokeWidth="5" strokeLinecap="round" style={{ transition: trans }} />

          {/* Shoes */}
          <ellipse cx="38" cy="132" rx="6" ry="3" fill="hsl(var(--muted-foreground))" style={{ transition: trans, opacity: 0.7 }} />
          <ellipse cx="62" cy="132" rx="6" ry="3" fill="hsl(var(--muted-foreground))" style={{ transition: trans, opacity: 0.7 }} />
        </g>
      </svg>
      <p className="text-xs text-muted-foreground text-center">Preview em tempo real</p>
    </div>
  );
}
