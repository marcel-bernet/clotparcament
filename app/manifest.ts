import type { MetadataRoute } from "next";

// Lets people "Add to home screen" so the app opens like a normal phone app.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClotParcament",
    short_name: "ClotParcament",
    description: "On aparcar al Clot",
    lang: "ca",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#fbf6ec",
    theme_color: "#fbf6ec",
    icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
