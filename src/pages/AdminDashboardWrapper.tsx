import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Analytics } from './Analytics';
import toast from 'react-hot-toast';
import { MaterialsManagement } from './MaterialsManagement';
import { LogOut } from 'lucide-react';

export const AdminDashboardWrapper: React.FC = () => {
  const { signOut, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('👋 Logging out...');
      await signOut();
      console.log('✅ Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-end items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white">
                {(userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0) || 'A').toUpperCase()}
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-gray-900">
                  {userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 font-semibold border border-red-200 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<MaterialsManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
