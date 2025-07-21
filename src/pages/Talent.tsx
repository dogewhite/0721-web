import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTalentStore } from "../stores/talentStore";
import ProjectManager from '@/components/ProjectManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TalentDetailModal } from '../components/TalentDetailModal';
import { Card } from '@/components/ui/card';
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

// 真实数据接口
interface Resume {
  id: number;  // 主键ID
  resume_number: string;
  contact_time_preference: string;
  chinese_name: string;
  english_name: string;
  gender: string;
  current_city: string;
  phone: string;
  email: string;
  summary_total_years: string;
  expected_position: string;
  ai_career_stage: string;
  skills: string[];
  languages: string[];
  ai_profile: string;
  created_at: string;
  oss_url: string;
  original_filename: string;
  file_format: string;
  upload_source: string;
  avatar_url: string;
  // 打标功能已撤回
}

// 项目管理相关接口
interface Company {
  id: number;
  name: string;
  description: string;
  projects: Project[];
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  positions: Position[];
}

interface Position {
  id: number;
  name: string;
  description: string;
  status: string;
}



// 排序选项
const sortOptions = [
  { value: "desc", label: "最新入库优先" },
  { value: "asc", label: "最早入库优先" }
];

// 页面状态接口
interface PageState {
  currentPage: number;
  pageSize: number;
  searchKeyword: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}

// 获取保存的页面状态
const getSavedPageState = (): PageState | null => {
  const saved = localStorage.getItem('talentPageState');
  return saved ? JSON.parse(saved) : null;
};

// 保存页面状态
const savePageState = (state: PageState) => {
  localStorage.setItem('talentPageState', JSON.stringify(state));
};

