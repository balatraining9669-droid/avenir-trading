import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Material } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Image as ImageIcon, X } from 'lucide-react';
import { ImageViewer } from '../components/ImageViewer';

export const MaterialsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  // Form states
  const [factoryName, setFactoryName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [rate, setRate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'available' | 'sold'>('available');
  const [images, setImages] = useState<FileList | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  useEffect(() => {
    console.log('🔄 Fetching materials from database...');
    fetchMaterials();

    // Subscribe to realtime changes
    console.log('👂 Setting up realtime subscription...');
    const subscription = supabase
      .channel('materials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        console.log('🔔 Realtime update received, refetching materials...');
        fetchMaterials();
      })
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from realtime...');
      subscription.unsubscribe();
    };
  }, []);

  const fetchMaterials = async () => {
    try {
      console.log('📊 Querying materials table...');
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching materials:', error);
        throw error;
      }
      
      console.log('✅ Materials fetched successfully:', data?.length, 'items');
      
      // Map database fields (snake_case) to Material interface (camelCase)
      const mappedMaterials = (data || []).map(item => ({
        id: item.id,
        factory_name: item.factory_name,
        owner_name: item.owner_name,
        owner_phone: item.owner_phone || '',
        rate: item.rate,
        images: item.images || [],
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        description: item.description || '',
        notes: item.notes || ''
      }));
      
      setMaterials(mappedMaterials as any);
    } catch (error: any) {
      console.error('❌ Error in fetchMaterials:', error);
      toast.error('Failed to fetch materials');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Starting material submission...');
    
    if (!userProfile?.id) {
      console.error('❌ No user profile found or missing id');
      console.log('Current userProfile:', userProfile);
      toast.error('User not authenticated properly. Please try logging out and back in.');
      return;
    }

    console.log('✅ User profile validated:', { id: userProfile.id, uid: userProfile.uid, email: userProfile.email });

    if (!images || images.length === 0) {
      console.error('❌ No images selected');
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    console.log('📤 Upload started:', {
      factoryName,
      ownerName,
      imageCount: images.length,
      isEditing: !!editingMaterial
    });

    try {
      const imageUrls: string[] = editingMaterial?.images || [];

      // Upload new images
      console.log('⬆️ Uploading', images.length, 'images to storage...');
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log(`📸 Uploading image ${i + 1}/${images.length}:`, filePath);

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`❌ Error uploading image ${i + 1}:`, uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
        console.log(`✅ Image ${i + 1} uploaded successfully:`, publicUrl);
      }

      const materialData = {
        factory_name: factoryName,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        rate: parseFloat(rate),
        description: description || null,
        notes: notes || null,
        status,
        images: imageUrls,
        created_by: userProfile.id
      };

      console.log('💾 Saving material data:', materialData);

      if (editingMaterial) {
        console.log('📝 Updating existing material:', editingMaterial.id);
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', editingMaterial.id);

        if (error) {
          console.error('❌ Error updating material:', error);
          throw error;
        }
        console.log('✅ Material updated successfully');
        toast.success('Material updated successfully!');
      } else {
        console.log('➕ Creating new material...');
        const { error } = await supabase
          .from('materials')
          .insert([materialData]);

        if (error) {
          console.error('❌ Error creating material:', error);
          throw error;
        }
        console.log('✅ Material created successfully');
        toast.success('Material added successfully!');
      }

      resetForm();
      fetchMaterials();
    } catch (error: any) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error(error.message || 'Failed to save material');
    } finally {
      setLoading(false);
      console.log('🏁 Upload process completed');
    }
  };

  const handleEdit = (material: Material) => {
    console.log('✏️ Editing material:', material.id);
    setEditingMaterial(material);
    setFactoryName(material.factory_name);
    setOwnerName(material.owner_name);
    setOwnerPhone(material.owner_phone || '');
    setRate(material.rate.toString());
    setDescription(material.description || '');
    setNotes(material.notes || '');
    setStatus(material.status);
    setShowForm(true);
  };

  const handleDelete = async (id: string, imageUrls: string[]) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    console.log('🗑️ Deleting material:', id);

    try {
      // Delete images from storage
      for (const url of imageUrls) {
        const path = url.split('/').pop();
        if (path) {
          console.log('🗑️ Deleting image:', path);
          await supabase.storage.from('materials').remove([path]);
        }
      }

      // Delete material from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting material:', error);
        throw error;
      }

      console.log('✅ Material deleted successfully');
      toast.success('Material deleted successfully!');
      fetchMaterials();
    } catch (error: any) {
      console.error('❌ Error in handleDelete:', error);
      toast.error('Failed to delete material');
    }
  };

  const resetForm = () => {
    setFactoryName('');
    setOwnerName('');
    setOwnerPhone('');
    setRate('');
    setDescription('');
    setNotes('');
    setStatus('available');
    setImages(null);
    setImagePreviewUrls([]);
    setEditingMaterial(null);
    setShowForm(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setImages(files);
    
    // Create preview URLs
    if (files && files.length > 0) {
      const urls: string[] = [];
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        urls.push(url);
      });
      setImagePreviewUrls(urls);
    } else {
      setImagePreviewUrls([]);
    }
  };

  const removePreviewImage = (index: number) => {
    if (!images) return;
    
    const dt = new DataTransfer();
    const filesArray = Array.from(images);
    
    filesArray.forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file);
      }
    });
    
    setImages(dt.files.length > 0 ? dt.files : null);
    
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    setImagePreviewUrls(newUrls);
  };

  const openImageViewer = (images: string[], initialIndex: number) => {
    setViewerImages(images);
    setViewerInitialIndex(initialIndex);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {viewerOpen && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Materials Management</h1>
          <p className="text-gray-600">Manage your granite materials inventory</p>
        </div>

        {/* Add Material Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Material
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Factory Name *
                  </label>
                  <input
                    type="text"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    placeholder="Enter factory name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    placeholder="Enter owner name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Owner Phone
                  </label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rate (per sq ft) *
                  </label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    placeholder="Enter rate"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={3}
                  placeholder="Enter material description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'available' | 'sold')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Images * {editingMaterial && '(Upload new images to add more)'}
                </label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  multiple
                  accept="image/*"
                  required={!editingMaterial}
                />
                
                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Selected images ({imagePreviewUrls.length}):</p>
                    <div className="grid grid-cols-4 gap-3">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removePreviewImage(index)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading ? 'Saving...' : editingMaterial ? 'Update Material' : 'Add Material'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-200 transform hover:scale-105"
            >
              {/* Image Carousel */}
              {material.images && material.images.length > 0 ? (
                <div 
                  className="relative h-56 bg-gray-100 cursor-pointer group"
                  onClick={() => openImageViewer(material.images, 0)}
                >
                  <img
                    src={material.images[0]}
                    alt={material.factory_name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
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
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      material.status === 'available'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {material.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {material.factory_name}
                </h3>
                <p className="text-gray-600 mb-4">Owner: {material.owner_name}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{material.rate}/sq ft
                  </span>
                </div>

                {material.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {material.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(material)}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(material.id, material.images)}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {materials.length === 0 && !showForm && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <ImageIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No materials yet</h3>
            <p className="text-gray-500">Click the button above to add your first material</p>
          </div>
        )}
      </div>
    </div>
  );
};
