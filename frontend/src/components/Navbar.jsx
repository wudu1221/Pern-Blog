import React, { useContext, useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";
import API from "../services/api";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Category Dropdown States
  const [categories, setCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }

    // Fetch categories dynamically from backend
   API.get("/categories")
    .then((res) => {
      // Handles both { data: [...] } and { categories: [...] }
      const categoryList = res.data.data || res.data.categories || res.data || [];
      setCategories(categoryList);
    })
    .catch((err) => {
      console.error("Error fetching categories for Navbar:", err);
      setCategories([]); // Fallback to empty array on error
    });
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

  // Navigates to Home filtered by category
  const handleCategorySelect = (categoryName) => {
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate(`/?category=${encodeURIComponent(categoryName)}`);
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

            {/* Dynamic Hover Dropdown for Categories */}
            <div
              className="relative py-2"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="flex items-center gap-1.5 cursor-pointer">
                <NavLink
                  to="/categories"
                  className={navLinkClass}
                >
                  Categories
                </NavLink>
                <FaChevronDown
                  className={`text-xs text-slate-500 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180 text-indigo-600" : ""
                  }`}
                />
              </div>

              {/* Hover Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 w-56 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 animate-in fade-in duration-150">
                  <button
                    onClick={() => handleCategorySelect("All")}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    ✨ All Articles
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700/50" />

                  {categories.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-slate-400">Loading...</div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.name)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

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

              {/* Mobile Category Accordion */}
              <div>
                <button
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="flex items-center justify-between w-full text-slate-600 dark:text-slate-300 text-sm font-medium"
                >
                  <span>Categories</span>
                  <FaChevronDown className={`transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {mobileCategoriesOpen && (
                  <div className="pl-4 mt-2 flex flex-col gap-2 border-l-2 border-indigo-500">
                    <button
                      onClick={() => handleCategorySelect("All")}
                      className="text-left text-xs font-bold text-indigo-600 dark:text-indigo-400"
                    >
                      All Articles
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.name)}
                        className="text-left text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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