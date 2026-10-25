import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMBR — Above Ordinary",
    short_name: "AMBR",
    description: "Inspired perfumes and attars in Bangladesh.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7E8E1",
    theme_color: "#4A1022",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