export default function Talent() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  // 从store获取状态和方法
  const {
    candidates,
    filteredCandidates,
    loading,
    currentPage,
    pageSize,
    viewMode,
    scrollPosition,
    filters,
    setCandidates,
    setFilteredCandidates,
    setLoading,
    setCurrentPage,
    setPageSize,
    setViewMode,
    setScrollPosition,
    setFilters,
    loadFromCache,
    saveToCache,
    clearCache,
    fetchTalentDetail,
    setSelectedTalent
  } = useTalentStore();

  // 从localStorage恢复状态或使用默认值
  const savedState = getSavedPageState();
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 删除相关状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 批量操作相关状态
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [showBatchAddToProject, setShowBatchAddToProject] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [batchNotes, setBatchNotes] = useState('');

  // 职位筛选相关状态
  const [isFilteringByPosition, setIsFilteringByPosition] = useState(false);

  // 快速过滤状态
  const [quickFilters, setQuickFilters] = useState({
    skills: '',
    city: '',
    position: '',
    experience: ''
  });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 获取候选人列表
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      let response;
      let data;

      if (isFilteringByPosition && filters.selectedPosition) {
        // 如果按职位筛选，获取指定职位的候选人
        const response = await apiClient.get(`/positions/${filters.selectedPosition.positionId}/candidates`);
        data = response.data;
        if (data.success) {
          setCandidates(data.data);
          setFilteredCandidates(data.data);
          setTotalPages(1); // 职位候选人不分页
          setTotalCount(data.data.length);
        }
      } else {
        // 否则获取全部候选人
        const params = {
          page: currentPage,
          page_size: pageSize,
          search: filters.searchKeyword,
          sort_order: filters.sortOrder
        };

        const response = await apiClient.get('/resume/list', { params });
        data = response.data;
        if (data.success) {
          setCandidates(data.data);
          setFilteredCandidates(data.data);
          setTotalPages(data.pagination.total_pages);
          setTotalCount(data.pagination.total);
        }
      }

      if (!data.success) {
        throw new Error(data.message || '获取数据失败');
      }
    } catch (error) {
      console.error('获取候选人列表失败:', error);
      toast.error('获取候选人列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有公司和项目数据（用于批量添加）
  const fetchCompanies = async () => {
    try {
      const response = await apiClient.get('/companies');
      const data = response.data;
      if (data.success) {
        setCompanies(data.data);
      } else {
        // 如果是项目管理功能未启用，不显示错误提示
        if (data.message?.includes('项目管理功能需要数据库')) {
          console.log('项目管理功能未启用，跳过获取公司数据');
        } else {
          toast.error('获取公司数据失败');
        }
        setCompanies([]);
      }
    } catch (error) {
      console.error('获取公司数据失败:', error);
      setCompanies([]);
    }
  };

  // 组件加载时尝试从缓存恢复数据和滚动位置
  useEffect(() => {
    const hasCache = loadFromCache();

    if (hasCache) {
      // 恢复滚动位置
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    }

    // 无论是否有缓存，都重新获取最新数据
    fetchCandidates();

    // 监听滚动事件
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 应用快速过滤
  useEffect(() => {
    let filtered = candidates;

    // 技能过滤
    if (quickFilters.skills) {
      filtered = filtered.filter(candidate =>
        candidate.skills?.some((skill: string) =>
          skill.toLowerCase().includes(quickFilters.skills.toLowerCase())
        )
      );
    }

    // 城市过滤
    if (quickFilters.city) {
      filtered = filtered.filter(candidate =>
        candidate.current_city?.toLowerCase().includes(quickFilters.city.toLowerCase())
      );
    }

    // 职位过滤
    if (quickFilters.position) {
      filtered = filtered.filter(candidate =>
        candidate.expected_position?.toLowerCase().includes(quickFilters.position.toLowerCase())
      );
    }

    // 经验过滤
    if (quickFilters.experience) {
      filtered = filtered.filter(candidate =>
        candidate.summary_total_years?.toLowerCase().includes(quickFilters.experience.toLowerCase())
      );
    }

    setFilteredCandidates(filtered);
  }, [quickFilters, candidates]);

  // 处理详情页面跳转
  const handleCandidateClick = (candidateId: number) => {
    // 保存当前滚动位置
    setScrollPosition(window.scrollY);
    saveToCache();

    // 跳转到详情页
    navigate(`/talent/${candidateId}`);
  };

  // 删除简历
  const deleteResume = async (resumeId: number) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || '删除成功');
        // 重新获取数据
        await fetchCandidates();
      } else {
        throw new Error(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除简历失败:', error);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setCandidateToDelete(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (candidateToDelete) {
      deleteResume(candidateToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCandidateToDelete(null);
  };

  const handleDeleteClick = (candidate: Resume, e: React.MouseEvent) => {
    e.stopPropagation();
    setCandidateToDelete(candidate);
    setShowDeleteConfirm(true);
  };

  // 批量选择操作
  const handleSelectCandidate = (candidateId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedCandidates([]);
  };

  // 批量添加到项目
  const handleBatchAddToProject = async () => {
    if (selectedCandidates.length === 0) {
      toast.error('请选择要添加的候选人');
      return;
    }

    if (selectedPositions.length === 0) {
      toast.error('请选择至少一个职位');
      return;
    }

    try {
      const promises = [];
      for (const candidateId of selectedCandidates) {
        for (const positionId of selectedPositions) {
          promises.push(
            fetch(`/api/positions/${positionId}/candidates/${candidateId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes: batchNotes })
            })
          );
        }
      }

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount > 0) {
        toast.success(`成功添加 ${selectedCandidates.length} 位候选人到 ${selectedPositions.length} 个职位`);
        setShowBatchAddToProject(false);
        setSelectedCandidates([]);
        setSelectedPositions([]);
        setBatchNotes('');
      } else {
        toast.error('批量添加失败');
      }
    } catch (error) {
      toast.error('批量添加失败');
    }
  };

  // 批量删除候选人
  const handleBatchDelete = async () => {
    if (selectedCandidates.length === 0) {
      toast.error('请选择要删除的候选人');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedCandidates.length} 位候选人吗？此操作不可撤销。`)) {
      return;
    }

    try {
      // 通过查询字符串传递 id 列表，避免 DELETE 带 body 在某些代理下被丢弃
      const params = selectedCandidates.map(id => `resume_ids=${id}`).join('&');
      const response = await fetch(`/api/resume/batch?${params}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('批量删除失败');
      }

      const data = await response.json();
      if (data.success) {
        // 显示删除结果
        if (data.failed_ids && data.failed_ids.length > 0) {
          toast.success(`${data.message}，失败ID: ${data.failed_ids.join(', ')}`);
        } else {
          toast.success(data.message || '批量删除成功');
        }
        
        // 清空选择并刷新数据
        setSelectedCandidates([]);
        await fetchCandidates();
      } else {
        throw new Error(data.message || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除候选人失败:', error);
      toast.error('批量删除失败');
    }
  };

  // 切换职位选择状态
  const togglePositionSelection = (positionId: number) => {
    setSelectedPositions(prev =>
      prev.includes(positionId)
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    );
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, searchKeyword: value });
  };

  const handleClearSearch = () => {
    setFilters({ ...filters, searchKeyword: '' });
    setQuickFilters({ skills: '', city: '', position: '', experience: '' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };



  const getAvatarUrl = (candidate: Resume) => {
    return candidate.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.chinese_name || candidate.english_name || 'Unknown')}&background=random&size=200`;
  };

  const getSkillTags = (skills: string[]) => {
    return skills?.slice(0, 3) || [];
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
    fetchCandidates();
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchCandidates();
  };

  // 处理职位选择
  const handlePositionSelect = (position: Position, project: Project, company: Company) => {
    setFilters({
      ...filters,
      selectedPosition: {
        positionId: position.id,
        projectId: project.id,
        companyId: company.id,
        positionName: position.name,
        projectName: project.name,
        companyName: company.name
      }
    });
    setIsFilteringByPosition(true);
    setCurrentPage(1); // 重置页码
    toast.success(`已选择职位：${company.name} > ${project.name} > ${position.name}`);
  };

  // 清除职位筛选
  const clearPositionFilter = () => {
    setFilters({
      ...filters,
      selectedPosition: undefined
    });
    setIsFilteringByPosition(false);
    setCurrentPage(1);
    toast.success('已清除职位筛选');
  };

  // 初始化时检查是否有已选择的职位
  useEffect(() => {
    // 暂时注释掉职位筛选，让页面正常显示所有候选人
    // if (filters.selectedPosition) {
    //   setIsFilteringByPosition(true);
    // }
  }, []);

  // 当职位筛选状态改变时重新获取数据
  useEffect(() => {
    fetchCandidates();
  }, [isFilteringByPosition, filters.selectedPosition]);

  const handleTalentClick = async (candidate: Resume) => {
    try {
      if (!candidate) {
        console.error('Invalid candidate data:', candidate);
        return;
      }

      console.log('点击的人才数据:', candidate);

      // 先打开模态框
      setIsDetailModalOpen(true);

      // 设置当前选中的人才
      setSelectedTalent(candidate);
      console.log('已设置选中人才');

      // 然后获取详情
      if (candidate.id) {
        console.log('开始获取详情数据, ID:', candidate.id);
        await fetchTalentDetail(candidate.id.toString());
        console.log('详情数据获取完成');
      } else {
        console.error('Candidate has no ID:', candidate);
        toast.error('无效的候选人数据');
      }
    } catch (error) {
      console.error('Error in handleTalentClick:', error);
      toast.error('获取候选人详情失败');
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 flex">
        {/* 项目管理侧边栏 */}
        <ProjectManager
          onPositionSelect={handlePositionSelect}
          selectedPositionId={filters.selectedPosition?.positionId}
        />

        {/* 主内容区域 */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* 页面标题和操作栏 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">人才库管理</h1>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-gray-600">
                    {isFilteringByPosition ? (
                      <>
                        职位候选人：{totalCount} 位
                        {filters.selectedPosition && (
                          <span className="ml-2 text-blue-600 font-medium">
                            {filters.selectedPosition.companyName} &gt; {filters.selectedPosition.projectName} &gt; {filters.selectedPosition.positionName}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        共 {totalCount} 位候选人
                      </>
                    )}
                    {selectedCandidates.length > 0 && (
                      <span className="ml-2 text-blue-600">
                        (已选择 {selectedCandidates.length} 位)
                      </span>
                    )}
                  </p>
                  {isFilteringByPosition && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearPositionFilter}
                    >
                      <i className="fa-solid fa-times mr-2"></i>
                      清除筛选
                    </Button>
                  )}
                </div>
              </div>

              {/* 批量操作按钮 */}
              {selectedCandidates.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBatchAddToProject(true);
                      fetchCompanies();
                    }}
                  >
                    <i className="fa-solid fa-plus mr-2"></i>
                    批量添加到项目
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBatchDelete}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <i className="fa-solid fa-trash mr-2"></i>
                    批量删除
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearSelection}
                  >
                    取消选择
                  </Button>
                </div>
              )}
            </div>

            {/* 搜索和快速过滤栏 */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="搜索候选人姓名、邮箱、电话..."
                    value={filters.searchKeyword}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">
                    <i className="fa-solid fa-search mr-2"></i>
                    搜索
                  </Button>
                  {filters.searchKeyword && (
                    <Button variant="outline" onClick={handleClearSearch}>
                      清除
                    </Button>
                  )}
                </div>
              </form>

              {/* 快速过滤器 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="技能关键词"
                  value={quickFilters.skills}
                  onChange={(e) => setQuickFilters({ ...quickFilters, skills: e.target.value })}
                />
                <Input
                  placeholder="城市"
                  value={quickFilters.city}
                  onChange={(e) => setQuickFilters({ ...quickFilters, city: e.target.value })}
                />
                <Input
                  placeholder="期望职位"
                  value={quickFilters.position}
                  onChange={(e) => setQuickFilters({ ...quickFilters, position: e.target.value })}
                />
                <Input
                  placeholder="工作经验"
                  value={quickFilters.experience}
                  onChange={(e) => setQuickFilters({ ...quickFilters, experience: e.target.value })}
                />
              </div>
            </div>

            {/* 操作栏 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* 全选按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  <i className={`fa-solid fa-${selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0 ? 'check-square' : 'square'} mr-2`}></i>
                  {selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0 ? '取消全选' : '全选'}
                </Button>

                {/* 排序选择 */}
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
                  className="border rounded px-3 py-1"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* 视图切换 */}
                <div className="flex border rounded">
                  <button
                    className={cn(
                      "px-3 py-1 text-sm",
                      viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                    )}
                    onClick={() => setViewMode('grid')}
                  >
                    <i className="fa-solid fa-th"></i>
                  </button>
                  <button
                    className={cn(
                      "px-3 py-1 text-sm",
                      viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                    )}
                    onClick={() => setViewMode('list')}
                  >
                    <i className="fa-solid fa-list"></i>
                  </button>
                </div>
              </div>

              {/* 页面大小选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">每页显示:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* 候选人列表 */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              )}>
                {filteredCandidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className={cn(
                      "bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md relative",
                      selectedCandidates.includes(candidate.id) ? 'ring-2 ring-blue-500' : ''
                    )}
                    onClick={() => handleTalentClick(candidate)}
                  >
                    {/* 选择复选框 */}
                    <div
                      className="absolute top-3 left-3 z-10"
                      onClick={(e) => handleSelectCandidate(candidate.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => { }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="p-6 pt-10">
                        <div className="flex items-start gap-4">
                          <img
                            src={getAvatarUrl(candidate)}
                            alt={candidate.chinese_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            {/* 单行信息展示 */}
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <h3 className="text-lg font-semibold text-gray-900 truncate mr-2">
                                {candidate.chinese_name || candidate.english_name}
                              </h3>
                              {candidate.expected_position && (
                                <span className="text-blue-600 truncate">{candidate.expected_position}</span>
                              )}
                              {candidate.current_city && (
                                <span className="text-gray-500 flex items-center"><i className="fa-solid fa-location-dot mr-1"></i>{candidate.current_city}</span>
                              )}
                              {candidate.summary_total_years && (
                                <span className="text-gray-500 flex items-center"><i className="fa-solid fa-clock mr-1"></i>{candidate.summary_total_years}</span>
                              )}
                              {candidate.gender && (
                                <span className="text-gray-500 flex items-center"><i className="fa-solid fa-user mr-1"></i>{candidate.gender}</span>
                              )}
                            </div>

                            {/* 联系方式 */}
                            <div className="mt-2 text-sm text-gray-500">
                              {candidate.phone && (
                                <div className="flex items-center gap-1">
                                  <i className="fa-solid fa-phone"></i>
                                  <span>{candidate.phone}</span>
                                </div>
                              )}
                              {candidate.email && (
                                <div className="flex items-center gap-1 mt-1">
                                  <i className="fa-solid fa-envelope"></i>
                                  <span className="truncate">{candidate.email}</span>
                                </div>
                              )}
                            </div>

                            {/* 职业阶段 */}
                            <div className="mt-1">
                              <span className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
                                {candidate.ai_career_stage || '未知阶段'}
                              </span>
                            </div>

                            {/* 职位候选人状态 */}
                            {isFilteringByPosition && (candidate as any).position_candidate_status && (
                              <div className="mt-2">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${(candidate as any).position_candidate_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  (candidate as any).position_candidate_status === 'interviewing' ? 'bg-blue-100 text-blue-800' :
                                    (candidate as any).position_candidate_status === 'offered' ? 'bg-green-100 text-green-800' :
                                      (candidate as any).position_candidate_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                  }`}>
                                  {(candidate as any).position_candidate_status === 'pending' ? '待筛选' :
                                    (candidate as any).position_candidate_status === 'interviewing' ? '面试中' :
                                      (candidate as any).position_candidate_status === 'offered' ? '已发offer' :
                                        (candidate as any).position_candidate_status === 'rejected' ? '已拒绝' :
                                          (candidate as any).position_candidate_status}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* 删除按钮 */}
                          <button
                            onClick={(e) => handleDeleteClick(candidate, e)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>

                        {/* 技能标签 */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1">
                            {getSkillTags(candidate.skills).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{candidate.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 语言能力 */}
                        {candidate.languages && candidate.languages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {candidate.languages.map((lang: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 简短介绍 */}
                        {candidate.ai_profile && (
                          <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {candidate.ai_profile}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 pl-10">
                        <div className="flex items-center gap-4">
                          <img
                            src={getAvatarUrl(candidate)}
                            alt={candidate.chinese_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {candidate.chinese_name || candidate.english_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-blue-600">{candidate.expected_position || '未指定职位'}</span>
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                    {candidate.ai_career_stage || '未知阶段'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleDeleteClick(candidate, e)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <span>
                                  <i className="fa-solid fa-location-dot mr-1"></i>
                                  {candidate.current_city || '未指定城市'}
                                </span>
                              </div>

                              {/* 联系方式 */}
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <span>
                                  <i className="fa-solid fa-phone mr-1"></i>
                                  {candidate.phone || '未提供'}
                                </span>
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <span>
                                  <i className="fa-solid fa-envelope mr-1"></i>
                                  {candidate.email || '未提供'}
                                </span>
                              </div>
                            </div>

                            {/* 技能和语言 */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {/* 技能标签 */}
                              {candidate.skills && candidate.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {getSkillTags(candidate.skills).map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {candidate.skills.length > 5 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                      +{candidate.skills.length - 5}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* 语言能力 */}
                              {candidate.languages && candidate.languages.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {candidate.languages.map((lang: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                                    >
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* 职位候选人状态 */}
                            {isFilteringByPosition && (candidate as any).position_candidate_status && (
                              <div className="mt-2">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${(candidate as any).position_candidate_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  (candidate as any).position_candidate_status === 'interviewing' ? 'bg-blue-100 text-blue-800' :
                                    (candidate as any).position_candidate_status === 'offered' ? 'bg-green-100 text-green-800' :
                                      (candidate as any).position_candidate_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                  }`}>
                                  {(candidate as any).position_candidate_status === 'pending' ? '待筛选' :
                                    (candidate as any).position_candidate_status === 'interviewing' ? '面试中' :
                                      (candidate as any).position_candidate_status === 'offered' ? '已发offer' :
                                        (candidate as any).position_candidate_status === 'rejected' ? '已拒绝' :
                                          (candidate as any).position_candidate_status}
                                </span>
                              </div>
                            )}

                            {/* 简短介绍 */}
                            {candidate.ai_profile && (
                              <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                                {candidate.ai_profile}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {!isFilteringByPosition && totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  上一页
                </Button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                        size="sm"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 批量添加到项目模态框 */}
        {showBatchAddToProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  批量添加 {selectedCandidates.length} 位候选人到项目职位
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowBatchAddToProject(false);
                    setSelectedPositions([]);
                    setBatchNotes('');
                  }}
                >
                  <i className="fa-solid fa-times"></i>
                </Button>
              </div>

              {/* 备注输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">备注（可选）</label>
                <Input
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="为这批候选人添加备注信息"
                />
              </div>

              {/* 职位选择 */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {companies.map(company => (
                  <div key={company.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{company.name}</h4>
                    <div className="space-y-3">
                      {company.projects.map(project => (
                        <div key={project.id} className="ml-4">
                          <h5 className="font-medium text-sm text-gray-700 mb-2">
                            {project.name}
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                              }`}>
                              {project.status}
                            </span>
                          </h5>
                          <div className="ml-4 space-y-2">
                            {project.positions.map(position => {
                              const isSelected = selectedPositions.includes(position.id);

                              return (
                                <div
                                  key={position.id}
                                  className={cn(
                                    'flex items-center justify-between p-2 rounded border cursor-pointer',
                                    isSelected
                                      ? 'bg-blue-50 border-blue-300'
                                      : 'bg-white border-gray-200 hover:bg-gray-50'
                                  )}
                                  onClick={() => togglePositionSelection(position.id)}
                                >
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => { }}
                                      className="mr-2"
                                    />
                                    <div>
                                      <div className="font-medium text-sm">{position.name}</div>
                                      {position.description && (
                                        <div className="text-xs text-gray-500">{position.description}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  已选择 {selectedPositions.length} 个职位
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBatchAddToProject(false);
                      setSelectedPositions([]);
                      setBatchNotes('');
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleBatchAddToProject}
                    disabled={selectedPositions.length === 0}
                  >
                    批量添加到选中职位
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认对话框 */}
        {showDeleteConfirm && candidateToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">确认删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除候选人 "{candidateToDelete.chinese_name || candidateToDelete.english_name}" 吗？此操作不可撤销。
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleDeleteCancel}>
                  取消
                </Button>
                <Button
                  variant="default"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleting ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <TalentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      </div>
    </div>
  );
}
