import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <NavLink 
              to="/" 
              className="text-xl font-bold text-bjj-red"
            >
              BJJ Academy
            </NavLink>
          </div>
          <div className="flex items-center space-x-4">
            <NavLink
              to="/coach"
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive 
                    ? 'bg-bjj-red text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              Coach Portal
            </NavLink>
            <NavLink
              to="/student"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-bjj-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              Student Portal
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}