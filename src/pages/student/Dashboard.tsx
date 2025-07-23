import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Course {
  id: string;
  title: string;
  coachName: string;
  purchasedAt: string;
  status: 'current' | 'completed';
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user?.uid!;
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    fetch(`/api/students/${studentId}/purchases`)
      .then(res => res.json())
      .then((data: Course[]) => setCourses(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  const current = courses.filter(c => c.status === 'current');
  const previous = courses.filter(c => c.status === 'completed');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>

      <div>
        <h2 className="text-2xl font-semibold mb-2">My Courses</h2>
        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>You haven’t purchased any courses yet.</p>
        ) : (
          <>
            <div>
              <h3 className="text-xl font-semibold">Current Courses</h3>
              {current.length > 0 ? (
                <ul className="list-disc list-inside">
                  {current.map(course => (
                    <li key={course.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{course.title}</span> by {course.coachName}
                      </div>
                      <button
                        onClick={() => navigate(`/content/${course.id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No current courses.</p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-semibold">Completed Courses</h3>
              {previous.length > 0 ? (
                <ul className="list-disc list-inside">
                  {previous.map(course => (
                    <li key={course.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{course.title}</span> by {course.coachName}
                      </div>
                      <button
                        onClick={() => navigate(`/content/${course.id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No completed courses.</p>
              )}
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => navigate('/student/chat')}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        💬 Chats
      </button>
    </div>
  );
}
