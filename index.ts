import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import sharp from "sharp";

const app = new Hono();

app.get("/", serveStatic({ path: "./public/index.html" }));

app.use("/favicon.ico", serveStatic({ path: "./public/picsum.svg" }));

app.get("/:width/:height?", async (c) => {
  const { width, height } = c.req.param();
  const { text, color } = c.req.query();

  try {
    const imageBuffer = await sharp({
      create: {
        width: Number(width),
        height: Number(height || width),
        channels: 3,
        background: {
          r: color
            ? parseInt(color.slice(1, 3), 16)
            : Math.floor(Math.random() * 256),
          g: color
            ? parseInt(color.slice(3, 5), 16)
            : Math.floor(Math.random() * 256),
          b: color
            ? parseInt(color.slice(5, 7), 16)
            : Math.floor(Math.random() * 256),
        },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${width}" height="${height || width}">
            <text x="50%" y="50%" font-size="32" fill="white" font-family="Arial" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${text || `${width}*${height || width}`}</text>
          </svg>`,
          ),
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    return c.body(new Uint8Array(imageBuffer), 200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    });
  } catch {
    // console.log("Error processing image:", error);
    return c.text("Image processing failed.", 500);
  }
});

app.notFound((c) => {
  return c.redirect("/", 302);
});

export default app;
