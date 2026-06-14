import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import { Store, Star, Calendar, User, Mail, Award, Clock } from 'lucide-react';

export const StoreOwnerDashboard: React.FC = () => {
  const [store, setStore] = useState<any>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/store-owner/dashboard');
      setStore(response.data.store);
      setAverageRating(response.data.averageRating);
      setTotalRatings(response.data.totalRatings);
      setRatings(response.data.ratings);
    } catch (error: any) {
      console.error('Fetch owner dashboard error:', error);
      const msg = error.response?.data?.error || 'Failed to load dashboard.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="ml-3 font-semibold text-slate-400">Loading store metrics...</span>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center max-w-md space-y-4">
          <Store size={48} className="mx-auto text-amber-500" />
          <h3 className="text-xl font-bold text-white">No store assigned</h3>
          <p className="text-sm text-slate-400">
            It looks like your owner account hasn't been assigned to any store yet. Please reach out to the System Administrator to register your store.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      {/* Aesthetic blobs */}
      <div className="absolute top-10 left-10 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        
        {/* Welcome Dashboard Header */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <Store size={12} />
              Store Business Account
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{store.name}</h1>
            <p className="text-slate-400 flex items-center gap-1.5 text-sm">
              <Mail size={14} className="text-slate-500" />
              {store.email}
              <span className="text-slate-600">|</span>
              <span className="font-medium">{store.address}</span>
            </p>
          </div>

          {/* Average Rating Big Card */}
          <div className="flex items-center gap-4 bg-slate-950 border border-slate-850 p-4 sm:p-5 rounded-2xl shrink-0">
            <div className="text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Avg Rating</span>
              <span className="text-4xl font-black text-white">{averageRating === 0 ? '-' : averageRating}</span>
            </div>
            <div className="h-10 w-px bg-slate-850" />
            <div>
              <div className="flex items-center gap-0.5">
                <StarRating rating={Math.round(averageRating)} size={18} />
              </div>
              <span className="text-xs text-slate-400 mt-1 block font-semibold">{totalRatings} ratings total</span>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Total Ratings */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award size={24} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quality Score</h3>
              <p className="text-2xl font-bold text-white mt-0.5">
                {averageRating >= 4.5 ? 'Excellent ⭐⭐⭐⭐⭐' : averageRating >= 3.5 ? 'Good ⭐⭐⭐⭐' : averageRating > 0 ? 'Needs Work ⭐⭐⭐' : 'No Reviews Yet'}
              </p>
            </div>
          </div>

          {/* Card: Latest Review time */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Latest Activity</h3>
              <p className="text-xl font-bold text-white mt-0.5">
                {ratings.length > 0 ? formatDate(ratings[0].createdAt) : 'No recent submissions'}
              </p>
            </div>
          </div>
        </div>

        {/* Ratings Table Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-white">Users who rated your store</h2>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-xl">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-200 uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {ratings.length > 0 ? (
                  ratings.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/10">
                      <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-400">
                          {r.user.name.charAt(0).toUpperCase()}
                        </div>
                        {r.user.name}
                      </td>
                      <td className="px-6 py-4">{r.user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-0.5">
                          <StarRating rating={r.rating} size={14} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={14} className="text-slate-600" />
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No ratings submitted for your store yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
export default StoreOwnerDashboard;
