import { useState } from 'react';
import { FiUsers, FiFilm, FiCalendar } from 'react-icons/fi';
import type { IconType } from 'react-icons';

const IconWrapper = ({ icon: Icon, size }: { icon: IconType; size: number }) => (
  <Icon size={size} />
);

interface StatCardProps {
  icon: React.ReactElement;
  title: string;
  value: string | number;
  trend?: 'up' | 'down';
  loading?: boolean;
}

const StatCard = ({ 
  icon, 
  title, 
  value, 
  trend, 
  loading = false 
}: StatCardProps) => {
  return (
    <div className="p-4 bg-bjj-gray-light rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-bjj-blue/10 text-bjj-blue">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-700">{title}</h3>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <span className={`text-sm ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? '↑' : '↓'} 12%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StatsOverview = () => {
  const [isLoading] = useState(false);

  return (
    <div className="space-y-4">
      <StatCard 
        icon={<IconWrapper icon={FiUsers} size={20} />} 
        title="Active Students" 
        value={42} 
        trend="up" 
        loading={isLoading}
      />
      <StatCard 
        icon={<IconWrapper icon={FiFilm} size={20} />} 
        title="Videos Processed" 
        value={128} 
        loading={isLoading}
      />
      <StatCard 
        icon={<IconWrapper icon={FiCalendar} size={20} />} 
        title="Upcoming Sessions" 
        value={5} 
        trend="down" 
        loading={isLoading}
      />
    </div>
  );
};