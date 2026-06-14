import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import { Search, MapPin, Store, Star, StarOff, Sparkles, PenTool } from 'lucide-react';

export const NormalUserHome: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Rating Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [userRating, setUserRating] = useState<number>(5);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores', {
        params: {
          searchName,
          searchAddress
        }
      });
      setStores(response.data);
    } catch (error) {
      console.error('Fetch stores error:', error);
      toast.error('Failed to load stores.');
    }
  };

  useEffect(() => {
    fetchStores();
  }, [searchName, searchAddress]);

  const openRatingModal = (store: any) => {
    setSelectedStore(store);
    setUserRating(store.myRating || 5);
    setIsModalOpen(true);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    try {
      if (selectedStore.ratingId) {
        // Edit existing rating
        await api.put(`/ratings/${selectedStore.ratingId}`, { rating: userRating });
        toast.success(`Updated rating for ${selectedStore.name}!`);
      } else {
        // Submit new rating
        await api.post('/ratings', { storeId: selectedStore.id, rating: userRating });
        toast.success(`Thank you for rating ${selectedStore.name}!`);
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to submit rating.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      {/* Visual background aesthetics */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        {/* Banner Section */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-violet-950/40 border border-slate-800/80 p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              <Sparkles size={12} className="fill-indigo-400/20" />
              Store Rating Platform
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Discover Quality Stores, <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Share Your Reviews</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              Explore user-curated stores around you. Browse average stars and leave your rating to help the community.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 opacity-20 blur-md" />
              <div className="relative bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center gap-2">
                <Star size={48} className="text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-2xl font-black">100%</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">User Driven</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filtering Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 border border-slate-850 rounded-2xl p-5 backdrop-blur-xl">
          {/* Name search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by store name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {/* Address search */}
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by location / address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.length > 0 ? (
            stores.map((store) => (
              <div 
                key={store.id} 
                className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/2 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Store Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-indigo-400">
                      <Store size={20} />
                    </div>
                    {/* Overall Rating badge */}
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-400 border border-amber-500/20">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      {store.overallRating === 0 ? 'No rating' : store.overallRating}
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div>
                    <h3 className="text-xl font-bold text-white line-clamp-1">{store.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{store.email}</p>
                  </div>

                  {/* Address */}
                  <p className="text-sm text-slate-400 flex items-start gap-1">
                    <MapPin size={16} className="text-slate-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{store.address}</span>
                  </p>
                </div>

                {/* Rating Footer */}
                <div className="mt-6 pt-5 border-t border-slate-850/60 flex items-center justify-between gap-4">
                  <div>
                    {store.myRating ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">Your Rating</span>
                        <div className="flex items-center gap-0.5">
                          <StarRating rating={store.myRating} size={14} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Not rated yet</span>
                    )}
                  </div>

                  <button
                    onClick={() => openRatingModal(store)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 active:scale-95 ${
                      store.myRating
                        ? 'bg-slate-900 border border-slate-800 text-indigo-400 hover:border-slate-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/10'
                    }`}
                  >
                    <PenTool size={12} />
                    {store.myRating ? 'Edit Rating' : 'Rate Store'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <StarOff size={48} className="mx-auto text-slate-700 mb-3" />
              <h3 className="text-lg font-bold text-slate-400">No stores found</h3>
              <p className="text-sm text-slate-500 mt-1">Try expanding your search parameters or check back later.</p>
            </div>
          )}
        </div>

        {/* Modal: Rating Entry */}
        {isModalOpen && selectedStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-white text-center border-b border-slate-850 pb-3 mb-5">
                {selectedStore.myRating ? 'Update Your Rating' : 'Rate This Store'}
              </h3>
              
              <div className="text-center space-y-4 mb-6">
                <p className="text-lg font-bold text-white leading-tight">{selectedStore.name}</p>
                <p className="text-xs text-slate-500 max-w-[250px] mx-auto line-clamp-1">{selectedStore.address}</p>
                
                <div className="flex justify-center pt-3">
                  <StarRating 
                    rating={userRating} 
                    onChange={(r) => setUserRating(r)} 
                    size={36} 
                  />
                </div>
                
                <div className="text-sm font-extrabold text-amber-400">
                  {userRating === 1 && '1 Star - Poor'}
                  {userRating === 2 && '2 Stars - Average'}
                  {userRating === 3 && '3 Stars - Good'}
                  {userRating === 4 && '4 Stars - Very Good'}
                  {userRating === 5 && '5 Stars - Excellent'}
                </div>
              </div>

              <form onSubmit={handleRatingSubmit} className="flex gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-slate-800 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white transition shadow-md"
                >
                  {selectedStore.myRating ? 'Update' : 'Submit'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default NormalUserHome;
