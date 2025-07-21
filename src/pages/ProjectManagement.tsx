import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Plus, 
  ChevronRight, 
  Users, 
  Briefcase,
  MapPin,
  Calendar,
  Target,
  TrendingUp,
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { companyApi, projectApi } from "@/lib/api";
import { toast } from "sonner";
import CompanyCreateModal from "@/components/CompanyCreateModal";
import CompanyEditModal from "@/components/CompanyEditModal";
import ProjectCreateModal from "@/components/ProjectCreateModal";
import PositionCreateModal from "@/components/PositionCreateModal";
import PositionEditModal from "@/components/PositionEditModal";

// 类型定义
interface Company {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  company_id: number;
  name: string;  // 修改为name
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Position {
  id: number;
  project_id: number;
  title: string;
  description: string;
  requirements: string;
  salary_range: string;
  count: number;
  hired: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// 视图类型
type ViewType = 'companies' | 'projects' | 'positions';

const ProjectManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [currentView, setCurrentView] = useState<ViewType>('companies');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // 数据状态
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  
  // UI状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 模态框状态
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreatePositionModal, setShowCreatePositionModal] = useState(false);
  
  // 编辑和删除状态
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  // 编辑职位模态状态
  const [showEditPositionModal, setShowEditPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  // 获取公司列表
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await companyApi.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('获取公司列表失败:', error);
      toast.error('获取公司列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取项目列表
  const fetchProjects = async (companyId: number) => {
    setLoading(true);
    try {
      const data = await companyApi.getCompanyProjects(companyId.toString());
      setProjects(data);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      toast.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取职位列表
  const fetchPositions = async (projectId: number) => {
    setLoading(true);
    try {
      const data = await projectApi.getProjectPositions(projectId.toString());
      setPositions(data);
    } catch (error) {
      console.error('获取职位列表失败:', error);
      toast.error('获取职位列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取公司列表
  useEffect(() => {
    fetchCompanies();
  }, []);

  // 处理公司创建成功
  const handleCompanyCreated = () => {
    fetchCompanies(); // 重新获取公司列表
  };

  // 处理公司编辑成功
  const handleCompanyEdited = () => {
    fetchCompanies(); // 重新获取公司列表
  };

  // 处理编辑公司
  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowEditCompanyModal(true);
  };

  // 处理删除公司
  const handleDeleteCompany = (company: Company) => {
    setDeletingCompany(company);
    setShowDeleteConfirm(true);
  };

  // 确认删除公司
  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;

    try {
      await companyApi.deleteCompany(deletingCompany.id.toString());
      toast.success("公司删除成功");
      fetchCompanies(); // 重新获取公司列表
      
      // 如果删除的是当前选中的公司，重置状态
      if (selectedCompany && selectedCompany.id === deletingCompany.id) {
        setSelectedCompany(null);
        setCurrentView('companies');
        setProjects([]);
        setPositions([]);
      }
    } catch (error) {
      console.error("删除公司失败:", error);
      toast.error("删除公司失败");
    } finally {
      setShowDeleteConfirm(false);
      setDeletingCompany(null);
    }
  };

  // 处理项目创建成功
  const handleProjectCreated = () => {
    if (selectedCompany) {
      fetchProjects(selectedCompany.id); // 重新获取项目列表
    }
  };

  // 处理职位创建成功
  const handlePositionCreated = () => {
    if (selectedProject) {
      fetchPositions(selectedProject.id); // 重新获取职位列表
    }
  };

  // 处理管理候选人
  const handleManageCandidates = (position: Position) => {
    // 跳转到人才库页面，可以在URL中带上职位ID信息
    navigate('/talent', { 
      state: { 
        selectedPosition: position,
        selectedProject: selectedProject,
        selectedCompany: selectedCompany
      } 
    });
  };

  // 处理编辑职位
  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setShowEditPositionModal(true);
  };

  // 处理职位编辑成功
  const handlePositionEdited = () => {
    if (selectedProject) fetchPositions(selectedProject.id);
  };

  // 处理删除职位
  const handleDeletePosition = async (position: Position) => {
    if (!window.confirm(`确定删除职位「${position.title || position.name}」?`)) return;
    try {
      await projectApi.deletePosition(position.id.toString());
      toast.success("职位已删除");
      if (selectedProject) fetchPositions(selectedProject.id);
    } catch (e) {
      console.error(e);
      toast.error("删除职位失败");
    }
  };

  // 导航逻辑
  const navigateToProjects = (company: Company) => {
    setSelectedCompany(company);
    setCurrentView('projects');
    fetchProjects(company.id);
  };

  const navigateToPositions = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('positions');
    fetchPositions(project.id);
  };

  const navigateBack = () => {
    if (currentView === 'positions') {
      setCurrentView('projects');
      setSelectedProject(null);
    } else if (currentView === 'projects') {
      setCurrentView('companies');
      setSelectedCompany(null);
      setProjects([]);
    }
  };

  // 面包屑导航
  const renderBreadcrumb = () => (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <span 
        className={`cursor-pointer ${currentView === 'companies' ? 'text-blue-600 font-medium' : 'hover:text-blue-600'}`}
        onClick={() => {
          setCurrentView('companies');
          setSelectedCompany(null);
          setSelectedProject(null);
        }}
      >
        公司管理
      </span>
      
      {selectedCompany && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span 
            className={`cursor-pointer ${currentView === 'projects' ? 'text-blue-600 font-medium' : 'hover:text-blue-600'}`}
            onClick={() => {
              setCurrentView('projects');
              setSelectedProject(null);
            }}
          >
                         {selectedCompany.name}
          </span>
        </>
      )}
      
      {selectedProject && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span className="text-blue-600 font-medium">
                            {selectedProject.name}
          </span>
        </>
      )}
    </nav>
  );

  // 渲染公司卡片
  const renderCompanyCard = (company: Company) => (
    <motion.div
      key={company.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => navigateToProjects(company)}
          >
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{company.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCompany(company);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCompany(company);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div 
              className="cursor-pointer pl-2"
              onClick={() => navigateToProjects(company)}
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>创建时间: {new Date(company.created_at).toLocaleDateString()}</p>
        </div>
      </Card>
    </motion.div>
  );

  // 渲染项目卡片
  const renderProjectCard = (project: Project) => (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cursor-pointer"
      onClick={() => navigateToPositions(project)}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {project.status === 'active' ? '进行中' : '已完成'}
          </span>
          <span className="text-gray-600">
            创建于 {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </motion.div>
  );

  // 渲染职位卡片
  const renderPositionCard = (position: Position) => (
    <motion.div
      key={position.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{position.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{position.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEditPosition(position)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDeletePosition(position)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">职位要求:</span>
            <p className="text-sm mt-1">{position.requirements}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">薪资范围:</span>
              <p className="font-medium">{position.salary_range}</p>
            </div>
            <div>
              <span className="text-gray-600">需求人数:</span>
              <p className="font-medium">{position.count}</p>
            </div>
            <div>
              <span className="text-gray-600">已招聘:</span>
              <p className="font-medium text-green-600">{position.hired}</p>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleManageCandidates(position)}
            >
              <Users className="w-4 h-4 mr-2" />
              管理候选人
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 页面标题和返回按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentView !== 'companies' && (
              <Button variant="outline" onClick={navigateBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">招聘项目管理</h1>
              <p className="text-gray-600 mt-2">管理公司、项目和职位的完整招聘流程</p>
            </div>
          </div>
          
          {/* 创建按钮 */}
          <div>
            {currentView === 'companies' && (
              <Button onClick={() => setShowCreateCompanyModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建公司
              </Button>
            )}
            {currentView === 'projects' && selectedCompany && (
              <Button onClick={() => setShowCreateProjectModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建项目
              </Button>
            )}
            {currentView === 'positions' && selectedProject && (
              <Button onClick={() => setShowCreatePositionModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建职位
              </Button>
            )}
          </div>
        </div>

        {/* 面包屑导航 */}
        {renderBreadcrumb()}

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* 公司列表 */}
              {currentView === 'companies' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {companies.map(renderCompanyCard)}
                  {companies.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">还没有公司</h3>
                      <p className="text-gray-600 mb-4">创建第一个公司开始招聘项目管理</p>
                      <Button onClick={() => setShowCreateCompanyModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        创建公司
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* 项目列表 */}
              {currentView === 'projects' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {projects.map(renderProjectCard)}
                  {projects.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">还没有项目</h3>
                      <p className="text-gray-600 mb-4">在 {selectedCompany?.name} 下创建第一个招聘项目</p>
                      <Button onClick={() => setShowCreateProjectModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        创建项目
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* 职位列表 */}
              {currentView === 'positions' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {positions.map(renderPositionCard)}
                  {positions.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">还没有职位</h3>
                      <p className="text-gray-600 mb-4">在 {selectedProject?.name} 下创建第一个职位</p>
                      <Button onClick={() => setShowCreatePositionModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        创建职位
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 错误提示 */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* 创建公司模态框 */}
      <CompanyCreateModal
        isOpen={showCreateCompanyModal}
        onClose={() => setShowCreateCompanyModal(false)}
        onSuccess={handleCompanyCreated}
      />

      {/* 编辑公司模态框 */}
      {editingCompany && (
        <CompanyEditModal
          isOpen={showEditCompanyModal}
          onClose={() => setShowEditCompanyModal(false)}
          onSuccess={handleCompanyEdited}
          company={editingCompany}
        />
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-4">
              确定要删除公司 "{deletingCompany.name}" 吗？此操作不可撤销，将同时删除该公司下的所有项目和职位。
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 创建项目模态框 */}
      {selectedCompany && (
        <ProjectCreateModal
          isOpen={showCreateProjectModal}
          onClose={() => setShowCreateProjectModal(false)}
          onSuccess={handleProjectCreated}
          company={selectedCompany}
        />
      )}

      {/* 创建职位模态框 */}
      {selectedProject && (
        <PositionCreateModal
          isOpen={showCreatePositionModal}
          onClose={() => setShowCreatePositionModal(false)}
          onSuccess={handlePositionCreated}
          project={selectedProject}
        />
      )}

      {/* 编辑职位模态 */}
      <PositionEditModal
        isOpen={showEditPositionModal}
        onClose={() => setShowEditPositionModal(false)}
        onSuccess={handlePositionEdited}
        project={selectedProject as any || {id:0,name:''}}
        position={editingPosition}
      />
    </div>
  );
};

export default ProjectManagement; 