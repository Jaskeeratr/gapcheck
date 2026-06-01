import { lazy, Suspense } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { PageTransition } from "./components/motion";

const JobBoardPage = lazy(() => import("./pages/JobBoardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const TrackerPage = lazy(() => import("./pages/TrackerPage"));
const GapCheckCaseStudyPage = lazy(() => import("./pages/GapCheckCaseStudyPage"));
const AboutGapCheckPage = lazy(() => import("./pages/AboutGapCheckPage"));

function RouteFallback() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="gc-panel rounded-3xl p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500" />
        <div className="flex-1">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-64 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            <Route path="/" element={<JobBoardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/case-study/gapcheck" element={<GapCheckCaseStudyPage />} />
            <Route path="/about-gapcheck" element={<AboutGapCheckPage />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="gc-page relative min-h-screen overflow-x-hidden">
        <div className="gc-orb pointer-events-none absolute left-[-180px] top-[40px] h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="gc-orb pointer-events-none absolute right-[-180px] top-[220px] h-[30rem] w-[30rem] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="gc-orb pointer-events-none absolute bottom-[-200px] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-orange-100/40 blur-3xl" />
        <Navbar />
        <main className="relative mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
