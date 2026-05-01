export const GROK_MODE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "custom", label: "Custom" },
  { value: "extremely-crazy", label: "Extremely Crazy" },
  { value: "extremely-spicy-or-crazy", label: "Extremely Spicy or Crazy" },
] as const;

export const GROK_ASPECT_OPTIONS = [
  { value: "16:9", label: "Landscape 16:9" },
  { value: "9:16", label: "Portrait 9:16" },
  { value: "1:1", label: "Square 1:1" },
  { value: "2:3", label: "Vertical 2:3" },
  { value: "3:2", label: "Horizontal 3:2" },
] as const;

export const GROK_DURATION_OPTIONS = [
  { value: "6", label: "6s" },
  { value: "10", label: "10s" },
] as const;

export const GROK_VALID_ASPECTS = GROK_ASPECT_OPTIONS.map((o) => o.value) as string[];