import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import opentype from "opentype.js";
import sharp from "sharp";

const font = await opentype.load("./fonts/Roboto-Regular.ttf");

const app = new Hono();

app.get("/", serveStatic({ path: "./public/index.html" }));

app.use("/favicon.ico", serveStatic({ path: "./public/picsum.svg" }));

app.get("/:width/:height?", async (c) => {
  const { width, height } = c.req.param();
  const { text, color } = c.req.query();

  const finalWidth = Number(width);
  const finalHeight = Number(height || width);
  const displayText = text?.trim() || `${finalWidth}*${finalHeight}`;
  const fontSize = Math.max(
    20,
    Math.floor(Math.min(finalWidth, finalHeight) / 5),
  );

  const path = font.getPath(displayText, 0, 0, fontSize);
  const bbox = path.getBoundingBox();
  const textWidth = bbox.x2 - bbox.x1;
  const textHeight = bbox.y2 - bbox.y1;
  const offsetX = (finalWidth - textWidth) / 2 - bbox.x1;
  const offsetY = (finalHeight - textHeight) / 2 - bbox.y1;
  const pathData = path.toPathData(1);
  const hasValidHexColor = /^#[0-9a-fA-F]{6}$/.test(color || "");
  const backgroundR = hasValidHexColor
    ? parseInt((color as string).slice(1, 3), 16)
    : Math.floor(Math.random() * 256);
  const backgroundG = hasValidHexColor
    ? parseInt((color as string).slice(3, 5), 16)
    : Math.floor(Math.random() * 256);
  const backgroundB = hasValidHexColor
    ? parseInt((color as string).slice(5, 7), 16)
    : Math.floor(Math.random() * 256);
  const textR = 255 - backgroundR;
  const textG = 255 - backgroundG;
  const textB = 255 - backgroundB;

  try {
    const imageBuffer = await sharp({
      create: {
        width: finalWidth,
        height: finalHeight,
        channels: 3,
        background: {
          r: backgroundR,
          g: backgroundG,
          b: backgroundB,
        },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${finalWidth} ${finalHeight}">
            <path d="${pathData}" fill="rgb(${textR}, ${textG}, ${textB})" transform="translate(${offsetX} ${offsetY})" />
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
