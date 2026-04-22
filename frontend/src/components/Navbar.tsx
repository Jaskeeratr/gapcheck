import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Jobs", to: "/" },
  { label: "Resume", to: "/profile" },
  { label: "Tracker", to: "/tracker" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
