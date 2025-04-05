import { Activity } from '../../types/dashboard';

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => (
  <div className="mt-4 bg-white p-4 border-4 border-black">
    <h4 className="text-2xl font-black mb-4 text-black">Recent Activity</h4>
    <ul className="space-y-3">
      {activities.map((activity, index) => (
        <li
          key={index}
          className="bg-[#F0EAD6] p-4 border-2 border-black flex items-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <span className="mr-4 p-2 bg-[#fef29f] border-2 border-black rounded">
            {activity.icon}
          </span>
          <div>
            <p className="font-bold text-black">{activity.text}</p>
            <p className="text-sm text-gray-600">{activity.date}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);
