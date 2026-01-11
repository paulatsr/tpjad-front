import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function Button({ children, onClick, variant = "primary", className, ...props }) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40",
    secondary: "bg-gradient-to-r from-white to-gray-50 text-gray-700 border border-gray-200 hover:border-blue-300 hover:from-blue-50 hover:to-blue-100 shadow-md hover:shadow-lg",
    ghost: "bg-transparent text-gray-600 hover:text-blue-600 hover:bg-blue-50/50",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40",
    outline: "bg-transparent text-blue-600 border-2 border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 shadow-sm hover:shadow-md"
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}