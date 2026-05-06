import type { CheckState, ConnectionStatus, ModuleStatus } from "@/lib/types";

export function getModulePalette(status: ModuleStatus) {
  switch (status) {
    case "verified":
      return {
        body: "#9ee1b6",
        edge: "#2d8a58",
        glow: "#7cf0b2",
      };
    case "implemented":
      return {
        body: "#7ab88f",
        edge: "#315b41",
        glow: "#9bd1ab",
      };
    case "building":
      return {
        body: "#d9cc7d",
        edge: "#847431",
        glow: "#eadb8f",
      };
    case "skeleton":
      return {
        body: "#cbd5c9",
        edge: "#6f7e71",
        glow: "#dce7da",
      };
    case "broken":
      return {
        body: "#f0ada8",
        edge: "#c5463c",
        glow: "#ffcabf",
      };
    case "empty":
    default:
      return {
        body: "#eef1ed",
        edge: "#9ba49e",
        glow: "#ffffff",
      };
  }
}

export function getConnectionStroke(status: ConnectionStatus) {
  switch (status) {
    case "active":
      return { color: "#17915a", dash: false, opacity: 0.95 };
    case "broken":
      return { color: "#d94841", dash: false, opacity: 0.95 };
    case "untested":
      return { color: "#d8a126", dash: true, opacity: 0.9 };
    case "planned":
    default:
      return { color: "#97a294", dash: true, opacity: 0.55 };
  }
}

export function glyphForCheck(state: CheckState) {
  if (state === "pass") return "●";
  if (state === "fail") return "×";
  return "—";
}
