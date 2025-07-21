import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OSSFile {
  name: string;
  size: number;
  lastModified: string;
  isDirectory: boolean;
  path: string;
}

interface AnalysisResult {
  job_title: string;
  skills: string[];
  products: string[];
  companies: string[];
  industry: string[];
  keywords: {
    position: string[];
    industry: string[];
    company: string[];
    product: string[];
    skill: string[];
  };
  tagging_dict: {
    companies: string[];
    skills: string[];
    products: string[];
    industry: string[];
  };
  mermaid_code: string;
  diagram_url: string;
  summary: string;
}

interface Candidate {
  id: string;
  name: string;
  level: 'L1' | 'L1.5' | 'L2' | 'L3';
  score: number;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  summary: string;
  contactInfo: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model_used?: string;
}

interface JDAnalysisState {
  // 分析结果相关
  analysisResult: AnalysisResult | null;
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  
  // 文件相关（注意：File对象不能序列化，所以不会持久化）
  files: File[];
  jdFile: File | null;
  selectedOssPath: string;
  selectedOSSFile: OSSFile | null;
  previewContent: string;
  
  // 表单数据
  supplementaryInfo: string;
  uploadPath: string;
  
  // UI状态
  currentMode: 'upload' | 'analyze';
  showOSSBrowser: boolean;
  rightPanelWidth: number;
  isRightPanelCollapsed: boolean;
  
  // AI对话相关
  availableModels: Array<{id: string; name: string}>;
  selectedModel: string;
  chatHistory: ChatMessage[];
  
  // 加载状态（这些不需要持久化，每次加载都重置）
  uploading: boolean;
  uploadProgress: number;
  isLoading: 'oss' | 'local' | false;
  isPreviewLoading: boolean;
  loadingAction: 'analyze' | 'upload' | null;
  analysisProgress: number;
  isChatLoading: boolean;
  
  // Actions
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setCandidates: (candidates: Candidate[]) => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  setFiles: (files: File[]) => void;
  setJdFile: (file: File | null) => void;
  setSelectedOssPath: (path: string) => void;
  setSelectedOSSFile: (file: OSSFile | null) => void;
  setPreviewContent: (content: string) => void;
  setSupplementaryInfo: (info: string) => void;
  setUploadPath: (path: string) => void;
  setCurrentMode: (mode: 'upload' | 'analyze') => void;
  setShowOSSBrowser: (show: boolean) => void;
  setRightPanelWidth: (width: number) => void;
  setIsRightPanelCollapsed: (collapsed: boolean) => void;
  setAvailableModels: (models: Array<{id: string; name: string}>) => void;
  setSelectedModel: (model: string) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  
  // 非持久化状态的setters
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setIsLoading: (loading: 'oss' | 'local' | false) => void;
  setIsPreviewLoading: (loading: boolean) => void;
  setLoadingAction: (action: 'analyze' | 'upload' | null) => void;
  setAnalysisProgress: (progress: number) => void;
  setIsChatLoading: (loading: boolean) => void;
  
  // 重置功能
  resetAnalysis: () => void;
  resetChat: () => void;
  resetAll: () => void;
}

export const useJDAnalysisStore = create<JDAnalysisState>()(
  persist(
    (set, get) => ({
      // 初始状态
      analysisResult: null,
      candidates: [],
      selectedCandidate: null,
      files: [],
      jdFile: null,
      selectedOssPath: '',
      selectedOSSFile: null,
      previewContent: '',
      supplementaryInfo: '',
      uploadPath: '',
      currentMode: 'upload',
      showOSSBrowser: false,
      rightPanelWidth: 500,
      isRightPanelCollapsed: false,
      availableModels: [],
      selectedModel: 'glm-4-flash',
      chatHistory: [],
      
      // 非持久化状态（每次重新加载都重置）
      uploading: false,
      uploadProgress: 0,
      isLoading: false,
      isPreviewLoading: false,
      loadingAction: null,
      analysisProgress: 0,
      isChatLoading: false,
      
      // Actions
      setAnalysisResult: (result) => set({ analysisResult: result }),
      setCandidates: (candidates) => set({ candidates }),
      setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
      setFiles: (files) => set({ files }),
      setJdFile: (file) => set({ jdFile: file }),
      setSelectedOssPath: (path) => set({ selectedOssPath: path }),
      setSelectedOSSFile: (file) => set({ selectedOSSFile: file }),
      setPreviewContent: (content) => set({ previewContent: content }),
      setSupplementaryInfo: (info) => set({ supplementaryInfo: info }),
      setUploadPath: (path) => set({ uploadPath: path }),
      setCurrentMode: (mode) => set({ currentMode: mode }),
      setShowOSSBrowser: (show) => set({ showOSSBrowser: show }),
      setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
      setIsRightPanelCollapsed: (collapsed) => set({ isRightPanelCollapsed: collapsed }),
      setAvailableModels: (models) => set({ availableModels: models }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setChatHistory: (history) => set({ chatHistory: history }),
      addChatMessage: (message) => set((state) => ({ chatHistory: [...state.chatHistory, message] })),
      clearChatHistory: () => set({ chatHistory: [] }),
      
      // 非持久化状态的setters
      setUploading: (uploading) => set({ uploading }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsPreviewLoading: (loading) => set({ isPreviewLoading: loading }),
      setLoadingAction: (action) => set({ loadingAction: action }),
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      setIsChatLoading: (loading) => set({ isChatLoading: loading }),
      
      // 重置功能
      resetAnalysis: () => set({
        analysisResult: null,
        candidates: [],
        selectedCandidate: null,
        files: [],
        jdFile: null,
        previewContent: '',
        supplementaryInfo: '',
      }),
      
      resetChat: () => set({
        chatHistory: [],
      }),
      
      resetAll: () => set({
        analysisResult: null,
        candidates: [],
        selectedCandidate: null,
        files: [],
        jdFile: null,
        selectedOssPath: '',
        selectedOSSFile: null,
        previewContent: '',
        supplementaryInfo: '',
        uploadPath: '',
        currentMode: 'upload',
        showOSSBrowser: false,
        chatHistory: [],
        uploading: false,
        uploadProgress: 0,
        isLoading: false,
        isPreviewLoading: false,
        loadingAction: null,
        analysisProgress: 0,
        isChatLoading: false,
      }),
    }),
    {
      name: 'jd-analysis-storage',
      // 只持久化需要保存的状态，排除加载状态等临时状态
      partialize: (state) => ({
        analysisResult: state.analysisResult,
        candidates: state.candidates,
        selectedCandidate: state.selectedCandidate,
        // files 和 jdFile 不持久化，因为 File 对象不能序列化
        selectedOssPath: state.selectedOssPath,
        selectedOSSFile: state.selectedOSSFile,
        previewContent: state.previewContent,
        supplementaryInfo: state.supplementaryInfo,
        uploadPath: state.uploadPath,
        currentMode: state.currentMode,
        showOSSBrowser: state.showOSSBrowser,
        rightPanelWidth: state.rightPanelWidth,
        isRightPanelCollapsed: state.isRightPanelCollapsed,
        availableModels: state.availableModels,
        selectedModel: state.selectedModel,
        chatHistory: state.chatHistory,
      }),
    }
  )
); 