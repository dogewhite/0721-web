import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { projectApi } from "@/lib/api";
import { toast } from "sonner";

interface Company {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company: Company;
}

const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  company
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("请输入项目名称");
      return;
    }

    setLoading(true);
    try {
      await projectApi.createProject({
        company_id: company.id,
        name: formData.title,  // 修改为name
        description: formData.description,
        status: formData.status
      });

      toast.success("项目创建成功");
      onSuccess();
      onClose();
      setFormData({
        title: "",
        description: "",
        status: "active"
      });
    } catch (error) {
      console.error("创建项目失败:", error);
      toast.error("创建项目失败");
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
            className="relative w-full max-w-md mx-4"
          >
            <Card className="p-6">
              {/* 标题 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">创建项目</h2>
                    <p className="text-sm text-gray-600">在 {company.name} 下创建新项目</p>
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

              {/* 表单 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目名称 *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入项目名称"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入项目描述"
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="paused">已暂停</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>

                {/* 预览区域 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">预览</h3>
                  <div className="text-sm text-gray-600">
                    <p><strong>所属公司:</strong> {company.name}</p>
                    <p><strong>项目名称:</strong> {formData.title || "未填写"}</p>
                    <p><strong>项目描述:</strong> {formData.description || "未填写"}</p>
                    <p><strong>项目状态:</strong> {
                      formData.status === 'active' ? '进行中' :
                      formData.status === 'completed' ? '已完成' :
                      formData.status === 'paused' ? '已暂停' : '已取消'
                    }</p>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 pt-4">
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
                  >
                    {loading ? "创建中..." : "创建项目"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectCreateModal; 