import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { loadDB } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = await loadDB();
  const image = db.images.find((i) => i.id === params.id);
  if (!image) return new NextResponse("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "data", "images", `${image.id}.svg`), "utf8");
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return new NextResponse("Image file missing", { status: 404 });
  }
}
