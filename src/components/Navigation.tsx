"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, User, Sun, Moon, Settings, UploadCloud } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const { user, signOut } = useAuth()
  const [pendingSeasonal, setPendingSeasonal] = useState(false)
  const [dueTerm, setDueTerm] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  /** After pointer interaction, ignore scroll-up–based nav reveal (avoids layout/anchoring jumps from accordions, etc.). */
  const ignoreRevealUntilRef = useRef(0)
  const lastYRef = useRef(0)
  const scrollRafRef = useRef<number | null>(null)
  const scrolledRef = useRef(false)
  const hiddenRef = useRef(false)
  const isMenuOpenRef = useRef(false)

  scrolledRef.current = scrolled
  hiddenRef.current = hidden
  isMenuOpenRef.current = isMenuOpen

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const syncMobile = () => setIsMobileViewport(mq.matches)
    syncMobile()
    mq.addEventListener("change", syncMobile)
    return () => mq.removeEventListener("change", syncMobile)
  }, [])

  useEffect(() => {
    /** Cover accordion open + any delayed scroll/anchoring events after pointer up */
    const REVEAL_COOLDOWN_MS = 700
    const onPointerDownCapture = () => {
      ignoreRevealUntilRef.current = Date.now() + REVEAL_COOLDOWN_MS
    }
    document.addEventListener("pointerdown", onPointerDownCapture, true)
    return () => document.removeEventListener("pointerdown", onPointerDownCapture, true)
  }, [])

  useEffect(() => {
    lastYRef.current = window.scrollY
    const mqMobile = window.matchMedia("(max-width: 767px)")

    const flushScroll = () => {
      scrollRafRef.current = null
      const currentY = window.scrollY
      const lastY = lastYRef.current
      const delta = currentY - lastY
      const directionThreshold = mqMobile.matches ? 22 : 14

      const nextScrolled = currentY > 20
      let nextHidden = hiddenRef.current

      if (currentY < 80) {
        nextHidden = false
      } else if (delta > directionThreshold) {
        nextHidden = true
      } else if (delta < -directionThreshold && Date.now() >= ignoreRevealUntilRef.current) {
        nextHidden = false
      }

      if (nextScrolled !== scrolledRef.current) {
        scrolledRef.current = nextScrolled
        setScrolled(nextScrolled)
      }
      if (nextHidden !== hiddenRef.current) {
        hiddenRef.current = nextHidden
        setHidden(nextHidden)
      }
      if (delta > directionThreshold && nextHidden && isMenuOpenRef.current) {
        isMenuOpenRef.current = false
        setIsMenuOpen(false)
      }

      lastYRef.current = currentY
    }

    const onScroll = () => {
      if (scrollRafRef.current !== null) return
      scrollRafRef.current = window.requestAnimationFrame(flushScroll)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const checkSeasonal = async () => {
      try {
        const { data: session } = await getSupabaseClient().auth.getSession()
        const token = session?.session?.access_token
        if (!token) return
        const res = await fetch("/api/me/access-status", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const status = await res.json()
        if (!status.pending_seasonal_upload) return
        setPendingSeasonal(true)
        setDueTerm(status.due_term)
        // Toast once per browser session
        const sessionKey = `seasonal_toast_${status.due_term}`
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "1")
          toast({
            title: `${status.due_term} grades are available on SOLUS`,
            description: "Upload your grade distribution to keep Queen's Answers access and help your peers.",
          })
        }
      } catch {
        // non-critical, silently fail
      }
    }
    void checkSeasonal()
  }, [user])

  const handleSignOut = async () => {
    toast({
      title: "Signing out...",
      description: "You will be redirected to the home page",
      variant: "success",
    })
    await signOut()
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/schools/queens", label: "View Courses" },
    { href: "/add-courses", label: "Upload Distributions" },
    { href: "/queens-answers", label: "AI Assistant" },
    { href: "/about", label: "About" },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4 will-change-transform motion-safe:transition-[transform] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22_1_0.36_1)] motion-reduce:duration-200 motion-reduce:ease-out"
      style={{ transform: hidden ? "translateY(-110%)" : "translateY(0)" }}
    >
      {/* Pill navbar */}
      <div
        className="max-w-4xl mx-auto rounded-full px-5 py-2.5 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22_1_0.36_1)] motion-reduce:duration-200"
        style={{
          background: scrolled ? "var(--nav-bg-scrolled)" : "var(--nav-bg)",
          backdropFilter: isMobileViewport
            ? "none"
            : scrolled
              ? "blur(48px) saturate(220%)"
              : "blur(32px) saturate(200%)",
          WebkitBackdropFilter: isMobileViewport
            ? "none"
            : scrolled
              ? "blur(48px) saturate(220%)"
              : "blur(32px) saturate(200%)",
          border: "1px solid var(--nav-border)",
          boxShadow: scrolled
            ? `0 16px 48px var(--nav-shadow-scrolled), 0 4px 12px var(--nav-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
            : `0 8px 32px var(--nav-shadow), 0 2px 8px var(--nav-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-lg font-bold tracking-tight text-brand-navy dark:text-white">Cours</span>
            <span className="text-lg font-bold tracking-tight text-brand-red">ify</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden nav:flex items-center gap-0.5 text-sm font-medium text-brand-navy/70 dark:text-white/70">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    link.href === "/queens-answers"
                      ? "px-3.5 py-1.5 rounded-full text-brand-gold font-semibold"
                      : "px-3.5 py-1.5 rounded-full text-brand-navy/70 dark:text-white/70 hover:text-brand-navy dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-full text-sm font-medium bg-black/[0.06] dark:bg-white/[0.10] hover:bg-black/[0.10] dark:hover:bg-white/[0.16] text-gray-600 dark:text-white/75 border border-black/[0.06] dark:border-white/[0.10] transition-colors duration-[420ms] ease-in-out motion-reduce:transition-none"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 dark:text-white/75 hover:text-brand-navy dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 border border-white/60 dark:border-white/10"
                    style={{ background: "var(--nav-bg)" }}
                  >
                    <span className="relative">
                      <User className="w-4 h-4" strokeWidth={1.5} />
                      {pendingSeasonal && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-red rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </span>
                    <span className="hidden nav:block max-w-[80px] truncate text-xs">
                      {user.email?.split("@")[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-2xl border-0 shadow-xl mt-2 glass-card"
                >
                  <div className="p-2 text-xs font-medium text-gray-500 dark:text-white/50">{user.email}</div>
                  <DropdownMenuSeparator className="bg-black/5 dark:bg-white/5" />
                  {pendingSeasonal && dueTerm && (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push("/add-courses")}
                        className="cursor-pointer text-sm text-brand-red rounded-xl mx-1 font-medium"
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload {dueTerm} data
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-black/5 dark:bg-white/5" />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer text-sm text-gray-600 dark:text-white/80 hover:text-brand-navy dark:hover:text-white rounded-xl mx-1">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-black/5 dark:bg-white/5" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-sm text-gray-600 dark:text-white/80 hover:text-brand-red rounded-xl mx-1">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => router.push("/sign-in")}
                className="liquid-btn-red text-white text-sm font-medium px-4 py-1.5 rounded-full"
              >
                Sign In
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className="nav:hidden p-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-gray-500 dark:text-white/60 hover:text-brand-navy dark:hover:text-white transition-all duration-200"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span className="relative block w-5 h-5">
                <Menu
                  size={20}
                  className={`absolute inset-0 transition-all duration-200 ${isMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"}`}
                />
                <X
                  size={20}
                  className={`absolute inset-0 transition-all duration-200 ${isMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown — always in DOM, animated via grid-template-rows */}
      <div
        className="nav:hidden max-w-4xl mx-auto mt-2"
        style={{
          display: "grid",
          gridTemplateRows: isMenuOpen ? "1fr" : "0fr",
          opacity: isMenuOpen ? 1 : 0,
          transition: "grid-template-rows 0.28s ease, opacity 0.22s ease",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div className="rounded-3xl px-4 py-4 glass-card">
            <nav className="flex flex-col gap-0.5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 dark:text-white/75 hover:text-brand-navy dark:hover:text-white px-4 py-2.5 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-200"
                  onClick={toggleMenu}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium text-gray-600 dark:text-white/75">Theme</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-center p-2 rounded-full text-sm font-medium bg-black/[0.06] dark:bg-white/[0.10] hover:bg-black/[0.10] dark:hover:bg-white/[0.16] text-gray-600 dark:text-white/75 border border-black/[0.06] dark:border-white/[0.10] transition-colors duration-[420ms] ease-in-out motion-reduce:transition-none"
                  aria-label="Toggle theme"
                >
                  {mounted && theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>

              {user ? (
                <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/5">
                  <div className="text-xs font-medium text-gray-400 dark:text-white/45 mb-1 px-4">{user.email}</div>
                  <button
                    type="button"
                    className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-white/80 hover:text-brand-navy dark:hover:text-white rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-200"
                    onClick={() => { router.push("/settings"); setIsMenuOpen(false); }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-white/80 hover:text-brand-red rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-200"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    className="w-full liquid-btn-red text-white text-sm font-medium px-4 py-2.5 rounded-2xl"
                    onClick={() => {
                      router.push("/sign-in")
                      setIsMenuOpen(false)
                    }}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navigation
