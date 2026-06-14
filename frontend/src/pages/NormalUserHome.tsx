import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import { Search, MapPin, Store, Star, StarOff, Sparkles, PenTool, X } from 'lucide-react';

export const NormalUserHome: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Rating Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [userRating, setUserRating] = useState<number>(5);

  // Store Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailStore, setDetailStore] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const openStoreDetail = async (storeId: number) => {
    setDetailLoading(true);
    setIsDetailOpen(true);
    try {
      const response = await api.get(`/stores/${storeId}`);
      setDetailStore(response.data);
    } catch (error) {
      console.error('Fetch store details error:', error);
      toast.error('Failed to load store details.');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRateFromDetail = (storeObj: any) => {
    const matchedStore = stores.find((s) => s.id === storeObj.id);
    setSelectedStore(matchedStore || {
      id: storeObj.id,
      name: storeObj.name,
      address: storeObj.address,
      myRating: null,
      ratingId: null
    });
    setUserRating(matchedStore?.myRating || 5);
    setIsDetailOpen(false);
    setIsModalOpen(true);
  };

  const renderDetailDistribution = (reviews: any[]) => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating as 5 | 4 | 3 | 2 | 1]++;
      }
    });
    const total = reviews.length;

    return (
      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = counts[stars as 5 | 4 | 3 | 2 | 1];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={stars} className="flex items-center gap-2.5 text-xs">
              <span className="font-bold text-slate-400 w-5">{stars}★</span>
              <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden relative border border-slate-900">
                <div style={{ width: `${pct}%` }} className="h-full bg-amber-500 rounded-full transition-all duration-300" />
              </div>
              <span className="font-semibold text-slate-500 w-12 text-right">
                {count} <span className="text-[10px] text-slate-600">({Math.round(pct)}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    );
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
                onClick={() => openStoreDetail(store.id)}
                className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/2 hover:-translate-y-1 cursor-pointer"
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
                    onClick={(e) => { e.stopPropagation(); openRatingModal(store); }}
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

        {/* Modal: Store Detail View */}
        {isDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              {/* Close Button */}
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950/40 p-2 rounded-full border border-slate-850 hover:border-slate-800 transition"
              >
                <X size={16} />
              </button>

              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                  <span className="ml-3 font-semibold text-slate-400 mt-2">Loading store details...</span>
                </div>
              ) : detailStore ? (
                <div className="space-y-6">
                  
                  {/* Store Info Header */}
                  <div className="border-b border-slate-850 pb-5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-extrabold text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-2">
                      Store Details
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{detailStore.store.name}</h3>
                    <p className="text-slate-400 flex items-center gap-1 text-sm mt-1">
                      <MapPin size={14} className="text-slate-500 shrink-0" />
                      <span>{detailStore.store.address}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Contact: {detailStore.store.email}</p>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                    
                    {/* Big Score Card */}
                    <div className="flex flex-col items-center justify-center text-center p-3">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">Average Score</span>
                      <span className="text-5xl font-black text-white">{detailStore.overallRating || '-'}</span>
                      <div className="flex items-center gap-0.5 mt-2">
                        <StarRating rating={Math.round(detailStore.overallRating)} size={16} />
                      </div>
                      <span className="text-xs text-slate-500 mt-1.5 font-medium">{detailStore.totalRatings} user reviews</span>
                    </div>

                    {/* Horizontal distribution bars */}
                    <div className="border-t md:border-t-0 md:border-l border-slate-850 pt-5 md:pt-0 md:pl-6">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block mb-3">Rating Breakdown</span>
                      {renderDetailDistribution(detailStore.reviews)}
                    </div>
                  </div>

                  {/* Public Reviews Log */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Public Reviews</h4>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-2 divide-y divide-slate-850/60">
                      {detailStore.reviews.length > 0 ? (
                        detailStore.reviews.map((review: any) => (
                          <div key={review.id} className="pt-3 first:pt-0">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-400">
                                  {review.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-white block leading-tight">{review.user.name}</span>
                                  <span className="text-[10px] text-slate-500">{review.user.email}</span>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="flex items-center gap-0.5">
                                  <StarRating rating={review.rating} size={11} />
                                </div>
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs font-medium">
                          No reviews submitted for this store yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-3 pt-5 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-slate-850 text-slate-300 transition"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRateFromDetail(detailStore.store)}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-650 hover:from-indigo-600 hover:to-violet-750 text-white transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <PenTool size={14} />
                      {stores.find(s => s.id === detailStore.store.id)?.myRating ? 'Edit Your Rating' : 'Rate This Store'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 text-sm">
                  Failed to load details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default NormalUserHome;
