import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { companyApi } from "@/lib/api";
import { toast } from "sonner";

interface Company {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface CompanyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company: Company;
}

const CompanyEditModal: React.FC<CompanyEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  company
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);

  // 当公司数据变化时，更新表单数据
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        description: company.description || ""
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("请输入公司名称");
      return;
    }

    setLoading(true);
    try {
      await companyApi.updateCompany(company.id.toString(), {
        name: formData.name,
        description: formData.description
      });

      toast.success("公司信息更新成功");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("更新公司失败:", error);
      toast.error("更新公司失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // 重置表单数据为原始数据
      if (company) {
        setFormData({
          name: company.name || "",
          description: company.description || ""
        });
      }
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
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">编辑公司</h2>
                    <p className="text-sm text-gray-600">修改公司基本信息</p>
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
                    公司名称 *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入公司名称"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公司描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入公司描述（可选）"
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* 预览区域 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">预览</h3>
                  <div className="text-sm text-gray-600">
                    <p><strong>公司名称:</strong> {formData.name || "未填写"}</p>
                    <p><strong>公司描述:</strong> {formData.description || "未填写"}</p>
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
                    disabled={loading || !formData.name.trim()}
                  >
                    {loading ? "更新中..." : "更新公司"}
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

export default CompanyEditModal; 