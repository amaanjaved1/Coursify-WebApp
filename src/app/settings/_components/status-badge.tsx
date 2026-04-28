import { Check, Info, X } from "lucide-react"
import type { AccessStatus, DistributionUploadStatus } from "@/types"

export function StatusBadge({ status }: { status: AccessStatus }) {
  if (status.is_exempt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Exempt · First Semester
      </span>
    );
  }
  if (status.has_access) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Contributor · {status.upload_count}/{status.required_uploads} uploads
      </span>
    );
  }
  if (status.pending_seasonal_upload && status.upload_count >= status.required_uploads) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        Action Needed · {status.due_term} data pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold px-3 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Locked · {status.upload_count}/{status.required_uploads} uploads
    </span>
  );
}

export function UploadStatusBadge({ status }: { status: DistributionUploadStatus }) {
  if (status === "processed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2.5 py-0.5">
        <Check className="w-3 h-3" />
        Processed
      </span>
    );
  }
  if (status === "already_uploaded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium px-2.5 py-0.5">
        <Info className="w-3 h-3" />
        Already uploaded
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium px-2.5 py-0.5">
        <X className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-2.5 py-0.5">
      Pending
    </span>
  );
}
