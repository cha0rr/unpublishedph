import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface SequentialVideoPlayerProps {
  segments: string[];
  aspectRatio: string;
}

export function SequentialVideoPlayer({ segments, aspectRatio }: SequentialVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  // Reset to first segment when segments change (new generation)
  useEffect(() => {
    if (segments.length === 1) setCurrentIndex(0);
  }, [segments.length]);

  // Auto-play when segment changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.load();
    vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentIndex]);

  const handleEnded = useCallback(() => {
    const next = currentIndex + 1;
    if (next < segments.length) {
      setCurrentIndex(next);
    } else {
      // Loop back to first
      setCurrentIndex(0);
    }
  }, [currentIndex, segments.length]);

  const goNext = () => {
    if (currentIndex < segments.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true));
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  const containerClass = aspectRatio === "16:9"
    ? "aspect-video"
    : "aspect-[9/16] max-w-sm mx-auto";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/30 bg-card/40 ${containerClass} group`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={segments[currentIndex]}
        autoPlay
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="h-full w-full object-cover"
      />

      {/* Segment indicator */}
      {segments.length > 1 && (
        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm text-xs text-foreground px-2 py-0.5 rounded-md font-medium">
          Parte {currentIndex + 1} de {segments.length}
        </div>
      )}

      {/* Controls overlay */}
      {segments.length > 1 && (
        <div
          className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 py-3 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-sm disabled:opacity-30 hover:bg-background/80 transition-colors"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={togglePlay}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/80 text-primary-foreground backdrop-blur-sm hover:bg-primary transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === segments.length - 1}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-sm disabled:opacity-30 hover:bg-background/80 transition-colors"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preload next segment */}
      {currentIndex + 1 < segments.length && (
        <link rel="preload" href={segments[currentIndex + 1]} as="video" />
      )}
    </div>
  );
}
