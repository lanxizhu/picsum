import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import sharp from "sharp";

const app = new Hono();

const welcomeStrings = [
  "Hello Hono!",
  "To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

app.use("/favicon.ico", serveStatic({ path: "./picsum.svg" }));

app.get("/:width/:height?", async (c) => {
  const { width, height } = c.req.param();
  try {
    const imageBuffer = await sharp({
      create: {
        width: Number(width),
        height: Number(height || width),
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

    return c.body(new Uint8Array(imageBuffer), 200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    });
  } catch {
    return c.text("Image processing failed.", 500);
  }
});

export default app;
