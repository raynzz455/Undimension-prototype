import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "UNDIMENSION — Circle Beyond Space & Time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph image — renders a snapshot of the opening page look:
 * dark space background with radial glows (blackhole on the right),
 * the UNDIMENSION title with cyan text-shadow, and the astronaut
 * floating in the center (the actual /assets/Astronout.png image).
 *
 * The OG image is a static PNG — the WebGL blackhole shader + CSS 3D
 * tesseract can't be captured server-side, so we approximate the look
 * with radial gradients + the astronaut image + orbit rings.
 */
export default async function Image() {
  // Read the astronaut image from the public folder + convert to a base64
  // data URI so it can be embedded in the OG image (next/og ImageResponse
  // supports img with data URI src — Node.js Buffer doesn't work directly).
  let astronautSrc: string | undefined;
  try {
    const filePath = join(process.cwd(), "public", "assets", "Astronout.png");
    const buf = await readFile(filePath);
    astronautSrc = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    // Image not found — render without it (title + bg only)
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          backgroundImage: [
            // Left side — red/magenta glow (like the opening page's left side)
            "radial-gradient(circle at 15% 50%, rgba(255,77,77,0.20) 0%, transparent 40%)",
            // Right side — blackhole glow (orange/yellow/cyan, like the shader)
            "radial-gradient(circle at 85% 50%, rgba(255,140,0,0.25) 0%, transparent 35%)",
            "radial-gradient(circle at 85% 50%, rgba(0,229,255,0.15) 0%, transparent 25%)",
            // Subtle star field (tiny dots)
            "radial-gradient(1px 1px at 100px 100px, rgba(255,255,255,0.6), transparent)",
            "radial-gradient(1px 1px at 300px 200px, rgba(255,255,255,0.4), transparent)",
            "radial-gradient(1px 1px at 500px 50px, rgba(255,255,255,0.5), transparent)",
            "radial-gradient(1px 1px at 700px 300px, rgba(255,255,255,0.3), transparent)",
            "radial-gradient(1px 1px at 900px 150px, rgba(255,255,255,0.5), transparent)",
            "radial-gradient(1px 1px at 1100px 400px, rgba(255,255,255,0.4), transparent)",
            "radial-gradient(1px 1px at 200px 500px, rgba(255,255,255,0.3), transparent)",
            "radial-gradient(1px 1px at 600px 550px, rgba(255,255,255,0.4), transparent)",
            "radial-gradient(1px 1px at 1000px 580px, rgba(255,255,255,0.3), transparent)",
          ].join(", "),
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top-left boot terminal hint (like the opening page's SYS:BOOT) */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "#00ff00",
            letterSpacing: "0.15em",
          }}
        >
          <div style={{ width: "8px", height: "8px", backgroundColor: "#ff4d4d", borderRadius: "50%" }} />
          <div style={{ width: "8px", height: "8px", backgroundColor: "#d4ff00", borderRadius: "50%" }} />
          <div style={{ width: "8px", height: "8px", backgroundColor: "#00ff00", borderRadius: "50%" }} />
          <span>SYS:BOOT</span>
        </div>

        {/* Top-right corner mark */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            display: "flex",
            gap: "6px",
          }}
        >
          <div style={{ width: "24px", height: "3px", backgroundColor: "#00e5ff" }} />
          <div style={{ width: "16px", height: "3px", backgroundColor: "#d4ff00" }} />
          <div style={{ width: "8px", height: "3px", backgroundColor: "#ff4d4d" }} />
        </div>

        {/* Center: astronaut image + UNDIMENSION title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Astronaut floating above the title */}
          {astronautSrc && (
            <img
              src={astronautSrc}
              alt="Astronaut"
              style={{
                width: "200px",
                height: "200px",
                objectFit: "contain",
                marginBottom: "10px",
                // No shadow/border/glow — plain floating image, like the opening page
              }}
            />
          )}

          {/* UNDIMENSION title with cyan text-shadow (like the opening page) */}
          <div
            style={{
              fontSize: "130px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.05em",
              lineHeight: 1,
              // text-shadow equivalent in OG: use multiple shadows
              // next/og supports textShadow as a string
              textShadow: "8px 8px 0px #00e5ff",
            }}
          >
            UNDIMENSION
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "26px",
              color: "#00e5ff",
              marginTop: "25px",
              letterSpacing: "0.15em",
            }}
          >
            Circle Beyond Space &amp; Time
          </div>
        </div>

        {/* Bottom: orbit ring decoration + tagline */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ width: "40px", height: "3px", backgroundColor: "#d4ff00" }} />
          <div
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.1em",
            }}
          >
            Seven orbits. One gravity. No limits.
          </div>
          <div style={{ width: "40px", height: "3px", backgroundColor: "#ff4d4d" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
