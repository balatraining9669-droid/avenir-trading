import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { BarChart3, Package, Factory, CheckCircle, XCircle, Image as ImageIcon, TrendingUp } from 'lucide-react';

interface Stats {
  totalMaterials: number;
  totalPhotos: number;
  totalFactories: number;
  uniqueFactories: number;
  availableMaterials: number;
  soldMaterials: number;
}

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalMaterials: 0,
    totalPhotos: 0,
    totalFactories: 0,
    uniqueFactories: 0,
    availableMaterials: 0,
    soldMaterials: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      console.log('📊 Fetching analytics...');
      const { data, error } = await supabase
        .from('materials')
        .select('*');

      if (error) throw error;

      console.log('✅ Analytics data loaded:', data);

      // Calculate stats
      const totalPhotos = data.reduce((sum, item) => sum + (item.images?.length || 0), 0);
      const uniqueFactories = new Set(data.map(item => item.factory_name)).size;
      const available = data.filter(item => item.status === 'available').length;
      const sold = data.filter(item => item.status === 'sold').length;

      setStats({
        totalMaterials: data.length,
        totalPhotos,
        totalFactories: data.length,
        uniqueFactories,
        availableMaterials: available,
        soldMaterials: sold,
      });
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    bgColor: string;
  }> = ({ icon, label, value, color, bgColor }) => (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-granite-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bgColor} p-3 rounded-xl`}>
          <div className={color}>{icon}</div>
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <h3 className="text-granite-600 text-sm font-medium mb-1">{label}</h3>
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-granite-800 mb-2">Analytics Dashboard</h1>
        <p className="text-granite-600">Track your granite inventory performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<Package className="w-6 h-6" />}
          label="Total Materials"
          value={stats.totalMaterials}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        
        <StatCard
          icon={<ImageIcon className="w-6 h-6" />}
          label="Total Photos"
          value={stats.totalPhotos}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        
        <StatCard
          icon={<Factory className="w-6 h-6" />}
          label="Unique Factories"
          value={stats.uniqueFactories}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Available"
          value={stats.availableMaterials}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        
        <StatCard
          icon={<XCircle className="w-6 h-6" />}
          label="Sold Out"
          value={stats.soldMaterials}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Total Entries"
          value={stats.totalFactories}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
      </div>

      {/* Additional Stats Section */}
      <div className="mt-8 bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl shadow-lg p-8 border border-primary-100">
        <h2 className="text-2xl font-bold text-granite-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          Quick Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-granite-600 mb-2">Availability Rate</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white rounded-full h-4 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{
                    width: `${stats.totalMaterials > 0 ? (stats.availableMaterials / stats.totalMaterials) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-2xl font-bold text-green-600">
                {stats.totalMaterials > 0 ? Math.round((stats.availableMaterials / stats.totalMaterials) * 100) : 0}%
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-granite-600 mb-2">Average Photos per Material</p>
            <p className="text-4xl font-bold text-purple-600">
              {stats.totalMaterials > 0 ? (stats.totalPhotos / stats.totalMaterials).toFixed(1) : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
