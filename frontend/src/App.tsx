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
        <div className="pointer-events-none absolute left-[-140px] top-[90px] h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[280px] h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <Navbar />
        <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
