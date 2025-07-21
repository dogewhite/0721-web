import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useTalentStore } from '../stores/talentStore';
import ResumePreview from './ResumePreview';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Copy as CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TalentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResumePosition {
  id: number;
  name: string;
  status: string;
  project: {
    id: number;
    name: string;
    company: {
      id: number;
      name: string;
    };
  };
  candidate_status?: string;
  candidate_notes?: string;
}

const drawerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' },
};

export const TalentDetailModal = ({ isOpen, onClose }: TalentDetailModalProps) => {
  const { selectedTalent, isLoadingDetail } = useTalentStore();
  const [positions, setPositions] = React.useState<ResumePosition[]>([]);
  const [loadingPositions, setLoadingPositions] = React.useState(false);

  // 字段安全渲染
  const safe = (v: any) => (v !== null && v !== undefined && v !== '' ? v : '暂无');

  // 日期格式化
  const formatDate = (date: any): string => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (Number.isNaN(d.getTime())) return String(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return String(date);
    }
  };

  // 计算年龄
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}岁`;
  };

  // 当打开弹窗且 selectedTalent 变化时获取候选人关联职位
  React.useEffect(() => {
    const fetchPositions = async () => {
      if (!selectedTalent?.id) {
        setPositions([]);
        return;
      }
      setLoadingPositions(true);
      try {
        const res = await fetch(`/api/resume/${selectedTalent.id}/positions`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPositions(data.data || []);
          } else {
            setPositions([]);
          }
        } else {
          setPositions([]);
        }
      } catch (e) {
        setPositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };

    if (isOpen) {
      fetchPositions();
    }
  }, [isOpen, selectedTalent?.id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-y-0 right-0 z-50 flex items-stretch"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={drawerVariants}
          transition={{ type: 'tween', duration: 0.35 }}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="relative bg-white dark:bg-gray-800 h-full shadow-xl flex flex-col"
            style={{ width: 720, marginRight: 32, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
          >
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-tl-lg">
              <h2 className="text-xl font-semibold">人才详情</h2>
              <Button variant="ghost" onClick={onClose}>关闭</Button>
            </div>
            
            {isLoadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : selectedTalent ? (
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* 基本信息 */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">基本信息</h3>
                      {selectedTalent.resume_number && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">简历编号：{selectedTalent.resume_number}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedTalent.resume_number);
                              toast.success('简历编号已复制');
                            }}
                          >
                            <CopyIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-6">
                      {/* 左侧信息 */}
                      <div className="space-y-2 flex-1">
                        <p><span className="font-medium">姓名：</span>{safe(selectedTalent.chinese_name)}</p>
                        <p><span className="font-medium">性别：</span>{safe(selectedTalent.gender)}</p>
                        <p><span className="font-medium">年龄：</span>{calculateAge(selectedTalent.birth_date)}</p>
                        <p><span className="font-medium">居住地：</span>{safe(selectedTalent.current_city)}</p>
                        <p><span className="font-medium">期望职位：</span>{safe(selectedTalent.expected_position)}</p>
                        <p><span className="font-medium">期望薪资：</span>{safe(selectedTalent.expected_salary_monthly)}</p>
                        <p><span className="font-medium">工作经验：</span>{safe(selectedTalent.summary_total_years)}</p>
                        <p><span className="font-medium">联系方式：</span>{safe(selectedTalent.phone)}</p>
                        <p><span className="font-medium">邮箱：</span>{safe(selectedTalent.email)}</p>
                      </div>
                      {/* 头像 */}
                      {selectedTalent.avatar_url && (
                        <img
                          src={selectedTalent.avatar_url}
                          alt="avatar"
                          className="w-24 h-24 rounded-lg object-cover border"
                        />
                      )}
                    </div>
                  </Card>
                  
                  {/* 教育经历 */}
                  {selectedTalent.education_experiences?.length > 0 && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-4">教育经历</h3>
                      <div className="space-y-4">
                        {selectedTalent.education_experiences.map((edu: any, index: number) => (
                          <div key={index} className="space-y-1 border-b last:border-0 pb-4 last:pb-0">
                            <div className="font-medium text-base">{safe(edu.school)}</div>
                            <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                              <span>{safe(edu.major)}</span>
                              <span>{safe(edu.degree)}</span>
                              <span>{formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : '至今'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* 工作经历 */}
                  {selectedTalent.work_experiences?.length > 0 && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-4">工作经历</h3>
                      <div className="space-y-6">
                        {selectedTalent.work_experiences.map((work: any, index: number) => (
                          <div key={index} className="space-y-1 border-b last:border-0 pb-6 last:pb-0">
                            <div className="font-medium text-base flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <span>{safe(work.company_name)} | {safe(work.position)}</span>
                              <span className="text-sm text-gray-500 mt-1 sm:mt-0">{formatDate(work.start_date)} - {work.end_date ? formatDate(work.end_date) : '至今'}</span>
                            </div>
                            <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                              {work.department && <span>{work.department}</span>}
                              {work.company_location && <span>{work.company_location}</span>}
                            </div>
                            {work.job_description && (
                              <p className="whitespace-pre-wrap text-sm text-gray-700 mt-2">{work.job_description}</p>
                            )}
                            {work.achievements?.length > 0 && (
                              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
                                {work.achievements.map((ach: any, idx: number) => (
                                  <li key={idx}>{ach}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* 技能与语言 */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">技能与语言</h3>
                    {/* 技能标签 */}
                    {selectedTalent.skills?.length > 0 && (
                      <div className="mb-4">
                        <p className="font-medium mb-2">技能：</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTalent.skills.map((skill: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 语言能力 */}
                    {selectedTalent.languages?.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">语言能力：</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTalent.languages.map((lang: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-xs">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* 个人评价 */}
                  {selectedTalent.ai_profile && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-4">个人评价</h3>
                      <div className="whitespace-pre-wrap text-sm text-gray-600">
                        {selectedTalent.ai_profile}
                      </div>
                    </Card>
                  )}

                  {/* 项目 / 职位归属 */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">项目 / 职位归属</h3>
                    {loadingPositions ? (
                      <div className="flex items-center text-gray-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />加载中...
                      </div>
                    ) : positions.length > 0 ? (
                      <div className="space-y-4">
                        {positions.map((pos) => (
                          <div key={pos.id} className="border-b pb-3 last:border-0 last:pb-0">
                            <p><span className="font-medium">公司：</span>{pos.project.company.name}</p>
                            <p><span className="font-medium">项目：</span>{pos.project.name}</p>
                            <p><span className="font-medium">职位：</span>{pos.name}</p>
                            <p><span className="font-medium">候选人状态：</span>{pos.candidate_status || '-'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">暂无关联项目/职位</p>
                    )}
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-gray-600">暂无详情数据</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 