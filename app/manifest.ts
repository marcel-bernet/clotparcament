import type { MetadataRoute } from "next";

// Lets people "Add to home screen" so the app opens like a normal phone app.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clotparcament",
    short_name: "Clotparcament",
    description: "On aparcar al Clot",
    lang: "ca",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#f4f6f4",
    theme_color: "#1f6f43",
    icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
