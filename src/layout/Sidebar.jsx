import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, GraduationCap, Users, BookOpen, LogOut, School, Presentation, HeartHandshake, Award, UserPlus } from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import { cn } from "../lib/utils";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import { usersAPI } from "../services/api";

export default function Sidebar() {
  const { logout, user } = useSchool();
  const location = useLocation();
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allMenuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
    { name: "Classrooms", icon: <GraduationCap size={16} />, href: "/classrooms", roles: ["ADMIN", "TEACHER"] },
    { name: "Students", icon: <School size={16} />, href: "/students", roles: ["ADMIN"] },
    { name: "Teachers", icon: <Presentation size={16} />, href: "/teachers", roles: ["ADMIN"] },
    { name: "Parents", icon: <HeartHandshake size={16} />, href: "/parents", roles: ["ADMIN", "TEACHER"] },
    { name: "Courses", icon: <School size={16} />, href: "/courses", roles: ["ADMIN", "STUDENT", "PARENT"] },
    { name: "My Classroom", icon: <GraduationCap size={16} />, href: "/my-classroom", roles: ["TEACHER"] },
  ];

  // Filter menu items based on user role
  const menu = allMenuItems.filter(item => {
    if (!user || !user.role) return false;
    return item.roles.includes(user.role);
  });

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate passwords match
    if (adminFormData.password !== adminFormData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Validate password length
    if (adminFormData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await usersAPI.register({
        username: adminFormData.username,
        password: adminFormData.password,
        role: "ADMIN"
      });
      
      if (result) {
        // Success - close modal and reset form
        setIsCreateAdminModalOpen(false);
        setAdminFormData({ username: "", password: "", confirmPassword: "" });
        setError("");
        // Optionally show success message or refresh data
        alert("Admin account created successfully!");
      }
    } catch (err) {
      setError(err.message || "Failed to create admin account. Username might already exist.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Create Admin Account Button (only for ADMIN) */}
      {user && user.role === "ADMIN" && (
        <div className="p-3 border-t border-gray-200">
          <button 
            onClick={() => setIsCreateAdminModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <UserPlus size={16} />
            <span>Create Admin Account</span>
          </button>
        </div>
      )}

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

      {/* Create Admin Modal */}
      <Modal
        isOpen={isCreateAdminModalOpen}
        onClose={() => {
          setIsCreateAdminModalOpen(false);
          setAdminFormData({ username: "", password: "", confirmPassword: "" });
          setError("");
        }}
        title="Create Admin Account"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              placeholder="Enter username"
              value={adminFormData.username}
              onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              placeholder="Enter password"
              value={adminFormData.password}
              onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              placeholder="Confirm password"
              value={adminFormData.confirmPassword}
              onChange={(e) => setAdminFormData({ ...adminFormData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Creating..." : "Create Admin Account"}
          </Button>
        </form>
      </Modal>
    </aside>
  );
}