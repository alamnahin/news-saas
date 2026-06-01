"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  RefreshCw,
  Play,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  Newspaper,
  Cpu,
  Globe,
  Trophy,
  Heart,
  AlertTriangle,
  Eye,
} from "lucide-react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  category: string;
  articleTitle: string;
  sourceDomain: string;
  headlineLine1: string;
  highlightedWord: string;
  headlineLine2: string;
  subcategory: string;
  summary: string;
  hashtags: string;
  cardImageUrl?: string;
  fbPostId?: string;
  igPostId?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  errorMessage?: string;
}

interface Stats {
  today: {
    total: number;
    published: number;
    failed: number;
    pending: number;
    byCategory: Record<string, { count: number; published: number; target: number }>;
  };
}

interface WorkflowRun {
  id: number;
  triggeredBy: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  processed: number;
  published: number;
  failed: number;
}

interface DashboardData {
  posts: Post[];
  stats: Stats;
  recentRuns: WorkflowRun[];
  pagination: { total: number; pages: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  STEM: {
    label: "বিজ্ঞান ও প্রযুক্তি",
    shortLabel: "STEM",
    color: "#00C9A7",
    bg: "rgba(0, 201, 167, 0.1)",
    border: "rgba(0, 201, 167, 0.25)",
    icon: Cpu,
  },
  GEOPOLITICAL: {
    label: "ভূরাজনীতি",
    shortLabel: "GEO",
    color: "#FF6B6B",
    bg: "rgba(255, 107, 107, 0.1)",
    border: "rgba(255, 107, 107, 0.25)",
    icon: Globe,
  },
  SPORTS: {
    label: "খেলাধুলা",
    shortLabel: "SPORTS",
    color: "#F9C74F",
    bg: "rgba(249, 199, 79, 0.1)",
    border: "rgba(249, 199, 79, 0.25)",
    icon: Trophy,
  },
  HUMANS_OF_BD: {
    label: "মানুষের গল্প",
    shortLabel: "HUMANS",
    color: "#A78BFA",
    bg: "rgba(167, 139, 250, 0.1)",
    border: "rgba(167, 139, 250, 0.25)",
    icon: Heart,
  },
} as const;

const CATEGORY_TARGETS: Record<string, number> = {
  STEM: 15,
  GEOPOLITICAL: 5,
  SPORTS: 7,
  HUMANS_OF_BD: 3,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PUBLISHED: { label: "প্রকাশিত", color: "#00C9A7", icon: <CheckCircle2 size={11} /> },
    PROCESSED: { label: "প্রক্রিয়াজাত", color: "#60A5FA", icon: <Clock size={11} /> },
    PENDING: { label: "অপেক্ষমান", color: "#F9C74F", icon: <Clock size={11} /> },
    FAILED: { label: "ব্যর্থ", color: "#FF6B6B", icon: <XCircle size={11} /> },
    RUNNING: { label: "চলছে", color: "#A78BFA", icon: <Loader2 size={11} className="animate-spin" /> },
  };
  const cfg = map[status] || map.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  if (!cfg) return <span className="text-xs text-white/40">{category}</span>;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold font-display"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.shortLabel}
    </span>
  );
}

