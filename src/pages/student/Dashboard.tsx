export default function StudentDashboard() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-bjj-blue mb-8">Student Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">My Subscriptions</h2>
            </div>
            <div className="card-body">
              <p>Student content will go here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}