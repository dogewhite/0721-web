import { useState } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: "fa-solid fa-brain", label: "智能JD分析", path: "/jd-analysis" },
  { icon: "fa-solid fa-project-diagram", label: "招聘项目", path: "/project-management" },
  { icon: "fa-solid fa-upload", label: "上传简历", path: "/upload" },
  { icon: "fa-solid fa-file-lines", label: "草稿简历", path: "/resume/draft" },
  { icon: "fa-solid fa-database", label: "人才库", path: "/talent" },
  { icon: "fa-solid fa-cubes", label: "原件库", path: "/component-library" },
];

export default function Navbar({ horizontal = false, small = false }: { horizontal?: boolean, small?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (horizontal) {
    return (
      <div className={cn("flex items-center justify-center", small ? "space-x-3" : "space-x-6", small ? "py-1" : "py-2") }>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center transition-all",
                small ? "px-2" : "px-4",
                small ? "text-gray-600" : "text-gray-700 hover:text-blue-600",
                isActive ? "font-bold text-blue-600" : ""
              )
            }
          >
            <i className={item.icon + (small ? " text-base mb-0.5" : " text-lg mb-1")}></i>
            <span className={small ? "text-xs" : "text-sm"}>{item.label}</span>
          </NavLink>
        ))}
      </div>
    );
  }
  // 纵向侧边栏模式
  return (
    <aside className="fixed top-0 left-0 h-full w-20 bg-white shadow flex flex-col items-center py-6 z-20">
      <div className="flex-1 flex flex-col gap-6 mt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center text-gray-700 hover:text-blue-600 transition-all",
                isActive ? "font-bold text-blue-600" : ""
              )
            }
          >
            <i className={item.icon + " text-2xl mb-1"}></i>
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
      

    </aside>
  );
}