function QuotaBar({
  category,
  count,
  target,
}: {
  category: string;
  count: number;
  target: number;
}) {
  const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  if (!cfg) return null;
  const Icon = cfg.icon;
  const pct = Math.min((count / target) * 100, 100);
  const remaining = Math.max(target - count, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: cfg.color }} />
          <span className="text-sm font-medium text-white/80">{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">{remaining} বাকি</span>
          <span className="text-sm font-display font-bold" style={{ color: cfg.color }}>
            {count}/{target}
          </span>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`
              : `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`,
            boxShadow: pct > 0 ? `0 0 8px ${cfg.color}60` : "none",
          }}
        />
      </div>
    </div>
  );
}

function PostRow({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const hashtags = (() => {
    try { return JSON.parse(post.hashtags) as string[]; } catch { return []; }
  })();

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {post.cardImageUrl ? (
              <div className="w-10 h-12 rounded overflow-hidden flex-shrink-0 bg-white/5">
                <img
                  src={post.cardImageUrl}
                  alt="card"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-12 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                <Newspaper size={14} className="text-white/20" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/90 truncate max-w-[260px]">
                {post.articleTitle}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{post.sourceDomain}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3"><CategoryBadge category={post.category} /></td>
        <td className="px-4 py-3">
          <div className="text-sm text-white/70">
            <span className="font-bangla">{post.headlineLine1} </span>
            <span className="font-bold" style={{ color: CATEGORY_CONFIG[post.category as keyof typeof CATEGORY_CONFIG]?.color }}>
              {post.highlightedWord}
            </span>
            <span className="font-bangla"> {post.headlineLine2}</span>
          </div>
        </td>
        <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {post.fbPostId && (
              <span className="w-5 h-5 rounded flex items-center justify-center bg-[#1877F2]/20 text-[#1877F2] text-xs font-bold">f</span>
            )}
            {post.igPostId && (
              <span className="w-5 h-5 rounded flex items-center justify-center bg-[#E1306C]/20 text-[#E1306C] text-xs font-bold">ig</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-white/40">
          {new Date(post.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
        </td>
        <td className="px-4 py-3">
          <ChevronRight
            size={14}
            className={`text-white/30 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/5 bg-white/[0.015]">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">সারসংক্ষেপ</p>
                  <p className="text-sm text-white/80 font-bangla leading-relaxed">{post.summary}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">হ্যাশট্যাগ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.slice(0, 8).map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/60 font-bangla">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {post.errorMessage && (
                  <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <AlertTriangle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-400">{post.errorMessage}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {post.cardImageUrl && (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">কার্ড ইমেজ</p>
                    <a href={post.cardImageUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={post.cardImageUrl}
                        alt="card preview"
                        className="w-24 h-30 rounded object-cover hover:opacity-80 transition-opacity border border-white/10"
                        style={{ aspectRatio: "4/5" }}
                      />
                    </a>
                  </div>
                )}
                <div className="space-y-2">
                  {post.fbPostId && (
                    <a
                      href={`https://www.facebook.com/${post.fbPostId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#1877F2] hover:underline"
                    >
                      <ExternalLink size={11} /> Facebook পোস্ট
                    </a>
                  )}
                  {post.igPostId && (
                    <a
                      href={`https://www.instagram.com/p/${post.igPostId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#E1306C] hover:underline"
                    >
                      <ExternalLink size={11} /> Instagram পোস্ট
                    </a>
                  )}
                  <p className="text-xs text-white/30 font-bangla">উপশ্রেণি: {post.subcategory}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [filter, setFilter] = useState({ status: "", category: "" });
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        ...(filter.status && { status: filter.status }),
        ...(filter.category && { category: filter.category }),
      });
      const res = await fetch(`/api/posts?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/manual-trigger", { method: "POST" });
      const json = await res.json();
      setTriggerResult({
        success: json.success,
        message: json.success
          ? `✓ সফল: ${json.result?.published || 0}টি প্রকাশিত`
          : `✗ ব্যর্থ: ${json.error}`,
      });
      if (json.success) fetchData();
    } catch (err) {
      setTriggerResult({ success: false, message: "নেটওয়ার্ক ত্রুটি" });
    } finally {
      setTriggering(false);
    }
  };

  const today = data?.stats.today;
  const totalTarget = Object.values(CATEGORY_TARGETS).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#080b12] text-white">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow orbs */}
      <div className="fixed top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,201,167,0.06) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-start justify-between mb-10 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0,201,167,0.15)", border: "1px solid rgba(0,201,167,0.3)" }}>
                <Newspaper size={16} style={{ color: "#00C9A7" }} />
              </div>
              <span className="text-xs font-display font-semibold tracking-[0.2em] text-white/40 uppercase">
                The Contemporary
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white">
              নিউজ অটোমেশন
            </h1>
            <p className="text-sm text-white/40 mt-1 font-body">
              বাংলা নিউজ কার্ড পাবলিশিং ড্যাশবোর্ড
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              রিফ্রেশ
            </button>
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: triggering ? "rgba(0,201,167,0.1)" : "rgba(0,201,167,0.15)",
                border: "1px solid rgba(0,201,167,0.4)",
                color: "#00C9A7",
                boxShadow: triggering ? "none" : "0 0 20px rgba(0,201,167,0.15)",
              }}
            >
              {triggering ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              {triggering ? "চলছে..." : "ওয়ার্কফ্লো চালান"}
            </button>
          </div>
        </header>

        {triggerResult && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm animate-fade-in"
            style={{
              background: triggerResult.success ? "rgba(0,201,167,0.08)" : "rgba(255,107,107,0.08)",
              border: `1px solid ${triggerResult.success ? "rgba(0,201,167,0.25)" : "rgba(255,107,107,0.25)"}`,
              color: triggerResult.success ? "#00C9A7" : "#FF6B6B",
            }}
          >
            {triggerResult.message}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "মোট প্রক্রিয়াজাত",
              value: today?.total ?? 0,
              icon: Activity,
              color: "#60A5FA",
            },
            {
              label: "প্রকাশিত",
              value: today?.published ?? 0,
              icon: CheckCircle2,
              color: "#00C9A7",
            },
            {
              label: "ব্যর্থ",
              value: today?.failed ?? 0,
              icon: XCircle,
              color: "#FF6B6B",
            },
            {
              label: "মোট লক্ষ্যমাত্রা",
              value: totalTarget,
              icon: TrendingUp,
              color: "#F9C74F",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="rounded-xl p-5 animate-fade-in"
                style={{
                  animationDelay: `${i * 60}ms`,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/40 font-body">{stat.label}</span>
                  <Icon size={14} style={{ color: stat.color }} />
                </div>
                <p className="text-3xl font-display font-bold" style={{ color: stat.color }}>
                  {loading ? (
                    <span className="skeleton inline-block w-12 h-8 rounded" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Quota Panel */}
          <div
            className="col-span-1 rounded-xl p-5 animate-fade-in"
            style={{
              animationDelay: "120ms",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <h3 className="text-sm font-display font-semibold text-white/70 mb-5 flex items-center gap-2">
              <Activity size={14} className="text-white/40" />
              দৈনিক কোটা অগ্রগতি
            </h3>
            <div className="space-y-5">
              {Object.entries(CATEGORY_TARGETS).map(([cat, target]) => {
                const catData = today?.byCategory[cat];
                const count = catData?.published || 0;
                return (
                  <QuotaBar key={cat} category={cat} count={count} target={target} />
                );
              })}
            </div>
          </div>

          {/* Recent Workflow Runs */}
          <div
            className="col-span-2 rounded-xl p-5 animate-fade-in"
            style={{
              animationDelay: "160ms",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <h3 className="text-sm font-display font-semibold text-white/70 mb-5 flex items-center gap-2">
              <Clock size={14} className="text-white/40" />
              সাম্প্রতিক ওয়ার্কফ্লো রান
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-lg" />
                ))}
              </div>
            ) : data?.recentRuns?.length ? (
              <div className="space-y-2">
                {data.recentRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={run.status} />
                      <div>
                        <p className="text-xs text-white/60">
                          {run.triggeredBy === "manual" ? "ম্যানুয়াল" : "স্বয়ংক্রিয়"} —{" "}
                          {new Date(run.startedAt).toLocaleString("bn-BD", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {run.finishedAt && (
                          <p className="text-xs text-white/30">
                            সময় লেগেছে:{" "}
                            {Math.round(
                              (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
                            )}
                            s
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-white/40">
                        <span className="font-display font-bold text-white/70">{run.processed}</span> প্রক্রিয়াজাত
                      </span>
                      <span className="text-[#00C9A7]/70">
                        <span className="font-display font-bold text-[#00C9A7]">{run.published}</span> প্রকাশিত
                      </span>
                      {run.failed > 0 && (
                        <span className="text-[#FF6B6B]/70">
                          <span className="font-display font-bold text-[#FF6B6B]">{run.failed}</span> ব্যর্থ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <Clock size={28} className="mb-2" />
                <p className="text-sm">কোনো রান নেই</p>
              </div>
            )}
          </div>
        </div>

        {/* Posts Table */}
        <div
          className="rounded-xl overflow-hidden animate-fade-in"
          style={{
            animationDelay: "200ms",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-display font-semibold text-white/70 flex items-center gap-2">
              <Newspaper size={14} className="text-white/40" />
              পোস্ট সমূহ
              {data && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                  {data.pagination.total}
                </span>
              )}
            </h3>

            <div className="flex items-center gap-2">
              {/* Status filter */}
              <select
                value={filter.status}
                onChange={(e) => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 outline-none"
              >
                <option value="">সব স্ট্যাটাস</option>
                <option value="PUBLISHED">প্রকাশিত</option>
                <option value="PROCESSED">প্রক্রিয়াজাত</option>
                <option value="FAILED">ব্যর্থ</option>
                <option value="PENDING">অপেক্ষমান</option>
              </select>

              {/* Category filter */}
              <select
                value={filter.category}
                onChange={(e) => { setFilter(f => ({ ...f, category: e.target.value })); setPage(1); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 outline-none"
              >
                <option value="">সব বিভাগ</option>
                <option value="STEM">STEM</option>
                <option value="GEOPOLITICAL">ভূরাজনীতি</option>
                <option value="SPORTS">খেলাধুলা</option>
                <option value="HUMANS_OF_BD">মানুষের গল্প</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["আর্টিকেল", "বিভাগ", "হেডলাইন", "স্ট্যাটাস", "প্ল্যাটফর্ম", "সময়", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-display font-semibold text-white/30 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="skeleton h-10 rounded" />
                      </td>
                    </tr>
                  ))
                ) : data?.posts?.length ? (
                  data.posts.map((post) => <PostRow key={post.id} post={post} />)
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Newspaper size={32} className="text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-white/30">কোনো পোস্ট পাওয়া যায়নি</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <span className="text-xs text-white/30">
                পৃষ্ঠা {page} / {data.pagination.pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded text-xs bg-white/5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  পূর্ববর্তী
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                  disabled={page === data.pagination.pages}
                  className="px-3 py-1.5 rounded text-xs bg-white/5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-white/20 font-body">
          The Contemporary News Automation • © 2026 • UTC+6 ঢাকা সময়
        </footer>
      </div>
    </div>
  );
}
