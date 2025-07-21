import React, { useEffect, useState } from 'react';
import { getDraftList, deleteDraft, batchConfirmDrafts, batchDeleteDrafts } from '../api/draftResume';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, CheckSquare, Square } from 'lucide-react';

const ResumeDraftList: React.FC = () => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const pageSize = 12;
  const navigate = useNavigate();

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await getDraftList({ page, page_size: pageSize });
      setDrafts(res.data.data);
      setTotal(res.data.pagination.total);
      setSelectedIds([]); // 重置选择
    } catch (error) {
      toast.error('获取草稿列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [page]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定要删除草稿简历"${name}"吗？`)) return;
    try {
      await deleteDraft(id);
      toast.success('删除成功');
      fetchDrafts();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === drafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(drafts.map(d => d.id));
    }
  };

  const handleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchConfirm = async () => {
    if (selectedIds.length === 0) {
      toast.warning('请选择要确认的草稿简历');
      return;
    }
    if (!window.confirm(`确定要批量确认 ${selectedIds.length} 个草稿简历吗？`)) return;
    
    setBatchLoading(true);
    try {
      const res = await batchConfirmDrafts(selectedIds);
      toast.success(res.data.message);
      fetchDrafts();
    } catch (error) {
      toast.error('批量确认失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.warning('请选择要删除的草稿简历');
      return;
    }
    if (!window.confirm(`确定要批量删除 ${selectedIds.length} 个草稿简历吗？`)) return;
    
    setBatchLoading(true);
    try {
      const res = await batchDeleteDrafts(selectedIds);
      toast.success(res.data.message);
      fetchDrafts();
    } catch (error) {
      toast.error('批量删除失败');
    } finally {
      setBatchLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">草稿简历管理</h1>
          <p className="text-gray-600 mt-2">管理通过Kimi AI标准化的简历草稿，审核后入库</p>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-800 font-medium">
                已选择 {selectedIds.length} 个草稿简历
              </span>
              <button
                onClick={handleBatchConfirm}
                disabled={batchLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {batchLoading ? '处理中...' : '批量确认'}
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={batchLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {batchLoading ? '处理中...' : '批量删除'}
              </button>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="text-blue-600 hover:text-blue-800"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无草稿简历</h3>
          <p className="text-gray-500">上传简历后将在此显示待审核的草稿</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {drafts.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* 选择框 */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => handleSelect(item.id)}
                      className="flex items-center justify-center w-5 h-5"
                    >
                      {selectedIds.includes(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.chinese_name || '未填写姓名'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.gender} • {item.current_city || '未填写城市'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">期望职位:</span>
                      <span className="ml-2">{item.expected_position || '未填写'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">手机号:</span>
                      <span className="ml-2">{item.phone || '未填写'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">邮箱:</span>
                      <span className="ml-2 truncate">{item.email || '未填写'}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    上传时间: {item.created_at?.slice(0, 19).replace('T', ' ')}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/resume/draft/${item.id}`)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看详情
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.chinese_name)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 全选和分页 */}
          <div className="flex justify-between items-center mt-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {selectedIds.length === drafts.length ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>全选</span>
              </button>
              {selectedIds.length > 0 && (
                <span className="text-sm text-gray-500">
                  已选择 {selectedIds.length} / {drafts.length}
                </span>
              )}
            </div>

            {/* 分页 */}
            {total > pageSize && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-gray-700">
                  第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeDraftList; 