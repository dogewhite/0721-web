import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { smartSearchApi } from "@/lib/api";
import { generateTaskId, cachePositionSelection } from "../api/draftResume";

// 定义分析结果的类型接口
interface AnalysisResult {
  job_title: string;
  skills: string[];
  products: string[];
  companies: string[];
  industry: string;
  keywords: {
    position: string[];
    industry: string[];
    company: string[];
    product: string[];
    skill: string[];
  };
  tagging_dict: {
    companies: string[];
    skills: string[];
    products: string[];
    industry: string[];
  };
  mermaid_code: string;
  diagram_url: string;
  summary: string;
}

// 关键词类型枚举
type KeywordType = 'position' | 'industry' | 'company' | 'product' | 'skill';

// 关键词项接口
interface KeywordItem {
  text: string;
  type: KeywordType;
}

// 方案配置接口
interface SchemeConfig {
  id: string;
  name: string;
  mainKeywords: KeywordItem[];
  positionKeywords: KeywordItem[];
  companyKeywords: KeywordItem[];
  settings: {
    includeKeywords: string;  // 必须包含的关键词（多个词用空格隔开）
    excludeKeywords: string;  // 不包含的关键词（多个词用空格隔开）
  };
}

interface SmartSearchConfigProps {
  analysisResult: AnalysisResult | null;
  onSearch?: () => void;
  onAddToDatabase?: () => void;
  taskId?: string;
  onTaskIdChange?: (id: string) => void;
  positionInfo?: any;
}

