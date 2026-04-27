import Link from "next/link"
import { Pencil } from "lucide-react"
import type { UserProfile } from "@/types"

const SEMESTERS_OPTIONS = [
  { label: "None", sublabel: "1st sem", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8+", value: 8 },
]

function semestersLabel(n: number): string {
  if (n === 0) return "None (1st semester)";
  if (n >= 8) return "8+ semesters";
  return `${n} semester${n === 1 ? "" : "s"}`;
}

interface SemesterEditorProps {
  profile: UserProfile | null
  editing: boolean
  editSemesters: number | null
  saving: boolean
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  onEditSemestersChange: (n: number) => void
}

export function SemesterEditor({
  profile,
  editing,
  editSemesters,
  saving,
  onStartEdit,
  onSave,
  onCancel,
  onEditSemestersChange,
}: SemesterEditorProps) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Academic Profile
        </h2>
        {profile && !editing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="flex items-center gap-1.5 text-xs text-brand-navy dark:text-white/70 hover:text-brand-red transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {!profile ? (
        <div className="text-sm text-brand-navy/70 dark:text-white/70">
          Profile not set up.{" "}
          <Link href="/onboarding" className="text-brand-red hover:underline font-medium">
            Complete your profile →
          </Link>
        </div>
      ) : !editing ? (
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Semesters Completed</div>
          <div className="text-sm font-semibold text-brand-navy dark:text-white">
            {semestersLabel(profile.semesters_completed)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">Semesters Completed</div>
            <div className="grid grid-cols-3 gap-2">
              {SEMESTERS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onEditSemestersChange(opt.value)}
                  className={`rounded-full px-3 py-2.5 text-sm font-semibold border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/40 ${
                    editSemesters === opt.value
                      ? "bg-brand-navy text-white border-brand-navy shadow-md scale-[1.03]"
                      : "bg-brand-navy/5 dark:bg-white/[0.07] border-brand-navy/15 dark:border-white/10 text-brand-navy dark:text-white hover:bg-brand-navy/10 dark:hover:bg-white/[0.12] hover:border-brand-navy/25"
                  }`}
                >
                  <span>
                    {opt.label}
                    {opt.sublabel && (
                      <span className={`text-[10px] ml-1 ${editSemesters === opt.value ? "text-white/70" : "text-brand-navy/50 dark:text-white/40"}`}>
                        · {opt.sublabel}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onSave}
              disabled={editSemesters === null || saving}
              className="liquid-btn-red rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-5 py-2 text-sm font-semibold border border-brand-navy/15 dark:border-white/10 bg-brand-navy/5 dark:bg-white/[0.07] text-brand-navy dark:text-white hover:bg-brand-navy/10 dark:hover:bg-white/[0.12] transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
