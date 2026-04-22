import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import JobBoardPage from "./pages/JobBoardPage";
import ProfilePage from "./pages/ProfilePage";
import JobDetailPage from "./pages/JobDetailPage";
import TrackerPage from "./pages/TrackerPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen overflow-x-hidden">
        <div className="pointer-events-none absolute left-[-180px] top-[40px] h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="pointer-events-none absolute right-[-180px] top-[220px] h-[30rem] w-[30rem] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-200px] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-orange-100/40 blur-3xl" />
        <Navbar />
        <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Routes>
            <Route path="/" element={<JobBoardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/tracker" element={<TrackerPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
