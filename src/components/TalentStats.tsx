import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { useTalentStore } from '@/stores/talentStore';

interface StatsData {
  total_count: number;
  new_count: number;
  position_stats: Array<{ position: string; count: number }>;
  skill_stats: Array<{ skill: string; count: number }>;
  city_stats: Array<{ city: string; count: number }>;
}

export default function TalentStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { candidates } = useTalentStore();

  useEffect(() => {
    fetchStats();
  }, [candidates]); // 当candidates变化时重新获取统计数据

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resume/stats');
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 relative">
      {/* 主要指标 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">总人才库</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{stats.total_count}</p>
        </Card>
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">本月新增</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{stats.new_count}</p>
        </Card>
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">职位数量</h3>
          <p className="text-3xl font-bold mt-2 text-purple-600">{stats.position_stats.length}</p>
        </Card>
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">技能覆盖</h3>
          <p className="text-3xl font-bold mt-2 text-orange-600">{stats.skill_stats.length}</p>
        </Card>
      </div>

      {/* 详细统计 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* 职位分布 */}
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-base font-medium text-gray-900 mb-4">职位分布</h3>
          <div className="space-y-4">
            {stats.position_stats.slice(0, 5).map(({ position, count }, index) => (
              <div key={position} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-600 truncate flex-1">{position}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 技能分布 */}
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-base font-medium text-gray-900 mb-4">技能分布</h3>
          <div className="space-y-4">
            {stats.skill_stats.slice(0, 5).map(({ skill, count }, index) => (
              <div key={skill} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-600 truncate flex-1">{skill}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 城市分布 */}
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-base font-medium text-gray-900 mb-4">城市分布</h3>
          <div className="space-y-4">
            {stats.city_stats.slice(0, 5).map(({ city, count }, index) => (
              <div key={city} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-600 truncate flex-1">{city}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 