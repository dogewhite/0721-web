import React, { useEffect, useState } from 'react';
import { getDraftDetail, confirmDraft, updateDraft } from '../api/draftResume';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getSafeNumberValue } from '@/lib/utils';

const ResumeDraftDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDraftDetail(Number(id)).then((res) => {
      setData(res.data.data);
      setFormData(res.data.data);
      setLoading(false);
    });
  }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm('确认无误，提交入库？')) return;
    setConfirming(true);
    try {
      await confirmDraft(Number(id));
      toast.success('入库成功！');
      navigate('/resume/draft');
    } catch (error) {
      toast.error('入库失败');
    } finally {
      setConfirming(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDraft(Number(id), formData);
      toast.success('保存成功！');
      setIsEditing(false);
      // 重新加载数据
      const res = await getDraftDetail(Number(id));
      setData(res.data.data);
      setFormData(res.data.data);
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(data);
    setIsEditing(false);
  };

  const updateField = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayField = (section: string, index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: prev[section].map((item: any, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  if (loading || !data) return <div className="flex justify-center items-center h-64">加载中...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">草稿简历详情</h1>
        <div className="space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                编辑
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {confirming ? '提交中...' : '确认入库'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 基本信息（合并原基本+联系） */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          {/* 中文姓名 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">中文姓名</label>
            <input type="text" value={formData?.basic_info?.chinese_name || ''} onChange={e => updateField('basic_info', 'chinese_name', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 英文姓名 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">英文姓名</label>
            <input type="text" value={formData?.basic_info?.english_name || ''} onChange={e => updateField('basic_info', 'english_name', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 性别 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">性别</label>
            <select value={formData?.basic_info?.gender || ''} onChange={e => updateField('basic_info', 'gender', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm">
              <option value="">请选择</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          {/* 出生日期 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">出生日期</label>
            <input type="date" value={formData?.basic_info?.birth_date || ''} onChange={e => updateField('basic_info', 'birth_date', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 籍贯 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">籍贯</label>
            <input type="text" value={formData?.basic_info?.native_place || ''} onChange={e => updateField('basic_info', 'native_place', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 现居城市 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">现居城市</label>
            <input type="text" value={formData?.basic_info?.current_city || ''} onChange={e => updateField('basic_info', 'current_city', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 政治面貌 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">政治面貌</label>
            <input type="text" value={formData?.basic_info?.political_status || ''} onChange={e => updateField('basic_info', 'political_status', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 婚姻状况 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">婚姻状况</label>
            <input type="text" value={formData?.basic_info?.marital_status || ''} onChange={e => updateField('basic_info', 'marital_status', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 健康状况 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">健康状况</label>
            <input type="text" value={formData?.basic_info?.health || ''} onChange={e => updateField('basic_info', 'health', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 身高 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">身高(cm)</label>
            <input type="text" value={formData?.basic_info?.height_cm || ''} onChange={e => updateField('basic_info', 'height_cm', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 体重 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">体重(kg)</label>
            <input type="text" value={formData?.basic_info?.weight_kg || ''} onChange={e => updateField('basic_info', 'weight_kg', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 性格特点 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">性格特点</label>
            <input type="text" value={formData?.basic_info?.personality || ''} onChange={e => updateField('basic_info', 'personality', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 头像 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">头像</label>
            {formData?.basic_info?.avatar_url && <img src={formData.basic_info.avatar_url} alt="头像" className="w-12 h-12 rounded-full mb-1" />}
            <input type="text" value={formData?.basic_info?.avatar_url || ''} onChange={e => updateField('basic_info', 'avatar_url', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="头像URL" />
          </div>
          {/* 手机号 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">手机号</label>
            <input type="tel" value={formData?.basic_info?.phone || ''} onChange={e => updateField('basic_info', 'phone', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 邮箱 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">邮箱</label>
            <input type="email" value={formData?.basic_info?.email || ''} onChange={e => updateField('basic_info', 'email', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 微信 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">微信</label>
            <input type="text" value={formData?.basic_info?.wechat || ''} onChange={e => updateField('basic_info', 'wechat', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          {/* 方便联系时间 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">方便联系时间</label>
            <input type="text" value={formData?.basic_info?.contact_time_preference || ''} onChange={e => updateField('basic_info', 'contact_time_preference', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
        </div>
      </div>

      {/* 工作经历、项目经历、教育经历优先级提升 */}
      {/* 工作经历 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">工作经历</h2>
        {formData?.work_experiences?.map((exp: any, index: number) => (
          <div key={index} className="border rounded p-2 mb-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">公司名称</label>
                <input type="text" value={exp.company_name || ''} onChange={e => updateArrayField('work_experiences', index, 'company_name', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">公司简介</label>
                <input type="text" value={exp.company_intro || ''} onChange={e => updateArrayField('work_experiences', index, 'company_intro', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">公司规模</label>
                <input type="text" value={exp.company_size || ''} onChange={e => updateArrayField('work_experiences', index, 'company_size', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">公司类型</label>
                <input type="text" value={exp.company_type || ''} onChange={e => updateArrayField('work_experiences', index, 'company_type', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">公司阶段</label>
                <input type="text" value={exp.company_stage || ''} onChange={e => updateArrayField('work_experiences', index, 'company_stage', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">公司地点</label>
                <input type="text" value={exp.company_location || ''} onChange={e => updateArrayField('work_experiences', index, 'company_location', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">职位</label>
                <input type="text" value={exp.position || ''} onChange={e => updateArrayField('work_experiences', index, 'position', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">部门</label>
                <input type="text" value={exp.department || ''} onChange={e => updateArrayField('work_experiences', index, 'department', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">开始日期</label>
                <input type="date" value={exp.start_date || ''} onChange={e => updateArrayField('work_experiences', index, 'start_date', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">结束日期</label>
                <input type="date" value={exp.end_date || ''} onChange={e => updateArrayField('work_experiences', index, 'end_date', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">当前状态</label>
                <input type="text" value={exp.current_status || ''} onChange={e => updateArrayField('work_experiences', index, 'current_status', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">汇报对象</label>
                <input type="text" value={exp.report_to || ''} onChange={e => updateArrayField('work_experiences', index, 'report_to', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">下属人数</label>
                <input type="text" value={exp.subordinates || ''} onChange={e => updateArrayField('work_experiences', index, 'subordinates', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">工作描述</label>
              <textarea value={exp.job_description || ''} onChange={e => updateArrayField('work_experiences', index, 'job_description', e.target.value)} disabled={!isEditing} rows={4} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">工作详情</label>
              <textarea value={Array.isArray(exp.job_details) ? exp.job_details.join(', ') : ''} onChange={e => updateArrayField('work_experiences', index, 'job_details', e.target.value.split(',').map((s: string) => s.trim()))} disabled={!isEditing} rows={3} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个详情用逗号分隔" />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">工作成就</label>
              <textarea value={Array.isArray(exp.achievements) ? exp.achievements.join(', ') : ''} onChange={e => updateArrayField('work_experiences', index, 'achievements', e.target.value.split(',').map((s: string) => s.trim()))} disabled={!isEditing} rows={3} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个成就用逗号分隔" />
            </div>
          </div>
        ))}
      </div>

      {/* 项目经历 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">项目经历</h2>
        {formData?.project_experiences?.map((exp: any, index: number) => (
          <div key={index} className="border rounded p-2 mb-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">项目名称</label>
                <input type="text" value={exp.project_name || ''} onChange={e => updateArrayField('project_experiences', index, 'project_name', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">角色</label>
                <input type="text" value={exp.role || ''} onChange={e => updateArrayField('project_experiences', index, 'role', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">开始日期</label>
                <input type="date" value={exp.start_date || ''} onChange={e => updateArrayField('project_experiences', index, 'start_date', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">结束日期</label>
                <input type="date" value={exp.end_date || ''} onChange={e => updateArrayField('project_experiences', index, 'end_date', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">项目简介</label>
              <textarea value={exp.project_intro || ''} onChange={e => updateArrayField('project_experiences', index, 'project_intro', e.target.value)} disabled={!isEditing} rows={2} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">项目成就</label>
              <input type="text" value={exp.project_achievements || ''} onChange={e => updateArrayField('project_experiences', index, 'project_achievements', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* 教育经历 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">教育经历</h2>
        {formData?.education_experiences?.map((exp: any, index: number) => (
          <div key={index} className="border rounded p-2 mb-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">学校名称</label>
                <input type="text" value={exp.school || ''} onChange={e => updateArrayField('education_experiences', index, 'school', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">专业</label>
                <input type="text" value={exp.major || ''} onChange={e => updateArrayField('education_experiences', index, 'major', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">学位</label>
                <select value={exp.degree || ''} onChange={e => updateArrayField('education_experiences', index, 'degree', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm">
                  <option value="">请选择</option>
                  <option value="本科">本科</option>
                  <option value="硕士">硕士</option>
                  <option value="博士">博士</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">开始日期</label>
                <input type="date" value={exp.start_date || ''} onChange={e => updateArrayField('education_experiences', index, 'start_date', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">结束日期</label>
                <input type="date" value={exp.end_date || ''} onChange={e => updateArrayField('education_experiences', index, 'end_date', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">主要课程</label>
                <input type="text" value={Array.isArray(exp.main_courses) ? exp.main_courses.join(', ') : ''} onChange={e => updateArrayField('education_experiences', index, 'main_courses', e.target.value.split(',').map((s: string) => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个课程用逗号分隔" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">证书</label>
                <input type="text" value={Array.isArray(exp.certificates) ? exp.certificates.join(', ') : ''} onChange={e => updateArrayField('education_experiences', index, 'certificates', e.target.value.split(',').map((s: string) => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个证书用逗号分隔" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">排名</label>
                <input type="text" value={exp.ranking || ''} onChange={e => updateArrayField('education_experiences', index, 'ranking', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 期望信息、总结信息、AI分析、追溯信息依次排在后面，样式同样紧凑 */}
      {/* 期望信息 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">期望信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望职位</label>
            <input type="text" value={formData?.expectations?.position || ''} onChange={e => updateField('expectations', 'position', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望年薪(万元)</label>
            <input type="number" value={getSafeNumberValue(formData?.expectations?.salary_yearly)} onChange={e => updateField('expectations', 'salary_yearly', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="万元" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望月薪(元)</label>
            <input type="number" value={getSafeNumberValue(formData?.expectations?.salary_monthly)} onChange={e => updateField('expectations', 'salary_monthly', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="元" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望城市</label>
            <input type="text" value={Array.isArray(formData?.expectations?.cities) ? formData.expectations.cities.join(', ') : ''} onChange={e => updateField('expectations', 'cities', e.target.value.split(',').map(s => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个城市用逗号分隔" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望行业</label>
            <input type="text" value={Array.isArray(formData?.expectations?.industries) ? formData.expectations.industries.join(', ') : ''} onChange={e => updateField('expectations', 'industries', e.target.value.split(',').map(s => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个行业用逗号分隔" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望公司性质</label>
            <input type="text" value={formData?.expectations?.company_nature || ''} onChange={e => updateField('expectations', 'company_nature', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望公司规模</label>
            <input type="text" value={formData?.expectations?.company_size || ''} onChange={e => updateField('expectations', 'company_size', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望公司阶段</label>
            <input type="text" value={formData?.expectations?.company_stage || ''} onChange={e => updateField('expectations', 'company_stage', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">期望工作地点范围(公里)</label>
            <input type="text" value={formData?.expectations?.location_range_km || ''} onChange={e => updateField('expectations', 'location_range_km', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">其他条件</label>
            <input type="text" value={formData?.expectations?.additional_conditions || ''} onChange={e => updateField('expectations', 'additional_conditions', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">求职状态</label>
            <input type="text" value={formData?.expectations?.job_search_status || ''} onChange={e => updateField('expectations', 'job_search_status', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
        </div>
      </div>

      {/* 总结信息 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">总结信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">工作年限</label>
            <input type="number" value={getSafeNumberValue(formData?.summary?.total_years)} onChange={e => updateField('summary', 'total_years', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="年" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">行业经验</label>
            <input type="text" value={Array.isArray(formData?.summary?.industries) ? formData.summary.industries.join(', ') : ''} onChange={e => updateField('summary', 'industries', e.target.value.split(',').map(s => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个行业用逗号分隔" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">角色经验</label>
            <input type="text" value={Array.isArray(formData?.summary?.roles) ? formData.summary.roles.join(', ') : ''} onChange={e => updateField('summary', 'roles', e.target.value.split(',').map(s => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个角色用逗号分隔" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">技能</label>
            <input type="text" value={Array.isArray(formData?.summary?.skills) ? formData.summary.skills.join(', ') : ''} onChange={e => updateField('summary', 'skills', e.target.value.split(',').map(s => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个技能用逗号分隔" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">获奖情况</label>
            <input type="text" value={Array.isArray(formData?.summary?.awards) ? formData.summary.awards.join(', ') : ''} onChange={e => updateField('summary', 'awards', e.target.value.split(',').map(s => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个奖项用逗号分隔" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">语言能力</label>
            <input type="text" value={Array.isArray(formData?.summary?.languages) ? formData.summary.languages.join(', ') : ''} onChange={e => updateField('summary', 'languages', e.target.value.split(',').map(s => s.trim()))} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" placeholder="多个语言用逗号分隔" />
          </div>
        </div>
      </div>

      {/* AI分析 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">AI分析</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">AI个人简介</label>
            <textarea value={formData?.ai_analysis?.profile || ''} onChange={e => updateField('ai_analysis', 'profile', e.target.value)} disabled={!isEditing} rows={2} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">AI SWOT分析</label>
            <textarea value={typeof formData?.ai_analysis?.swot === 'string' ? formData.ai_analysis.swot : JSON.stringify(formData?.ai_analysis?.swot || '', null, 2)} onChange={e => updateField('ai_analysis', 'swot', e.target.value)} disabled={!isEditing} rows={2} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">AI职业阶段</label>
            <input type="text" value={formData?.ai_analysis?.career_stage || ''} onChange={e => updateField('ai_analysis', 'career_stage', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">AI性格分析</label>
            <input type="text" value={formData?.ai_analysis?.personality || ''} onChange={e => updateField('ai_analysis', 'personality', e.target.value)} disabled={!isEditing} className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 text-sm" />
          </div>
        </div>
      </div>

      {/* 追溯信息 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">追溯信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">简历编号</label>
            <input type="text" value={formData?.basic_info?.resume_number || ''} onChange={e => updateField('basic_info', 'resume_number', e.target.value)} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">草稿状态</label>
            <input type="text" value={formData?.basic_info?.draft_status || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">审核备注</label>
            <input type="text" value={formData?.basic_info?.review_notes || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Kimi文件ID</label>
            <input type="text" value={formData?.basic_info?.kimi_file_id || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">原始文件名</label>
            <input type="text" value={formData?.basic_info?.original_filename || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">上传来源</label>
            <input type="text" value={formData?.basic_info?.upload_source || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">文件格式类型</label>
            <input type="text" value={formData?.basic_info?.file_format || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">OSS路径</label>
            <input type="text" value={formData?.basic_info?.oss_path || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">OSS URL</label>
            <input type="text" value={formData?.basic_info?.oss_url || ''} disabled className="w-full px-2 py-1 border rounded bg-gray-100 text-sm" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResumeDraftDetail; 