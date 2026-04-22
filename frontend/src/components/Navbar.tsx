import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Jobs", to: "/" },
  { label: "Resume", to: "/profile" },
  { label: "Tracker", to: "/tracker" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-lg shadow-blue-100/30 backdrop-blur-xl sm:px-6">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 to-cyan-500 p-2 text-white shadow-md shadow-blue-200">
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
              <path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h7v4H4z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">GapCheck</p>
            <p className="text-xs font-medium text-slate-500">Internship Match Intelligence</p>
          </div>
        </NavLink>

        <div className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 md:block">
          Product Demo
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/85 p-1.5 shadow-sm">
          <div className="flex items-center gap-1 text-sm font-semibold">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
