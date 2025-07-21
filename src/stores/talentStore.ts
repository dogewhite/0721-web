import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Resume } from '@/types/resume';
import { makeAutoObservable } from 'mobx';
import { getTalentDetail } from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface TalentCandidate {
  id: string;
  name: string;
  position: string;
  location: string;
  educationLevel: string;
  industry: string;
  skills: string[];
  avatar: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  educationHistory: Array<{
    school: string;
    degree: string;
    period: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    period: string;
    description: string;
  }>;
}

interface TalentFilters {
  searchKeyword: string;
  sortOrder: 'asc' | 'desc';
  selectedPosition?: {
    positionId: number;
    projectId: number;
    companyId: number;
    positionName: string;
    projectName: string;
    companyName: string;
  };
}

interface TalentState {
  // 数据状态
  candidates: Resume[];
  filteredCandidates: Resume[];
  loading: boolean;
  error: string | null;
  
  // 分页和筛选状态
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  
  // 视图状态
  viewMode: 'grid' | 'list';
  scrollPosition: number;
  
  // 筛选条件
  filters: TalentFilters;
  
  // UI状态
  selectedCandidateId: string | null;
  
  // 上传相关
  uploadFiles: File[];
  uploading: boolean;
  uploadProgress: number;
  
  // Actions
  setCandidates: (candidates: Resume[]) => void;
  setFilteredCandidates: (candidates: Resume[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalPages: (pages: number) => void;
  setTotalCount: (count: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setScrollPosition: (position: number) => void;
  setFilters: (filters: Partial<TalentFilters>) => void;
  setSelectedCandidateId: (id: string | null) => void;
  setUploadFiles: (files: File[]) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  
  // 筛选逻辑
  applyFilters: () => void;
  resetFilters: () => void;
  
  // 候选人操作
  addCandidate: (candidate: Resume) => void;
  updateCandidate: (id: string, updates: Partial<Resume>) => void;
  removeCandidate: (id: string) => void;
  
  // API操作
  deleteCandidateFromAPI: (resumeId: number) => Promise<void>;
  batchDeleteCandidatesFromAPI: (resumeIds: number[]) => Promise<void>;
  
  // 重置
  resetAll: () => void;
  
  // 缓存控制
  clearCache: () => void;
  loadFromCache: () => boolean;
  saveToCache: () => void;

  selectedTalent: Resume | null;
  isLoadingDetail: boolean;
  fetchTalentDetail: (id: string) => Promise<void>;
  setSelectedTalent: (talent: Resume) => void;
}

const initialFilters: TalentFilters = {
  searchKeyword: '',
  sortOrder: 'desc',
  selectedPosition: undefined,
};

const CACHE_KEY = 'talentStore';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟过期

const loadFromLocalStorage = (): Partial<TalentState> | null => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cached);
    // 检查缓存是否过期
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const saveToLocalStorage = (state: Partial<TalentState>) => {
  const dataToCache = {
    data: {
      candidates: state.candidates,
      filteredCandidates: state.filteredCandidates,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
      totalPages: state.totalPages,
      totalCount: state.totalCount,
      viewMode: state.viewMode,
      scrollPosition: state.scrollPosition,
      filters: state.filters
    },
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
};

export const useTalentStore = create<TalentState>()(
  persist(
    (set, get) => ({
      // 初始状态
      candidates: [],
      filteredCandidates: [],
      loading: false,
      error: null,
      currentPage: 1,
      pageSize: 20,
      totalPages: 1,
      totalCount: 0,
      viewMode: 'grid',
      scrollPosition: 0,
      filters: initialFilters,
      selectedCandidateId: null,
      uploadFiles: [],
      uploading: false,
      uploadProgress: 0,
      selectedTalent: null,
      isLoadingDetail: false,
      
      // Actions
      setCandidates: (candidates) => {
        set({ candidates });
        get().applyFilters();
        get().saveToCache();
      },
      
      setFilteredCandidates: (filteredCandidates) => {
        set({ filteredCandidates });
        get().applyFilters();
        get().saveToCache();
      },
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setCurrentPage: (page) => {
        set({ currentPage: page });
        get().saveToCache();
      },
      
      setPageSize: (size) => {
        set({ pageSize: size });
        get().saveToCache();
      },
      
      setTotalPages: (pages) => {
        set({ totalPages: pages });
        get().saveToCache();
      },
      
      setTotalCount: (count) => {
        set({ totalCount: count });
        get().saveToCache();
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
        get().saveToCache();
      },
      
      setScrollPosition: (position) => {
        set({ scrollPosition: position });
        get().saveToCache();
      },
      
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1, // 重置到第一页
        }));
        get().applyFilters();
        get().saveToCache();
      },
      
      setSelectedCandidateId: (id) => set({ selectedCandidateId: id }),
      
      setUploadFiles: (files) => set({ uploadFiles: files }),
      
      setUploading: (uploading) => set({ uploading }),
      
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      
      // 筛选逻辑
      applyFilters: () => {
        const { candidates, filters } = get();
        let filtered = [...candidates];
        
        // 按关键词搜索
        if (filters.searchKeyword.trim()) {
          const keyword = filters.searchKeyword.toLowerCase();
          filtered = filtered.filter(c => 
            (c.chinese_name?.toLowerCase().includes(keyword) || c.english_name?.toLowerCase().includes(keyword)) ||
            c.expected_position?.toLowerCase().includes(keyword) ||
            (c.skills && c.skills.some(skill => skill.toLowerCase().includes(keyword))) ||
            c.ai_profile?.toLowerCase().includes(keyword) ||
            c.current_city?.toLowerCase().includes(keyword) ||
            c.email?.toLowerCase().includes(keyword) ||
            c.phone?.toLowerCase().includes(keyword)
          );
        }
        
        // 按时间排序
        if (filters.sortOrder) {
          filtered.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
        }
        
        set({ filteredCandidates: filtered });
      },
      
      resetFilters: () => {
        set({ filters: initialFilters, currentPage: 1 });
        get().applyFilters();
        get().saveToCache();
      },
      
      // 候选人操作
      addCandidate: (candidate) => {
        set((state) => ({
          candidates: [...state.candidates, candidate]
        }));
        get().applyFilters();
        get().saveToCache();
      },
      
      updateCandidate: (id, updates) => {
        set((state) => ({
          candidates: state.candidates.map(c => 
            c.id === id ? { ...c, ...updates } : c
          )
        }));
        get().applyFilters();
        get().saveToCache();
      },
      
      removeCandidate: (id) => {
        set((state) => ({
          candidates: state.candidates.filter(c => c.id !== id),
          selectedCandidateId: state.selectedCandidateId === id ? null : state.selectedCandidateId
        }));
        get().applyFilters();
        get().saveToCache();
      },
      
      // API操作
      deleteCandidateFromAPI: async (resumeId: number) => {
        try {
          const response = await fetch(`/api/resume/${resumeId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('删除失败');
          }
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.message || '删除失败');
          }
          
          // 从本地状态中移除该候选人
          get().removeCandidate(resumeId.toString());
          
          return data;
        } catch (error) {
          console.error('删除简历失败:', error);
          throw error;
        }
      },
      
      batchDeleteCandidatesFromAPI: async (resumeIds: number[]) => {
        try {
          // 通过查询参数传递 id 列表
          const params = resumeIds.map(id => `resume_ids=${id}`).join('&');
          const response = await fetch(`/api/resume/batch?${params}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('批量删除失败');
          }
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.message || '批量删除失败');
          }
          
          // 从本地状态中移除成功删除的候选人
          const deletedIds = resumeIds.filter(id => !data.failed_ids || !data.failed_ids.includes(id));
          deletedIds.forEach(id => {
            get().removeCandidate(id.toString());
          });
          
          return data;
        } catch (error) {
          console.error('批量删除简历失败:', error);
          throw error;
        }
      },
      
