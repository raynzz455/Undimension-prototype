import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured, dbRetry } from "@/lib/db";
import { PORTFOLIO_PROJECTS } from "@/lib/undimension/data";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ projects: PORTFOLIO_PROJECTS, count: PORTFOLIO_PROJECTS.length }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  }
  try {
    const rows = await dbRetry(() => db.portfolioProject.findMany({ orderBy: [{ year: "desc" }, { createdAt: "desc" }] }));
    const projects = rows.map((p) => ({
      id: p.id, title: p.title, description: p.description,
      tech: JSON.parse(p.techJson) as string[], category: p.category, status: p.status,
      year: p.year, author: "", memberId: p.memberId, link: p.link, repo: p.repo, color: p.color,
    }));
    const merged = [...projects, ...PORTFOLIO_PROJECTS];
    return NextResponse.json({ projects: merged, count: merged.length }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.warn("[GET /api/portfolio] DB unavailable, returning 503.", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "DB temporarily unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  const rl = rateLimit(getClientIP(req));
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const body = await req.json();
    const title = String(body.title || "").trim().slice(0, 80);
    const description = String(body.description || "").trim().slice(0, 500);
    const tech = Array.isArray(body.tech) ? body.tech.map(String).slice(0, 10) : [];
    const category = String(body.category || "OTHER").trim().slice(0, 20).toUpperCase();
    const status = String(body.status || "WIP").trim().slice(0, 20).toUpperCase();
    const year = String(body.year || String(new Date().getFullYear()));
    const memberId = String(body.memberId || "aldi").trim().slice(0, 50);
    const link = body.link ? String(body.link).slice(0, 500) : null;
    const repo = body.repo ? String(body.repo).slice(0, 500) : null;
    const color = String(body.color || "#ff4d4d").slice(0, 20);
    if (!title || !description) return NextResponse.json({ error: "Title dan description wajib diisi." }, { status: 400 });
    const project = await db.portfolioProject.create({ data: { title, description, techJson: JSON.stringify(tech), category, status, year, memberId, link, repo, color } });
    return NextResponse.json({ id: project.id, ...project, tech: JSON.parse(project.techJson) });
  } catch (e) { return NextResponse.json({ error: "Gagal membuat project." }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  const rl = rateLimit(getClientIP(req));
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    if (id.startsWith("p") && id.length <= 3) return NextResponse.json({ error: "Project statis tidak bisa dihapus" }, { status: 400 });
    await db.portfolioProject.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (e) { return NextResponse.json({ error: "Gagal menghapus project." }, { status: 500 }); }
}
