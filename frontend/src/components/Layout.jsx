import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="
      flex flex-col min-h-screen
      bg-slate-50 dark:bg-slate-950
      text-slate-800 dark:text-slate-100
      antialiased
      transition-colors duration-300
    ">
      <Navbar />

      <main className="
        flex-grow max-w-7xl w-full mx-auto
        px-4 sm:px-6 lg:px-8 py-8
      ">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;