export default function SmartSearchConfig({ 
  analysisResult, 
  onSearch, 
  onAddToDatabase,
  taskId,
  onTaskIdChange,
  positionInfo
}: SmartSearchConfigProps) {
  // 清理关键词文本，去除方括号和多余空格
  const cleanKeywordText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    // 去除开头和结尾的方括号、空格、引号等
    return text
      .replace(/^[\[\]"'\s]+|[\[\]"'\s]+$/g, '') // 去除首尾的方括号、引号、空格
      .replace(/^\[|\]$/g, '') // 再次确保去除方括号
      .trim(); // 去除多余空格
  };

  // 从分析结果生成关键词池数据
  const generateKeywordPool = (result: AnalysisResult | null): KeywordItem[] => {
    if (!result || !result.keywords) {
      console.log('SmartSearchConfig: 无分析结果或keywords为空');
      return [];
    }

    const pool: KeywordItem[] = [];
    
    try {
      // 添加职位关键词
      if (result.keywords.position && Array.isArray(result.keywords.position)) {
        result.keywords.position.forEach(keyword => {
          if (keyword && typeof keyword === 'string') {
            const cleanedText = cleanKeywordText(keyword);
            if (cleanedText) {
              pool.push({ text: cleanedText, type: "position" });
            }
          }
        });
      }
      
      // 添加行业关键词
      if (result.keywords.industry && Array.isArray(result.keywords.industry)) {
        result.keywords.industry.forEach(keyword => {
          if (keyword && typeof keyword === 'string') {
            const cleanedText = cleanKeywordText(keyword);
            if (cleanedText) {
              pool.push({ text: cleanedText, type: "industry" });
            }
          }
        });
      }
      
      // 添加公司关键词
      if (result.keywords.company && Array.isArray(result.keywords.company)) {
        result.keywords.company.forEach(keyword => {
          if (keyword && typeof keyword === 'string') {
            const cleanedText = cleanKeywordText(keyword);
            if (cleanedText) {
              pool.push({ text: cleanedText, type: "company" });
            }
          }
        });
      }
      
      // 添加产品关键词
      if (result.keywords.product && Array.isArray(result.keywords.product)) {
        result.keywords.product.forEach(keyword => {
          if (keyword && typeof keyword === 'string') {
            const cleanedText = cleanKeywordText(keyword);
            if (cleanedText) {
              pool.push({ text: cleanedText, type: "product" });
            }
          }
        });
      }
      
      // 添加技能关键词
      if (result.keywords.skill && Array.isArray(result.keywords.skill)) {
        result.keywords.skill.forEach(keyword => {
          if (keyword && typeof keyword === 'string') {
            const cleanedText = cleanKeywordText(keyword);
            if (cleanedText) {
              pool.push({ text: cleanedText, type: "skill" });
            }
          }
        });
      }
      
      console.log('SmartSearchConfig: 生成关键词池，共', pool.length, '个关键词');
      return pool;
    } catch (error) {
      console.error('SmartSearchConfig: 生成关键词池时出错', error);
      return [];
    }
  };

  // 关键词池数据
  const [keywordPool, setKeywordPool] = useState<KeywordItem[]>([]);

  // 随机从数组中选择指定数量的元素
  const getRandomItems = <T,>(array: T[], count: number): T[] => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  };

  // 自动填充默认方案
  const autoFillDefaultSchemes = (keywordPool: KeywordItem[]) => {
    if (keywordPool.length === 0) return;

    const positionKeywords = keywordPool.filter(item => item.type === 'position');
    const industryKeywords = keywordPool.filter(item => item.type === 'industry');
    const companyKeywords = keywordPool.filter(item => item.type === 'company');
    const productKeywords = keywordPool.filter(item => item.type === 'product');
    const skillKeywords = keywordPool.filter(item => item.type === 'skill');

    // 只保留一个默认方案
    setSchemes([{
      id: 'scheme1',
      name: '初试方案',
      mainKeywords: [],
      positionKeywords: [],
      companyKeywords: [],
      settings: {
        includeKeywords: '',
        excludeKeywords: ''
      }
    }]);
  };

  // 当分析结果改变时更新关键词池并自动填充方案
  useEffect(() => {
    const newPool = generateKeywordPool(analysisResult);
    setKeywordPool(newPool);
    
    // 只有当有新的分析结果时才自动填充
    if (newPool.length > 0) {
      autoFillDefaultSchemes(newPool);
    }
  }, [analysisResult]);

  // 方案配置
  const [schemes, setSchemes] = useState<SchemeConfig[]>([
    {
      id: "scheme1",
      name: "初试方案",
      mainKeywords: [],
      positionKeywords: [],
      companyKeywords: [],
      settings: {
        includeKeywords: '',
        excludeKeywords: ''
      }
    }
  ]);

  // 自定义添加关键词的状态
  const [addingKeyword, setAddingKeyword] = useState<{type: KeywordType | null, text: string}>({
    type: null,
    text: ''
  });

  // 编辑关键词的状态
  const [editingKeyword, setEditingKeyword] = useState<{keyword: KeywordItem | null, text: string}>({
    keyword: null,
    text: ''
  });

  const [activeSchemeId, setActiveSchemeId] = useState<string>("scheme1");
  const [progressVisible, setProgressVisible] = useState<boolean>(false);
  const [activeTargetField, setActiveTargetField] = useState<'mainKeywords' | 'positionKeywords' | 'companyKeywords'>('mainKeywords');
  const [rpaTriggerActive, setRpaTriggerActive] = useState<boolean>(false);

  // 队列状态
  const [queueStatus, setQueueStatus] = useState<{
    visible: boolean;
    loading: boolean;
    data: any;
    error: string | null;
  }>({
    visible: false,
    loading: false,
    data: null,
    error: null
  });

  // 获取关键词类型颜色
  const getKeywordColor = (type: KeywordType) => {
    const colors = {
      position: "bg-blue-100 text-blue-800 border-blue-300",
      industry: "bg-green-100 text-green-800 border-green-300", 
      company: "bg-purple-100 text-purple-800 border-purple-300",
      product: "bg-orange-100 text-orange-800 border-orange-300",
      skill: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[type];
  };

  // 获取关键词类型名称
  const getKeywordTypeName = (type: KeywordType) => {
    const names = {
      position: "职位",
      industry: "行业",
      company: "公司", 
      product: "产品",
      skill: "技能"
    };
    return names[type];
  };

  // 检查关键词是否已被当前活跃方案使用
  const isKeywordUsed = (keyword: KeywordItem): boolean => {
    const activeScheme = schemes.find(scheme => scheme.id === activeSchemeId);
    if (!activeScheme) return false;
    
    return activeScheme.mainKeywords.some(k => k.text === keyword.text && k.type === keyword.type) ||
           activeScheme.positionKeywords.some(k => k.text === keyword.text && k.type === keyword.type) ||
           activeScheme.companyKeywords.some(k => k.text === keyword.text && k.type === keyword.type);
  };

  // 添加关键词到方案
  const addKeywordToScheme = (keyword: KeywordItem, targetField: 'mainKeywords' | 'positionKeywords' | 'companyKeywords') => {
    // 检查是否在当前方案中已经存在
    if (isKeywordUsed(keyword)) {
      toast.warning("该关键词在当前方案中已被使用");
      return;
    }

    setSchemes(prev => prev.map(scheme => 
      scheme.id === activeSchemeId 
        ? {
            ...scheme,
            [targetField]: [...scheme[targetField], keyword]
          }
        : scheme
    ));
  };

  // 从方案中删除关键词
  const removeKeywordFromScheme = (schemeId: string, index: number, targetField: 'mainKeywords' | 'positionKeywords' | 'companyKeywords') => {
    setSchemes(prev => prev.map(scheme => 
      scheme.id === schemeId 
        ? {
            ...scheme,
            [targetField]: scheme[targetField].filter((_, i) => i !== index)
          }
        : scheme
    ));
  };

  // 创建新方案
  const createNewScheme = () => {
    const defaultNames = ["默认方案一", "默认方案二", "默认方案三"];
    const nextSchemeNumber = Math.min(schemes.length + 1, 3);
    
    const newScheme: SchemeConfig = {
      id: `scheme${Date.now()}`,
      name: defaultNames[nextSchemeNumber - 1] || "自定义",
      mainKeywords: [],
      positionKeywords: [],
      companyKeywords: [],
      settings: {
        includeKeywords: '',
        excludeKeywords: ''
      }
    };
    setSchemes(prev => [...prev, newScheme]);
    setActiveSchemeId(newScheme.id);
  };

  // 删除方案
  const deleteScheme = (schemeId: string) => {
    if (schemes.length <= 1) {
      toast.warning("至少保留一个方案");
      return;
    }
    setSchemes(prev => prev.filter(scheme => scheme.id !== schemeId));
    // 如果删除的是当前活跃方案，切换到第一个方案
    if (activeSchemeId === schemeId) {
      const remainingSchemes = schemes.filter(scheme => scheme.id !== schemeId);
      if (remainingSchemes.length > 0) {
        setActiveSchemeId(remainingSchemes[0].id);
      }
    }
  };

  // 添加自定义关键词到池
  const addCustomKeyword = (type: KeywordType, text: string) => {
    if (!text.trim()) return;
    
    const newKeyword: KeywordItem = {
      text: text.trim(),
      type: type
    };
    
    // 检查是否已存在
    const exists = keywordPool.some(item => item.text === newKeyword.text && item.type === newKeyword.type);
    if (exists) {
      toast.warning("该关键词已存在");
      return;
    }
    
    setKeywordPool(prev => [...prev, newKeyword]);
    setAddingKeyword({ type: null, text: '' });
    toast.success("关键词添加成功");
  };

  // 开始添加自定义关键词
  const startAddingKeyword = (type: KeywordType) => {
    setAddingKeyword({ type: type, text: '' });
  };

  // 取消添加自定义关键词
  const cancelAddingKeyword = () => {
    setAddingKeyword({ type: null, text: '' });
  };

  // 从关键词池中删除关键词
  const deleteKeywordFromPool = (keyword: KeywordItem) => {
    // 先从所有方案中移除该关键词
    setSchemes(prev => prev.map(scheme => ({
      ...scheme,
      mainKeywords: scheme.mainKeywords.filter(k => !(k.text === keyword.text && k.type === keyword.type)),
      positionKeywords: scheme.positionKeywords.filter(k => !(k.text === keyword.text && k.type === keyword.type)),
      companyKeywords: scheme.companyKeywords.filter(k => !(k.text === keyword.text && k.type === keyword.type))
    })));
    
    // 从关键词池中删除
    setKeywordPool(prev => prev.filter(k => !(k.text === keyword.text && k.type === keyword.type)));
    toast.success("关键词已删除");
  };

  // 开始编辑关键词
  const startEditingKeyword = (keyword: KeywordItem) => {
    setEditingKeyword({ keyword, text: keyword.text });
  };

  // 取消编辑关键词
  const cancelEditingKeyword = () => {
    setEditingKeyword({ keyword: null, text: '' });
  };

  // 保存编辑的关键词
  const saveEditedKeyword = () => {
    if (!editingKeyword.keyword || !editingKeyword.text.trim()) return;
    
    const oldKeyword = editingKeyword.keyword;
    const newText = editingKeyword.text.trim();
    
    // 检查新名称是否已存在（除了当前编辑的关键词）
    const exists = keywordPool.some(k => 
      k.text === newText && 
      k.type === oldKeyword.type && 
      !(k.text === oldKeyword.text && k.type === oldKeyword.type)
    );
    
    if (exists) {
      toast.warning("该关键词已存在");
      return;
    }
    
    // 更新关键词池
    setKeywordPool(prev => prev.map(k => 
      (k.text === oldKeyword.text && k.type === oldKeyword.type)
        ? { ...k, text: newText }
        : k
    ));
    
    // 更新所有方案中的关键词
    setSchemes(prev => prev.map(scheme => ({
      ...scheme,
      mainKeywords: scheme.mainKeywords.map(k => 
        (k.text === oldKeyword.text && k.type === oldKeyword.type)
          ? { ...k, text: newText }
          : k
      ),
      positionKeywords: scheme.positionKeywords.map(k => 
        (k.text === oldKeyword.text && k.type === oldKeyword.type)
          ? { ...k, text: newText }
          : k
      ),
      companyKeywords: scheme.companyKeywords.map(k => 
        (k.text === oldKeyword.text && k.type === oldKeyword.type)
          ? { ...k, text: newText }
          : k
      )
    })));
    
    setEditingKeyword({ keyword: null, text: '' });
    toast.success("关键词已更新");
  };

  // 更新方案名称并重新填充方案
  const handleSmartSearch = async () => {
    const activeScheme = schemes.find(s => s.id === activeSchemeId);
    if (!activeScheme) {
      toast.error("请先选择一个方案");
      return;
    }
    if (activeScheme.mainKeywords.length === 0 && 
        activeScheme.positionKeywords.length === 0 && 
        activeScheme.companyKeywords.length === 0) {
      toast.error("请至少配置一组关键词");
      return;
    }
    try {
      // 关键词处理
      const keywordsMain = activeScheme.mainKeywords.map(k => k.text).join(' ');
      const keywordsPosition = activeScheme.positionKeywords.map(k => k.text).join(' ');
      const keywordsCompany = activeScheme.companyKeywords.map(k => k.text).join(' ');
      let tid = taskId;
      // 1. 如果没有taskId，先生成
      if (!tid) {
        const res = await generateTaskId();
        tid = res.data.task_id;
        if (tid && onTaskIdChange) onTaskIdChange(tid);
      }
      // 2. 缓存岗位信息
      if (positionInfo && tid) {
        await cachePositionSelection(tid, positionInfo);
      }
      // 3. 写入队列
      toast.loading("正在提交智能搜索任务...");
      const response = await smartSearchApi.triggerTask(
        keywordsMain,
        keywordsPosition,
        keywordsCompany,
        tid,
        positionInfo.company_id,
        positionInfo.company_name,
        positionInfo.project_id,
        positionInfo.project_name,
        positionInfo.position_id,
        positionInfo.position_name
      );
      toast.dismiss();
      toast.success("智能搜索任务已提交到队列！");
      console.log("智能搜索任务提交成功:", response);
    } catch (error) {
      toast.dismiss();
      toast.error("提交智能搜索任务失败");
      console.error("智能搜索任务提交失败:", error);
    }
  };

  // 查看队列状态
  const handleViewQueue = async () => {
    setQueueStatus(prev => ({ ...prev, visible: true, loading: true, error: null }));
    
    try {
      const response = await smartSearchApi.getQueueStatus();
      console.log("队列状态:", response);
      
      if (response.success) {
        setQueueStatus(prev => ({ 
          ...prev, 
          loading: false, 
          data: response,
          error: null 
        }));
      } else {
        setQueueStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: response.message || "获取队列状态失败" 
        }));
      }
    } catch (error) {
      setQueueStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: "查看队列状态失败" 
      }));
      console.error("查看队列状态失败:", error);
    }
  };

  // 清空队列
  const handleClearQueue = async () => {
    if (!confirm("确定要清空队列吗？此操作不可恢复。")) {
      return;
    }
    
    try {
      const response = await smartSearchApi.clearQueue();
      if (response.success) {
        toast.success(response.message || "队列已清空");
        // 清空后刷新队列状态
        setQueueStatus(prev => ({ 
          ...prev, 
          data: { 
            success: true, 
            queue_name: "trigger_queue", 
            queue_length: 0, 
            tasks: [] 
          },
          error: null
        }));
      }
    } catch (error) {
      toast.error("清空队列失败");
      console.error("清空队列失败:", error);
    }
  };

  // 一键沟通
  const handleCommunicate = () => {
    if (onSearch) {
      onSearch();
    } else {
      toast.info("开始一键沟通...");
    }
  };

  // 一键简历入库
  const handleAddToDatabase = () => {
    // 激活RPA trigger
    setRpaTriggerActive(true);
    setProgressVisible(true);
    
    // 获取当前活跃方案的配置数据
    const activeScheme = schemes.find(s => s.id === activeSchemeId);
    const schemeData = {
      schemeName: activeScheme?.name || '',
      mainKeywords: activeScheme?.mainKeywords || [],
      positionKeywords: activeScheme?.positionKeywords || [],
      companyKeywords: activeScheme?.companyKeywords || [],
      settings: activeScheme?.settings || { includeKeywords: '', excludeKeywords: '' },
      timestamp: new Date().toISOString()
    };
    
    // 将配置数据存储到trigger元素的data属性中
    setTimeout(() => {
      const triggerElement = document.getElementById('rpa-resume-trigger');
      if (triggerElement) {
        triggerElement.setAttribute('data-scheme-config', JSON.stringify(schemeData));
        triggerElement.setAttribute('data-action', 'resume-database');
      }
    }, 100);
    
    toast.success("简历入库指令已触发，RPA可以开始执行");
    
    if (onAddToDatabase) {
      onAddToDatabase();
    }
    
    // 10秒后自动隐藏trigger（给RPA足够的时间识别）
    setTimeout(() => {
      setRpaTriggerActive(false);
      setProgressVisible(false);
    }, 10000);
  };

  // 手动清除RPA trigger
  const clearRpaTrigger = () => {
    setRpaTriggerActive(false);
    setProgressVisible(false);
    toast.info("RPA触发器已清除");
  };

  // 智能搜索配置始终显示，不依赖分析结果

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <div className="h-full space-y-4 p-4">
        {/* 关键词选用池 - 紧凑布局 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <span className="w-4 h-4 bg-green-100 text-green-600 rounded-sm flex items-center justify-center text-xs">池</span>
            关键词选用池
            {!analysisResult && (
              <span className="text-xs text-gray-500 ml-2">请先进行智能分析</span>
            )}
          </h3>
          
          {analysisResult && keywordPool.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {(['position', 'industry', 'company', 'product', 'skill'] as KeywordType[]).map(type => {
                const typeKeywords = keywordPool.filter(item => item.type === type);
                if (typeKeywords.length === 0) return null;
                
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium min-w-[44px] text-center ${getKeywordColor(type)}`}>
                      {getKeywordTypeName(type)}
                    </span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {typeKeywords.map((keyword, index) => {
                        const isUsed = isKeywordUsed(keyword);
                        const isEditing = editingKeyword.keyword?.text === keyword.text && editingKeyword.keyword?.type === keyword.type;
                        
                        if (isEditing) {
                          return (
                            <div key={`${type}-${index}`} className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingKeyword.text}
                                onChange={(e) => setEditingKeyword(prev => ({ ...prev, text: e.target.value }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEditedKeyword();
                                  } else if (e.key === 'Escape') {
                                    cancelEditingKeyword();
                                  }
                                }}
                                className="px-2 py-0.5 text-xs border border-blue-300 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                autoFocus
                              />
                              <button
                                onClick={saveEditedKeyword}
                                className="px-1 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditingKeyword}
                                className="px-1 py-0.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={`${type}-${index}`} className="relative group">
                            <button
                              onClick={() => addKeywordToScheme(keyword, activeTargetField)}
                              disabled={isUsed}
                              className={`px-2 py-0.5 pr-8 rounded text-xs border cursor-pointer transition-all ${
                                isUsed 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-300' 
                                  : `hover:shadow-sm hover:scale-105 ${getKeywordColor(type)}`
                              }`}
                            >
                              {keyword.text}
                              {isUsed && <span className="ml-1">✓</span>}
                            </button>
                            
                            {/* 编辑和删除按钮 */}
                            <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingKeyword(keyword);
                                }}
                                className="w-4 h-4 bg-blue-500 text-white rounded-sm text-xs flex items-center justify-center hover:bg-blue-600 transition-colors mr-0.5"
                                title="编辑关键词"
                              >
                                ✎
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteKeywordFromPool(keyword);
                                }}
                                className="w-4 h-4 bg-red-500 text-white rounded-sm text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                                title="删除关键词"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* 自定义添加按钮 */}
                      {addingKeyword.type === type ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={addingKeyword.text}
                            onChange={(e) => setAddingKeyword(prev => ({ ...prev, text: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addCustomKeyword(type, addingKeyword.text);
                              } else if (e.key === 'Escape') {
                                cancelAddingKeyword();
                              }
                            }}
                            placeholder="输入关键词"
                            className="px-2 py-0.5 text-xs border border-gray-300 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            autoFocus
                          />
                          <button
                            onClick={() => addCustomKeyword(type, addingKeyword.text)}
                            className="px-1 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelAddingKeyword}
                            className="px-1 py-0.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startAddingKeyword(type)}
                          className={`px-2 py-0.5 rounded text-xs border-2 border-dashed cursor-pointer hover:shadow-sm transition-all ${getKeywordColor(type)} opacity-60 hover:opacity-100`}
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fa-solid fa-tags text-gray-400"></i>
              </div>
              <p className="text-sm">暂无关键词数据</p>
              <p className="text-xs text-gray-400">上传JD文件并点击"智能分析"生成关键词池</p>
            </div>
          )}
        </div>

        {/* 方案配置区域 - 紧凑水平滚动 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <span className="w-4 h-4 bg-red-500 text-white rounded-sm flex items-center justify-center text-xs font-bold">1</span>
              方案配置
            </h3>
            
            {/* 新建按钮 - 标题栏右侧 */}
            <button
              data-rpa-role="create-new-scheme-button"
              onClick={createNewScheme}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-colors shadow-sm"
              title="添加新方案"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              新建方案
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin" data-rpa-target="scheme-container">
                {schemes.map((scheme) => (
                  <div
                    key={scheme.id}
                    data-rpa-scheme="true"
                    data-scheme-id={scheme.id}
                    className={`min-w-[280px] flex-shrink-0 bg-white border-2 rounded-xl p-4 space-y-3 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                      activeSchemeId === scheme.id
                        ? 'border-red-400 shadow-lg bg-red-50/50 ring-2 ring-red-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveSchemeId(scheme.id)}
                  >
                    {/* 删除方案按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScheme(scheme.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white border border-gray-300 text-gray-500 rounded-md text-xs flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all shadow-sm z-10 opacity-60 hover:opacity-100"
                      title="删除方案"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    {/* 方案名称 - 下拉选择 */}
                    <div>
                      <select
                        value={scheme.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateSchemeName(scheme.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 pr-8 transition-all"
                      >
                        <option value="默认方案一">默认方案一</option>
                        <option value="默认方案二">默认方案二</option>
                        <option value="默认方案三">默认方案三</option>
                        <option value="自定义">自定义</option>
                      </select>
                    </div>

                    {/* 关键词输入区 - 紧凑三栏布局 */}
                    <div className="space-y-2">
                      {/* 主搜索栏 */}
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSchemeId(scheme.id);
                          setActiveTargetField('mainKeywords');
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">主搜索栏</span>
                          <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                            activeSchemeId === scheme.id && activeTargetField === 'mainKeywords' 
                              ? 'bg-blue-500 border-blue-500 shadow-sm' 
                              : 'bg-white border-gray-300'
                          }`}></div>
                        </div>
                        <div 
                          className={`min-h-[28px] px-3 py-2 border-2 rounded-lg text-xs bg-white flex flex-wrap gap-1 transition-all ${
                            activeSchemeId === scheme.id && activeTargetField === 'mainKeywords' 
                              ? 'border-blue-400 bg-blue-50 shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {scheme.mainKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded-md text-xs border cursor-pointer hover:bg-red-100 transition-colors shadow-sm ${getKeywordColor(keyword.type)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeKeywordFromScheme(scheme.id, index, 'mainKeywords');
                              }}
                            >
                              {keyword.text}
                            </span>
                          ))}
                          {scheme.mainKeywords.length === 0 && (
                            <span className="text-gray-400 text-xs">点击池中词汇添加</span>
                          )}
                        </div>
                      </div>

                      {/* 职位 */}
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSchemeId(scheme.id);
                          setActiveTargetField('positionKeywords');
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">职位</span>
                          <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                            activeSchemeId === scheme.id && activeTargetField === 'positionKeywords' 
                              ? 'bg-blue-500 border-blue-500 shadow-sm' 
                              : 'bg-white border-gray-300'
                          }`}></div>
                        </div>
                        <div 
                          className={`min-h-[28px] px-3 py-2 border-2 rounded-lg text-xs bg-white flex flex-wrap gap-1 transition-all ${
                            activeSchemeId === scheme.id && activeTargetField === 'positionKeywords' 
                              ? 'border-blue-400 bg-blue-50 shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {scheme.positionKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded-md text-xs border cursor-pointer hover:bg-red-100 transition-colors shadow-sm ${getKeywordColor(keyword.type)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeKeywordFromScheme(scheme.id, index, 'positionKeywords');
                              }}
                            >
                              {keyword.text}
                            </span>
                          ))}
                          {scheme.positionKeywords.length === 0 && (
                            <span className="text-gray-400 text-xs">点击池中词汇添加</span>
                          )}
                        </div>
                      </div>

                      {/* 公司 */}
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSchemeId(scheme.id);
                          setActiveTargetField('companyKeywords');
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">公司</span>
                          <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                            activeSchemeId === scheme.id && activeTargetField === 'companyKeywords' 
                              ? 'bg-blue-500 border-blue-500 shadow-sm' 
                              : 'bg-white border-gray-300'
                          }`}></div>
                        </div>
                        <div 
                          className={`min-h-[28px] px-3 py-2 border-2 rounded-lg text-xs bg-white flex flex-wrap gap-1 transition-all ${
                            activeSchemeId === scheme.id && activeTargetField === 'companyKeywords' 
                              ? 'border-blue-400 bg-blue-50 shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {scheme.companyKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded-md text-xs border cursor-pointer hover:bg-red-100 transition-colors shadow-sm ${getKeywordColor(keyword.type)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeKeywordFromScheme(scheme.id, index, 'companyKeywords');
                              }}
                            >
                              {keyword.text}
                            </span>
                          ))}
                          {scheme.companyKeywords.length === 0 && (
                            <span className="text-gray-400 text-xs">点击池中词汇添加</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* 设置选项区域 - 紧凑布局 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <span className="w-4 h-4 bg-orange-500 text-white rounded-sm flex items-center justify-center text-xs font-bold">2</span>
            设置选项
          </h3>
          
          <div className="bg-orange-50/70 border-2 border-orange-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* 必须包含的关键词 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">必须包含的关键词</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                  value={schemes.find(s => s.id === activeSchemeId)?.settings.includeKeywords || ""}
                  onChange={(e) => updateSchemeSetting(activeSchemeId, 'includeKeywords', e.target.value)}
                  placeholder="多个词用空格隔开"
                />
              </div>
              {/* 必须排除的关键词 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">必须排除的关键词</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                  value={schemes.find(s => s.id === activeSchemeId)?.settings.excludeKeywords || ""}
                  onChange={(e) => updateSchemeSetting(activeSchemeId, 'excludeKeywords', e.target.value)}
                  placeholder="多个词用空格隔开"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 - 紧凑布局 */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleCommunicate}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all hover:shadow-sm flex items-center gap-1"
          >
            <i className="fa-solid fa-comments text-xs"></i>
            一键沟通
          </button>
          <button
            onClick={handleSmartSearch}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-medium rounded-lg transition-all hover:shadow-sm flex items-center gap-1"
          >
            <i className="fa-solid fa-search text-xs"></i>
            智能搜索
          </button>
          <button
            onClick={handleAddToDatabase}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-medium rounded-lg transition-all hover:shadow-sm flex items-center gap-1"
          >
            <i className="fa-solid fa-database text-xs"></i>
            简历入库
          </button>
        </div>

        {/* 队列管理按钮 */}
        <div className="flex justify-center gap-2">
          <button
            onClick={handleViewQueue}
            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors flex items-center gap-1"
          >
            <i className="fa-solid fa-eye text-xs"></i>
            查看队列
          </button>
          <button
            onClick={handleClearQueue}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors flex items-center gap-1"
          >
            <i className="fa-solid fa-trash text-xs"></i>
            清空队列
          </button>
        </div>

        {/* 队列状态显示区域 */}
        {queueStatus.visible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50/80 border-2 border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm flex items-center justify-center">
                  <i className="fa-solid fa-list text-white text-xs"></i>
                </div>
                Redis队列状态
              </h4>
              <button
                onClick={() => setQueueStatus(prev => ({ ...prev, visible: false }))}
                className="text-blue-500 hover:text-blue-700 text-xs"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            {queueStatus.loading && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">正在获取队列状态...</span>
              </div>
            )}

            {queueStatus.error && (
              <div className="text-red-600 text-sm">
                <i className="fa-solid fa-exclamation-triangle mr-1"></i>
                {queueStatus.error}
              </div>
            )}

            {!queueStatus.loading && !queueStatus.error && queueStatus.data && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">队列名称:</span>
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{queueStatus.data.queue_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">队列长度:</span>
                  <span className={`text-sm px-2 py-1 rounded ${queueStatus.data.queue_length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {queueStatus.data.queue_length} 个任务
                  </span>
                </div>
                {queueStatus.data.tasks && queueStatus.data.tasks.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">任务详情:</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {queueStatus.data.tasks.map((task: any, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">任务 {index + 1}</span>
                            <span className="text-xs text-gray-500">{task.timestamp || '未知时间'}</span>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 w-12">主搜索:</span>
                              <span className="text-gray-800 bg-blue-50 px-2 py-1 rounded">{task.main || '无'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 w-12">职位:</span>
                              <span className="text-gray-800 bg-green-50 px-2 py-1 rounded">{task.position || '无'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 w-12">公司:</span>
                              <span className="text-gray-800 bg-purple-50 px-2 py-1 rounded">{task.company || '无'}</span>
                            </div>
                            {task.task_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 w-12">task_id:</span>
                                <span className="text-gray-800 bg-gray-50 px-2 py-1 rounded break-all">{task.task_id}</span>
                              </div>
                            )}
                            {task.company_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 w-20">公司ID:</span>
                                <span className="text-gray-800 bg-gray-50 px-2 py-1 rounded break-all">{task.company_id}</span>
                              </div>
                            )}
                            {task.company_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 w-20">公司名:</span>
                                <span className="text-gray-800 bg-gray-50 px-2 py-1 rounded break-all">{task.company_name}</span>
                              </div>
                            )}
                            {task.project_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 w-20">项目ID:</span>
                                <span className="text-gray-800 bg-gray-50 px-2 py-1 rounded break-all">{task.project_id}</span>
                              </div>
                            )}
                            {task.project_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 w-20">项目名:</span>
                                <span className="text-gray-800 bg-gray-50 px-2 py-1 rounded break-all">{task.project_name}</span>
                              </div>
                            )}
                            {task.position_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 w-20">岗位ID:</span>
                                <span className="text-gray-800 bg-gray-50 px-2 py-1 rounded break-all">{task.position_id}</span>
                              </div>
                            )}
                            {task.position_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 w-20">岗位名:</span>
                                <span className="text-gray-800 bg-gray-50 px-2 py-1 rounded break-all">{task.position_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!queueStatus.data.tasks || queueStatus.data.tasks.length === 0) && (
                  <div className="text-center text-gray-500">
                    <i className="fa-solid fa-inbox text-2xl mb-2"></i>
                    <p>队列为空，暂无任务</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* RPA状态显示区域 */}
        {rpaTriggerActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50/80 border-2 border-green-200 rounded-lg p-3"
            id="rpa-status-display"
          >
            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                <i className="fa-solid fa-robot text-white text-xs animate-pulse"></i>
              </div>
              RPA触发器已激活
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700">等待影刀RPA识别触发器...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-xs text-gray-600">当前方案：{schemes.find(s => s.id === activeSchemeId)?.name}</span>
              </div>
                                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                   <span className="text-xs text-gray-600">触发器ID: rpa-resume-trigger</span>
                 </div>
               </div>
               <div className="mt-2 flex justify-end">
                 <button
                   onClick={clearRpaTrigger}
                   className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                 >
                   清除触发器
                 </button>
               </div>
             </motion.div>
           )}

          {/* 脚本操作进度显示区域 - 紧凑版 */}
          {progressVisible && !rpaTriggerActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50/80 border border-gray-200 rounded-lg p-3"
            >
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm flex items-center justify-center">
                  <i className="fa-solid fa-cog text-white text-xs animate-spin"></i>
                </div>
                自动操作进度
              </h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">正在分析简历数据...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">准备入库操作...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-400">等待执行...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

      {/* RPA Trigger 元素 - 用于影刀RPA识别 */}
      {rpaTriggerActive && (
        <div
          id="rpa-resume-trigger"
          className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none z-50"
          data-rpa-trigger="resume-database"
          data-status="active"
          data-timestamp={new Date().toISOString()}
        >
          {/* 隐藏的RPA触发器，影刀可以通过ID或data属性识别 */}
        </div>
      )}
    </motion.div>
  );
} 