'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, MessageSquare, User, ChevronDown, X } from 'lucide-react';
import { getCommentsForCoursePaginated } from '@/lib/db';
import type { RedditComment, RmpComment, PaginatedCommentsResult } from '@/lib/db';
import { useMotionTier, type MotionTier } from '@/lib/motion-prefs';

type CommentItem = (RedditComment & { _type: 'reddit' }) | (RmpComment & { _type: 'rmp' });

function listMotionVariants(tier: MotionTier) {
  const lite = tier === 'lite';
  return {
    staggerContainer: lite
      ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { staggerChildren: 0 } } }
      : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } },
    cardVariant: lite
      ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
      : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } },
  };
}

const RedditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={className}>
    <circle fill="#FF4500" cx="10" cy="10" r="10" />
    <path fill="#fff" d="M16.67,10A1.46,1.46,0,0,0,14.2,9a7.12,7.12,0,0,0-3.85-1.23L11,4.65,13.14,5.1a1,1,0,1,0,.13-.61L10.82,4a.31.31,0,0,0-.37.24L9.71,7.71a7.14,7.14,0,0,0-3.9,1.23A1.46,1.46,0,1,0,4.2,11.33a2.87,2.87,0,0,0,0,.44c0,2.24,2.61,4.06,5.83,4.06s5.83-1.82,5.83-4.06a2.87,2.87,0,0,0,0-.44A1.46,1.46,0,0,0,16.67,10Zm-10,1a1,1,0,1,1,1,1A1,1,0,0,1,6.67,11Zm5.81,2.75a3.84,3.84,0,0,1-2.47.77,3.84,3.84,0,0,1-2.47-.77.27.27,0,0,1,.38-.38A3.27,3.27,0,0,0,10,14a3.28,3.28,0,0,0,2.09-.61.27.27,0,1,1,.38.38Zm-.18-1.71a1,1,0,1,1,1-1A1,1,0,0,1,12.29,12.08Z" />
  </svg>
);

