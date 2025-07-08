import VideoProcessor from "../../components/coach/VideoProcessor";
import { StatsOverview } from "../../components/coach/StatsOverview";
import { RecentActivity } from "../../components/coach/RecentActivity";

export default function CoachDashboard() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-bjj-red mb-8">Coach Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Video Processor</h2>
              </div>
              <div className="card-body">
                <VideoProcessor />
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
          
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Quick Stats</h2>
              </div>
              <div className="card-body">
                <StatsOverview />
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Upcoming</h2>
              </div>
              <div className="card-body">
                {/* Upcoming sessions will go here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}