import Svg, { Path } from "react-native-svg";

import { T } from "@/lib/theme";

// Line icons for UI actions (props and rewards use pixel sprites instead).
const PATHS = {
  back: "M15 5l-7 7 7 7",
  chevron: "M9 5l7 7-7 7",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  camera: "M4 8h3l1.5-2.5h7L17 8h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z",
  image: "M3.5 5h17v14h-17zM4 17l5-4.5 4 3.5 3-2.5 4 3.5M9 8.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6z",
  mic: "M9 3h6v11H9zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6",
  quill: "M20 4c-7 1-12 6-13.5 13.5L5 20M20 4c-1 6-5 10-11 11",
  play: "M8 5.5v13l10.5-6.5z",
  stop: "M7 7h10v10H7z",
  lock: "M5 10.5h14v10H5zM8 10.5V7.5a4 4 0 0 1 8 0v3",
  hourglass: "M6 3h12M6 21h12M7.5 3c0 4.5 4.5 5.5 4.5 9s-4.5 4.5-4.5 9M16.5 3c0 4.5-4.5 5.5-4.5 9s4.5 4.5 4.5 9",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
  phone: "M7 2.5h10a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM11 18.5h2",
  home: "M4 11l8-7 8 7v9H4zM10 20v-5h4v5",
  seal: "M12 3l2.2 1.6 2.7-.2.9 2.6 2.3 1.4-.6 2.6 1.1 2.5-2 1.8-.4 2.7-2.7.4-1.8 2L12 19.9l-2.5 1.1-1.8-2-2.7-.4-.4-2.7-2-1.8 1.1-2.5-.6-2.6 2.3-1.4.9-2.6 2.7.2zM8.5 12l2.5 2.5 4.5-5",
  scroll: "M7 4h11a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h1zM10 9h4M10 12.5h4",
  chest: "M3.5 10a8.5 5 0 0 1 17 0v9h-17zM3.5 12h17M10.5 10.5h3v4h-3z",
  apps: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  coin: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17zM12 7.5l3 4.5-3 4.5-3-4.5z",
  trash: "M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13",
  logout: "M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10",
} as const;

export type IconName = keyof typeof PATHS;

const FILLED: Partial<Record<IconName, true>> = { play: true, stop: true };

export function Icon({ name, size = 20, color = T.brassHi }: { name: IconName; size?: number; color?: string }) {
  const filled = FILLED[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"}>
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
