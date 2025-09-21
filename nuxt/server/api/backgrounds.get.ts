import { promises as fs } from "node:fs";
import { join } from "node:path";
import { createError } from "h3";

export default defineEventHandler(async () => {
  const dir = join(process.cwd(), "public", "backgrounds");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => /\.(png|jpe?g|webp|avif)$/i.test(name))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/backgrounds/${name}`);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to list backgrounds",
      cause: error,
    });
  }
});
