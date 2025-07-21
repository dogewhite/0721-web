import { Upload, BrainCircuit, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Upload className="w-8 h-8 text-blue-500" />,
      title: '简历上传',
      description: '支持PDF/DOCX多格式上传，自动触发AI解析流程',
      action: () => navigate('/upload')
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-green-500" />,
      title: 'AI分析',
      description: '生成人才名片、SWOT分析和结构化信息展示',
      action: () => navigate('/analysis')
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: '人才库',
      description: '候选人搜索与卡片式浏览，智能匹配最佳人选',
      action: () => navigate('/talent')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">智能招聘系统</h1>
        <p className="text-lg text-gray-600 mb-12">
          AI驱动的人才管理平台，帮助您高效筛选和评估候选人
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={feature.action}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100"
            >
              <div className="flex items-center mb-4">
                {feature.icon}
                <h2 className="text-xl font-semibold text-gray-800 ml-3">
                  {feature.title}
                </h2>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}