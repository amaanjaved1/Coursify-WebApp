import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getCommentsForCourse } from "@/lib/db";
import type { RedditComment, RmpComment } from "@/lib/db";

const CAROUSEL_LIMIT = 5;

interface CourseCommentsProps {
  courseCode: string;
}

export function CourseComments({ courseCode }: CourseCommentsProps) {
  const [redditComments, setRedditComments] = useState<RedditComment[]>([]);
  const [rmpComments, setRmpComments] = useState<RmpComment[]>([]);
  const [redditTotal, setRedditTotal] = useState(0);
  const [rmpTotal, setRmpTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redditCommentIndex, setRedditCommentIndex] = useState(0);
  const [rmpCommentIndex, setRmpCommentIndex] = useState(0);

  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      try {
        const { redditComments: reddit, rmpComments: rmp, redditTotal: rTotal, rmpTotal: rmpT } =
          await getCommentsForCourse(courseCode, CAROUSEL_LIMIT);
        setRedditComments(reddit);
        setRmpComments(rmp);
        setRedditCommentIndex(0);
        setRmpCommentIndex(0);
        setRedditTotal(rTotal);
        setRmpTotal(rmpT);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoading(false);
      }
    }
    if (courseCode) fetchComments();
  }, [courseCode]);

  const nextRedditComment = () => setRedditCommentIndex((prev) => (prev + 1) % Math.max(redditComments.length, 1));
  const prevRedditComment = () => setRedditCommentIndex((prev) => (prev - 1 + redditComments.length) % Math.max(redditComments.length, 1));
  const nextRmpComment = () => setRmpCommentIndex((prev) => (prev + 1) % Math.max(rmpComments.length, 1));
  const prevRmpComment = () => setRmpCommentIndex((prev) => (prev - 1 + rmpComments.length) % Math.max(rmpComments.length, 1));

  const currentRedditComment = redditComments[redditCommentIndex];
  const currentRmpComment = rmpComments[rmpCommentIndex];

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const sentimentBadge = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes("positive")) return "bg-green-100/80 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-700/40";
    if (normalized.includes("negative")) return "bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200/60 dark:border-red-700/40";
    return "bg-gray-100/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/40";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full mt-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy dark:border-blue-400"></div>
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading comments...</span>
        </div>
      </div>
    );
  }

  const hasComments = redditComments.length > 0 || rmpComments.length > 0;

  if (!hasComments) {
    return (
      <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full mt-6">
        <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-6 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          Student Comments
        </h2>
        <div className="glass-card-deep rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No student comments found for this course yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full mt-6">
      <h2
        className="text-xl font-bold text-brand-navy dark:text-white mb-6 flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
        Wanna see what students are saying?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Reddit Card ── */}
        <div className="glass-card-deep rounded-xl overflow-hidden flex flex-col">
          {/* Header with integrated nav */}
          <div
            className="px-4 py-3 flex-shrink-0 reddit-comment-header"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="h-7 w-7 flex-shrink-0">
                <g>
                  <circle fill="#FF4500" cx="10" cy="10" r="10"/>
                  <path fill="#FFFFFF" d="M16.67,10A1.46,1.46,0,0,0,14.2,9a7.12,7.12,0,0,0-3.85-1.23L11,4.65,13.14,5.1a1,1,0,1,0,.13-0.61L10.82,4a0.31,0.31,0,0,0-.37.24L9.71,7.71a7.14,7.14,0,0,0-3.9,1.23,1.46,1.46,0,1,0-1.61,2.39,2.87,2.87,0,0,0,0,.44c0,2.24,2.61,4.06,5.83,4.06s5.83-1.82,5.83-4.06a2.87,2.87,0,0,0,0-.44A1.46,1.46,0,0,0,16.67,10Zm-10,1a1,1,0,1,1,1,1A1,1,0,0,1,6.67,11Zm5.81,2.75a3.84,3.84,0,0,1-2.47.77,3.84,3.84,0,0,1-2.47-.77,0.27,0.27,0,0,1,.38-0.38A3.27,3.27,0,0,0,10,14a3.28,3.28,0,0,0,2.09-.61A0.27,0.27,0,1,1,12.48,13.79Zm-0.18-1.71a1,1,0,1,1,1-1A1,1,0,0,1,12.29,12.08Z"/>
                </g>
              </svg>
              <h3 className="text-sm font-semibold text-brand-navy dark:text-white">Reddit Comments</h3>

              {/* Nav controls in header */}
              <div className="ml-auto flex items-center gap-1.5">
                {redditComments.length > 1 && (
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center glass-pill transition-colors"
                    onClick={prevRedditComment}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-[#FF4500]" />
                  </button>
                )}
                <span className="text-xs font-semibold px-2 min-w-[44px] text-center rounded-full glass-pill text-brand-navy dark:text-white">
                  {redditComments.length > 0 ? `${redditCommentIndex + 1}/${redditComments.length}` : "0"}
                  {redditTotal > redditComments.length && (
                    <>
                      {" "}
                      <span className="text-gray-400 dark:text-gray-500 ml-0.5">of {redditTotal}</span>
                    </>
                  )}
                </span>
                {redditComments.length > 1 && (
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center glass-pill transition-colors"
                    onClick={nextRedditComment}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-[#FF4500]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body — natural height, no fixed constraint */}
          <div className="flex-1">
            {currentRedditComment ? (
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full mr-2 overflow-hidden flex-shrink-0">
                    <img src="/queens_reddit_icon.png" alt="Queen's Reddit" className="h-full w-full object-cover" />
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">r/queensuniversity</div>
                  <span
                    className={`ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shrink-0 glass-pill ${sentimentBadge(currentRedditComment.sentiment_label)}`}
                  >
                    {currentRedditComment.sentiment_label}
                  </span>
                </div>

                {currentRedditComment.professor_name && currentRedditComment.professor_name !== "general_prof" && (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Professor:</span>
                    <span className="text-xs text-brand-navy dark:text-white font-medium">{currentRedditComment.professor_name}</span>
                  </div>
                )}

                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{currentRedditComment.text}</p>

                <div className="mt-auto flex items-center gap-2 text-xs">
                  <span className="glass-pill px-2.5 py-0.5 rounded-full flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#FF4500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    {currentRedditComment.upvotes} upvotes
                  </span>
                  {formatDate(currentRedditComment.created_at) && (
                    <span className="glass-pill px-2.5 py-0.5 rounded-full text-gray-500 dark:text-gray-400">{formatDate(currentRedditComment.created_at)}</span>
                  )}
                  {currentRedditComment.source_url && (
                    <a
                      href={currentRedditComment.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 hover:underline ml-auto text-[#FF4500]"
                    >
                      View on Reddit
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm min-h-[160px]">
                No Reddit comments for this course.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/60 dark:border-white/5 flex justify-center flex-shrink-0 bg-white/35 dark:bg-slate-900/35 backdrop-blur-[12px]">
            <a
              href="https://www.reddit.com/r/queensuniversity/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF4500] text-sm font-medium hover:underline flex items-center gap-1"
            >
              See more on Reddit
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── RateMyProfessors Card ── */}
        <div className="glass-card-deep rounded-xl overflow-hidden flex flex-col">
          {/* Header with integrated nav */}
          <div
            className="px-4 py-3 flex-shrink-0 rmp-comment-header"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex-shrink-0 bg-brand-navy rounded-full flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-brand-navy dark:text-white">RateMyProfessors Comments</h3>

              {/* Nav controls in header */}
              <div className="ml-auto flex items-center gap-1.5">
                {rmpComments.length > 1 && (
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center glass-pill transition-colors"
                    onClick={prevRmpComment}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-brand-navy dark:text-white" />
                  </button>
                )}
                <span className="text-xs font-semibold px-2 min-w-[44px] text-center rounded-full glass-pill text-brand-navy dark:text-white">
                  {rmpComments.length > 0 ? `${rmpCommentIndex + 1}/${rmpComments.length}` : "0"}
                  {rmpTotal > rmpComments.length && (
                    <>
                      {" "}
                      <span className="text-gray-400 dark:text-gray-500 ml-0.5">of {rmpTotal}</span>
                    </>
                  )}
                </span>
                {rmpComments.length > 1 && (
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center glass-pill transition-colors"
                    onClick={nextRmpComment}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-brand-navy dark:text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body — natural height, no fixed constraint */}
          <div className="flex-1">
            {currentRmpComment ? (
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Anonymous</div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-3.5 w-3.5 ${i < Math.floor(currentRmpComment.quality_rating) ? "text-yellow-400" : i < currentRmpComment.quality_rating ? "text-yellow-300" : "text-gray-200 dark:text-gray-600"}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shrink-0 glass-pill ${sentimentBadge(currentRmpComment.sentiment_label)}`}
                  >
                    {currentRmpComment.sentiment_label}
                  </span>
                </div>

                {currentRmpComment.professor_name && (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Professor:</span>
                    <a
                      href={currentRmpComment.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-navy dark:text-white hover:underline font-medium flex items-center"
                    >
                      {currentRmpComment.professor_name}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </a>
                  </div>
                )}

                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{currentRmpComment.text}</p>

                <div className="mt-auto flex flex-col gap-2">
                  {currentRmpComment.tags?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {currentRmpComment.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="text-xs glass-pill px-2 py-0.5 rounded-full text-brand-navy dark:text-white"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="glass-pill px-2.5 py-1 rounded-full text-brand-navy dark:text-white font-medium">
                      Quality: {currentRmpComment.quality_rating}/5
                    </span>
                    <span className="glass-pill px-2.5 py-1 rounded-full text-brand-red font-medium">
                      Difficulty: {currentRmpComment.difficulty_rating}/5
                    </span>
                    {formatDate(currentRmpComment.created_at) && (
                      <span className="glass-pill px-2.5 py-1 rounded-full text-gray-500 dark:text-gray-400">{formatDate(currentRmpComment.created_at)}</span>
                    )}
                    {currentRmpComment.source_url && (
                      <a
                        href={currentRmpComment.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 hover:underline text-brand-navy dark:text-white ml-auto"
                      >
                        View on RateMyProfessors
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm min-h-[160px]">
                No RateMyProfessors comments for this course.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/60 dark:border-white/5 flex justify-center flex-shrink-0 bg-white/35 dark:bg-slate-900/35 backdrop-blur-[12px]">
            <a
              href="https://www.ratemyprofessors.com/school/1466"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-navy dark:text-white text-sm font-medium hover:underline flex items-center gap-1"
            >
              See more on RateMyProfessors
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* See All Comments */}
      <div className="mt-8 mb-4 flex justify-center">
        <Link
          href={`/course-comments?courseCode=${encodeURIComponent(courseCode)}`}
          className="liquid-btn-blue text-white flex items-center gap-2 px-8 py-2.5 rounded-full"
        >
          <ExternalLink className="h-4 w-4" />
          See More Details
        </Link>
      </div>

      <div className="text-center text-xs text-gray-400 dark:text-gray-500 mb-2">
        Click the button to filter reviews by professors.
      </div>

    </div>
  );
}
