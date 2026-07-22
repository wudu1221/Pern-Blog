// frontend/src/pages/About.jsx
import { Link } from 'react-router-dom';

const About = () => {
  // Core topic focus areas
  const topics = [
    {
      title: 'Full-Stack Architecture',
      description: 'Building end-to-end applications with React, Node.js, Express, and modern REST APIs.',
      icon: '⚡',
    },
    {
      title: 'Database Management',
      description: 'Designing clean relational and document database schemas using PostgreSQL and MongoDB.',
      icon: '🗄️',
    },
    {
      title: 'UI/UX & Frontend Design',
      description: 'Crafting responsive, accessible interfaces using Tailwind CSS and modern layout principles.',
      icon: '🎨',
    },
    {
      title: 'Real-World Debugging',
      description: 'Documenting practical solutions, console breakdowns, and workflow optimizations.',
      icon: '🛠️',
    },
  ];

  // Tech stack badges
  const stack = [
    'React.js', 'JavaScript (ES6+)', 'Node.js', 'Express',
    'PostgreSQL', 'MongoDB', 'Tailwind CSS', 'Git & GitHub',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* 🚀 Hero Section */}
      <div className="mb-12 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8 md:p-12 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-8">
          
          {/* Avatar / Profile Image Placeholder */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border-2 border-blue-500/20 shadow-md">
            <img 
              src="https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=400&auto=format&fit=crop" 
              alt="Developer Profile" 
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              Software Engineer & Technical Writer
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mt-3 tracking-tight">
              Hey, I'm Wudneh 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm md:text-base leading-relaxed">
              Welcome to my open digital notebook. I build web software, solve architecture challenges, and share everything I learn along the way to help fellow developers build better projects.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link 
                to="/" 
                className="px-5 py-2.5 bg-blue-600 text-white font-medium text-xs rounded-xl hover:bg-blue-700 transition shadow-xs"
              >
                Explore Articles
              </Link>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium text-xs rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                GitHub Profile
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* 🎯 Mission / Story Section */}
      <div className="mb-12 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
          Why This Blog Exists
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
          When learning technology, official documentation covers <span className="italic">how</span> functions work, but rarely captures the step-by-step process of building real-world software. 
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          I created this publication platform to break down complex full-stack concepts, outline backend API structures, and share clear, step-by-step solutions to everyday bugs. Whether you are building your first API or refining UI components, you'll find practical breakdowns here.
        </p>
      </div>

      {/* 📚 Core Topics Grid */}
      <div className="mb-12">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
          What You Will Find Here
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {topics.map((item) => (
            <div 
              key={item.title} 
              className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {item.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 🛠️ Tech Stack Pills */}
      <div className="mb-12 bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
          Technologies I Work With
        </h3>
        <div className="flex flex-wrap gap-2">
          {stack.map((tech) => (
            <span 
              key={tech} 
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 📬 Contact Banner */}
      <div className="bg-blue-600 text-white p-8 rounded-2xl text-center shadow-xs">
        <h3 className="text-xl font-bold">Have a question or feedback?</h3>
        <p className="text-blue-100 text-xs md:text-sm mt-2 max-w-xl mx-auto">
          I'm always open to discussing new engineering projects, article suggestions, or tech topics.
        </p>
        <div className="mt-6">
          <a 
            href="mailto:your-email@example.com" 
            className="inline-block px-6 py-2.5 bg-white text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-50 transition shadow-xs"
          >
            Get In Touch
          </a>
        </div>
      </div>

    </div>
  );
};

export default About;