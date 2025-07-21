import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Calendar, DollarSign, Users, Target, TrendingUp, Clock, Award } from "lucide-react";
import { Project, ProjectStatus } from "@/stores/projectStore";

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const ProjectDetailModal = ({ project, isOpen, onClose, onEdit }: ProjectDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "positions" | "candidates" | "timeline">("overview");

  if (!isOpen || !project) return null;

  // 状态颜色映射
  const statusColors = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    paused: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800"
  };

  // 状态文本映射
  const statusTexts = {
    active: "进行中",
    completed: "已完成",
    paused: "已暂停",
    cancelled: "已取消"
  };

  // 计算进度百分比
  const getProgress = () => {
    return project.positions > 0 ? (project.hired / project.positions) * 100 : 0;
  };

  // 计算成功率
  const getSuccessRate = () => {
    return project.candidates > 0 ? (project.hired / project.candidates) * 100 : 0;
  };

  // 计算平均成本
  const getAverageCost = () => {
    return project.hired > 0 ? project.budget / project.hired : 0;
  };

  // 计算项目持续时间
  const getProjectDuration = () => {
    const start = new Date(project.startDate);
    const end = project.endDate ? new Date(project.endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
      >
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 text-sm">创建于 {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                {statusTexts[project.status]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={onEdit}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  编辑项目
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "概览", icon: Target },
              { id: "positions", label: "职位", icon: Users },
              { id: "candidates", label: "候选人", icon: Award },
              { id: "timeline", label: "时间线", icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 项目描述 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">项目描述</h3>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </Card>

              {/* 关键指标 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">招聘进度</p>
                      <p className="text-2xl font-bold text-blue-600">{getProgress().toFixed(1)}%</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>已招聘</span>
                      <span>{project.hired}/{project.positions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">候选人总数</p>
                      <p className="text-2xl font-bold text-green-600">{project.candidates}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    成功率: {getSuccessRate().toFixed(1)}%
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">项目预算</p>
                      <p className="text-2xl font-bold text-purple-600">¥{project.budget.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    平均: ¥{getAverageCost().toLocaleString()}/人
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">项目周期</p>
                      <p className="text-2xl font-bold text-orange-600">{getProjectDuration()}天</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {project.endDate ? "已结束" : "进行中"}
                  </p>
                </Card>
              </div>

              {/* 时间信息 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">时间信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">开始日期</p>
                    <p className="text-lg font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                  {project.endDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">结束日期</p>
                      <p className="text-lg font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">最后更新</p>
                    <p className="text-lg font-medium">{new Date(project.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "positions" && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">职位信息</h3>
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">💼</div>
                  <p className="text-gray-600">职位管理功能开发中...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    目前计划招聘 {project.positions} 个职位，已招聘 {project.hired} 人
                  </p>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">候选人管理</h3>
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <p className="text-gray-600">候选人管理功能开发中...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    目前共有 {project.candidates} 名候选人
                  </p>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">项目时间线</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">项目创建</p>
                      <p className="text-sm text-gray-600">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">项目开始</p>
                      <p className="text-sm text-gray-600">{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">最后更新</p>
                      <p className="text-sm text-gray-600">{new Date(project.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">项目结束</p>
                        <p className="text-sm text-gray-600">{new Date(project.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectDetailModal; 