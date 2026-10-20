import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { IMAGE_ASPECTS, IMAGE_COST_USD, buildImageSvg, buildPalette } from "@/lib/images";
import { imagesUsed, planLimit, PLAN_CATALOG } from "@/lib/agency";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

async function generateImage(clientId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) redirect("/images?error=client");

  const limit = planLimit(db.planTier);
  if (imagesUsed(db.images) >= limit.images) redirect(`/images?client=${clientId}&error=limit`);

  const prompt = String(formData.get("prompt") ?? "").trim().slice(0, 400);
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const aspect = String(formData.get("aspect") ?? "square");
  if (prompt.length < 6) redirect(`/images?client=${clientId}&error=prompt`);

  const assetId = String(formData.get("assetId") ?? "");
  const asset = db.assets.find((a) => a.id === assetId && a.clientId === clientId);
  const id = uid("img");
  const palette = buildPalette(prompt + client.name, client.brandColor);
  const svg = buildImageSvg({ prompt, palette, aspect, brandName: client.name });
  const dir = path.join(process.cwd(), "data", "images");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}.svg`), svg, "utf8");

  const t = nowIso();
  db.images.push({
    id,
    workspaceId: client.workspaceId,
    clientId,
    prompt,
    aspect,
    status: "ready",
    url: `/api/images/${id}/file`,
    palette,
    costUsd: IMAGE_COST_USD,
    origin: "generated",
    title: title || prompt.slice(0, 80),
    createdAt: t
  });
  db.usage.push({
    id: uid("use"),
    workspaceId: client.workspaceId,
    runId: null,
    provider: "image/svg",
    unit: "image",
    quantity: 1,
    estimatedCost: IMAGE_COST_USD,
    createdAt: t,
    meta: { model: "local-svg-v1", estimated: true }
  });
  if (asset) {
    asset.imageId = id;
    asset.imageAlt = title || prompt.slice(0, 140);
    asset.updatedAt = t;
  }
  await audit(db, "image.generated", "image_asset", id);
  await saveDB(db);
  revalidatePath("/images");
  redirect(`/images?client=${clientId}&message=generated`);
}

export default async function ImagesPage({
  searchParams
}: {
  searchParams: { client?: string; error?: string; message?: string };
}) {
  const db = await loadDB();
  if (db.clients.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="◧" title="Add a client first." body="Images inherit the client palette and brand name." action={<a href="/clients" className="btn btn-accent">Go to clients</a>} />
      </div>
    );
  }
  const client = db.clients.find((c) => c.id === searchParams.client) ?? db.clients[0];
  const images = db.images.filter((i) => i.clientId === client.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const assets = db.assets.filter((a) => a.clientId === client.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limit = PLAN_CATALOG[db.planTier];
  const used = imagesUsed(db.images);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Image studio</p>
            <h1 className="h-display mt-1 text-3xl md:text-4xl">Branded visuals with a recorded cost.</h1>
            <p className="prose-muted mt-1 max-w-2xl text-sm">Deterministic SVG visuals in the client palette. Attach one to a draft; alt text is required before scheduling.</p>
          </div>
          <a href={`/studio?client=${client.id}`} className="btn btn-sm">Content studio →</a>
        </div>
        <form method="get" className="mt-4 flex flex-wrap gap-2">
          <select name="client" defaultValue={client.id} className="input sm:!w-72" aria-label="Client">
            {db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-outline" type="submit">View</button>
          <span className="self-center text-xs text-muted-foreground">Images this month {used}/{limit.images}</span>
        </form>
      </div>

      {searchParams.error && (
        <p className="alert alert-danger">
          {searchParams.error === "prompt" ? "Describe the visual before generating." : searchParams.error === "limit" ? `Your ${limit.label} plan allows ${limit.images} images/month.` : "Select a valid client."}
        </p>
      )}
      {searchParams.message === "generated" && <p className="alert alert-warning">Image generated and saved. Attach it to a draft or download it below.</p>}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="card xl:sticky xl:top-4 xl:self-start">
          <p className="eyebrow">Generate</p>
          <h2 className="h-display mt-1 text-xl">New visual</h2>
          <form action={generateImage.bind(null, client.id)} className="mt-3 space-y-3">
            <div><label className="label" htmlFor="im-title">Internal title</label><input id="im-title" name="title" className="input" maxLength={140} placeholder="Open house quote card" /></div>
            <div><label className="label" htmlFor="im-prompt">Visual prompt / headline</label><textarea id="im-prompt" name="prompt" className="input min-h-[90px]" required minLength={6} maxLength={400} placeholder="One clear line that earns the scroll." /></div>
            <div>
              <label className="label" htmlFor="im-aspect">Aspect</label>
              <select id="im-aspect" name="aspect" className="input" defaultValue="square">
                {Object.entries(IMAGE_ASPECTS).map(([key, val]) => <option key={key} value={key}>{val.label} · {val.w}×{val.h}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="im-asset">Attach to draft <span className="font-normal text-muted-foreground">(optional)</span></label>
              <select id="im-asset" name="assetId" className="input" defaultValue="">
                <option value="">Do not attach</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.title ?? "Untitled"} · {a.status.replace("_", " ")}</option>)}
              </select>
            </div>
            <button className="btn btn-accent w-full" type="submit">Generate image · ${IMAGE_COST_USD.toFixed(2)}</button>
            <p className="text-[11px] text-muted-foreground">Palette: {client.brandColor} + derived tones. Cost is logged as an estimated image event.</p>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="h-display text-2xl">Library</h2>
            <span className="text-xs text-muted-foreground">{images.length} images</span>
          </div>
          {images.length === 0 ? (
            <div className="card"><EmptyState icon="◧" title="No images yet." body="Generate a branded visual, then attach it to a draft so alt text travels with it." /></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <img src={`/api/images/${image.id}/file`} alt={image.title ?? image.prompt} className="aspect-[4/3] w-full object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-semibold leading-snug">{image.title ?? image.prompt}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{IMAGE_ASPECTS[image.aspect]?.label ?? image.aspect} · ${image.costUsd.toFixed(2)} · {new Date(image.createdAt).toLocaleDateString()}</p>
                    <a className="btn btn-outline btn-sm mt-2" href={`/api/images/${image.id}/file`} target="_blank" rel="noreferrer">Open SVG</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
