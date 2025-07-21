import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/FileUpload";
import OSSFileBrowser from "@/components/OSSFileBrowser";
import { toast } from "sonner";
import { uploadResumeWithKimi } from "../api/draftResume";
import { getDraftList, deleteDraft, batchConfirmDrafts, batchDeleteDrafts, getDraftDetail, updateDraft, confirmDraft } from '../api/draftResume';
import { Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, CheckSquare, Square } from 'lucide-react';

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

export default function Upload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(""); // 添加当前步骤状态
  const [selectedPath, setSelectedPath] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  
  // 草稿简历相关状态
  const [drafts, setDrafts] = useState<any[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsPage, setDraftsPage] = useState(1);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [selectedDraftIds, setSelectedDraftIds] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // 草稿简历详情相关状态
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [draftDetailLoading, setDraftDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // 上传区域折叠状态
  const [isUploadCollapsed, setIsUploadCollapsed] = useState(false);

  // 获取公司和职位数据
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies');
        if (!response.ok) throw new Error('获取数据失败');
        const data = await response.json();
        if (data.success) {
          setCompanies(data.data);
        }
      } catch (error) {
        console.error('获取公司数据失败:', error);
        toast.error('获取公司数据失败');
      }
    };
    fetchCompanies();
  }, []);

  // 获取草稿简历列表
  const fetchDrafts = async () => {
    setDraftsLoading(true);
    try {
      const res = await getDraftList({ page: draftsPage, page_size: 8 });
      setDrafts(res.data.data);
      setDraftsTotal(res.data.pagination.total);
      setSelectedDraftIds([]);
    } catch (error) {
      toast.error('获取草稿列表失败');
    } finally {
      setDraftsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [draftsPage]);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.warning("请先选择文件");
      return;
    }
    if (!selectedCompanyId || !selectedProjectId || !selectedPositionId) {
      toast.warning("请选择要关联的公司、项目和职位");
      return;
    }
    setUploading(true);
    setProgress(0);
    setCurrentStep("准备上传...");
    
    // 定义处理步骤和对应的进度
    const processingSteps = [
      { name: "上传文件到Kimi", progress: 10, duration: 1000 },
      { name: "等待文件处理", progress: 20, duration: 3000 },
      { name: "基本信息提取", progress: 30, duration: 2000 },
      { name: "总结信息提取", progress: 40, duration: 2000 },
      { name: "期望信息提取", progress: 50, duration: 2000 },
      { name: "工作经历提取", progress: 60, duration: 4000 }, // 工作经历处理时间较长
      { name: "教育经历提取", progress: 70, duration: 2000 },
      { name: "项目经历提取", progress: 80, duration: 2000 },
      { name: "AI分析生成", progress: 90, duration: 3000 },
      { name: "保存到数据库", progress: 100, duration: 1000 }
    ];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 开始处理第一个文件
        if (i === 0) {
          setProgress(processingSteps[0].progress);
          setCurrentStep(processingSteps[0].name);
        }
        
        // 模拟步骤进度更新
        const updateProgress = () => {
          let currentStepIndex = 0;
          const intervals: number[] = [];
          
          processingSteps.forEach((step, index) => {
            const timeout = setTimeout(() => {
              setProgress(step.progress);
              setCurrentStep(step.name);
            }, processingSteps.slice(0, index).reduce((acc, s) => acc + s.duration, 0));
            intervals.push(timeout);
          });
          
          return intervals;
        };
        
        const progressIntervals = updateProgress();
        
        const res = await uploadResumeWithKimi(file, selectedPositionId);
        
        // 清除所有进度更新定时器
        progressIntervals.forEach(clearTimeout);
        
        if (res.data && res.data.success && res.data.draft_resume_id) {
          toast.success(`${file.name} 上传成功，已进入草稿区，请前往审核`);
        } else {
          throw new Error(res.data?.message || '上传失败');
        }
        
        // 如果是最后一个文件，设置进度为100%
        if (i === files.length - 1) {
          setProgress(100);
          setCurrentStep("上传完成");
        }
      }
      
      toast.success("所有文件上传完成");
      // 刷新草稿列表
      fetchDrafts();
    } catch (error) {
      console.error('上传错误:', error);
      toast.error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  // 草稿简历操作函数
  const handleDraftDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定要删除草稿简历"${name}"吗？`)) return;
    try {
      await deleteDraft(id);
      toast.success('删除成功');
      fetchDrafts();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleDraftSelectAll = () => {
    if (selectedDraftIds.length === drafts.length) {
      setSelectedDraftIds([]);
    } else {
      setSelectedDraftIds(drafts.map(d => d.id));
    }
  };

  const handleDraftSelect = (id: number) => {
    if (selectedDraftIds.includes(id)) {
      setSelectedDraftIds(selectedDraftIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedDraftIds([...selectedDraftIds, id]);
    }
  };

  const handleBatchConfirm = async () => {
    if (selectedDraftIds.length === 0) {
      toast.warning('请选择要确认的草稿简历');
      return;
    }
    if (!window.confirm(`确定要批量确认 ${selectedDraftIds.length} 个草稿简历吗？`)) return;
    
    setBatchLoading(true);
    try {
      const res = await batchConfirmDrafts(selectedDraftIds);
      toast.success(res.data.message);
      fetchDrafts();
    } catch (error) {
      toast.error('批量确认失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedDraftIds.length === 0) {
      toast.warning('请选择要删除的草稿简历');
      return;
    }
    if (!window.confirm(`确定要批量删除 ${selectedDraftIds.length} 个草稿简历吗？`)) return;
    
    setBatchLoading(true);
    try {
      const res = await batchDeleteDrafts(selectedDraftIds);
      toast.success(res.data.message);
      fetchDrafts();
    } catch (error) {
      toast.error('批量删除失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 草稿简历详情相关函数
  const fetchDraftDetail = async (id: number) => {
    setDraftDetailLoading(true);
    try {
      const res = await getDraftDetail(id);
      if (res.data.success) {
        setSelectedDraft(res.data.data);
        setFormData(res.data.data);
        console.log('获取到的草稿详情:', res.data.data); // 调试日志
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      toast.error('获取详情失败');
    } finally {
      setDraftDetailLoading(false);
    }
  };

  const handleDraftClick = (draft: any) => {
    console.log('点击草稿简历:', draft);
    setSelectedDraft(draft);
    fetchDraftDetail(draft.id);
  };

  const handleSave = async () => {
    // 从selectedDraft或formData中获取id
    const draftId = selectedDraft?.id || formData?.basic_info?.id;
    if (!draftId) {
      console.error('没有选中的草稿简历');
      console.error('selectedDraft:', selectedDraft);
      console.error('formData:', formData);
      toast.error('没有选中的草稿简历');
      return;
    }
    setSaving(true);
    try {
      const apiData = prepareDataForAPI();
      console.log('发送给API的数据:', apiData); // 调试日志
      const res = await updateDraft(draftId, apiData);
      console.log('API响应:', res); // 调试日志
      if (res.data.success) {
        toast.success('保存成功！');
        setIsEditing(false);
        // 重新加载数据
        await fetchDraftDetail(draftId);
        fetchDrafts(); // 刷新列表
      } else {
        throw new Error(res.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      if (error.response) {
        console.error('错误响应:', error.response.data);
        toast.error(`保存失败: ${error.response.data.detail || error.response.data.message || '未知错误'}`);
      } else if (error.request) {
        console.error('请求错误:', error.request);
        toast.error('网络请求失败，请检查网络连接');
      } else {
        console.error('其他错误:', error.message);
        toast.error(`保存失败: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    const draftId = selectedDraft?.id || formData?.basic_info?.id;
    if (!draftId) return;
    setConfirming(true);
    try {
      const res = await confirmDraft(draftId);
      if (res.data.success) {
        toast.success('入库成功！');
        // setSelectedDraft(null); // 不要清空当前选中草稿
        // fetchDrafts(); // 草稿库不会变化，无需刷新
      } else {
        throw new Error(res.data.message || '入库失败');
      }
    } catch (error) {
      toast.error('入库失败');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    // 重新获取原始数据
    const draftId = selectedDraft?.id || formData?.basic_info?.id;
    if (draftId) {
      fetchDraftDetail(draftId);
    }
    setIsEditing(false);
  };

  const updateField = (section: string, field: string, value: any) => {
    console.log('更新字段:', section, field, value);
    setFormData((prev: any) => {
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      console.log('更新后的formData:', newData);
      return newData;
    });
  };

  const updateArrayField = (section: string, field: string, value: string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateWorkExperience = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      work_experiences: prev.work_experiences.map((exp: any, i: number) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const updateEducationExperience = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      education_experiences: prev.education_experiences.map((exp: any, i: number) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const updateProjectExperience = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      project_experiences: prev.project_experiences.map((exp: any, i: number) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  // 处理日期格式转换
  const formatDateForAPI = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // 准备发送给API的数据
  const prepareDataForAPI = () => {
    const apiData: any = {
      basic_info: {},
      contact_info: {},
      expectations: {},
      summary: {},
      ai_analysis: {},
      work_experiences: [],
      education_experiences: [],
      project_experiences: []
    };

    // 基本信息（包含联系信息）
    if (formData?.basic_info) {
      apiData.basic_info = {
        ...formData.basic_info,
        birth_date: formatDateForAPI(formData.basic_info.birth_date)
      };
    }

    // 联系信息（从basic_info中提取，但后端会直接更新basic_info中的字段）
    if (formData?.basic_info) {
      apiData.contact_info = {
        phone: formData.basic_info.phone,
        email: formData.basic_info.email,
        wechat: formData.basic_info.wechat
      };
    }

    // 期望信息
    if (formData?.expectations) {
      apiData.expectations = formData.expectations;
    }

    // 总结信息
    if (formData?.summary) {
      apiData.summary = {
        ...formData.summary,
        skills: Array.isArray(formData.summary.skills) ? formData.summary.skills : 
                (formData.summary.skills ? formData.summary.skills.split(',').map((s: string) => s.trim()) : [])
      };
    }

    // AI分析
    if (formData?.ai_analysis) {
      apiData.ai_analysis = formData.ai_analysis;
    }

    // 工作经历
    if (formData?.work_experiences) {
      apiData.work_experiences = formData.work_experiences.map((exp: any) => ({
        ...exp,
        start_date: formatDateForAPI(exp.start_date),
        end_date: formatDateForAPI(exp.end_date)
      }));
    }

    // 教育经历
    if (formData?.education_experiences) {
      apiData.education_experiences = formData.education_experiences.map((exp: any) => ({
        ...exp,
        start_date: formatDateForAPI(exp.start_date),
        end_date: formatDateForAPI(exp.end_date)
      }));
    }

    // 项目经历
    if (formData?.project_experiences) {
      apiData.project_experiences = formData.project_experiences.map((exp: any) => ({
        ...exp,
        start_date: formatDateForAPI(exp.start_date),
        end_date: formatDateForAPI(exp.end_date)
      }));
    }

    console.log('准备发送给API的数据:', apiData); // 添加调试日志
    return apiData;
  };

  // 获取当前选中公司的项目
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const projects = selectedCompany?.projects || [];
  // 获取当前选中项目的职位
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const positions = selectedProject?.positions || [];

  return (
    <div className="p-8 overflow-auto">
      <div className="flex gap-8">
        {/* 左侧：可折叠的上传区域 */}
        <div className={`transition-all duration-300 ${isUploadCollapsed ? 'w-12' : 'w-80'}`}>
          {isUploadCollapsed ? (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2">
              <button
                onClick={() => setIsUploadCollapsed(false)}
                className="w-full h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                title="展开上传区域"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 折叠按钮 */}
              <div className="flex justify-end">
                <button
                  onClick={() => setIsUploadCollapsed(true)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                  title="收起上传区域"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* 文件上传和职位选择 */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200">
                <div className="p-4">
                  {/* 职位选择器 */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        选择公司 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedCompanyId || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedCompanyId(value ? Number(value) : null);
                          setSelectedProjectId(null);
                          setSelectedPositionId(null);
                        }}
                        className={cn(
                          "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                          !selectedCompanyId ? "border-red-300" : "border-gray-300"
                        )}
                        required
                      >
                        <option value="">选择公司</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        选择项目 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedProjectId || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedProjectId(value ? Number(value) : null);
                          setSelectedPositionId(null);
                        }}
                        disabled={!selectedCompanyId}
                        className={cn(
                          "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                          selectedCompanyId && !selectedProjectId ? "border-red-300" : "border-gray-300"
                        )}
                        required
                      >
                        <option value="">选择项目</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        选择职位 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedPositionId || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedPositionId(value ? Number(value) : null);
                        }}
                        disabled={!selectedProjectId}
                        className={cn(
                          "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                          selectedProjectId && !selectedPositionId ? "border-red-300" : "border-gray-300"
                        )}
                        required
                      >
                        <option value="">选择职位</option>
                        {positions.map(position => (
                          <option key={position.id} value={position.id}>{position.name}</option>
                        ))}
                      </select>
                    </div>
                    {selectedPositionId ? (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">已选择职位:</span> {
                            `${selectedCompany?.name} > ${selectedProject?.name} > ${positions.find(p => p.id === selectedPositionId)?.name}`
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          <i className="fas fa-exclamation-triangle mr-2"></i>
                          请选择要关联的职位，上传的简历将自动添加到所选职位中
                        </p>
                      </div>
                    )}
                  </div>
                  <FileUpload
                    onFileChange={(newFiles) => setFiles(newFiles || [])}
                    files={files}
                    setFiles={setFiles}
                    progress={progress}
                    uploading={uploading}
                    currentStep={currentStep}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.json"
                    maxFiles={10}
                    acceptDescription="PDF、Word、Excel、TXT、JSON等主流格式"
                  />
                  {/* 上传按钮 */}
                  <button
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0 || !selectedPositionId}
                    className={cn(
                      "w-full mt-4 py-2 px-4 rounded-lg text-white font-medium transition-all text-sm",
                      uploading || files.length === 0 || !selectedPositionId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    )}
                  >
                    {uploading ? `上传中 ${Math.round(progress)}%` : "开始上传"}
                  </button>
                  
                  {/* 测试进度按钮（开发环境） */}
                  {import.meta.env.DEV && (
                    <button
                      onClick={() => {
                        setUploading(true);
                        setProgress(0);
                        setCurrentStep("测试进度...");
                        
                        const testSteps = [
                          { name: "上传文件到Kimi", progress: 10 },
                          { name: "等待文件处理", progress: 20 },
                          { name: "基本信息提取", progress: 30 },
                          { name: "总结信息提取", progress: 40 },
                          { name: "期望信息提取", progress: 50 },
                          { name: "工作经历提取", progress: 60 },
                          { name: "教育经历提取", progress: 70 },
                          { name: "项目经历提取", progress: 80 },
                          { name: "AI分析生成", progress: 90 },
                          { name: "保存到数据库", progress: 100 }
                        ];
                        
                        let currentStep = 0;
                        const interval = setInterval(() => {
                          if (currentStep < testSteps.length) {
                            const step = testSteps[currentStep];
                            setProgress(step.progress);
                            setCurrentStep(step.name);
                            currentStep++;
                          } else {
                            clearInterval(interval);
                            setTimeout(() => {
                              setUploading(false);
                              setProgress(0);
                              setCurrentStep("");
                            }, 1000);
                          }
                        }, 1000);
                      }}
                      className="w-full mt-2 py-1 px-3 rounded-md text-gray-600 border border-gray-300 hover:bg-gray-50 text-xs"
                    >
                      测试进度显示
                    </button>
                  )}
                </div>
              </div>

              {/* 目录选择器 - 压缩版本 */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200">
                <div className="p-3">
                  <OSSFileBrowser 
                    onSelectPath={setSelectedPath}
                    className="h-32"
                  />
                  {selectedPath && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        <span className="font-medium">已选择上传目录:</span> /{selectedPath || '根目录'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 中间：草稿简历区域 */}
        <div className="w-1/5">

          {/* 批量操作栏 */}
          {selectedDraftIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-blue-800 font-medium">
                    已选择 {selectedDraftIds.length} 个草稿简历
                  </span>
                  <button
                    onClick={handleBatchConfirm}
                    disabled={batchLoading}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
                  >
                    {batchLoading ? '处理中...' : '批量确认'}
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={batchLoading}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm"
                  >
                    {batchLoading ? '处理中...' : '批量删除'}
                  </button>
                </div>
                <button
                  onClick={() => setSelectedDraftIds([])}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  取消选择
                </button>
              </div>
            </div>
          )}

          {draftsLoading ? (
            <div className="flex justify-center items-center h-[650px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 h-[650px] flex flex-col justify-center">
              <div className="text-gray-400 text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无草稿简历</h3>
              <p className="text-gray-500">上传简历后将在此显示待审核的草稿</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[650px] overflow-y-auto">
                {drafts.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer relative"
                    onClick={() => handleDraftClick(item)}
                  >
                    {/* 删除按钮 - 右上角 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDraftDelete(item.id, item.chinese_name);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    
                    <div className="p-2">
                      <div className="flex items-start justify-between">
                        {/* 左侧：姓名、性别、地点 */}
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDraftSelect(item.id);
                              }}
                              className="flex items-center justify-center w-4 h-4"
                            >
                              {selectedDraftIds.includes(item.id) ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>

                          <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {item.chinese_name || '未填写姓名'}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {item.gender} • {item.current_city || '未填写城市'}
                            </p>
                          </div>
                        </div>

                        {/* 右侧：其他信息 */}
                        <div className="ml-4 flex-1">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="font-medium w-16">期望职位:</span>
                              <span className="truncate">{item.expected_position || '未填写'}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="font-medium w-16">工作经验:</span>
                              <span>{item.work_experience_years || '未填写'}年</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="font-medium w-16">最高学历:</span>
                              <span>{item.highest_education || '未填写'}</span>
                            </div>
                            <div className="flex items-center justify-end text-xs text-gray-600">
                              <span className="font-medium">上传时间:</span>
                              <span className="text-gray-500 ml-2">{item.created_at?.slice(0, 19).replace('T', ' ')}</span>
                            </div>
                            {item.skills && (
                              <div className="flex items-center text-xs text-gray-600">
                                <span className="font-medium w-16">技能:</span>
                                <span className="truncate">{item.skills.slice(0, 30)}...</span>
                              </div>
                            )}
                            {item.work_experience_summary && (
                              <div className="flex items-center text-xs text-gray-600">
                                <span className="font-medium w-16">工作经历:</span>
                                <span className="truncate">{item.work_experience_summary.slice(0, 35)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 全选和分页 */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleDraftSelectAll}
                    className="flex items-center space-x-2 text-xs text-gray-600 hover:text-gray-800"
                  >
                    {selectedDraftIds.length === drafts.length ? (
                      <CheckSquare className="w-3 h-3 text-blue-600" />
                    ) : (
                      <Square className="w-3 h-3 text-gray-400" />
                    )}
                    <span>全选</span>
                  </button>
                  {selectedDraftIds.length > 0 && (
                    <span className="text-xs text-gray-500">
                      已选择 {selectedDraftIds.length} / {drafts.length}
                    </span>
                  )}
                </div>

                {/* 分页 */}
                {draftsTotal > 8 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDraftsPage(draftsPage - 1)}
                      disabled={draftsPage === 1}
                      className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-xs"
                    >
                      上一页
                    </button>
                    <span className="px-2 py-1 text-gray-700 text-xs">
                      {draftsPage} / {Math.ceil(draftsTotal / 8)}
                    </span>
                    <button
                      onClick={() => setDraftsPage(draftsPage + 1)}
                      disabled={draftsPage * 8 >= draftsTotal}
                      className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-xs"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 右侧：草稿简历详情区域 */}
        <div className="flex-1">

          {!selectedDraft ? (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 h-[700px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-lg font-medium">选择简历</p>
                <p className="text-sm">点击左侧草稿简历查看详情</p>
              </div>
            </div>
          ) : draftDetailLoading ? (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 h-[700px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 h-[700px] overflow-y-auto">
              {/* 操作按钮栏 */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formData?.basic_info?.chinese_name || '未填写姓名'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            console.log('编辑按钮被点击');
                            console.log('当前formData:', formData);
                            setIsEditing(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={handleConfirm}
                          disabled={confirming}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                          {confirming ? '提交中...' : '确认入库'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            console.log('保存按钮被点击');
                            console.log('当前selectedDraft:', selectedDraft);
                            console.log('当前formData:', formData);
                            handleSave();
                          }}
                          disabled={saving}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                          {saving ? '保存中...' : '保存'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 详情内容 */}
              <div className="p-4 space-y-4">
                {/* 基本信息 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">基本信息</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">姓名:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData?.basic_info?.chinese_name || ''}
                          onChange={(e) => updateField('basic_info', 'chinese_name', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium">{formData?.basic_info?.chinese_name || '未填写'}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">性别:</span>
                      {isEditing ? (
                        <select
                          value={formData?.basic_info?.gender || ''}
                          onChange={(e) => updateField('basic_info', 'gender', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        >
                          <option value="">选择性别</option>
                          <option value="男">男</option>
                          <option value="女">女</option>
                        </select>
                      ) : (
                        <span className="ml-1 font-medium">{formData?.basic_info?.gender || '未填写'}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">出生日期:</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData?.basic_info?.birth_date?.slice(0, 10) || ''}
                          onChange={(e) => updateField('basic_info', 'birth_date', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium">
                          {formData?.basic_info?.birth_date ? 
                            `${new Date().getFullYear() - new Date(formData.basic_info.birth_date).getFullYear()}岁` : 
                            '未填写'
                          }
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">城市:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData?.basic_info?.current_city || ''}
                          onChange={(e) => updateField('basic_info', 'current_city', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium">{formData?.basic_info?.current_city || '未填写'}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">手机:</span>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData?.basic_info?.phone || ''}
                          onChange={(e) => updateField('basic_info', 'phone', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium">{formData?.basic_info?.phone || '未填写'}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">邮箱:</span>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData?.basic_info?.email || ''}
                          onChange={(e) => updateField('basic_info', 'email', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium truncate">{formData?.basic_info?.email || '未填写'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 期望信息 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">期望信息</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">期望职位:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData?.expectations?.position || ''}
                          onChange={(e) => updateField('expectations', 'position', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium">{formData?.expectations?.position || '未填写'}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">期望年薪:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData?.expectations?.salary_yearly || ''}
                          onChange={(e) => updateField('expectations', 'salary_yearly', e.target.value)}
                          placeholder="万"
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium">
                          {formData?.expectations?.salary_yearly ? `${formData.expectations.salary_yearly}万` : '未填写'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 总结信息 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">总结信息</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">工作年限:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData?.summary?.total_years || ''}
                          onChange={(e) => updateField('summary', 'total_years', e.target.value)}
                          placeholder="年"
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        <span className="ml-1 font-medium">
                          {formData?.summary?.total_years ? `${formData.summary.total_years}年` : '未填写'}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">最高学历:</span>
                      {isEditing ? (
                        <select
                          value={formData?.summary?.highest_education || ''}
                          onChange={(e) => updateField('summary', 'highest_education', e.target.value)}
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        >
                          <option value="">选择学历</option>
                          <option value="高中">高中</option>
                          <option value="大专">大专</option>
                          <option value="本科">本科</option>
                          <option value="硕士">硕士</option>
                          <option value="博士">博士</option>
                        </select>
                      ) : (
                        <span className="ml-1 font-medium">{formData?.summary?.highest_education || '未填写'}</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">技能:</span>
                      {isEditing ? (
                        <textarea
                          value={Array.isArray(formData?.summary?.skills) ? formData.summary.skills.join(', ') : formData?.summary?.skills || ''}
                          onChange={(e) => updateField('summary', 'skills', e.target.value.split(',').map(s => s.trim()))}
                          placeholder="技能，用逗号分隔"
                          className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs w-full mt-1"
                          rows={2}
                        />
                      ) : (
                        <span className="ml-1 font-medium">
                          {formData?.summary?.skills ? 
                            (Array.isArray(formData.summary.skills) ? 
                              formData.summary.skills.slice(0, 5).join(', ') : 
                              formData.summary.skills.slice(0, 50)
                            ) : '未填写'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 工作经历 */}
                {formData?.work_experiences && formData.work_experiences.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">工作经历</h4>
                    <div className="space-y-2">
                      {formData.work_experiences.slice(0, 3).map((work: any, index: number) => (
                        <div key={index} className="text-xs border border-gray-200 rounded p-2">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={work.company_name || ''}
                                onChange={(e) => updateWorkExperience(index, 'company_name', e.target.value)}
                                placeholder="公司名称"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <input
                                type="text"
                                value={work.position || ''}
                                onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                                placeholder="职位"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <div className="grid grid-cols-2 gap-1">
                                <input
                                  type="date"
                                  value={work.start_date?.slice(0, 10) || ''}
                                  onChange={(e) => updateWorkExperience(index, 'start_date', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                                <input
                                  type="date"
                                  value={work.end_date?.slice(0, 10) || ''}
                                  onChange={(e) => updateWorkExperience(index, 'end_date', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{work.company_name}</div>
                              <div className="text-gray-600">{work.position} | {work.start_date?.slice(0, 7)} - {work.end_date?.slice(0, 7) || '至今'}</div>
                            </>
                          )}
                        </div>
                      ))}
                      {formData.work_experiences.length > 3 && (
                        <div className="text-xs text-gray-500">还有 {formData.work_experiences.length - 3} 条工作经历...</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 教育经历 */}
                {formData?.education_experiences && formData.education_experiences.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">教育经历</h4>
                    <div className="space-y-2">
                      {formData.education_experiences.slice(0, 2).map((edu: any, index: number) => (
                        <div key={index} className="text-xs border border-gray-200 rounded p-2">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={edu.school || ''}
                                onChange={(e) => updateEducationExperience(index, 'school', e.target.value)}
                                placeholder="学校名称"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <input
                                type="text"
                                value={edu.major || ''}
                                onChange={(e) => updateEducationExperience(index, 'major', e.target.value)}
                                placeholder="专业"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <input
                                type="text"
                                value={edu.degree || ''}
                                onChange={(e) => updateEducationExperience(index, 'degree', e.target.value)}
                                placeholder="学位"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <div className="grid grid-cols-2 gap-1">
                                <input
                                  type="date"
                                  value={edu.start_date?.slice(0, 10) || ''}
                                  onChange={(e) => updateEducationExperience(index, 'start_date', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                                <input
                                  type="date"
                                  value={edu.end_date?.slice(0, 10) || ''}
                                  onChange={(e) => updateEducationExperience(index, 'end_date', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{edu.school}</div>
                              <div className="text-gray-600">{edu.major} | {edu.degree} | {edu.start_date?.slice(0, 7)} - {edu.end_date?.slice(0, 7)}</div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI分析 */}
                {formData?.ai_analysis && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">AI分析</h4>
                    <div className="text-xs text-gray-700">
                      {isEditing ? (
                        <textarea
                          value={formData.ai_analysis.profile || ''}
                          onChange={(e) => updateField('ai_analysis', 'profile', e.target.value)}
                          placeholder="AI分析内容"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          rows={4}
                        />
                      ) : (
                        formData.ai_analysis.profile ? 
                          formData.ai_analysis.profile.slice(0, 100) + (formData.ai_analysis.profile.length > 100 ? '...' : '') : 
                          '暂无AI分析'
                      )}
                    </div>
                  </div>
                )}

                {/* 追溯信息 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">追溯信息</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">简历编号:</span>
                      <span className="ml-1 font-medium">{formData?.basic_info?.resume_number || '未生成'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">上传时间:</span>
                      <span className="ml-1 font-medium">{selectedDraft?.created_at?.slice(0, 19).replace('T', ' ') || '未知'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}