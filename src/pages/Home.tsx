export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-bjj-blue mb-8">
        Jiu-Jitsu Academy Platform
      </h1>
      <div className="flex gap-4">
        <a href="/coach" className="btn-primary">
          I'm a Coach
        </a>
        <a href="/student" className="btn-secondary">
          I'm a Student
        </a>
      </div>
    </div>
  );
}