import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Users, X } from "lucide-react";
import { projectApi } from "@/lib/api";
import { toast } from "sonner";
import { getSafeNumberValue } from "@/lib/utils";

interface Position {
  id: number;
  project_id: number;
  title: string;
  description: string;
  requirements: string;
  salary_range: string;
  count: number;
  status: string;
}

interface Project { id:number; name:string }

interface PositionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project;
  position: Position | null;
}

const PositionEditModal: React.FC<PositionEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project,
  position
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    salary_range: "",
    count: 0,
    status: "active"
  });
  const [loading, setLoading] = useState(false);

  // 同步选中职位
  useEffect(() => {
    if (position) {
      setFormData({
        title: position.title || position.name || "",
        description: position.description || "",
        requirements: position.requirements || "",
        salary_range: position.salary_range || "",
        count: position.count ?? 0,
        status: position.status || "active"
      });
    }
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) return;

    if (!formData.title.trim()) {
      toast.error("请输入职位名称");
      return;
    }

    setLoading(true);
    try {
      await projectApi.updatePosition(position.id.toString(), {
        name: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        salary_range: formData.salary_range,
        count: formData.count,
        status: formData.status
      });
      toast.success("职位更新成功");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("更新职位失败:", error);
      toast.error("更新职位失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && position && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg mx-4"
            style={{ height: "600px" }}
          >
            <Card className="flex flex-col h-full">
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-1.5 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">编辑职位</h2>
                    <p className="text-xs text-gray-600">项目 {project.name}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <form onSubmit={handleSubmit} className="space-y-2">
                  {/* Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">职位名称 *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">职位描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">职位要求</label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">薪资范围</label>
                      <Input
                        value={formData.salary_range}
                        onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">需求人数</label>
                      <Input
                        type="number"
                        value={getSafeNumberValue(formData.count)}
                        onChange={(e) => setFormData({ ...formData, count: Number(e.target.value) })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">职位状态</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={loading}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="active">招聘中</option>
                      <option value="paused">已暂停</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>保存修改</Button>
                </form>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PositionEditModal; 