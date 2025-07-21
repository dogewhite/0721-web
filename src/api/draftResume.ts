import axios from 'axios';

// 创建axios实例，自动添加认证token
const apiClient = axios.create({
  baseURL: '/api',
});

// 请求拦截器，自动添加认证token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器，处理认证错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 认证失败，跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function uploadResumeWithKimi(file: File, positionId?: number) {
  const formData = new FormData();
  formData.append('resume_file', file);
  if (positionId) {
    formData.append('position_id', positionId.toString());
  }
  return apiClient.post('/resume/upload_with_kimi', formData);
}

export async function getDraftList(params: { page?: number; page_size?: number; status?: string }) {
  return apiClient.get('/resume/draft/list', { params });
}

export async function getDraftDetail(id: number) {
  return apiClient.get(`/resume/draft/${id}`);
}

export async function updateDraft(id: number, data: any) {
  return apiClient.put(`/resume/draft/${id}`, data);
}

export async function confirmDraft(id: number) {
  return apiClient.post(`/resume/draft/${id}/confirm`);
}

export async function deleteDraft(id: number) {
  return apiClient.delete(`/resume/draft/${id}`);
}

export async function batchConfirmDrafts(draftIds: number[]) {
  return apiClient.post('/resume/draft/batch/confirm', { draft_ids: draftIds });
}

export async function batchDeleteDrafts(draftIds: number[]) {
  return apiClient.delete('/resume/draft/batch', { data: { draft_ids: draftIds } });
}

export async function generateTaskId() {
  return apiClient.post('/generate_task_id');
}

export async function cachePositionSelection(taskId: string, positionInfo: any) {
  return apiClient.post('/position_selection_cache', {
    task_id: taskId,
    position_info: positionInfo
  });
}

export async function uploadResumeJsonWithPosition(taskId: string, jsonData: any) {
  return apiClient.post('/resume/upload_json_with_position', {
    task_id: taskId,
    json_data: jsonData
  });
} 