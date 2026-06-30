import React, { useContext, useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `relative text-sm font-medium transition-all duration-300
    ${
      isActive
        ? "text-indigo-600"
        : "text-slate-600 dark:text-slate-300 hover:text-indigo-600"
    }
    after:absolute after:left-0 after:-bottom-1 after:h-0.5
    after:bg-indigo-600 after:transition-all after:duration-300
    ${
      isActive
        ? "after:w-full"
        : "after:w-0 hover:after:w-full"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm relative">

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              TechStck
            </span>
            <span className="text-slate-800 dark:text-white ml-1">
              Portal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">

            <NavLink
              to="/"
              className={navLinkClass}
            >
              Home Articles
            </NavLink>

            <NavLink
              to="/categories"
              className={navLinkClass}
            >
              Categories
            </NavLink>

            <NavLink
              to="/about"
              className={navLinkClass}
            >
              About
            </NavLink>

          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">

            {/* Dark Mode */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {darkMode ? (
                <FaSun className="text-yellow-400" />
              ) : (
                <FaMoon className="text-slate-600" />
              )}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-4">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <Link
                  to={
                    user.role === "admin"
                      ? "/admin-dashboard"
                      : user.role === "publisher"
                      ? "/publisher-dashboard"
                      : "/"
                  }
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow hover:shadow-lg hover:scale-105 transition-all"
                >
                  {user.role === "admin"
                    ? "Admin Panel"
                    : user.role === "publisher"
                    ? "Publisher Dashboard"
                    : "My Feed"}
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                >
                  Sign Out
                </button>

              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">

                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 px-3 py-2"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow hover:shadow-lg hover:scale-105 transition-all"
                >
                  Get Started
                </Link>

              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <FaTimes
                  size={22}
                  className="dark:text-white"
                />
              ) : (
                <FaBars
                  size={22}
                  className="dark:text-white"
                />
              )}
            </button>

          </div>

        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top duration-300">

            <div className="flex flex-col gap-4">

              <NavLink
                to="/"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Home Articles
              </NavLink>

              <NavLink
                to="/categories"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Categories
              </NavLink>

              <NavLink
                to="/about"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                About
              </NavLink>

              {user ? (
                <>
                  <Link
                    to={
                      user.role === "admin"
                        ? "/admin-dashboard"
                        : user.role === "publisher"
                        ? "/publisher-dashboard"
                        : "/"
                    }
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    {user.role === "admin"
                      ? "Admin Panel"
                      : user.role === "publisher"
                      ? "Publisher Dashboard"
                      : "My Feed"}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-left text-red-600"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}

            </div>

          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;