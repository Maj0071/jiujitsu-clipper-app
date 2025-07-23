import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VideoProcessor from '../../components/coach/VideoProcessor';
import { StatsOverview } from '../../components/coach/StatsOverview';
import { RecentActivity } from '../../components/coach/RecentActivity';
import CoachProfile from '../../components/coach/CoachProfile';

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const coachId = user?.uid!;

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-bjj-red">Coach Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/editor')}
              className="bg-bjj-blue text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              ➕ Create Training Content
            </button>
            <button
              onClick={() => navigate('/coach/chat')}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              💬 Open Chats
            </button>
          </div>
        </div>


            {/* Sidebar Column */}
            <div className="space-y-6">
            {/* Profile Section */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">My Profile</h2>
              </div>
              <div className="card-body">
                <CoachProfile />
              </div>
            </div>


            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
              <div className="card-body">
                <RecentActivity />
              </div>
            </div>
          </div>


            {/* Quick Stats */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Quick Stats</h2>
              </div>
              <div className="card-body">
                <StatsOverview />
              </div>
            </div>
          </div>
        </div>
  );
}
