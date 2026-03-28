import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import JobBoardPage from "./pages/JobBoardPage";
import ProfilePage from "./pages/ProfilePage";
import JobDetailPage from "./pages/JobDetailPage";
import TrackerPage from "./pages/TrackerPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 py-8">
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