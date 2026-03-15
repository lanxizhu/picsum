import { serve } from "bun";
import sharp from "sharp";

const server = serve({
  port: 3000,

  routes: {
    "/": (req) => {
      return new Response("Hello, World!", {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    },
    "/:width/:height": async (req) => {
      const { width, height } = req.params;
      try {
        const imageBuffer = await sharp({
          create: {
            width: Number(width),
            height: Number(height),
            channels: 3,
            background: {
              r: Math.floor(Math.random() * 256),
              g: Math.floor(Math.random() * 256),
              b: Math.floor(Math.random() * 256),
            },
          },
        })
          .png()
          .toBuffer();

        return new Response(imageBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      } catch (error) {
        return new Response("Error generating image", { status: 500 });
      }
    },
  },

  // (optional) fallback for unmatched routes:
  // Required if Bun's version < 1.2.3
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Picsum server is started: http://localhost:${server.port}`);
