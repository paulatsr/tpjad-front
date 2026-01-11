import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function Card({ children, className, hover = false, ...props }) {
  const baseClasses = cn(
    "bg-white p-4 rounded-xl border border-blue-100/50",
    "shadow-md shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/20",
    "transition-all duration-300",
    "bg-gradient-to-br from-white to-blue-50/10",
    hover && "cursor-pointer",
    className
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        className={baseClasses}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
}