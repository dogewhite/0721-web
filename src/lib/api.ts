import { Project, ProjectStats } from "@/stores/projectStore";

// 使用相对路径，交由 Vite 代理转发到后端，避免浏览器直接跨域访问自签 HTTPS
const API_BASE_URL = "/api";

// API客户端类
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${error}`);
      throw error;
    }
  }

  // GET请求
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH请求
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// 创建API客户端实例
const apiClient = new ApiClient();

// 导出API客户端实例供其他组件使用
export const api = apiClient;

// 智能搜索API
export const smartSearchApi = {
  // 触发智能搜索任务
  triggerTask: async (
    keywordsMain: string,
    keywordsPosition: string,
    keywordsCompany: string,
    taskId?: string,
    company_id?: number | null,
    company_name?: string,
    project_id?: number | null,
    project_name?: string,
    position_id?: number | null,
    position_name?: string
  ): Promise<any> => {
    const payload: any = {
      keywords_main: keywordsMain,
      keywords_position: keywordsPosition,
      keywords_company: keywordsCompany,
      task_id: taskId,
      company_id,
      company_name,
      project_id,
      project_name,
      position_id,
      position_name
    };
    return apiClient.post<any>('/trigger', payload);
  },
  
  // 查看队列状态
  getQueueStatus: async (): Promise<any> => {
    const response = await apiClient.get<any>('/trigger/queue');
    return response;
  },
  
  // 清空队列
  clearQueue: async (): Promise<any> => {
    const response = await apiClient.delete<any>('/trigger/queue');
    return response;
  }
};

// 公司管理API
export const companyApi = {
  // 获取公司列表
  getCompanies: async (): Promise<any[]> => {
    const response = await apiClient.get<any>('/companies');
    return response.data;
  },

  // 创建公司
  createCompany: async (companyData: any): Promise<any> => {
    const response = await apiClient.post<any>('/companies', companyData);
    return response.data;
  },

  // 更新公司
  updateCompany: async (id: string, updates: any): Promise<any> => {
    const response = await apiClient.put<any>(`/companies/${id}`, updates);
    return response.data;
  },

  // 删除公司
  deleteCompany: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },

  // 获取公司下的项目
  getCompanyProjects: async (companyId: string): Promise<any[]> => {
    const response = await apiClient.get<any>(`/projects/company/id/${companyId}`);
    return response.data;
  }
};

// 项目管理API
export const projectApi = {
  // 获取所有项目（这里我们通过获取所有公司的项目来实现）
  getProjects: async (): Promise<Project[]> => {
    try {
      // 先获取公司列表
      const companies = await companyApi.getCompanies();
      
      // 获取所有项目
      let allProjects: any[] = [];
      for (const company of companies) {
        const projects = await companyApi.getCompanyProjects(company.id);
        allProjects = [...allProjects, ...projects];
      }
      
      // 转换为前端需要的格式
      const formattedProjects: Project[] = allProjects.map(project => ({
        id: project.id.toString(),
        name: project.name,  // 修改为name
        description: project.description,
        status: project.status,
        startDate: project.created_at ? new Date(project.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: project.updated_at ? new Date(project.updated_at).toISOString().split('T')[0] : undefined,
        budget: 50000, // 需要从公司信息获取
        positions: 3, // 需要从职位信息获取
        hired: 0, // 需要从候选人信息获取
        candidates: 0, // 需要从候选人信息获取
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
      
      return formattedProjects;
    } catch (error) {
      console.error("获取项目列表失败:", error);
      throw error;
    }
  },

  // 创建项目
  createProject: async (projectData: any): Promise<any> => {
    try {
      const response = await apiClient.post<any>('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error("创建项目失败:", error);
      throw error;
    }
  },

  // 更新项目
  updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
    try {
      const apiData = {
        name: updates.name,  // 修改为name
        description: updates.description,
        status: updates.status
      };
      
      const response = await apiClient.put<any>(`/projects/${id}`, apiData);
      
      // 转换为前端格式
      const updatedProject: Project = {
        id: response.data.id.toString(),
        name: response.data.name,  // 修改为name
        description: response.data.description,
        status: response.data.status,
        startDate: updates.startDate || new Date().toISOString().split('T')[0],
        endDate: updates.endDate,
        budget: updates.budget || 0,
        positions: updates.positions || 0,
        hired: updates.hired || 0,
        candidates: updates.candidates || 0,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at
      };
      
      return updatedProject;
    } catch (error) {
      console.error("更新项目失败:", error);
      throw error;
    }
  },

  // 删除项目
  deleteProject: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/projects/${id}`);
    } catch (error) {
      console.error("删除项目失败:", error);
      throw error;
    }
  },

  // 获取项目详情
  getProjectDetail: async (id: string): Promise<any> => {
    const response = await apiClient.get<any>(`/projects/${id}`);
    return response.data;
  },

  // 获取项目统计
  getProjectStats: async (): Promise<ProjectStats> => {
    try {
      const projects = await projectApi.getProjects();
      
      const stats: ProjectStats = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === "active").length,
        completedProjects: projects.filter(p => p.status === "completed").length,
        totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
        totalHired: projects.reduce((sum, p) => sum + p.hired, 0),
        totalCandidates: projects.reduce((sum, p) => sum + p.candidates, 0),
        avgHiringTime: 45,
        successRate: 0
      };
      
      // 计算成功率
      if (stats.totalCandidates > 0) {
        stats.successRate = (stats.totalHired / stats.totalCandidates) * 100;
      }
      
      return stats;
    } catch (error) {
      console.error("获取项目统计失败:", error);
      throw error;
    }
  },

  // 职位管理
  createPosition: async (projectId: string, positionData: any): Promise<any> => {
    const response = await apiClient.post<any>(`/projects/${projectId}/position`, positionData);
    return response.data;
  },

  getProjectPositions: async (projectId: string): Promise<any[]> => {
    const response = await apiClient.get<any>(`/projects/${projectId}/positions`);
    // 后端返回字段为 name，这里兼容前端使用的 title，并填充缺失字段，避免渲染空白
    return response.data.map((pos: any) => ({
      ...pos,
      title: pos.title || pos.name || '',
      salary_range: pos.salary_range || '',
      count: pos.count ?? 0,
      hired: pos.hired ?? 0
    }));
  },

  // 更新职位
  updatePosition: async (positionId: string, updates: any): Promise<any> => {
    const response = await apiClient.put<any>(`/positions/${positionId}`, updates);
    return response.data;
  },

  // 删除职位
  deletePosition: async (positionId: string): Promise<void> => {
    await apiClient.delete(`/positions/${positionId}`);
  },

  // 候选人管理
  addCandidateToProject: async (projectId: string, candidateId: string, candidateData: any): Promise<any> => {
    const response = await apiClient.post<any>(`/projects/${projectId}/candidates/${candidateId}`, candidateData);
    return response.data;
  },

  updateCandidateStatus: async (projectId: string, candidateId: string, statusData: any): Promise<any> => {
    const response = await apiClient.patch<any>(`/projects/${projectId}/candidates/${candidateId}`, statusData);
    return response.data;
  },

  removeCandidateFromProject: async (projectId: string, candidateId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/candidates/${candidateId}`);
  }
};

// 获取人才详情
export const getTalentDetail = async (id: string) => {
  const response = await fetch(`/api/resume/${id}`);
  if (!response.ok) {
    throw new Error('获取人才详情失败');
  }
  return response.json();
};

export default apiClient; 