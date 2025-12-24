import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Package, Gem } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: Package, label: 'Materials', color: 'text-blue-600' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', color: 'text-purple-600' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-granite-900 via-granite-800 to-granite-900 text-white h-screen fixed left-0 top-0 shadow-2xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-granite-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-3 rounded-xl shadow-lg">
            <Gem className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              Avenir Trading
            </h1>
            <p className="text-xs text-granite-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-primary-500 to-blue-500 shadow-lg shadow-primary-500/50 scale-105'
                  : 'hover:bg-granite-700/50 hover:translate-x-1'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-granite-400'}`} />
              <span className={`font-medium ${active ? 'text-white' : 'text-granite-300'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
