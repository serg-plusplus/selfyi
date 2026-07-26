import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { monotonicUlid } from "@selfie/common";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function readDevVars(): Record<string, string> {
  try {
    const raw = readFileSync(join(ROOT, ".dev.vars"), "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*(#.*)?$/);
      if (m) out[m[1]!] = m[2]!.trim();
    }
    return out;
  } catch {
    return {};
  }
}

const vars = { ...readDevVars(), ...process.env } as Record<string, string | undefined>;
const PEXELS_API_KEY = vars.PEXELS_API_KEY;
const STREAM_ACCOUNT_ID = vars.STREAM_ACCOUNT_ID;
const STREAM_API_TOKEN = vars.STREAM_API_TOKEN;

if (!PEXELS_API_KEY || !STREAM_ACCOUNT_ID || !STREAM_API_TOKEN) {
  console.error(
    "Missing config. Set PEXELS_API_KEY, STREAM_ACCOUNT_ID, STREAM_API_TOKEN in apps/backend/.dev.vars",
  );
  process.exit(1);
}

const VIDEOS_PER_USER = 10;
const MAX_DURATION_SEC = 30;

const PERSONAS = [
  { handle: "mia_travels",   video: "woman travel vlog selfie",   avatar: "woman portrait smiling",  instagram: "kimkardashian",  whatsapp: "mia_travels" },
  { handle: "alex_fit",      video: "man workout gym",            avatar: "man portrait gym",        instagram: "cristiano",      whatsapp: "alex_fit" },
  { handle: "sofi_cooks",    video: "woman cooking kitchen",      avatar: "woman portrait kitchen",  instagram: "chiaraferragni", whatsapp: "sofi_cooks" },
  { handle: "dan_skates",    video: "man skateboard street",      avatar: "young man portrait",      instagram: "leomessi",       whatsapp: "dan_skates" },
  { handle: "lena_art",      video: "woman painting art studio",  avatar: "woman artist portrait",   instagram: "zendaya",        whatsapp: "lena_art" },
  { handle: "tom_coffee",    video: "man cafe barista coffee",    avatar: "man portrait cafe",       instagram: "therock",        whatsapp: "tom_coffee" },
  { handle: "nika_dance",    video: "woman dancing",              avatar: "woman dancer portrait",   instagram: "beyonce",        whatsapp: "nika_dance" },
  { handle: "max_music",     video: "man playing guitar",         avatar: "man musician portrait",   instagram: "arianagrande",   whatsapp: "max_music" },
  { handle: "ivy_nature",    video: "woman hiking nature",        avatar: "woman outdoor portrait",  instagram: "selenagomez",    whatsapp: "ivy_nature" },
  { handle: "leo_city",      video: "man city walking selfie",    avatar: "man street portrait",     instagram: "neymarjr",       whatsapp: "leo_city" },
] as const;

interface PexelsVideoFile { link: string; width: number; height: number; quality: string }
interface PexelsVideo { id: number; duration: number; video_files: PexelsVideoFile[] }
interface PexelsPhoto { src: { large: string } }

async function pexels<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.pexels.com${path}`, {
    headers: { Authorization: PEXELS_API_KEY! },
  });
  if (!res.ok) throw new Error(`Pexels ${path} → ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function findVideos(query: string, count: number): Promise<string[]> {
  const data = await pexels<{ videos: PexelsVideo[] }>(
    `/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=${count * 3}`,
  );
  const links: string[] = [];
  for (const v of data.videos) {
    if (v.duration > MAX_DURATION_SEC || v.duration < 3) continue;
    const file = v.video_files
      .filter((f) => f.height > f.width && f.width <= 1080)
      .sort((a, b) => b.width - a.width)[0];
    if (file) links.push(file.link);
    if (links.length >= count) break;
  }
  return links;
}

async function findAvatar(query: string): Promise<string | null> {
  const data = await pexels<{ photos: PexelsPhoto[] }>(
    `/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=1`,
  );
  return data.photos[0]?.src.large ?? null;
}

const CF_API = "https://api.cloudflare.com/client/v4";

interface StreamVideo {
  uid: string;
  readyToStream: boolean;
  duration: number;
  thumbnail: string;
  status: { state: string };
}

