import { useContext } from "react";
import { AuthContext } from "@/App";
import Navbar from "./Navbar";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useJDAnalysisStore } from "@/stores";
import { useLocation } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, username, logout } = useContext(AuthContext);
  const { isRightPanelCollapsed, setIsRightPanelCollapsed } = useJDAnalysisStore();
  const location = useLocation();
  
  // 切换右侧栏折叠状态
  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  // 只在JDAnalysis页面显示AI助手按钮
  const showAiAssistant = location.pathname === "/jd-analysis";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 bg-white shadow w-full" style={{ minHeight: 48 }}>
        {/* 左侧：系统标题 */}
        <div className="text-lg font-bold flex-shrink-0">智能招聘系统</div>
        {/* 中间：横向导航栏 */}
        <div className="flex-1 flex justify-center">
          <Navbar horizontal small />
        </div>
        {/* 右侧：AI助手、用户名和退出 */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* AI助手按钮 - 只在JDAnalysis页面显示 */}
            {showAiAssistant && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleRightPanel}
                className="border-gray-300 hover:border-violet-400 hover:text-violet-600"
              >
                {isRightPanelCollapsed ? <PanelRightOpen className="h-4" /> : <PanelRightClose className="h-4 w-4" />}
                <span className="ml-2 text-sm">AI助手</span>
              </Button>
            )}
            <span className="text-gray-700 text-sm">{username}</span>
            <button
              className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 text-sm"
              onClick={logout}
            >
              退出登录
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
} 