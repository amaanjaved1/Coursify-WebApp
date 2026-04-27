"use client"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
  onSignUp: () => void
}

export function SignInModal({ isOpen, onClose, onLogin, onSignUp }: SignInModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-50">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-brand-navy/10 dark:bg-blue-400/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-brand-navy dark:text-white" />
          </div>

          <h2 className="text-2xl font-bold text-brand-navy dark:text-white mb-2">Sign in required</h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to upload course distributions. Your contributions help other students make informed
            decisions!
          </p>

          <div className="flex flex-col sm:flex-row w-full gap-3 mb-4">
            <Button onClick={onLogin} className="w-full bg-brand-navy hover:bg-brand-navy/90 dark:hover:bg-blue-500/90">
              Log in
            </Button>
            <Button onClick={onSignUp} className="w-full bg-brand-red hover:bg-brand-red/90">
              Sign up
            </Button>
          </div>

          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
