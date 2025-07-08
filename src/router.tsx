import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import CoachDashboard from "./pages/coach/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import Layout from "./components/Layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "coach",
        element: <CoachDashboard />,
      },
      {
        path: "student",
        element: <StudentDashboard />,
      },
    ],
  },
]);

export default router;