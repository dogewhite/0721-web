import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Folder, File, ArrowLeft, Home, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OSSFile {
  name: string;
  size: number;
  lastModified: string;
  isDirectory: boolean;
  path: string;
}

interface OSSFileBrowserProps {
  onSelectPath: (path: string) => void;
  onPreviewFile?: (file: OSSFile) => void;
  onFileSelect?: (file: OSSFile) => void;
  className?: string;
}

const OSSFileBrowser = ({ onSelectPath, onPreviewFile, onFileSelect, className }: OSSFileBrowserProps) => {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<OSSFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    fetchFiles(currentPath);
    // Automatically select the current directory for upload
    handleSelectPath(currentPath); 
  }, [currentPath]);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/oss/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error("获取文件列表失败");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("获取文件列表错误:", error);
      toast.error("获取文件列表失败，请检查后端服务是否开启。");
      setFiles([]); // Clear files on error
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectPath = (path: string) => {
    setSelectedPath(path);
    onSelectPath(path);
  };

  const handleFileClick = (file: OSSFile) => {
    if (file.isDirectory) {
      // 文件夹：选择路径
      handleSelectPath(file.path);
    } else {
      // 文件：触发预览和选择
      if (onPreviewFile) {
        onPreviewFile(file);
      }
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const goBack = () => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast.warning("请输入文件夹名称");
      return;
    }

    try {
      const response = await fetch('/api/oss/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          folderName: newFolderName.trim(),
        }),
      });

      if (!response.ok) throw new Error("创建失败");
      
      toast.success("文件夹创建成功");
      setNewFolderName("");
      setShowNewFolderDialog(false);
      fetchFiles(currentPath); // Refresh file list
    } catch (error) {
      console.error("创建文件夹错误:", error);
      toast.error("文件夹创建失败，请检查网络或后端服务。");
    }
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <button onClick={() => setCurrentPath("")} disabled={!currentPath} className="disabled:opacity-50 hover:text-violet-600"><Home size={14} /></button>
            {currentPath && <button onClick={goBack} className="hover:text-violet-600"><ArrowLeft size={14} /></button>}
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
              {currentPath ? `/${currentPath}` : "/ (根目录)"}
            </span>
          </div>
          <Button onClick={() => setShowNewFolderDialog(true)} variant="ghost" size="sm">
            <Plus className="w-3 h-3 mr-1" />
            <span className="text-xs">新建文件夹</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2 min-h-0 p-4 pt-0">
        {loading && <p>加载中...</p>}
        {!loading && files.length === 0 && <p className="text-gray-500">目录为空</p>}
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.path}
              onClick={() => handleFileClick(file)}
              onDoubleClick={() => file.isDirectory && setCurrentPath(file.path)}
              className={cn(
                "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                selectedPath === file.path && file.isDirectory && "bg-violet-100 dark:bg-violet-900/50"
              )}
            >
              <div className="flex items-center space-x-3 flex-1">
                {file.isDirectory ? <Folder className="w-5 h-5 text-blue-500" /> : <File className="w-5 h-5 text-gray-400" />}
                <span className="text-sm">{file.name}</span>
              </div>
              {selectedPath === file.path && file.isDirectory && <CheckCircle2 className="w-5 h-5 text-violet-600" />}
            </div>
          ))}
        </div>
      </CardContent>

      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg p-6 w-full max-w-sm"
          >
            <h3 className="text-lg font-semibold mb-4">新建文件夹</h3>
            <Input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="请输入文件夹名称"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName("");
                }}
              >
                取消
              </Button>
              <Button onClick={createFolder}>创建</Button>
            </div>
          </motion.div>
        </div>
      )}
    </Card>
  );
};

// Re-using Card components from shadcn
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
);
const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);
const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
);
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

export default OSSFileBrowser; 