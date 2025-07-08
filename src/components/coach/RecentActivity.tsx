import { FiClock, FiUser, FiVideo } from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface ActivityItem {
  id: string;
  type: 'video' | 'session';
  title: string;
  student: string;
  time: string;
}

const IconWrapper = ({ icon: Icon, size }: { icon: IconType; size: number }) => (
  <Icon size={size} />
);

export const RecentActivity = () => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'video',
      title: 'Guard Passing Fundamentals',
      student: 'Alex Pereira',
      time: '2 hours ago'
    },
    {
      id: '2',
      type: 'session',
      title: 'Private Lesson',
      student: 'Israel Adesanya',
      time: '1 day ago'
    },
    {
      id: '3',
      type: 'video',
      title: 'Triangle Choke Setup',
      student: 'Sean Strickland',
      time: '2 days ago'
    }
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
          <div className="p-2 rounded-full bg-bjj-blue/10 text-bjj-blue mt-1">
            {activity.type === 'video' ? (
              <IconWrapper icon={FiVideo} size={18} />
            ) : (
              <IconWrapper icon={FiUser} size={18} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{activity.title}</h3>
            <div className="flex items-center text-sm text-gray-500 gap-2 mt-1">
              <IconWrapper icon={FiUser} size={14} />
              <span>{activity.student}</span>
              <IconWrapper icon={FiClock} size={14} />
              <span>{activity.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};