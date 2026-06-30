import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 border-t border-slate-700">
      {/* Glowing top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-70" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <span className="text-lg font-bold text-white">TechStack</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
              A modern, high-performance publishing platform crafted with the latest architecture stack.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-indigo-300 transition-colors duration-200" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-300 transition-colors duration-200" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.399s2.04.132 3 .399c2.292-1.552 3.3-1.23 3.3-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.372.823 1.102.823 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.694.825.577C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-300 transition-colors duration-200" aria-label="RSS">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.293 3.29C1.479 24 0 22.523 0 20.71c0-1.816 1.479-3.295 3.291-3.295zM15.909 24h-4.665c0-6.169-5.075-11.245-11.244-11.245V8.09c8.727 0 15.909 7.184 15.909 15.91z"/></svg>
              </a>
            </div>
          </div>

          {/* Discover */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discover</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors duration-200 relative group">
                  Latest Technical Stories
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-slate-300 hover:text-white transition-colors duration-200 relative group">
                  Browse Categorized Streams
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors duration-200 relative group">
                  About Team
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
              <li>
                <a href="mailto:info@addismesob.com" className="text-slate-300 hover:text-white transition-colors duration-200 relative group inline-flex items-center">
                  <svg className="w-4 h-4 mr-2 text-slate-400 group-hover:text-indigo-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Help Desk Support
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-400 transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stay Updated</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Get the latest articles delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
              <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-700/60 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 space-y-4 sm:space-y-0">
          <p>&copy; {currentYear} techStack. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-white cursor-pointer transition-colors duration-200">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors duration-200">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors duration-200">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;