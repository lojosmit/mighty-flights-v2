import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mighty Flights",
    short_name: "Mighty Flights",
    description: "Darts league management — standings, fixtures, and game nights.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0E1A12",
    theme_color: "#0E1A12",
    categories: ["sports", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