      // 重置
      resetAll: () => {
        set({
          candidates: [],
          filteredCandidates: [],
          filters: initialFilters,
          currentPage: 1,
          selectedCandidateId: null,
          uploadFiles: [],
          uploading: false,
          uploadProgress: 0,
          totalPages: 1,
          totalCount: 0,
          viewMode: 'grid',
          scrollPosition: 0,
        });
        get().saveToCache();
      },
      
      // 缓存控制方法
      clearCache: () => {
        localStorage.removeItem(CACHE_KEY);
        set({
          candidates: [],
          filteredCandidates: [],
          currentPage: 1,
          pageSize: 20,
          totalPages: 1,
          totalCount: 0,
          viewMode: 'grid',
          scrollPosition: 0,
          filters: initialFilters,
          selectedCandidateId: null,
          uploadFiles: [],
          uploading: false,
          uploadProgress: 0,
        });
      },
      
      loadFromCache: () => {
        const cached = loadFromLocalStorage();
        if (cached) {
          set(cached);
          return true;
        }
        return false;
      },
      
      saveToCache: () => {
        const state = get();
        saveToLocalStorage(state);
      },

      fetchTalentDetail: async (id: string) => {
        try {
          console.log('开始获取人才详情, ID:', id);
          set({ isLoadingDetail: true });
          const response = await getTalentDetail(id);
          console.log('获取到的详情数据:', response);
          
          if (response.success && response.data) {
            // 更新选中的人才详情
            set({ selectedTalent: response.data });
            console.log('已更新 selectedTalent:', response.data);
          } else {
            console.error('Invalid response format:', response);
            throw new Error('获取人才详情失败');
          }
        } catch (error) {
          console.error('获取人才详情失败:', error);
          toast.error('获取人才详情失败');
          throw error;
        } finally {
          set({ isLoadingDetail: false });
        }
      },

      setSelectedTalent: (talent) => set({ selectedTalent: talent }),
    }),
    {
      name: 'talent-storage',
      partialize: (state) => ({
        candidates: state.candidates,
        filters: state.filters,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        viewMode: state.viewMode,
        selectedCandidateId: state.selectedCandidateId,
      }),
    }
  )
);

export class TalentStore {
  selectedTalent: Resume | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setSelectedTalent = (talent: Resume) => {
    this.selectedTalent = talent;
  };
} 