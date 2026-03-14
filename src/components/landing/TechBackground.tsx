export function TechBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] animate-grid-pulse"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Scan line */}
      <div className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line" />

      {/* Floating particles */}
      {[
        { left: "10%", top: "20%", size: 3, delay: "0s", duration: "12s" },
        { left: "25%", top: "60%", size: 2, delay: "2s", duration: "15s" },
        { left: "45%", top: "30%", size: 4, delay: "4s", duration: "10s" },
        { left: "65%", top: "70%", size: 2, delay: "1s", duration: "14s" },
        { left: "80%", top: "15%", size: 3, delay: "3s", duration: "11s" },
        { left: "90%", top: "50%", size: 2, delay: "5s", duration: "13s" },
        { left: "35%", top: "85%", size: 3, delay: "6s", duration: "16s" },
        { left: "55%", top: "45%", size: 2, delay: "7s", duration: "12s" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/40 animate-float-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
