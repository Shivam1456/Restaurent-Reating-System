import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import { 
  Star, Search, Edit3, Calendar, Store, MapPin, 
  ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, Inbox
} from 'lucide-react';

export const MyRatings: React.FC = () => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<any>(null);
  const [newRatingScore, setNewRatingScore] = useState<number>(5);

  const fetchMyRatings = async () => {
    try {
      const response = await api.get('/ratings/me');
      setRatings(response.data);
    } catch (error) {
      console.error('Fetch my ratings error:', error);
      toast.error('Failed to load your ratings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRatings();
  }, []);

  const handleEditClick = (ratingRecord: any) => {
    setSelectedRating(ratingRecord);
    setNewRatingScore(ratingRecord.rating);
    setIsModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) return;

    try {
      await api.put(`/ratings/${selectedRating.id}`, { rating: newRatingScore });
      toast.success('Rating updated successfully!');
      setIsModalOpen(false);
      fetchMyRatings();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to update rating.';
      toast.error(msg);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (currentField: string) => {
    if (sortBy !== currentField) return <ArrowUpDown size={14} className="ml-1 text-slate-500" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-indigo-400 font-bold" />
      : <ArrowDown size={14} className="ml-1 text-indigo-400 font-bold" />;
  };

  // 1. Search Filtering
  const filteredRatings = ratings.filter(r => 
    r.store?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.store?.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Sorting
  const sortedRatings = [...filteredRatings].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // Handle nested store sorting
    if (sortBy === 'storeName') {
      valA = a.store?.name.toLowerCase();
      valB = b.store?.name.toLowerCase();
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  // 3. Pagination slicing
  const totalItems = sortedRatings.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  const paginatedRatings = sortedRatings.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="ml-3 font-semibold text-slate-400">Loading your ratings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            My Rated Stores
          </h1>
          <p className="mt-1 text-slate-400">
            View history, filter logs, and manage ratings you've submitted.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Store size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-extrabold tracking-wider block">Rated Stores</span>
              <span className="text-xl font-bold text-white">{ratings.length}</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star size={20} className="fill-amber-400" />
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-extrabold tracking-wider block">Average Rating Given</span>
              <span className="text-xl font-bold text-white">
                {ratings.length > 0 
                  ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Limit Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/20 p-4 rounded-2xl border border-slate-850">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search rated stores by name or address..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Limit selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500">Page size:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-slate-950 border border-slate-850 rounded-xl py-1.5 px-3 text-xs focus:outline-none text-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Tabular logs */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-xl">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-slate-200 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th onClick={() => handleSort('storeName')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                  <div className="flex items-center">Store Name {renderSortIcon('storeName')}</div>
                </th>
                <th onClick={() => handleSort('rating')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                  <div className="flex items-center">My Rating {renderSortIcon('rating')}</div>
                </th>
                <th onClick={() => handleSort('updatedAt')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                  <div className="flex items-center">Date Rated {renderSortIcon('updatedAt')}</div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {paginatedRatings.length > 0 ? (
                paginatedRatings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/10">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{r.store?.name}</div>
                      <p className="text-xs text-slate-500 flex items-center gap-0.5 mt-0.5">
                        <MapPin size={10} />
                        {r.store?.address}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-0.5">
                        <StarRating rating={r.rating} size={14} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={14} className="text-slate-600" />
                        {formatDate(r.updatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditClick(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-indigo-400 hover:border-slate-700 transition active:scale-95"
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox size={32} className="text-slate-700" />
                      <span>No ratings found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-350">{startIndex + 1}</span> to <span className="font-bold text-slate-350">{endIndex}</span> of <span className="font-bold text-slate-350">{totalItems}</span> reviews
            </span>

            {totalPages > 1 && (
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:border-slate-700 transition"
                >
                  Prev
                </button>
                <span className="flex items-center text-xs font-semibold px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:border-slate-700 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: Edit Rating */}
        {isModalOpen && selectedRating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-white text-center border-b border-slate-850 pb-3 mb-5">
                Update Store Rating
              </h3>
              
              <div className="text-center space-y-4 mb-6">
                <p className="text-lg font-bold text-white leading-tight">{selectedRating.store?.name}</p>
                <p className="text-xs text-slate-500 max-w-[250px] mx-auto line-clamp-1">{selectedRating.store?.address}</p>
                
                <div className="flex justify-center pt-3">
                  <StarRating 
                    rating={newRatingScore} 
                    onChange={(r) => setNewRatingScore(r)} 
                    size={36} 
                  />
                </div>
                
                <div className="text-sm font-extrabold text-amber-400">
                  {newRatingScore === 1 && '1 Star - Poor'}
                  {newRatingScore === 2 && '2 Stars - Average'}
                  {newRatingScore === 3 && '3 Stars - Good'}
                  {newRatingScore === 4 && '4 Stars - Very Good'}
                  {newRatingScore === 5 && '5 Stars - Excellent'}
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="flex gap-3 pt-3 border-t border-slate-850">
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
                  Update
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default MyRatings;
