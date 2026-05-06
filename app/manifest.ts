import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Git Orbit Mobile",
    short_name: "Git Orbit",
    description:
      "Installable GitHub system inspector for live repository status, connections, and evidence.",
    start_url: withBasePath("/"),
    display: "standalone",
    background_color: "#f6f7f4",
    theme_color: "#f6f7f4",
    orientation: "portrait",
    icons: [
      {
        src: withBasePath("/icon.svg"),
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: withBasePath("/icon.svg"),
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
