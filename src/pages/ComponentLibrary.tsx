import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, 
  File, 
  ArrowLeft, 
  ArrowRight,
  Home, 
  Upload,
  Download,
  Edit,
  Trash2,
  Plus,
  Search,
  MoreVertical,
  Check,
  X,
  RefreshCw,
  Grid,
  List,
  Clock,
  FileText,
  Image,
  Archive
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LibraryFile {
  name: string;
  size: number;
  lastModified: string;
  isDirectory: boolean;
  path: string;
  type?: string;
  selected?: boolean;
}

interface PathHistory {
  path: string;
  timestamp: number;
}

export default function ComponentLibrary() {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [pathHistory, setPathHistory] = useState<PathHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 弹窗状态
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFileName, setRenameFileName] = useState("");
  const [renameOriginalName, setRenameOriginalName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  // 更新路径历史
  const updatePathHistory = (path: string) => {
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push({ path, timestamp: Date.now() });
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

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
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // 导航功能
  const navigateToPath = (path: string) => {
    updatePathHistory(path);
    setCurrentPath(path);
    setSelectedFiles(new Set());
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex].path);
      setSelectedFiles(new Set());
    }
  };

  const goForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex].path);
      setSelectedFiles(new Set());
    }
  };

  const goHome = () => {
    navigateToPath("");
  };

  // 文件选择
  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    const allFilePaths = files.map(f => f.path);
    setSelectedFiles(new Set(allFilePaths));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  // 文件操作
  const handleFileDoubleClick = (file: LibraryFile) => {
    if (file.isDirectory) {
      navigateToPath(file.path);
    }
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
      fetchFiles(currentPath);
    } catch (error) {
      console.error("创建文件夹错误:", error);
      toast.error("文件夹创建失败");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);

        const response = await fetch('/api/oss/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error(`上传 ${file.name} 失败`);
        return response.json();
      });

      await Promise.all(uploadPromises);
      toast.success(`成功上传 ${files.length} 个文件`);
      fetchFiles(currentPath);
    } catch (error) {
      console.error("上传错误:", error);
      toast.error("文件上传失败");
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteFiles = async () => {
    if (selectedFiles.size === 0) {
      toast.warning("请选择要删除的文件");
      return;
    }

    try {
      const response = await fetch('/api/oss/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paths: Array.from(selectedFiles),
        }),
      });

      if (!response.ok) throw new Error("删除失败");
      
      const result = await response.json();
      toast.success(result.message);
      setSelectedFiles(new Set());
      fetchFiles(currentPath);
    } catch (error) {
      console.error("删除错误:", error);
      toast.error("删除失败");
    }
  };

  const renameFile = async () => {
    if (!renameFileName.trim()) {
      toast.warning("请输入新名称");
      return;
    }

    try {
      const response = await fetch('/api/oss/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath: renameOriginalName,
          newName: renameFileName.trim(),
        }),
      });

      if (!response.ok) throw new Error("重命名失败");
      
      const result = await response.json();
      toast.success(result.message);
      setRenameFileName("");
      setRenameOriginalName("");
      setShowRenameDialog(false);
      fetchFiles(currentPath);
    } catch (error) {
      console.error("重命名错误:", error);
      toast.error("重命名失败");
    }
  };

  const downloadFiles = async () => {
    if (selectedFiles.size === 0) {
      toast.warning("请选择要下载的文件");
      return;
    }

    try {
      if (selectedFiles.size === 1) {
        // 单个文件下载
        const filePath = Array.from(selectedFiles)[0];
        console.log('下载文件路径:', filePath);
        
        const response = await fetch(`/api/oss/download?path=${encodeURIComponent(filePath)}`);
        
        console.log('下载响应状态:', response.status);
        console.log('下载响应头:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('下载失败:', errorText);
          throw new Error(`下载失败: ${response.status} ${errorText}`);
        }
        
        const blob = await response.blob();
        console.log('下载文件大小:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 从响应头获取文件名
        const contentDisposition = response.headers.get('content-disposition');
        let filename = filePath.split('/').pop() || 'download';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // 批量下载（zip压缩包）
        console.log('批量下载文件:', Array.from(selectedFiles));
        
        const response = await fetch('/api/oss/download-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paths: Array.from(selectedFiles),
          }),
        });

        console.log('批量下载响应状态:', response.status);
        console.log('批量下载响应头:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('批量下载失败:', errorText);
          throw new Error(`批量下载失败: ${response.status} ${errorText}`);
        }
        
        const blob = await response.blob();
        console.log('批量下载文件大小:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'component-library-files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast.success("下载成功");
    } catch (error) {
      console.error("下载错误:", error);
      toast.error("下载失败");
    }
  };

  // 过滤文件
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 获取文件图标
  const getFileIcon = (file: LibraryFile) => {
    if (file.isDirectory) return <Folder className="w-5 h-5 text-blue-500" />;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <Image className="w-5 h-5 text-green-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Archive className="w-5 h-5 text-orange-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* 工具栏 */}
      <div className="bg-white dark:bg-gray-800 border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            <i className="fa-solid fa-cubes mr-2 text-blue-500"></i>
            原件库管理
          </h1>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFiles(currentPath)}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* 导航栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={historyIndex <= 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goForward}
              disabled={historyIndex >= pathHistory.length - 1}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goHome}
            >
              <Home className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <span>/</span>
              {currentPath.split('/').filter(Boolean).map((part, index, parts) => (
                <div key={index} className="flex items-center">
                  <span 
                    className="hover:text-blue-600 cursor-pointer"
                    onClick={() => navigateToPath(parts.slice(0, index + 1).join('/'))}
                  >
                    {part}
                  </span>
                  {index < parts.length - 1 && <span className="mx-1">/</span>}
                </div>
              ))}
              {!currentPath && <span className="text-gray-500">根目录</span>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索文件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowNewFolderDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              新建文件夹
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              size="sm"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-1" />
              上传文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                已选择 {selectedFiles.size} 项
              </span>
              <Button 
                onClick={downloadFiles} 
                size="sm" 
                variant="outline"
              >
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button 
                onClick={() => {
                  const firstSelected = Array.from(selectedFiles)[0];
                  const fileName = firstSelected.split('/').pop() || '';
                  setRenameOriginalName(firstSelected);
                  setRenameFileName(fileName);
                  setShowRenameDialog(true);
                }}
                size="sm" 
                variant="outline"
                disabled={selectedFiles.size !== 1}
              >
                <Edit className="w-4 h-4 mr-1" />
                重命名
              </Button>
              <Button 
                onClick={deleteFiles} 
                size="sm" 
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                删除
              </Button>
              <Button onClick={clearSelection} size="sm" variant="ghost">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 批量操作 */}
        {filteredFiles.length > 0 && (
          <div className="flex items-center space-x-2 mt-2 text-sm">
            <button 
              onClick={selectAllFiles}
              className="text-blue-600 hover:text-blue-800"
            >
              全选
            </button>
            <span className="text-gray-400">|</span>
            <button 
              onClick={clearSelection}
              className="text-blue-600 hover:text-blue-800"
            >
              取消选择
            </button>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">共 {filteredFiles.length} 项</span>
          </div>
        )}
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>加载中...</span>
          </div>
        )}
        
        {!loading && filteredFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Folder className="w-12 h-12 mb-2 opacity-50" />
            <span>目录为空</span>
          </div>
        )}

        {!loading && filteredFiles.length > 0 && (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              : "space-y-1"
          )}>
            {filteredFiles.map((file) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "group relative",
                  viewMode === 'grid' 
                    ? "p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                    : "flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  selectedFiles.has(file.path) && "bg-blue-50 dark:bg-blue-900/20 border-blue-200"
                )}
                onClick={() => toggleFileSelection(file.path)}
                onDoubleClick={() => handleFileDoubleClick(file)}
              >
                {viewMode === 'grid' ? (
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      {getFileIcon(file)}
                    </div>
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {!file.isDirectory && formatFileSize(file.size)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center justify-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(file.lastModified).split(' ')[0]}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {selectedFiles.has(file.path) && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      {getFileIcon(file)}
                      <span className="text-sm truncate flex-1">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="w-20 text-right">
                        {!file.isDirectory && formatFileSize(file.size)}
                      </span>
                      <span className="w-32 text-right">
                        {formatDate(file.lastModified)}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 对话框 */}
      <AnimatePresence>
        {/* 新建文件夹对话框 */}
        {showNewFolderDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowNewFolderDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">新建文件夹</h3>
              <Input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="请输入文件夹名称"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                autoFocus
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
          </motion.div>
        )}

        {/* 重命名对话框 */}
        {showRenameDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowRenameDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">重命名</h3>
              <Input
                type="text"
                value={renameFileName}
                onChange={(e) => setRenameFileName(e.target.value)}
                placeholder="请输入新名称"
                onKeyPress={(e) => e.key === 'Enter' && renameFile()}
                autoFocus
              />
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowRenameDialog(false);
                    setRenameFileName("");
                    setRenameOriginalName("");
                  }}
                >
                  取消
                </Button>
                <Button onClick={renameFile}>确认</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 