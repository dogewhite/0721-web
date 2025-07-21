import { useState, useEffect } from "react";
import { Folder, Home, ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OSSDirectorySelectorProps {
  onPathChange?: (path: string) => void;
}

interface OSSFile {
  name: string;
  size: number;
  lastModified: string;
  isDirectory: boolean;
  path: string;
}

export default function OSSDirectorySelector({ onPathChange }: OSSDirectorySelectorProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [directories, setDirectories] = useState<OSSFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [pathHistory, setPathHistory] = useState<string[]>([""]);
  const [selectedPath, setSelectedPath] = useState("");

  useEffect(() => {
    fetchDirectories(currentPath);
  }, [currentPath]);

  useEffect(() => {
    // 通知父组件路径变化
    onPathChange?.(selectedPath);
  }, [selectedPath, onPathChange]);

  const fetchDirectories = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/oss/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error("获取目录失败");
      const data = await response.json();
      // 只显示目录，不显示文件
      const dirs = (data.files || []).filter((file: OSSFile) => file.isDirectory);
      setDirectories(dirs);
    } catch (error) {
      console.error("获取目录错误:", error);
      toast.error("获取目录失败，请检查网络连接");
      setDirectories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectoryClick = (dir: OSSFile) => {
    const newPath = dir.path;
    setCurrentPath(newPath);
    setPathHistory([...pathHistory, newPath]);
  };

  const goBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1);
      const parentPath = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      setCurrentPath(parentPath);
    }
  };

  const goToRoot = () => {
    setCurrentPath("");
    setPathHistory([""]);
  };

  const selectCurrentPath = () => {
    setSelectedPath(currentPath);
    toast.success(`已选择目录: ${currentPath || '根目录'}`);
  };

  const formatPath = (path: string) => {
    return path ? `/${path}` : "/根目录";
  };

  return (
    <div className="space-y-4">
      {/* 当前路径和导航 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToRoot}
            className="p-1 hover:bg-gray-200 rounded"
            title="返回根目录"
          >
            <Home size={16} className="text-gray-600" />
          </button>
          {currentPath && (
            <button
              onClick={goBack}
              className="p-1 hover:bg-gray-200 rounded"
              title="返回上级目录"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </button>
          )}
          <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
            {formatPath(currentPath)}
          </span>
        </div>
        <button
          onClick={selectCurrentPath}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          选择此目录
        </button>
      </div>

      {/* 已选择路径显示 */}
      {selectedPath !== undefined && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <span className="font-medium">已选择:</span> {formatPath(selectedPath)}
          </p>
        </div>
      )}

      {/* 目录列表 */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-3 bg-gray-50 border-b">
          <h4 className="text-sm font-medium text-gray-700">
            选择上传目录 {loading && "(加载中...)"}
          </h4>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              加载目录中...
            </div>
          ) : directories.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              此目录下没有子目录
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {directories.map((dir) => (
                <div
                  key={dir.path}
                  onClick={() => handleDirectoryClick(dir)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">{dir.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 点击文件夹图标进入子目录</p>
        <p>• 点击"选择此目录"确认上传路径</p>
        <p>• 使用导航按钮可返回上级目录</p>
      </div>
    </div>
  );
}