async function streamCopy(url: string, meta: Record<string, string>): Promise<string> {
  const res = await fetch(`${CF_API}/accounts/${STREAM_ACCOUNT_ID}/stream/copy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STREAM_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, meta }),
  });
  const json = (await res.json()) as { success: boolean; result: { uid: string }; errors?: unknown };
  if (!res.ok || !json.success) throw new Error(`stream/copy failed: ${JSON.stringify(json.errors ?? json)}`);
  return json.result.uid;
}

async function streamGet(uid: string): Promise<StreamVideo> {
  const res = await fetch(`${CF_API}/accounts/${STREAM_ACCOUNT_ID}/stream/${uid}`, {
    headers: { Authorization: `Bearer ${STREAM_API_TOKEN}` },
  });
  const json = (await res.json()) as { success: boolean; result: StreamVideo };
  if (!res.ok || !json.success) throw new Error(`stream get ${uid} failed`);
  return json.result;
}

async function waitReady(uids: string[]): Promise<Map<string, StreamVideo>> {
  const ready = new Map<string, StreamVideo>();
  const pending = new Set(uids);
  for (let attempt = 0; attempt < 60 && pending.size > 0; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));
    for (const uid of [...pending]) {
      const v = await streamGet(uid);
      if (v.readyToStream) {
        ready.set(uid, v);
        pending.delete(uid);
      } else if (v.status.state === "error") {
        console.warn(`  ⚠ ${uid} failed to transcode — skipping`);
        pending.delete(uid);
      }
    }
    console.log(`  transcoding: ${ready.size}/${uids.length} ready`);
  }
  return ready;
}

const esc = (s: string | null) => (s === null ? "NULL" : `'${s.replace(/'/g, "''")}'`);

async function main() {
  const sql: string[] = [
    "-- Generated by scripts/seed.ts — 10 mock users + 100 videos.",
    "-- Apply: pnpm --filter @selfie/backend seed:apply:local | seed:apply:remote",
    "",
  ];

  const nowMs = Date.now();

  interface SeedVideo { userIdx: number; url: string }
  const plan: SeedVideo[] = [];

  console.log("1/4 Searching Pexels…");
  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i]!;
    const urls = await findVideos(p.video, VIDEOS_PER_USER);
    console.log(`  @${p.handle}: ${urls.length} clips`);
    for (const url of urls) plan.push({ userIdx: i, url });
  }

  console.log(`2/4 Copying ${plan.length} videos into Stream…`);
  const uidByPlanIdx = new Map<number, string>();
  for (let i = 0; i < plan.length; i++) {
    const uid = await streamCopy(plan[i]!.url, { seed: "1", persona: PERSONAS[plan[i]!.userIdx]!.handle });
    uidByPlanIdx.set(i, uid);
    process.stdout.write(`\r  copied ${i + 1}/${plan.length}`);
  }
  console.log();

  console.log("3/4 Waiting for transcoding…");
  const readyMap = await waitReady([...uidByPlanIdx.values()]);

  console.log("4/4 Writing seed/seed.sql…");
  const userIds: string[] = [];
  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i]!;
    const id = monotonicUlid(nowMs - 1000 * 60 * 60 * 24 * 30);
    userIds.push(id);
    const avatar = await findAvatar(p.avatar);
    sql.push(
      `INSERT OR IGNORE INTO users (id, world_nullifier, handle, avatar_url, instagram, whatsapp, is_mock, onboarded, created_at) VALUES (` +
        `${esc(id)}, ${esc(`mock:${p.handle}`)}, ${esc(p.handle)}, ${esc(avatar)}, ${esc(p.instagram)}, ${esc(p.whatsapp)}, 1, 1, ` +
        `${esc(new Date(nowMs - 1000 * 60 * 60 * 24 * 30).toISOString())});`,
    );
  }
  sql.push("");

  let written = 0;
  for (let k = 0; k < plan.length; k++) {
    const item = plan[k]!;
    const uid = uidByPlanIdx.get(k);
    const stream = uid ? readyMap.get(uid) : undefined;
    if (!uid || !stream) continue;

    const createdMs = nowMs - 1000 * 60 * 60 * (plan.length - k);
    const videoId = monotonicUlid(createdMs);
    sql.push(
      `INSERT OR IGNORE INTO videos (id, author_id, stream_uid, playback_id, thumbnail_url, duration_sec, status, created_at) VALUES (` +
        `${esc(videoId)}, ${esc(userIds[item.userIdx]!)}, ${esc(uid)}, ${esc(uid)}, ${esc(stream.thumbnail)}, ${stream.duration}, 'ready', ` +
        `${esc(new Date(createdMs).toISOString())});`,
    );
    written++;
  }

  mkdirSync(join(ROOT, "seed"), { recursive: true });
  writeFileSync(join(ROOT, "seed", "seed.sql"), sql.join("\n") + "\n");
  console.log(`Done: ${PERSONAS.length} users, ${written} videos → seed/seed.sql`);
  console.log("Apply with: pnpm --filter @selfie/backend seed:apply:local (or :remote)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
