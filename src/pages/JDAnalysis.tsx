import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import OSSFileBrowser from "@/components/OSSFileBrowser";
import ResumePreview from '@/components/ResumePreview';
import SmartSearchConfig from "@/components/SmartSearchConfig";
import ErrorBoundary from "@/components/ErrorBoundary";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { UploadCloud, Send, Sparkles, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useJDAnalysisStore } from '@/stores';
import { generateTaskId, cachePositionSelection } from "../api/draftResume";

// 这些接口现在在 store 中定义
interface OSSFile {
  name: string;
  size: number;
  lastModified: string;
  isDirectory: boolean;
  path: string;
}

// 统一处理后端响应的函数，解决数据隔离功能引入的payload包装问题
const extractAnalysisData = (data: any) => {
  if (!data) return null;
  
  // 如果数据包含payload字段，说明是被数据隔离功能包装过的
  if (data.payload) {
    return data.payload;
  }
  
  // 否则直接返回原数据
  return data;
};

// 定义类型
interface Company {
  id: number;
  name: string;
  projects: Project[];
}
interface Project {
  id: number;
  name: string;
  positions: Position[];
}
interface Position {
  id: number;
  name: string;
  description: string;
  status: string;
}

export default function JDAnalysis() {
  // 使用 Zustand store 代替 useState
  const {
    // 分析结果相关
    analysisResult,
    candidates,
    selectedCandidate,
    setAnalysisResult,
    setCandidates,
    setSelectedCandidate,
    
    // 文件相关
    files,
    jdFile,
    selectedOssPath,
    selectedOSSFile,
    previewContent,
    setFiles,
    setJdFile,
    setSelectedOssPath,
    setSelectedOSSFile,
    setPreviewContent,
    
    // 表单数据
    supplementaryInfo,
    uploadPath,
    setSupplementaryInfo,
    setUploadPath,
    
    // UI状态
    currentMode,
    showOSSBrowser,
    rightPanelWidth,
    isRightPanelCollapsed,
    setCurrentMode,
    setShowOSSBrowser,
    setRightPanelWidth,
    setIsRightPanelCollapsed,
    
    // AI对话相关
    availableModels,
    selectedModel,
    chatHistory,
    setAvailableModels,
    setSelectedModel,
    setChatHistory,
    addChatMessage,
    clearChatHistory,
    
    // 加载状态
    uploading,
    uploadProgress,
    isLoading,
    isPreviewLoading,
    loadingAction,
    analysisProgress,
    isChatLoading,
    setUploading,
    setUploadProgress,
    setIsLoading,
    setIsPreviewLoading,
    setLoadingAction,
    setAnalysisProgress,
    setIsChatLoading,
  } = useJDAnalysisStore();

  // 本地组件状态（不需要持久化的）
  const [showLargeImage, setShowLargeImage] = useState(false);
  const [largeImageSrc, setLargeImageSrc] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [chatInput, setChatInput] = useState("");
  
  const dragRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 新增：用于中断分析的AbortController
  const analyzeAbortController = useRef<AbortController | null>(null);

  // 岗位选择相关状态
  const [taskId, setTaskId] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);

  // 获取公司和职位数据
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies');
        if (!response.ok) throw new Error('获取公司数据失败');
        const data = await response.json();
        if (data.success) {
          setCompanies(data.data);
        }
      } catch (error) {
        toast.error('获取公司数据失败');
      }
    };
    fetchCompanies();
  }, []);

  // 选中公司、项目、岗位
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) as Company | undefined;
  const projects = selectedCompany?.projects || [];
  const selectedProject = projects.find((p) => p.id === selectedProjectId) as Project | undefined;
  const positions = selectedProject?.positions || [];
  const positionInfo = {
    company_id: selectedCompanyId,
    company_name: selectedCompany?.name || '',
    project_id: selectedProjectId,
    project_name: selectedProject?.name || '',
    position_id: selectedPositionId,
    position_name: positions.find(p => p.id === selectedPositionId)?.name || ''
  };

  // 拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    // 限制最小和最大宽度
    const minWidth = 300;
    const maxWidth = containerRect.width * 0.7;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setRightPanelWidth(newWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);



  // 加载可用的AI模型
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || []);
        }
      } catch (error) {
        console.error('加载模型列表失败:', error);
      }
    };
    
    loadModels();
  }, []);

  // 发送AI消息
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);
    
    // 添加用户消息到历史记录
    const newUserMessage = { role: "user" as const, content: userMessage, timestamp: new Date().toISOString() };
    addChatMessage(newUserMessage);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          model_id: selectedModel,
          conversation_history: chatHistory,
          system_prompt: "你是一个专业的招聘和人力资源助手，能够帮助用户分析JD、简历，并提供专业的建议。请用中文回答。"
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 添加AI回复到历史记录
        const aiMessage = { 
          role: "assistant" as const, 
          content: data.response, 
          timestamp: data.timestamp,
          model_used: data.model_used
        };
        addChatMessage(aiMessage);
        toast.success("AI回复完成");
      } else {
        toast.error("AI回复失败，请重试");
      }
    } catch (error) {
      console.error('AI对话错误:', error);
      toast.error("网络错误，请重试");
    } finally {
      setIsChatLoading(false);
    }
  };

  // 清空对话历史
  const handleClearChatHistory = () => {
    clearChatHistory();
    toast.info("对话历史已清空");
  };

  // 处理图片点击放大
  const handleImageClick = (imageSrc: string) => {
    setLargeImageSrc(imageSrc);
    setShowLargeImage(true);
  };

  // 处理大图关闭
  const handleCloseLargeImage = () => {
    setShowLargeImage(false);
    setLargeImageSrc('');
  };

  const handleAnalyze = async (uploadedFiles: File[]) => {
    if (uploadedFiles.length === 0) return;
    // 为本次分析生成唯一ID，用于区分并发请求
    const requestId = crypto.randomUUID();
    setLoadingAction('analyze');
    setAnalysisProgress(0);
    const formData = new FormData();
    formData.append('source', 'local'); // 添加必需的source参数
    formData.append('file', uploadedFiles[0]); // 参数名改为file
    formData.append('supplementary_info', supplementaryInfo || '');
    formData.append('request_id', requestId);
    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev: number) => Math.min(prev + 10, 90));
      }, 200);
      // 使用流式接口但简化处理
      const response = await fetch('/api/analyze_jd_stream', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // 暂时简化处理，直接读取完整响应
        const reader = response.body?.getReader();
        let fullData = '';
        let keywords_result = null;
        let diagram_result = null;
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            fullData += chunk;
            
            // 解析SSE数据
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('event: keywords_result')) {
                // 下一行应该是data
                const nextLineIndex = lines.indexOf(line) + 1;
                if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
                  try {
                    const data = JSON.parse(lines[nextLineIndex].substring(6));
                    if (data.request_id === requestId) {
                      keywords_result = extractAnalysisData(data);
                    }
                    console.log('解析到关键词结果:', data);
                  } catch (e) {
                    console.error('解析关键词结果失败:', e);
                  }
                }
              } else if (line.startsWith('event: diagram_result')) {
                // 下一行应该是data
                const nextLineIndex = lines.indexOf(line) + 1;
                if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
                  try {
                    const data = JSON.parse(lines[nextLineIndex].substring(6));
                    if (data.request_id === requestId) {
                      diagram_result = extractAnalysisData(data);
                    }
                    console.log('解析到图表结果:', data);
                  } catch (e) {
                    console.error('解析图表结果失败:', e);
                  }
                }
              }
            }
          }
        }
        
        clearInterval(progressInterval);
        setAnalysisProgress(100);
        
        // 合并结果
        console.log('关键词结果:', keywords_result);
        console.log('图表结果:', diagram_result);
        
        let combinedResult = {
          ...keywords_result,
          ...diagram_result
        };
        console.log('合并后的结果:', combinedResult);
        setAnalysisResult(combinedResult);
        setIsRightPanelCollapsed(false);
        toast.success("智能分析完成！");
      } else {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        const errorText = await response.text();
        toast.error(`分析失败: ${errorText || '请重试'}`);
      }
    } catch (error) {
      console.error('分析错误:', error);
      toast.error('分析过程中出现错误');
    } finally {
      setLoadingAction(null);
      setAnalysisProgress(0);
    }
  };

  const handleUploadToLibrary = async () => {
    if (files.length === 0) {
      toast.warning("请先选择文件");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('jd_file', files[0]);
    formData.append('supplementary_info', supplementaryInfo);
    formData.append('path', uploadPath);

    try {
      const response = await fetch('/api/upload_jd', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("文件已成功上传至库！");
        setFiles([]);
        setSupplementaryInfo("");
      } else {
        toast.error("上传失败，请重试");
      }
    } catch (error) {
      console.error('上传错误:', error);
      toast.error('上传过程中出现错误');
    } finally {
      setUploading(false);
    }
  };

  const handleOSSFileSelect = (file: OSSFile) => {
    setSelectedOSSFile(file);
    setShowOSSBrowser(false);
    toast.info(`已选择文件: ${file.name}`);
  };

  const handleOssFilePreview = async (file: any) => {
    if (!file || file.isDirectory) return;
    setIsPreviewLoading(true);
    try {
      // 对于本地上传的文件，直接读取内容；对于OSS文件，暂时显示文件信息
      if (file.path && !file.path.startsWith('oss://')) {
        // 这是本地文件路径，暂时显示文件信息
        setPreviewContent(`文件名: ${file.name}\n路径: ${file.path}\n大小: ${file.size} bytes\n修改时间: ${file.lastModified}\n\n注: OSS文件预览功能开发中...`);
      } else {
        // OSS文件预览（目前后端OSS功能被禁用）
        setPreviewContent(`文件名: ${file.name}\n路径: ${file.path}\n大小: ${file.size} bytes\n修改时间: ${file.lastModified}\n\n注: OSS预览功能暂时不可用`);
      }
    } catch (error) {
      console.error('预览文件失败:', error);
      setPreviewContent('预览失败');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const generateCandidates = async () => {
    if (!analysisResult) return;
    
    try {
      const response = await fetch('/api/generate_candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: analysisResult.keywords,
          jobTitle: analysisResult.job_title,
        }),
      });
      
      if (response.ok) {
        const candidateList = await response.json();
        setCandidates(candidateList);
      }
    } catch (error) {
      console.error('生成候选人失败:', error);
    }
  };

  const sendMessage = async (candidateId: string) => {
    try {
      const response = await fetch('/api/send_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          jdInfo: analysisResult,
        }),
      });
      
      if (response.ok) {
        toast.success('消息发送成功！');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const handleFileChange = async (files: File[] | null) => {
    // 如果正在分析中，不允许删除文件
    if ((!files || files.length === 0) && loadingAction === 'analyze') {
      toast.warning("分析进行中，请等待分析完成后再删除文件");
      return;
    }

    if (files && files.length > 0) {
      setJdFile(files[0]);
      // 如果有文件，自动预览内容
      const file = files[0];
      try {
        // 尝试以UTF-8读取文件内容
        const text = await file.text();
        // 检查是否包含乱码，如果是则显示文件信息
        if (text.includes('�') || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
          setPreviewContent(`文件名: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n文件类型: ${file.type || '未知'}\n最后修改: ${new Date(file.lastModified).toLocaleString()}\n\n注: 此文件可能包含特殊编码，预览可能显示不正常，但上传和分析功能正常。`);
        } else {
          setPreviewContent(text);
        }
      } catch (error) {
        console.error('读取文件内容失败:', error);
        setPreviewContent(`文件名: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n文件类型: ${file.type || '未知'}\n\n注: 无法预览此文件内容，但上传和分析功能正常。`);
      }
    } else {
      setJdFile(null);
      setPreviewContent('');
    }
  };

  const handleUploadToOss = async () => {
    if (!jdFile || !selectedOssPath) {
      toast.warning("请选择文件和上传路径");
      return;
    }
    setLoadingAction('upload');
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', jdFile); // 参数名改为file
    formData.append('path', selectedOssPath);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev: number) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/oss/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        toast.success("文件已成功上传至OSS库！");
        setJdFile(null);
        setSupplementaryInfo("");
        setPreviewContent('');
      } else {
        toast.error("上传失败，请重试");
      }
    } catch (error) {
      console.error('上传错误:', error);
      toast.error('上传过程中出现错误');
    } finally {
      setLoadingAction(null);
      setUploadProgress(0);
    }
  };

  const handleAnalyzeClick = async () => {
    // 如果正在分析，点击则终止分析
    if (loadingAction === 'analyze') {
      if (analyzeAbortController.current) {
        analyzeAbortController.current.abort();
        analyzeAbortController.current = null;
      }
      setLoadingAction(null);
      setAnalysisProgress(0);
      toast.info('已终止分析');
      return;
    }

    let fileToAnalyze: File | null = null;
    if (jdFile) {
      fileToAnalyze = jdFile;
    } else if (selectedOssPath) {
      try {
        setLoadingAction('analyze');
        setAnalysisProgress(0);
        analyzeAbortController.current = new AbortController();
        const progressInterval = setInterval(() => {
          setAnalysisProgress((prev: number) => Math.min(prev + 5, 90));
        }, 100);
        const formData = new FormData();
        formData.append('source', 'oss');
        formData.append('file_path', selectedOssPath);
        formData.append('supplementary_info', supplementaryInfo || '');
        const response = await fetch('/api/analyze_jd_stream', {
          method: 'POST',
          body: formData,
          signal: analyzeAbortController.current.signal,
        });
        if (response.ok) {
          // 处理流式响应
          const reader = response.body?.getReader();
          let keywords_result = null;
          let diagram_result = null;
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('event: keywords_result')) {
                  const nextLineIndex = lines.indexOf(line) + 1;
                  if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
                    try {
                      const data = JSON.parse(lines[nextLineIndex].substring(6));
                      keywords_result = extractAnalysisData(data);
                    } catch (e) {
                      console.error('OSS解析关键词结果失败:', e);
                    }
                  }
                } else if (line.startsWith('event: diagram_result')) {
                  const nextLineIndex = lines.indexOf(line) + 1;
                  if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
                    try {
                      const data = JSON.parse(lines[nextLineIndex].substring(6));
                      diagram_result = extractAnalysisData(data);
                    } catch (e) {
                      console.error('OSS解析图表结果失败:', e);
                    }
                  }
                }
              }
            }
          }
          
          clearInterval(progressInterval);
          setAnalysisProgress(100);
          
          if (keywords_result && diagram_result) {
            let combinedResult = {
              ...keywords_result,
              ...diagram_result
            };
            setAnalysisResult(combinedResult);
            setIsRightPanelCollapsed(false);
            toast.success("智能分析完成！");
          } else if (keywords_result) {
            setAnalysisResult(keywords_result);
            setIsRightPanelCollapsed(false);
            toast.success("智能分析完成！（部分结果）");
          } else {
            console.log('OSS分析无有效结果');
            toast.error("分析结果不完整，请重试");
          }
        } else {
          clearInterval(progressInterval);
          setAnalysisProgress(0);
          const errorText = await response.text();
          toast.error(`分析失败: ${errorText || '未知错误'}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          toast.info('分析已被终止');
        } else {
          console.error('分析错误:', error);
          toast.error('分析过程中出现错误');
        }
      } finally {
        setLoadingAction(null);
        setAnalysisProgress(0);
        analyzeAbortController.current = null;
      }
      return;
    }

    if (!fileToAnalyze) {
      toast.warning("请选择文件或OSS路径");
      return;
    }

    // 本地文件分析
    setLoadingAction('analyze');
    setAnalysisProgress(0);
    analyzeAbortController.current = new AbortController();
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev: number) => Math.min(prev + 10, 90));
    }, 200);
    const formData = new FormData();
    formData.append('source', 'local');
    formData.append('file', fileToAnalyze);
    formData.append('supplementary_info', supplementaryInfo || '');
    try {
      const response = await fetch('/api/analyze_jd_stream', {
        method: 'POST',
        body: formData,
        signal: analyzeAbortController.current.signal,
      });
      if (response.ok) {
        // 暂时简化处理，直接读取完整响应
        const reader = response.body?.getReader();
        let fullData = '';
        let keywords_result = null;
        let diagram_result = null;
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            fullData += chunk;
            
            // 解析SSE数据
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('event: keywords_result')) {
                // 下一行应该是data
                const nextLineIndex = lines.indexOf(line) + 1;
                if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
                  try {
                    const data = JSON.parse(lines[nextLineIndex].substring(6));
                    keywords_result = extractAnalysisData(data);
                    console.log('解析到关键词结果:', data);
                  } catch (e) {
                    console.error('解析关键词结果失败:', e);
                  }
                }
              } else if (line.startsWith('event: diagram_result')) {
                // 下一行应该是data
                const nextLineIndex = lines.indexOf(line) + 1;
                if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
                  try {
                    const data = JSON.parse(lines[nextLineIndex].substring(6));
                    diagram_result = extractAnalysisData(data);
                    console.log('解析到图表结果:', data);
                  } catch (e) {
                    console.error('解析图表结果失败:', e);
                  }
                }
              }
            }
          }
        }
        
        clearInterval(progressInterval);
        setAnalysisProgress(100);
        
        // 合并结果
        console.log('关键词结果:', keywords_result);
        console.log('图表结果:', diagram_result);
        
        if (keywords_result && diagram_result) {
          let combinedResult = {
            ...keywords_result,
            ...diagram_result
          };
          setAnalysisResult(combinedResult);
          setIsRightPanelCollapsed(false);
          toast.success("智能分析完成！");
        } else if (keywords_result) {
          setAnalysisResult(keywords_result);
          setIsRightPanelCollapsed(false);
          toast.success("智能分析完成！（部分结果）");
        } else {
          console.log('无有效分析结果');
          toast.error("分析结果不完整，请重试");
        }
      } else {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        const errorText = await response.text();
        toast.error(`分析失败: ${errorText || '请重试'}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('分析已被终止');
      } else {
        console.error('分析错误:', error);
        toast.error('分析过程中出现错误');
      }
    } finally {
      setLoadingAction(null);
      setAnalysisProgress(0);
      analyzeAbortController.current = null;
      clearInterval(progressInterval);
    }
  };

  const useProgressSimulator = (isActive: boolean, duration: number, setProgress: (p: number) => void) => {
    useEffect(() => {
      if (!isActive) return;
      
      let progress = 0;
      const increment = 100 / (duration / 100);
      
      const interval = setInterval(() => {
        progress += increment;
        if (progress >= 95) {
          setProgress(95);
          clearInterval(interval);
        } else {
          setProgress(Math.floor(progress));
        }
      }, 100);
      
      return () => clearInterval(interval);
    }, [isActive, duration, setProgress]);
  };

  useProgressSimulator(loadingAction === 'upload', 3000, setUploadProgress);
  useProgressSimulator(loadingAction === 'analyze', 8000, setAnalysisProgress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30dark:from-gray-900ark:to-gray-800">
      <div className="h-calc(10)]" ref={containerRef}>
        <div className="flex h-full">
          {/* 左侧文件操作面板 */}
          <div className="w-80 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
            {/* 岗位选择器区域 */}
            <div className="p-4 border-b border-gray-200/50">
              <div className="mb-4 bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择公司 <span className="text-red-500">*</span></label>
                    <select
                      value={selectedCompanyId || ''}
                      onChange={e => {
                        const v = e.target.value;
                        setSelectedCompanyId(v ? Number(v) : null);
                        setSelectedProjectId(null);
                        setSelectedPositionId(null);
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">选择公司</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择项目 <span className="text-red-500">*</span></label>
                    <select
                      value={selectedProjectId || ''}
                      onChange={e => {
                        const v = e.target.value;
                        setSelectedProjectId(v ? Number(v) : null);
                        setSelectedPositionId(null);
                      }}
                      disabled={!selectedCompanyId}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">选择项目</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择岗位 <span className="text-red-500">*</span></label>
                    <select
                      value={selectedPositionId || ''}
                      onChange={e => {
                        const v = e.target.value;
                        setSelectedPositionId(v ? Number(v) : null);
                      }}
                      disabled={!selectedProjectId}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">选择岗位</option>
                      {positions.map(position => (
                        <option key={position.id} value={position.id}>{position.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 文件上传区域 - 缩小高度 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <UploadCloud className="w-4 h-4 text-violet-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">文件上传</h3>
                </div>

                <FileUpload onFileChange={handleFileChange} file={jdFile} />

                <Textarea
                  placeholder="添加补充信息（岗位特殊要求、公司背景等）"
                  value={supplementaryInfo}
                  onChange={(e) => setSupplementaryInfo(e.target.value)}
                  className="h-12 text-sm bg-white/80 border-gray-200 resize-none focus:border-violet-400 focus:ring-violet-400/20"
                />

                {/* 操作按钮组 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={handleUploadToOss}
                      disabled={!jdFile || !selectedOssPath || !selectedPositionId || !!loadingAction}
                      variant="outline"
                    >
                      {loadingAction === 'upload' ? '上传中...' : '保存至库'}
                    </Button>
                    {loadingAction === 'upload' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-b overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Button
                      size="sm"
                      className={`w-full h-8 text-xs ${loadingAction === 'analyze'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700'
                        }`}
                      onClick={handleAnalyzeClick}
                      disabled={(!jdFile && !selectedOssPath) || !selectedPositionId || (!!loadingAction && loadingAction !== 'analyze')}
                    >
                      {loadingAction === 'analyze' ? '停止分析' : '开始分析'}
                    </Button>
                    {loadingAction === 'analyze' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-b overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* OSS文件浏览器 - 占满剩余空间 */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900 text-sm">文件库管理</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <OSSFileBrowser 
                    className="h-full border border-gray-200 rounded-lg bg-white/80" 
                    onSelectPath={setSelectedOssPath} 
                    onPreviewFile={handleOssFilePreview} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 中间主要内容区域 */}
          <div 
            className="flex-1 overflow-hidden bg-white/20"
            style={{ 
              width: isRightPanelCollapsed ? 'calc(100% - 320px)' : `calc(100% - 320px - ${rightPanelWidth}px - 4px)`
            }}
          >
            <div className="h-full p-4 overflow-hidden">
              {/* 智能搜索配置模块 */}
              <div className="h-full">
                <ErrorBoundary>
                  <div className="h-full bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden flex flex-col">
                    <div className="flex-1">
                      <SmartSearchConfig 
                        analysisResult={analysisResult}
                        taskId={taskId}
                        onTaskIdChange={setTaskId}
                        positionInfo={positionInfo}
                        onAddToDatabase={() => {
                          toast.info("开始简历入库...");
                        }}
                      />
                    </div>
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </div>

          {/* 拖拽分隔条 */}
          {!isRightPanelCollapsed && (
            <div
              ref={dragRef}
              onMouseDown={handleMouseDown}
              className={`w-1 bg-gray-300 transition-colors cursor-col-resize ${isDragging ? 'bg-violet-400' : ''}`}            />
          )}

          {/* 右侧 AI助手面板 */}
          <div 
            className={`bg-white/90 backdrop-blur-sm border-l border-gray-200/50 shadow-lg transition-all duration-300[object Object]           isRightPanelCollapsed ? 'w-0overflow-hidden:   }`}
            style={{ 
              width: isRightPanelCollapsed ? '0px' : `${rightPanelWidth}px`
            }}
          >
            {!isRightPanelCollapsed && (
              <div className="h-full flex flex-col"> {/* AI助手标题栏 */}
                <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gradient-to-r from-violet-50 to-blue-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-violet-500 to-blue-50 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">AI智能助手</h3>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">在线</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 分析结果展示区域 */}
                <div className="flex-1 overflow-y-auto p-4">
                  {analysisResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* 分析结果卡片 */}
                      <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl p-4 border border-violet-200/50">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                            <h4 className="font-semibold text-gray-900">{analysisResult.job_title}</h4>
                          </div>

                          {/* 思维导图 */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              岗位需求思维导图
                            </h5>
                            {analysisResult.diagram_url ? (
                              <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                <img 
                                  src={analysisResult.diagram_url} 
                                  alt="思维导图" 
                                  className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity rounded"
                                  onClick={() => handleImageClick(analysisResult.diagram_url)}
                                  title="点击查看大图"
                                />
                              </div>
                            ) : (
                              <div className="border border-gray-200 rounded-lg p-6 bg-white flex items-center justify-center">
                                <p className="text-gray-400 text-sm">思维导图生成中...</p>
                              </div>
                            )}
                          </div>

                          {/* 职位总结 */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                              职位分析总结
                            </h5>
                            <div className="bg-white/60 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
                              {(analysisResult.summary || '').split("\n").map((line, idx) => (
                                <p key={idx} className="text-sm text-gray-700 leading-relaxed mb-2">
                                  {line.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                                    i % 2 === 1 ? (
                                      <strong key={i} className="font-semibold text-base">{part}</strong>
                                    ) : (
                                      part
                                    )
                                  )}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 聊天历史记录 */}
                      <div className="space-y-3">
                        {chatHistory.filter(msg => msg.role === 'user' || msg.role === 'assistant').map((message, index) => (
                          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg ${
                              message.role === 'user' 
                                ? 'bg-violet-500 text-white rounded-br-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <span className="text-xs opacity-70 mt-1 block">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-violet-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-violet-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">开始分析</h3>
                      <p className="text-sm text-gray-500 mb-6">上传JD文件并点击"开始分析"来获取AI智能分析结果</p>
                    </div>
                  )}
                </div>

                {/* 消息输入区域 */}
                <div className="border-t border-gray-200/50 p-4 bg-gray-50/50">
                  <div className="space-y-3">
                    {/* 模型选择 - 紧凑版 */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-violet-600" />
                        <span className="font-medium text-gray-700">AI模型选择</span>
                      </div>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:border-violet-400 focus:ring-violet-400/20 font-medium"
                      >
                        {availableModels.map((model) => (
                          <option key={typeof model === 'string' ? model : model.id} value={typeof model === 'string' ? model : model.id}>
                            {((typeof model === 'string' ? model : model.id).includes('deepseek-reasoner')) ? '🧠 DeepSeek-R1 (深度推理)' :
                             ((typeof model === 'string' ? model : model.id).includes('deepseek-chat')) ? '⚡ DeepSeek-V3 (高速对话)' :
                             ((typeof model === 'string' ? model : model.id).includes('glm')) ? '🎯 GLM-4 (中文优化)' : 
                             (typeof model === 'string' ? model : model.name)}
                          </option>
                        ))}
                      </select>
                      
                      {/* 模型特性提示 - 内联显示 */}
                      <div className="text-gray-500">
                        {selectedModel?.includes('deepseek-reasoner') && (
                          <div className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                            <span>深度推理模型</span>
                          </div>
                        )}
                        {selectedModel?.includes('deepseek-chat') && (
                          <div className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                            <span>高速对话模型</span>
                          </div>
                        )}
                        {selectedModel?.includes('glm') && (
                          <div className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                            <span>中文优化模型</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 智能输入框 */}
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={
                            selectedModel?.includes('deepseek-reasoner') 
                              ? "💡 推理模式：深度分析该岗位的要求、挑战和发展前景..."
                              : selectedModel?.includes('deepseek-chat')
                              ? "⚡ 快速模式：询问关于这个岗位的任何问题..."
                              : "🤖 询问AI关于这个岗位的任何问题..."
                          }
                          className="flex-1 h-12 text-sm resize-none border-gray-300 focus:border-violet-400 focus:ring-violet-400/20 rounded-lg"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendChatMessage();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={sendChatMessage}
                          disabled={!chatInput.trim() || isChatLoading}
                          className={`h-12 px-4 ${
                            isChatLoading 
                              ? 'bg-gray-400' 
                              : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700'
                          } shadow-lg`}
                        >
                          {isChatLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {chatHistory.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClearChatHistory}
                        className="w-full text-xs"
                      >
                        清空对话历史
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 大图预览模态框 */}
      {showLargeImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={handleCloseLargeImage}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img 
              src={largeImageSrc} 
              alt="大图预览" 
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseLargeImage}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
            >
              关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 