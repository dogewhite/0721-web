import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Mock数据
const profileData = {
  summary: "资深全栈工程师，8年互联网产品开发经验，主导过3个百万级用户产品的技术架构设计和实现。精通React、Node.js技术栈，对微服务架构有深入理解。具备优秀的团队管理能力，曾带领15人技术团队完成多个大型项目。在性能优化和系统稳定性方面有丰富实践经验。",
  skills: ["React", "Node.js", "微服务", "性能优化", "团队管理", "TypeScript", "Docker", "AWS"]
};

const swotData = {
  strengths: [
    "技术栈全面，全栈开发能力",
    "大型项目架构设计经验",
    "团队管理和协调能力突出"
  ],
  weaknesses: [
    "缺乏AI/ML领域经验",
    "英语口语能力一般"
  ],
  opportunities: [
    "公司正在拓展海外市场",
    "行业数字化转型需求旺盛"
  ],
  threats: [
    "技术更新迭代速度快",
    "年轻竞争者不断涌现"
  ]
};

const structuredData = {
  education: [
    {
      school: "清华大学",
      degree: "计算机科学与技术 硕士",
      period: "2010-2013"
    },
    {
      school: "北京大学",
      degree: "软件工程 学士",
      period: "2006-2010"
    }
  ],
  experience: [
    {
      company: "某互联网公司",
      position: "技术总监",
      period: "2018-至今",
      description: "负责技术团队管理和产品架构设计"
    },
    {
      company: "某科技公司",
      position: "高级工程师",
      period: "2015-2018",
      description: "参与核心产品开发和性能优化"
    }
  ],
  skills: [
    {
      category: "前端技术",
      items: ["React", "TypeScript", "Next.js"]
    },
    {
      category: "后端技术",
      items: ["Node.js", "NestJS", "微服务"]
    }
  ]
};

export default function Analysis() {
  const navigate = useNavigate();

  return (
    <div className="p-8 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能分析</h1>
          <p className="text-gray-600">基于AI的简历智能分析，提供深度洞察</p>
        </div>

        {/* 人才名片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">人才名片</h2>
          <p className="text-gray-600 mb-4">{profileData.summary}</p>
          <div className="flex flex-wrap gap-2">
            {profileData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>

        {/* SWOT分析 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">SWOT分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 优势 */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-medium text-blue-800 mb-2">优势 (Strengths)</h3>
              <ul className="space-y-1 text-blue-700">
                {swotData.strengths.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* 劣势 */}
            <div className="bg-red-50 p-4 rounded-xl">
              <h3 className="font-medium text-red-800 mb-2">劣势 (Weaknesses)</h3>
              <ul className="space-y-1 text-red-700">
                {swotData.weaknesses.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* 机会 */}
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="font-medium text-green-800 mb-2">机会 (Opportunities)</h3>
              <ul className="space-y-1 text-green-700">
                {swotData.opportunities.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* 威胁 */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <h3 className="font-medium text-yellow-800 mb-2">威胁 (Threats)</h3>
              <ul className="space-y-1 text-yellow-700">
                {swotData.threats.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* 结构化信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">结构化信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 教育经历 */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">教育经历</h3>
              <div className="space-y-4">
                {structuredData.education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-green-500 pl-4">
                    <p className="font-medium text-gray-800">{edu.school}</p>
                    <p className="text-gray-600 text-sm">{edu.degree}</p>
                    <p className="text-gray-500 text-xs">{edu.period}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* 工作经历 */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">工作经历</h3>
              <div className="space-y-4">
                {structuredData.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-4">
                    <p className="font-medium text-gray-800">{exp.company}</p>
                    <p className="text-gray-600 text-sm">{exp.position}</p>
                    <p className="text-gray-500 text-xs">{exp.period}</p>
                    <p className="text-gray-600 text-sm mt-1">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* 技能 */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">技能</h3>
              <div className="space-y-4">
                {structuredData.skills.map((skill, index) => (
                  <div key={index}>
                    <p className="font-medium text-gray-800">{skill.category}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skill.items.map((item, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/talent")}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
          >
            查看人才库
          </button>
        </div>
      </div>
    </div>
  );
}