import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Jobs", to: "/" },
  { label: "Resume", to: "/profile" },
  { label: "Tracker", to: "/tracker" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-700 p-1.5 text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
              <path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h7v4H4z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">GapCheck</p>
            <p className="text-xs font-medium text-slate-500">Know exactly where you stand</p>
          </div>
        </NavLink>

        <div className="flex items-center gap-2 text-sm font-semibold">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
