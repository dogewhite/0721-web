import { create } from "zustand";
import { persist } from "zustand/middleware";
import { projectApi } from "@/lib/api";

// 项目状态类型
export type ProjectStatus = "active" | "completed" | "paused" | "cancelled";

// 项目接口
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  budget: number;
  positions: number;
  hired: number;
  candidates: number;
  createdAt: string;
  updatedAt: string;
}

// 统计数据接口
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalHired: number;
  totalCandidates: number;
  avgHiringTime: number;
  successRate: number;
}

// 过滤器接口
export interface ProjectFilters {
  status?: ProjectStatus | "all";
  searchTerm?: string;
}

// Store状态接口
interface ProjectStoreState {
  projects: Project[];
  stats: ProjectStats;
  loading: boolean;
  error: string | null;
  filters: ProjectFilters;
  
  // 操作方法
  fetchProjects: () => Promise<void>;
  createProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  calculateStats: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 默认统计数据
const defaultStats: ProjectStats = {
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  totalBudget: 0,
  totalHired: 0,
  totalCandidates: 0,
  avgHiringTime: 0,
  successRate: 0,
};

// 创建Store
export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      // 初始状态
      projects: [],
      stats: defaultStats,
      loading: false,
      error: null,
      filters: {
        status: "all",
        searchTerm: "",
      },

      // 获取项目列表
      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const projects = await projectApi.getProjects();
          set({ projects, loading: false });
          get().calculateStats();
        } catch (error) {
          console.error("获取项目列表失败:", error);
          set({ error: "获取项目列表失败", loading: false });
        }
      },

      // 创建项目
      createProject: async (projectData) => {
        set({ loading: true, error: null });
        try {
          const newProject = await projectApi.createProject(projectData);
          
          set(state => ({
            projects: [...state.projects, newProject],
            loading: false
          }));
          
          get().calculateStats();
        } catch (error) {
          console.error("创建项目失败:", error);
          set({ error: "创建项目失败", loading: false });
        }
      },

      // 更新项目
      updateProject: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const updatedProject = await projectApi.updateProject(id, updates);
          
          set(state => ({
            projects: state.projects.map(project =>
              project.id === id ? { ...project, ...updates, updatedAt: new Date().toISOString() } : project
            ),
            loading: false
          }));
          
          get().calculateStats();
        } catch (error) {
          console.error("更新项目失败:", error);
          set({ error: "更新项目失败", loading: false });
        }
      },

      // 删除项目
      deleteProject: async (id) => {
        set({ loading: true, error: null });
        try {
          await projectApi.deleteProject(id);
          
          set(state => ({
            projects: state.projects.filter(project => project.id !== id),
            loading: false
          }));
          
          get().calculateStats();
        } catch (error) {
          console.error("删除项目失败:", error);
          set({ error: "删除项目失败", loading: false });
        }
      },

      // 设置过滤器
      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters }
        }));
      },

      // 计算统计数据
      calculateStats: () => {
        const projects = get().projects;
        
        const stats: ProjectStats = {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === "active").length,
          completedProjects: projects.filter(p => p.status === "completed").length,
          totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
          totalHired: projects.reduce((sum, p) => sum + p.hired, 0),
          totalCandidates: projects.reduce((sum, p) => sum + p.candidates, 0),
          avgHiringTime: 45, // 模拟数据
          successRate: 0,
        };
        
        // 计算成功率
        if (stats.totalCandidates > 0) {
          stats.successRate = (stats.totalHired / stats.totalCandidates) * 100;
        }
        
        set({ stats });
      },

      // 设置加载状态
      setLoading: (loading) => {
        set({ loading });
      },

      // 设置错误
      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: "project-store-v2",
      partialize: (state) => ({ 
        projects: state.projects,
        filters: state.filters 
      }),
    }
  )
);

// 获取过滤后的项目
export const useFilteredProjects = () => {
  const { projects, filters } = useProjectStore();
  
  return projects.filter(project => {
    // 状态过滤
    if (filters.status && filters.status !== "all" && project.status !== filters.status) {
      return false;
    }
    
    // 搜索过滤
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
};

export default useProjectStore; 