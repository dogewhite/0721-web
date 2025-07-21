import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { projectApi } from "@/lib/api";
import { toast } from "sonner";
import { getSafeNumberValue } from "@/lib/utils";

interface Project {
  id: number;
  company_id: number;
  name: string;  // 修改为name
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PositionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project;
}

const PositionCreateModal: React.FC<PositionCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    salary_range: "",
    count: "",
    status: "active"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("请输入职位名称");
      return;
    }

    setLoading(true);
    try {
      await projectApi.createPosition(project.id.toString(), {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        salary_range: formData.salary_range,
        count: formData.count ? parseInt(formData.count) : 0,
        status: formData.status
      });

      toast.success("职位创建成功");
      onSuccess();
      onClose();
      setFormData({
        title: "",
        description: "",
        requirements: "",
        salary_range: "",
        count: "",
        status: "active"
      });
    } catch (error) {
      console.error("创建职位失败:", error);
      toast.error("创建职位失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        title: "",
        description: "",
        requirements: "",
        salary_range: "",
        count: "",
        status: "active"
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />
          
          {/* 模态框内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg mx-4"
            style={{height: '600px'}}
          >
            <Card className="flex flex-col h-full">
              {/* 固定头部 */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-1.5 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">创建职位</h2>
                    <p className="text-xs text-gray-600">在项目 {project.name} 下创建新职位</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClose}
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* 可滚动的表单内容 */}
              <div className="flex-1 overflow-y-auto p-3">
                <form onSubmit={handleSubmit} className="space-y-2">
                  {/* 表单字段开始 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职位名称 *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入职位名称"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职位描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入职位描述"
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职位要求
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="请输入职位要求"
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      薪资范围
                    </label>
                    <Input
                      type="text"
                      value={formData.salary_range}
                      onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                      placeholder="如：15K-25K"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      需求人数
                    </label>
                    <Input
                      type="number"
                      value={getSafeNumberValue(formData.count)}
                      onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                      placeholder="0"
                      min="0"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职位状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">招聘中</option>
                    <option value="paused">已暂停</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>

                  {/* 预览区域 - 简化版 */}
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">
                      <div className="grid grid-cols-2 gap-1">
                        <p><strong>项目:</strong> {project.name}</p>
                        <p><strong>职位:</strong> {formData.title || "未填写"}</p>
                        <p><strong>薪资:</strong> {formData.salary_range || "未填写"}</p>
                        <p><strong>人数:</strong> {formData.count || "0"}</p>
                        <p><strong>状态:</strong> {
                      formData.status === 'active' ? '招聘中' :
                      formData.status === 'paused' ? '已暂停' :
                      formData.status === 'completed' ? '已完成' : '已取消'
                    }</p>
                  </div>
                    </div>
                  </div>
                </form>
                </div>

              {/* 固定底部按钮 */}
              <div className="border-t border-gray-200 p-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || !formData.title.trim()}
                    onClick={handleSubmit}
                  >
                    {loading ? "创建中..." : "创建职位"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PositionCreateModal; 