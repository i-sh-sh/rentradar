import { NavLink } from "react-router-dom";
import { Home, Heart, Map, BarChart2, Settings } from "lucide-react";
import clsx from "clsx";

const links = [
  { to: "/", icon: Home, label: "דירות" },
  { to: "/map", icon: Map, label: "מפה" },
  { to: "/saved", icon: Heart, label: "שמורים" },
  { to: "/admin", icon: Settings, label: "סריקה" },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b sticky top-0 z-20 flex items-center justify-between px-6 h-14">
      <div className="font-bold text-xl text-blue-700">🏠 דירה סרץ׳</div>
      <div className="flex gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500 hover:text-gray-800"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
