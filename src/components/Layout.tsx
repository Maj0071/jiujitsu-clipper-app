import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-bjj-gray-dark text-white p-4">
        <p>© {new Date().getFullYear()} Jiu-Jitsu Academy</p>
      </footer>
    </div>
  );
}