import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-slate-900">
          GapCheck
        </Link>

        <div className="flex gap-6 text-sm font-medium text-slate-600">
          <Link to="/">Jobs</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/tracker">Tracker</Link>
        </div>
      </div>
    </nav>
  );
}