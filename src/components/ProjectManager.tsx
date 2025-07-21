import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

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
  status: 'active' | 'closed' | 'archived';
  positions: Position[];
}

interface Position {
  id: number;
  name: string;
  description: string;
  requirements: string;
  status: 'active' | 'closed' | 'archived';
  candidates: PositionCandidate[];
}

interface PositionCandidate {
  id: number;
  status: 'pending' | 'interviewing' | 'offered' | 'rejected' | 'archived';
  notes: string;
  resume: any;
}

interface ProjectManagerProps {
  onPositionSelect?: (position: Position, project: Project, company: Company) => void;
  selectedPositionId?: number;
}

export default function ProjectManager({ onPositionSelect, selectedPositionId }: ProjectManagerProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [width, setWidth] = useState(350);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  
  // 编辑状态
  const [editingCompany, setEditingCompany] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: string}>({});

  // 获取所有公司和项目数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('获取数据失败');
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.data);
      } else {
        toast.error(data.message || '获取项目数据失败');
        setCompanies([]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('加载项目数据失败');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理拖动调整宽度
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      setWidth(Math.max(250, Math.min(600, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 展开/收起控制
  const toggleCompany = (companyId: number) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // 公司操作
  const handleAddCompany = async () => {
    const name = prompt('请输入公司名称');
    if (!name) return;
    const description = prompt('请输入公司描述（可选）') || '';

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('添加公司成功');
        fetchData();
      } else {
        toast.error(data.message || '添加公司失败');
      }
    } catch (error) {
      toast.error('添加公司失败');
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company.id);
    setEditValues({
      [`company_${company.id}_name`]: company.name,
      [`company_${company.id}_description`]: company.description || ''
    });
  };

  const handleSaveCompany = async (companyId: number) => {
    const name = editValues[`company_${companyId}_name`];
    const description = editValues[`company_${companyId}_description`];

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('公司信息更新成功');
        setEditingCompany(null);
        fetchData();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDeleteCompany = async (companyId: number, companyName: string) => {
    if (!confirm(`确定要删除公司 "${companyName}" 吗？这将同时删除其下所有项目和职位。`)) return;

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('删除公司成功');
        fetchData();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 项目操作
  const handleAddProject = async (companyId: number) => {
    const name = prompt('请输入项目名称');
    if (!name) return;
    const description = prompt('请输入项目描述（可选）') || '';

    try {
      const response = await fetch(`/api/companies/${companyId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('添加项目成功');
        fetchData();
      } else {
        toast.error('添加项目失败');
      }
    } catch (error) {
      toast.error('添加项目失败');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project.id);
    setEditValues({
      [`project_${project.id}_name`]: project.name,
      [`project_${project.id}_description`]: project.description || ''
    });
  };

  const handleSaveProject = async (projectId: number) => {
    const name = editValues[`project_${projectId}_name`];
    const description = editValues[`project_${projectId}_description`];

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('项目信息更新成功');
        setEditingProject(null);
        fetchData();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    if (!confirm(`确定要删除项目 "${projectName}" 吗？这将同时删除其下所有职位。`)) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('删除项目成功');
        fetchData();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 职位操作
  const handleAddPosition = async (projectId: number) => {
    const name = prompt('请输入职位名称');
    if (!name) return;
    const description = prompt('请输入职位描述（可选）') || '';
    const requirements = prompt('请输入职位要求（可选）') || '';

    try {
      const response = await fetch(`/api/projects/${projectId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, requirements })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('添加职位成功');
        fetchData();
      } else {
        toast.error('添加职位失败');
      }
    } catch (error) {
      toast.error('添加职位失败');
    }
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position.id);
    setEditValues({
      [`position_${position.id}_name`]: position.name,
      [`position_${position.id}_description`]: position.description || '',
      [`position_${position.id}_requirements`]: position.requirements || ''
    });
  };

  const handleSavePosition = async (positionId: number) => {
    const name = editValues[`position_${positionId}_name`];
    const description = editValues[`position_${positionId}_description`];
    const requirements = editValues[`position_${positionId}_requirements`];

    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, requirements })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('职位信息更新成功');
        setEditingPosition(null);
        fetchData();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDeletePosition = async (positionId: number, positionName: string) => {
    if (!confirm(`确定要删除职位 "${positionName}" 吗？这将同时删除该职位下的所有候选人关联。`)) return;

    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('删除职位成功');
        fetchData();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <div
      className={cn(
        'h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 relative',
        isVisible ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ width: `${width}px` }}
    >
      {/* 切换显示按钮 */}
      <button
        className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-r-lg p-2 shadow-md z-10"
        onClick={() => setIsVisible(!isVisible)}
      >
        <i className={`fa-solid fa-chevron-${isVisible ? 'left' : 'right'}`}></i>
      </button>

      {/* 拖动调整宽度的把手 */}
      <div
        className={cn(
          'absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-10',
          isDragging ? 'bg-blue-500' : 'bg-transparent'
        )}
        onMouseDown={handleMouseDown}
      />

      {/* 内容区域 */}
      <div className="h-full flex flex-col">
        {/* 标题和添加按钮 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">招聘项目</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCompany}
          >
            <i className="fa-solid fa-plus mr-2"></i>
            添加公司
          </Button>
        </div>

        {/* 项目树形列表 */}
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <i className="fa-solid fa-building text-4xl mb-4"></i>
              <p className="text-center">还没有创建任何公司</p>
              <Button variant="outline" className="mt-4" onClick={handleAddCompany}>
                创建第一个公司
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {companies.map(company => (
                <div key={company.id} className="border border-gray-200 rounded-lg">
                  {/* 公司行 */}
                  <div className="p-3">
                    {editingCompany === company.id ? (
                      // 编辑模式
                      <div className="space-y-2">
                        <Input
                          value={editValues[`company_${company.id}_name`] || ''}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [`company_${company.id}_name`]: e.target.value
                          })}
                          placeholder="公司名称"
                          className="text-sm"
                        />
                        <Input
                          value={editValues[`company_${company.id}_description`] || ''}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [`company_${company.id}_description`]: e.target.value
                          })}
                          placeholder="公司描述"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveCompany(company.id)}
                          >
                            保存
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCompany(null)}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 显示模式
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center flex-1 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => toggleCompany(company.id)}
                        >
                          <i className={`fa-solid fa-chevron-${expandedCompanies.has(company.id) ? 'down' : 'right'} mr-2 text-gray-400 text-sm`}></i>
                          <i className="fa-solid fa-building mr-2 text-blue-500"></i>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{company.name}</div>
                            {company.description && (
                              <div className="text-xs text-gray-500">{company.description}</div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 mr-2">
                            {company.projects?.length || 0} 个项目
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCompany(company);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <i className="fa-solid fa-edit text-xs"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddProject(company.id);
                            }}
                            className="p-1 text-green-500 hover:text-green-600 rounded"
                          >
                            <i className="fa-solid fa-plus text-xs"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCompany(company.id, company.name);
                            }}
                            className="p-1 text-red-400 hover:text-red-600 rounded"
                          >
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 项目列表 */}
                  {expandedCompanies.has(company.id) && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {(company.projects?.length || 0) === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">该公司还没有项目</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => handleAddProject(company.id)}
                          >
                            添加第一个项目
                          </Button>
                        </div>
                      ) : (
                        (company.projects || []).map(project => (
                          <div key={project.id} className="border-b border-gray-100 last:border-b-0">
                            {/* 项目行 */}
                            <div className="p-3 ml-4">
                              {editingProject === project.id ? (
                                // 编辑模式
                                <div className="space-y-2">
                                  <Input
                                    value={editValues[`project_${project.id}_name`] || ''}
                                    onChange={(e) => setEditValues({
                                      ...editValues,
                                      [`project_${project.id}_name`]: e.target.value
                                    })}
                                    placeholder="项目名称"
                                    className="text-sm"
                                  />
                                  <Input
                                    value={editValues[`project_${project.id}_description`] || ''}
                                    onChange={(e) => setEditValues({
                                      ...editValues,
                                      [`project_${project.id}_description`]: e.target.value
                                    })}
                                    placeholder="项目描述"
                                    className="text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveProject(project.id)}
                                    >
                                      保存
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingProject(null)}
                                    >
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // 显示模式
                                <div className="flex items-center justify-between">
                                  <div 
                                    className="flex items-center flex-1 cursor-pointer hover:bg-gray-100 p-1 rounded"
                                    onClick={() => toggleProject(project.id)}
                                  >
                                    <i className={`fa-solid fa-chevron-${expandedProjects.has(project.id) ? 'down' : 'right'} mr-2 text-gray-400 text-sm`}></i>
                                    <i className="fa-solid fa-folder mr-2 text-orange-500"></i>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800 text-sm">{project.name}</div>
                                      {project.description && (
                                        <div className="text-xs text-gray-500">{project.description}</div>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                                          project.status === 'closed' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {project.status}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {project.positions?.length || 0} 个职位
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditProject(project);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    >
                                      <i className="fa-solid fa-edit text-xs"></i>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddPosition(project.id);
                                      }}
                                      className="p-1 text-blue-500 hover:text-blue-600 rounded"
                                    >
                                      <i className="fa-solid fa-plus text-xs"></i>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(project.id, project.name);
                                      }}
                                      className="p-1 text-red-400 hover:text-red-600 rounded"
                                    >
                                      <i className="fa-solid fa-trash text-xs"></i>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 职位列表 */}
                            {expandedProjects.has(project.id) && (
                              <div className="border-t border-gray-200 bg-white">
                                {(project.positions?.length || 0) === 0 ? (
                                  <div className="p-4 text-center text-gray-500">
                                    <p className="text-sm">该项目还没有职位</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2"
                                      onClick={() => handleAddPosition(project.id)}
                                    >
                                      添加第一个职位
                                    </Button>
                                  </div>
                                ) : (
                                  (project.positions || []).map(position => (
                                    <div key={position.id} className="border-b border-gray-100 last:border-b-0">
                                      {/* 职位行 */}
                                      <div className="p-3 ml-8">
                                        {editingPosition === position.id ? (
                                          // 编辑模式
                                          <div className="space-y-2">
                                            <Input
                                              value={editValues[`position_${position.id}_name`] || ''}
                                              onChange={(e) => setEditValues({
                                                ...editValues,
                                                [`position_${position.id}_name`]: e.target.value
                                              })}
                                              placeholder="职位名称"
                                              className="text-sm"
                                            />
                                            <Input
                                              value={editValues[`position_${position.id}_description`] || ''}
                                              onChange={(e) => setEditValues({
                                                ...editValues,
                                                [`position_${position.id}_description`]: e.target.value
                                              })}
                                              placeholder="职位描述"
                                              className="text-sm"
                                            />
                                            <Input
                                              value={editValues[`position_${position.id}_requirements`] || ''}
                                              onChange={(e) => setEditValues({
                                                ...editValues,
                                                [`position_${position.id}_requirements`]: e.target.value
                                              })}
                                              placeholder="职位要求"
                                              className="text-sm"
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSavePosition(position.id)}
                                              >
                                                保存
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingPosition(null)}
                                              >
                                                取消
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          // 显示模式
                                          <div className="flex items-center justify-between">
                                            <div 
                                              className={`flex items-center flex-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors ${
                                                selectedPositionId === position.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                                              }`}
                                              onClick={() => onPositionSelect?.(position, project, company)}
                                            >
                                              <i className="fa-solid fa-briefcase mr-2 text-purple-500"></i>
                                              <div className="flex-1">
                                                <div className="font-medium text-gray-800 text-sm">{position.name}</div>
                                                {position.description && (
                                                  <div className="text-xs text-gray-500">{position.description}</div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                                    position.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                    position.status === 'closed' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>
                                                    {position.status}
                                                  </span>
                                                  <span className="text-xs text-gray-400">
                                                    {position.candidates?.length || 0} 位候选人
                                                  </span>
                                                  {selectedPositionId === position.id && (
                                                    <span className="text-xs text-blue-600 font-medium">已选中</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex gap-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEditPosition(position);
                                                }}
                                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                              >
                                                <i className="fa-solid fa-edit text-xs"></i>
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeletePosition(position.id, position.name);
                                                }}
                                                className="p-1 text-red-400 hover:text-red-600 rounded"
                                              >
                                                <i className="fa-solid fa-trash text-xs"></i>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 