import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (files: File[] | null) => void;
  file?: File | null;
  files?: File[];
  setFiles?: (files: File[]) => void;
  progress?: number;
  uploading?: boolean;
  accept?: string;
  maxFiles?: number;
  acceptDescription?: string;
  currentStep?: string; // 添加当前步骤显示
}

const FileUpload = ({ 
  onFileChange, 
  file, 
  files, 
  setFiles, 
  progress = 0,
  uploading = false,
  currentStep = "",
  accept = ".pdf,.docx", 
  maxFiles = 1,
  acceptDescription = "PDF, DOCX"
}: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileChange(acceptedFiles);
    if (setFiles) {
      setFiles(acceptedFiles);
    }
  }, [onFileChange, setFiles]);

  const buildAcceptObject = (acceptString: string) => {
    const acceptObj: Record<string, string[]> = {};
    
    if (acceptString.includes('.json')) {
      acceptObj['application/json'] = ['.json'];
    }
    if (acceptString.includes('.pdf')) {
      acceptObj['application/pdf'] = ['.pdf'];
    }
    if (acceptString.includes('.docx')) {
      acceptObj['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
    }
    if (acceptString.includes('.doc')) {
      acceptObj['application/msword'] = ['.doc'];
    }
    if (acceptString.includes('.txt')) {
      acceptObj['text/plain'] = ['.txt'];
    }
    
    return acceptObj;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: buildAcceptObject(accept),
    maxFiles,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    if (setFiles) {
      setFiles([]);
    }
  };

  const currentFile = file || (files && files[0]);
  
  // 根据进度获取当前步骤名称
  const getCurrentStepName = (progress: number) => {
    if (progress <= 10) return "上传文件到Kimi";
    if (progress <= 20) return "等待文件处理";
    if (progress <= 30) return "基本信息提取";
    if (progress <= 40) return "总结信息提取";
    if (progress <= 50) return "期望信息提取";
    if (progress <= 60) return "工作经历提取";
    if (progress <= 70) return "教育经历提取";
    if (progress <= 80) return "项目经历提取";
    if (progress <= 90) return "AI分析生成";
    if (progress <= 100) return "保存到数据库";
    return "处理中...";
  };
  
  return (
    <div>
      {!currentFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          {isDragActive ? (
            <p className="text-blue-600">将文件拖到此处...</p>
          ) : (
            <div>
              <p className="font-semibold text-sm">点击或拖拽文件到此区域上传</p>
              <p className="text-xs text-gray-500 mt-1">支持 {acceptDescription} (最多{maxFiles}个文件)</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FileIcon className="w-6 h-6 text-gray-500" />
              <div className="ml-3">
                <p className="font-medium text-sm">{currentFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* 进度显示 */}
          {uploading && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  {currentStep || getCurrentStepName(progress)}
                </span>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;