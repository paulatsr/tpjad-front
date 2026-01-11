import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, GraduationCap, Users, BookOpen, LogOut, School, Presentation, HeartHandshake, Award } from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import { cn } from "../lib/utils";

export default function Sidebar() {
  const { logout, user } = useSchool();
  const location = useLocation();

  const allMenuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
    { name: "Classrooms", icon: <GraduationCap size={16} />, href: "/classrooms", roles: ["ADMIN", "TEACHER", "STUDENT"] },
    { name: "Students", icon: <School size={16} />, href: "/students", roles: ["ADMIN", "PARENT"] },
    { name: "Teachers", icon: <Presentation size={16} />, href: "/teachers", roles: ["ADMIN"] },
    { name: "Parents", icon: <HeartHandshake size={16} />, href: "/parents", roles: ["ADMIN", "TEACHER", "PARENT"] },
    { name: "Courses", icon: <School size={16} />, href: "/courses", roles: ["ADMIN", "STUDENT"] },
    { name: "Grades", icon: <Award size={16} />, href: "/grades", roles: ["ADMIN", "STUDENT"] },
    { name: "My Classroom", icon: <GraduationCap size={16} />, href: "/my-classroom", roles: ["TEACHER"] },
  ];

  // Filter menu items based on user role
  const menu = allMenuItems.filter(item => {
    if (!user || !user.role) return false;
    return item.roles.includes(user.role);
  });

  return (
    <aside className="w-56 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
          G
        </div>
        <span className="text-lg font-semibold text-gray-900">Gradio.</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menu.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative group",
                isActive 
                  ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-0.5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-r" />
              )}
              <span className={cn(
                "transition-transform duration-300",
                isActive ? "text-blue-600 scale-110" : "text-gray-500 group-hover:scale-110"
              )}>
                {item.icon}
              </span>
              <span className="relative">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}