export default function CourseCommentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const motionTier = useMotionTier();
  const liteMotion = motionTier === 'lite';
  const { staggerContainer, cardVariant } = listMotionVariants(motionTier);
  const courseCode = searchParams.get('courseCode') || '';
  const rawTab = searchParams.get('tab');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reddit' | 'rmp'>(rawTab === 'reddit' ? 'reddit' : 'rmp');
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 8;

  // Server-driven state
  const [paginatedComments, setPaginatedComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [redditTotal, setRedditTotal] = useState(0);
  const [rmpTotal, setRmpTotal] = useState(0);
  const [professorCounts, setProfessorCounts] = useState<Record<string, number>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const requestCounter = useRef(0);

  const fetchPage = useCallback(async (tab: 'reddit' | 'rmp', page: number, professor: string | null) => {
    requestCounter.current += 1;
    const currentRequestId = requestCounter.current;

    if (!courseCode) { setLoading(false); return; }
    
    setLoading(true);
    try {
      const result: PaginatedCommentsResult = await getCommentsForCoursePaginated({
        courseCode,
        source: tab,
        page,
        limit: commentsPerPage,
        professor: professor ?? undefined,
      });
      
      // Prevent stale response from overwriting newer state
      if (requestCounter.current !== currentRequestId) return;

      setPaginatedComments(result.comments);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setRedditTotal(result.redditTotal);
      setRmpTotal(result.rmpTotal);
      setProfessorCounts(result.professorCounts);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      if (requestCounter.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, [courseCode, commentsPerPage]);

  useEffect(() => {
    fetchPage(activeTab, currentPage, selectedProfessor);
  }, [activeTab, currentPage, selectedProfessor, fetchPage]);

  const startIndex = (currentPage - 1) * commentsPerPage;

  // Professor sidebar from server-provided counts
  const tabProfessors = Object.keys(professorCounts).sort();

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const sentimentBadge = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes('positive')) return 'bg-green-100/80 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-700/40';
    if (normalized.includes('negative')) return 'bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200/60 dark:border-red-700/40';
    return 'bg-gray-100/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/40';
  };

  const tabs = [
    { id: 'rmp' as const, label: 'RateMyProfessors', count: rmpTotal, accent: '#00305f' },
    { id: 'reddit' as const, label: 'Reddit', count: redditTotal, accent: '#FF4500' },
  ];

  const handleTabChange = (tab: 'reddit' | 'rmp') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedProfessor(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className="min-h-screen pb-20 pt-20 comments-page-bg"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .comments-page-bg {
          background-color: var(--page-bg);
          background-image: none;
        }
        :is(.dark) .comments-page-bg {
          background-color: #171717;
          background-image: none;
        }
        .glass-card-deep {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(28px) saturate(170%);
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255,255,255,0.82);
          box-shadow: 0 8px 32px rgba(0,48,95,0.10), 0 2px 8px rgba(0,48,95,0.06), inset 0 1px 0 rgba(255,255,255,0.95);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .glass-card-deep:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(0,48,95,0.14), 0 3px 10px rgba(0,48,95,0.08), inset 0 1px 0 rgba(255,255,255,0.98);
        }
        .glass-hero {
          background: rgba(0,48,95,0.82);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 24px 64px rgba(0,48,95,0.3), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .tab-pill {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.75);
          transition: all 0.2s ease;
        }
        .tab-pill:hover { background: rgba(255,255,255,0.75); }
        .tab-pill.active-reddit { background: rgba(255,69,0,0.9); border-color: rgba(255,69,0,0.3); color: white; }
        .tab-pill.active-rmp { background: rgba(0,48,95,0.9); border-color: rgba(0,48,95,0.3); color: white; }
        :is(.dark) .glass-card-deep {
          background: rgba(38,38,38,0.82);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        :is(.dark) .glass-card-deep:hover {
          box-shadow: 0 14px 40px rgba(0,0,0,0.24), 0 3px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        :is(.dark) .glass-hero {
          background: rgba(0,48,95,0.92);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        :is(.dark) .tab-pill {
          background: rgba(38,38,38,0.65);
          border: 1px solid rgba(255,255,255,0.1);
        }
        :is(.dark) .tab-pill:hover { background: rgba(50,50,50,0.80); }
        :is(.dark) .tab-pill.active-reddit { background: rgba(255,69,0,0.9); border-color: rgba(255,69,0,0.3); color: white; }
        :is(.dark) .tab-pill.active-rmp { background: rgba(59,130,246,0.9); border-color: rgba(59,130,246,0.3); }
      ` }} />

      <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-5xl">

        {/* ── Hero Header ── */}
        <motion.div
          className="glass-hero rounded-2xl overflow-hidden relative mb-6"
          initial={liteMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: liteMotion ? 0 : 0.5 }}
        >
          <div className="relative px-8 py-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm mb-6 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to course
            </button>

            <div className="flex items-end justify-between flex-wrap gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-white/40" />
                  <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Student Comments</span>
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  {courseCode || 'All Comments'}
                </h1>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-white/50 text-xs">Aggregated from</span>
                  <span className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 text-xs text-white/80 font-medium">
                    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0">
                      <circle fill="#FF4500" cx="10" cy="10" r="10" />
                      <path fill="#fff" d="M16.67,10A1.46,1.46,0,0,0,14.2,9a7.12,7.12,0,0,0-3.85-1.23L11,4.65,13.14,5.1a1,1,0,1,0,.13-.61L10.82,4a.31.31,0,0,0-.37.24L9.71,7.71a7.14,7.14,0,0,0-3.9,1.23A1.46,1.46,0,1,0,4.2,11.33a2.87,2.87,0,0,0,0,.44c0,2.24,2.61,4.06,5.83,4.06s5.83-1.82,5.83-4.06a2.87,2.87,0,0,0,0-.44A1.46,1.46,0,0,0,16.67,10Zm-10,1a1,1,0,1,1,1,1A1,1,0,0,1,6.67,11Zm5.81,2.75a3.84,3.84,0,0,1-2.47.77,3.84,3.84,0,0,1-2.47-.77.27.27,0,0,1,.38-.38A3.27,3.27,0,0,0,10,14a3.28,3.28,0,0,0,2.09-.61.27.27,0,1,1,.38.38Zm-.18-1.71a1,1,0,1,1,1-1A1,1,0,0,1,12.29,12.08Z" />
                    </svg>
                    Reddit
                  </span>
                  <span className="text-white/30 text-xs">&</span>
                  <span className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 text-xs text-white/80 font-medium">
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <svg viewBox="0 0 20 20" fill="white" className="h-2 w-2">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </span>
                    RateMyProfessors
                  </span>
                </div>
              </div>

              {/* Total comments pill */}
              <div className="pb-0.5">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold border border-white/30 bg-white/95 shadow-[0_8px_24px_rgba(255,255,255,0.25)]">
                  <MessageSquare className="h-3.5 w-3.5 text-brand-navy shrink-0" />
                  <span className="text-sm text-brand-navy tabular-nums">{redditTotal + rmpTotal}</span>
                  <span className="text-xs text-brand-navy/60 font-medium">total comments</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          className="flex flex-wrap gap-2 mb-8"
          initial={liteMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: liteMotion ? 0 : 0.4, delay: liteMotion ? 0 : 0.2 }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`tab-pill rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 min-w-0 shrink ${
                activeTab === tab.id ? `active-${tab.id}` : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.id === 'reddit' && (
                <svg viewBox="0 0 20 20" className="w-4 h-4">
                  <circle fill={activeTab === 'reddit' ? '#fff' : '#FF4500'} cx="10" cy="10" r="10" opacity={activeTab === 'reddit' ? 0.9 : 1} />
                  <path fill={activeTab === 'reddit' ? '#FF4500' : '#fff'} d="M16.67,10A1.46,1.46,0,0,0,14.2,9a7.12,7.12,0,0,0-3.85-1.23L11,4.65,13.14,5.1a1,1,0,1,0,.13-.61L10.82,4a.31.31,0,0,0-.37.24L9.71,7.71a7.14,7.14,0,0,0-3.9,1.23A1.46,1.46,0,1,0,4.2,11.33a2.87,2.87,0,0,0,0,.44c0,2.24,2.61,4.06,5.83,4.06s5.83-1.82,5.83-4.06a2.87,2.87,0,0,0,0,.44A1.46,1.46,0,0,0,16.67,10Zm-10,1a1,1,0,1,1,1,1A1,1,0,0,1,6.67,11Zm5.81,2.75a3.84,3.84,0,0,1-2.47.77,3.84,3.84,0,0,1-2.47-.77.27.27,0,0,1,.38-.38A3.27,3.27,0,0,0,10,14a3.28,3.28,0,0,0,2.09-.61.27.27,0,1,1,.38.38Zm-.18-1.71a1,1,0,1,1,1-1A1,1,0,0,1,12.29,12.08Z" />
                </svg>
              )}
              {tab.id === 'rmp' && (
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    activeTab === 'rmp'
                      ? 'bg-white/20'
                      : 'bg-brand-navy/10 dark:bg-white/15'
                  }`}
                >
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-3 w-3 ${activeTab === 'rmp' ? 'text-white' : 'text-brand-navy dark:text-sky-200'}`}
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {tab.id === 'rmp' ? (
                <>
                  <span className="inline lg:hidden" aria-hidden="true">RMP</span>
                  <span className="sr-only lg:not-sr-only lg:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-navy dark:border-blue-400" />
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading comments...</span>
          </div>
        )}

        {/* ── Content: sidebar + comments ── */}
        {!loading && (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">

            {/* Professor sidebar — only on RateMyProfessors tab */}
            {activeTab === 'rmp' && tabProfessors.length > 0 && (
              <motion.aside
                className="w-full lg:w-52 lg:flex-shrink-0 lg:sticky lg:top-24"
                initial={liteMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: liteMotion ? 0 : 0.35, delay: liteMotion ? 0 : 0.15 }}
              >
                <div className="glass-card-deep rounded-2xl border border-brand-navy/10 dark:border-white/10 shadow-[0_4px_14px_rgba(0,48,95,0.08)] dark:shadow-none overflow-hidden">

                  {/* Header — acts as toggle on mobile */}
                  <button
                    onClick={() => setSidebarOpen(prev => !prev)}
                    className="w-full flex items-center gap-2 px-4 py-3.5 lg:pointer-events-none"
                  >
                    <User className="h-3.5 w-3.5 text-brand-navy/60 dark:text-white/60 flex-shrink-0" />
                    <span className="text-xs font-semibold text-brand-navy dark:text-white uppercase tracking-wider flex-1 text-left">
                      Filter by Professor
                    </span>
                    {selectedProfessor && (
                      <span className="text-[10px] font-semibold bg-brand-navy dark:bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        1 active
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 lg:hidden ${sidebarOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Body — always visible on lg, collapsible on mobile */}
                  <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block border-t border-brand-navy/8 dark:border-white/8 px-2.5 pb-2.5 pt-2`}>
                    {/* Clear filter */}
                    {selectedProfessor && (
                      <button
                        onClick={() => { setSelectedProfessor(null); setCurrentPage(1); }}
                        className="mb-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-red hover:text-red-700 dark:hover:text-red-400 transition-colors py-1.5 rounded-lg border border-dashed border-brand-red/40 hover:border-brand-red/70 bg-brand-red/5 hover:bg-brand-red/10"
                      >
                        <X className="h-3 w-3" />
                        Clear filter
                      </button>
                    )}
                    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-0.5">
                      {tabProfessors.map(prof => {
                        const commentCount = professorCounts[prof] || 0;
                        const isActive = selectedProfessor === prof;
                        return (
                          <button
                            key={prof}
                            onClick={() => { setSelectedProfessor(isActive ? null : prof); setCurrentPage(1); }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-left ${
                              isActive
                                ? 'bg-brand-navy dark:bg-blue-600 text-white shadow-sm shadow-[#00305f]/20 dark:shadow-blue-900/30'
                                : 'bg-white/80 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.12] border border-brand-navy/15 dark:border-white/10'
                            }`}
                          >
                            <span className="truncate mr-2">{prof}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                              isActive ? 'bg-white/20 text-white' : 'bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}>
                              {commentCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}

            {/* Comments list */}
            <div className="flex-1 min-w-0">
        {paginatedComments.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${selectedProfessor ?? 'all'}-${currentPage}`}
              className="grid grid-cols-1 gap-4"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {paginatedComments.map((comment, index) => {
                const isReddit = comment._type === 'reddit';

                return (
                  <motion.div
                    key={index}
                    className="glass-card-deep rounded-2xl p-5"
                    variants={cardVariant}
                  >
                    {/* Card Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {isReddit ? (
                          <RedditIcon className="w-8 h-8 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 break-words">
                            {isReddit ? 'r/queensuniversity' : 'Anonymous'}
                          </div>
                          {!isReddit && (
                            <div className="flex mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className={`h-3.5 w-3.5 ${
                                    i < Math.floor((comment as RmpComment).quality_rating)
                                      ? 'text-yellow-400'
                                      : i < (comment as RmpComment).quality_rating
                                        ? 'text-yellow-300'
                                        : 'text-gray-200 dark:text-gray-600'
                                  }`}
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Source badge + sentiment */}
                      <div className="flex flex-wrap gap-2 justify-start sm:justify-end sm:flex-shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize glass-pill ${sentimentBadge(comment.sentiment_label)}`}>
                          {comment.sentiment_label}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium glass-pill ${
                          isReddit
                            ? 'bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/20'
                            : 'bg-brand-navy/10 dark:bg-blue-400/10 text-brand-navy dark:text-white border border-brand-navy/20 dark:border-blue-400/20'
                        }`}>
                          {isReddit ? 'Reddit' : 'RateMyProfessors'}
                        </span>
                      </div>
                    </div>

                    {/* Professor */}
                    {comment.professor_name && comment.professor_name !== 'general_prof' && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500">Professor:</span>
                        {isReddit ? (
                          <span className="text-xs text-brand-navy dark:text-white font-medium">{comment.professor_name}</span>
                        ) : (
                          <a
                            href={comment.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-navy dark:text-white hover:underline font-medium flex items-center gap-0.5"
                          >
                            {comment.professor_name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Comment text */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{comment.text}</p>

                    {/* RMP Tags (official site chips only) */}
                    {!isReddit && comment.tags && comment.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {comment.tags.map((tag, idx) => (
                          <span
                            key={`${tag}-${idx}`}
                            className="text-xs glass-pill px-2.5 py-0.5 rounded-full text-brand-navy dark:text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-white/60 dark:border-white/[0.06]">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {isReddit && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="glass-pill px-2.5 py-0.5 rounded-full flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#FF4500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                              </svg>
                              {(comment as RedditComment).upvotes} upvotes
                            </span>
                            {formatDate(comment.created_at) && (
                              <span className="glass-pill px-2.5 py-0.5 rounded-full text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</span>
                            )}
                          </div>
                        )}
                        {!isReddit && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="glass-pill text-xs px-2.5 py-0.5 rounded-full text-brand-navy dark:text-white font-medium">
                              Quality: {(comment as RmpComment).quality_rating}/5
                            </span>
                            <span className="glass-pill text-xs px-2.5 py-0.5 rounded-full text-brand-red font-medium">
                              Difficulty: {(comment as RmpComment).difficulty_rating}/5
                            </span>
                            {formatDate(comment.created_at) && (
                              <span className="glass-pill text-xs px-2.5 py-0.5 rounded-full text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {comment.source_url && (
                        <a
                          href={comment.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 hover:underline self-start sm:self-auto shrink-0 ${
                            isReddit ? 'text-[#FF4500]' : 'text-brand-navy dark:text-white'
                          }`}
                        >
                          {isReddit ? 'View on Reddit' : 'View on RateMyProfessors'}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-6 glass-card-deep rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1}–{Math.min(startIndex + commentsPerPage, total)} of {total} comments
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-brand-navy dark:text-white bg-white/50 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.12] border border-white/70 dark:border-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage >= totalPages}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-brand-navy dark:text-white bg-white/50 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.12] border border-white/70 dark:border-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {paginatedComments.length === 0 && !loading && (
          <motion.div
            className="glass-card-deep rounded-2xl p-12 text-center"
            initial={liteMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: liteMotion ? 0 : 0.35 }}
          >
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-base mb-2">
              {courseCode ? 'No comments found for this filter.' : 'No course code provided.'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {courseCode ? 'Try switching tabs.' : 'Navigate here from a course page.'}
            </p>
          </motion.div>
        )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
          Comments are aggregated from public sources and may not reflect current course structure.
        </p>
      </div>
    </div>
  );
}
