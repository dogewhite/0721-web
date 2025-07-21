import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface ComponentLibraryState {
  // 文件浏览相关
  currentPath: string;
  files: LibraryFile[];
  selectedFiles: string[]; // 使用路径数组而不是Set，因为Set不能序列化
  pathHistory: PathHistory[];
  historyIndex: number;
  
  // UI状态
  viewMode: 'grid' | 'list';
  searchTerm: string;
  
  // 弹窗状态
  showNewFolderDialog: boolean;
  showRenameDialog: boolean;
  newFolderName: string;
  renameFileName: string;
  renameOriginalName: string;
  
  // 加载状态（不持久化）
  loading: boolean;
  
  // Actions
  setCurrentPath: (path: string) => void;
  setFiles: (files: LibraryFile[]) => void;
  setSelectedFiles: (files: string[]) => void;
  addSelectedFile: (filePath: string) => void;
  removeSelectedFile: (filePath: string) => void;
  toggleFileSelection: (filePath: string) => void;
  clearSelection: () => void;
  selectAllFiles: () => void;
  
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchTerm: (term: string) => void;
  
  // 导航相关
  updatePathHistory: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
  goHome: () => void;
  navigateToPath: (path: string) => void;
  
  // 弹窗控制
  setShowNewFolderDialog: (show: boolean) => void;
  setShowRenameDialog: (show: boolean) => void;
  setNewFolderName: (name: string) => void;
  setRenameFileName: (name: string) => void;
  setRenameOriginalName: (name: string) => void;
  
  // 加载状态
  setLoading: (loading: boolean) => void;
  
  // 工具方法
  getFilteredFiles: () => LibraryFile[];
  isFileSelected: (filePath: string) => boolean;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  
  // 重置
  resetAll: () => void;
}

export const useComponentLibraryStore = create<ComponentLibraryState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentPath: '',
      files: [],
      selectedFiles: [],
      pathHistory: [],
      historyIndex: -1,
      viewMode: 'list',
      searchTerm: '',
      showNewFolderDialog: false,
      showRenameDialog: false,
      newFolderName: '',
      renameFileName: '',
      renameOriginalName: '',
      loading: false,
      
      // Actions
      setCurrentPath: (path) => set({ currentPath: path }),
      setFiles: (files) => set({ files }),
      
      setSelectedFiles: (files) => set({ selectedFiles: files }),
      
      addSelectedFile: (filePath) => {
        set((state) => ({
          selectedFiles: [...state.selectedFiles, filePath]
        }));
      },
      
      removeSelectedFile: (filePath) => {
        set((state) => ({
          selectedFiles: state.selectedFiles.filter(f => f !== filePath)
        }));
      },
      
      toggleFileSelection: (filePath) => {
        const state = get();
        if (state.selectedFiles.includes(filePath)) {
          get().removeSelectedFile(filePath);
        } else {
          get().addSelectedFile(filePath);
        }
      },
      
      clearSelection: () => set({ selectedFiles: [] }),
      
      selectAllFiles: () => {
        const filteredFiles = get().getFilteredFiles();
        set({ selectedFiles: filteredFiles.map(f => f.path) });
      },
      
      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      
      // 导航相关
      updatePathHistory: (path) => {
        const state = get();
        const newHistory = state.pathHistory.slice(0, state.historyIndex + 1);
        newHistory.push({ path, timestamp: Date.now() });
        set({
          pathHistory: newHistory,
          historyIndex: newHistory.length - 1
        });
      },
      
      goBack: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          set({
            historyIndex: newIndex,
            currentPath: state.pathHistory[newIndex].path,
            selectedFiles: []
          });
        }
      },
      
      goForward: () => {
        const state = get();
        if (state.historyIndex < state.pathHistory.length - 1) {
          const newIndex = state.historyIndex + 1;
          set({
            historyIndex: newIndex,
            currentPath: state.pathHistory[newIndex].path,
            selectedFiles: []
          });
        }
      },
      
      goHome: () => {
        get().navigateToPath('');
      },
      
      navigateToPath: (path) => {
        get().updatePathHistory(path);
        set({
          currentPath: path,
          selectedFiles: []
        });
      },
      
      // 弹窗控制
      setShowNewFolderDialog: (show) => set({ showNewFolderDialog: show }),
      setShowRenameDialog: (show) => set({ showRenameDialog: show }),
      setNewFolderName: (name) => set({ newFolderName: name }),
      setRenameFileName: (name) => set({ renameFileName: name }),
      setRenameOriginalName: (name) => set({ renameOriginalName: name }),
      
      // 加载状态
      setLoading: (loading) => set({ loading }),
      
      // 工具方法
      getFilteredFiles: () => {
        const { files, searchTerm } = get();
        if (!searchTerm.trim()) return files;
        
        return files.filter(file =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      },
      
      isFileSelected: (filePath) => {
        return get().selectedFiles.includes(filePath);
      },
      
      canGoBack: () => {
        const state = get();
        return state.historyIndex > 0;
      },
      
      canGoForward: () => {
        const state = get();
        return state.historyIndex < state.pathHistory.length - 1;
      },
      
      // 重置
      resetAll: () => {
        set({
          currentPath: '',
          files: [],
          selectedFiles: [],
          pathHistory: [],
          historyIndex: -1,
          viewMode: 'list',
          searchTerm: '',
          showNewFolderDialog: false,
          showRenameDialog: false,
          newFolderName: '',
          renameFileName: '',
          renameOriginalName: '',
          loading: false,
        });
      },
    }),
    {
      name: 'component-library-storage',
      partialize: (state) => ({
        currentPath: state.currentPath,
        selectedFiles: state.selectedFiles,
        pathHistory: state.pathHistory,
        historyIndex: state.historyIndex,
        viewMode: state.viewMode,
        searchTerm: state.searchTerm,
        // 弹窗状态通常不需要持久化
        // files 也不持久化，因为会从服务器重新获取
      }),
    }
  )
); 