import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Material } from '../types';
import toast from 'react-hot-toast';
import { LogOut, ShoppingCart, Phone, Gem, Filter, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageViewer } from '../components/ImageViewer';

export const BuyerDashboard: React.FC = () => {
  const { signOut, userProfile } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold'>('available');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  useEffect(() => {
    fetchMaterials();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('materials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filterStatus]);

  const fetchMaterials = async () => {
    try {
      let query = supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Data already matches our Material interface (snake_case)
      setMaterials((data || []) as Material[]);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleBuyRequest = async (material: Material) => {
    try {
      // Save buy request to database
      const { error } = await supabase
        .from('buy_requests')
        .insert([{
          material_id: material.id,
          buyer_email: userProfile?.email,
          buyer_name: userProfile?.displayName || userProfile?.companyName,
          buyer_phone: userProfile?.phone,
          timestamp: new Date().toISOString(),
          status: 'pending'
        }]);

      if (error) throw error;

      // Send WhatsApp message
      const message = encodeURIComponent(
        `New Buy Request!\n\nMaterial: ${material.factory_name}\nBuyer: ${userProfile?.displayName || userProfile?.companyName}\nPhone: ${userProfile?.phone}\nEmail: ${userProfile?.email}`
      );
      
      const whatsappNumber = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER || '919876543210';
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');

      toast.success('Buy request sent! We will contact you soon.');
      setSelectedMaterial(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send buy request');
    }
  };

  const openImageViewer = (images: string[], initialIndex: number) => {
    setViewerImages(images);
    setViewerInitialIndex(initialIndex);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-granite-50 to-granite-100">
      {viewerOpen && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-granite-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Gem className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-granite-800">Avenir Trading</h1>
                <p className="text-sm text-granite-600">Premium Granite Catalog</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-granite-600">
                Welcome, {userProfile?.displayName || userProfile?.companyName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 btn-secondary"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-granite-600" />
            <span className="text-sm font-medium text-granite-700">Filter:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-granite-700 hover:bg-granite-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === 'available'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-granite-700 hover:bg-granite-100'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterStatus('sold')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === 'sold'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-granite-700 hover:bg-granite-100'
              }`}
            >
              Sold
            </button>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div key={material.id} className="card hover:shadow-lg transition-shadow duration-200">
              {/* Image */}
              <div className="mb-4 relative cursor-pointer group" onClick={() => material.images.length > 0 && openImageViewer(material.images, 0)}>
                {material.images.length > 0 ? (
                  <>
                    <img
                      src={material.images[0]}
                      alt="Granite Material"
                      className="w-full h-64 object-cover rounded-lg transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center rounded-lg">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900">Click to view</p>
                      </div>
                    </div>
                    {material.images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                        <ImageIcon className="w-4 h-4 mr-1" />
                        {material.images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-64 bg-granite-200 rounded-lg flex items-center justify-center">
                    <Gem className="w-12 h-12 text-granite-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    material.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {material.status}
                  </span>
                </div>
              </div>

              {/* Material Info - Only showing price and description */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl text-granite-800">Premium Granite</h3>
                  <p className="text-2xl font-bold text-primary-600">₹{material.rate.toFixed(2)}</p>
                </div>
                <p className="text-sm text-granite-500">per sq ft</p>
                
                {material.description && (
                  <p className="text-sm text-granite-600">{material.description}</p>
                )}

                {/* Buy Button */}
                {material.status === 'available' && (
                  <button
                    onClick={() => setSelectedMaterial(material)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    I'm Interested
                  </button>
                )}
                
                {material.status === 'sold' && (
                  <button
                    disabled
                    className="w-full bg-granite-300 text-granite-600 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {materials.length === 0 && (
          <div className="text-center py-12">
            <Gem className="w-16 h-16 text-granite-400 mx-auto mb-4" />
            <p className="text-granite-500 text-lg">No materials available at the moment.</p>
            <p className="text-granite-400 text-sm">Check back soon for new granite materials!</p>
          </div>
        )}
      </main>

      {/* Buy Request Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-granite-800 mb-4">Confirm Interest</h3>
            <p className="text-granite-600 mb-4">
              Are you interested in this granite material? We'll send your contact information to our team via WhatsApp.
            </p>
            <div className="bg-granite-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-granite-700"><span className="font-semibold">Rate:</span> ₹{selectedMaterial.rate.toFixed(2)}/sq ft</p>
              <p className="text-sm text-granite-700 mt-2"><span className="font-semibold">Your Contact:</span></p>
              <p className="text-sm text-granite-600">{userProfile?.displayName || userProfile?.companyName}</p>
              <p className="text-sm text-granite-600">{userProfile?.phone}</p>
              <p className="text-sm text-granite-600">{userProfile?.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBuyRequest(selectedMaterial)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Send Request
              </button>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
