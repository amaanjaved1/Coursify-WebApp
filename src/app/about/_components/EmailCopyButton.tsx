"use client"

import { Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface EmailCopyButtonProps {
  email: string
  name: string
  className?: string
}

export function EmailCopyButton({ email, name, className }: EmailCopyButtonProps) {
  const { toast } = useToast()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email).then(() => {
      toast({
        title: "Email copied!",
        description: `${name}'s email has been copied to your clipboard.`,
        duration: 3000,
        variant: "success",
      })
    })
  }

  return (
    <button
      onClick={copyToClipboard}
      className={className}
    >
      <Mail className="h-4 w-4" />
    </button>
  )
}
