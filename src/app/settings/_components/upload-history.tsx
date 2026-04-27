import Link from "next/link"
import { UploadCloud, RefreshCw } from "lucide-react"
import type { DistributionUploadStatus } from "@/types"
import { UploadStatusBadge } from "./status-badge"

export type UploadRow = {
  id: string
  original_filename: string
  status: DistributionUploadStatus
  term: string | null
  processed_at: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
}

interface UploadHistoryProps {
  uploads: UploadRow[]
  uploadsError: string | null
  refreshing: boolean
  onRefresh: () => void
}

export function UploadHistory({ uploads, uploadsError, refreshing, onRefresh }: UploadHistoryProps) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Upload History
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-brand-navy dark:text-white/70 hover:text-brand-red transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/add-courses" className="flex items-center gap-1.5 text-xs text-brand-navy dark:text-white/70 hover:text-brand-red transition-colors">
            <UploadCloud className="w-3.5 h-3.5" />
            Upload
          </Link>
        </div>
      </div>

      {uploadsError ? (
        <div className="text-center py-6">
          <p className="text-sm text-red-600 dark:text-red-400">{uploadsError}</p>
        </div>
      ) : uploads.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-brand-navy/60 dark:text-white/50 mb-3">
            No uploads yet — upload your SOLUS distribution to unlock Queen&apos;s Answers.
          </p>
          <Link href="/add-courses" className="liquid-btn-red inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-medium text-white">
            <UploadCloud className="w-4 h-4" />
            Upload Distribution
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
          {uploads.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3 gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-brand-navy dark:text-white truncate">
                  {u.term ?? u.original_filename}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {u.original_filename} · {formatDate(u.processed_at)}
                </div>
              </div>
              <UploadStatusBadge status={u.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
