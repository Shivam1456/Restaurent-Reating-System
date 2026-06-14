import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Store, Star, Search, Plus, Filter, ArrowUpDown, 
  ArrowUp, ArrowDown, UserPlus, FileText, CheckCircle, Mail, MapPin, Shield, HelpCircle, Trash2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Tabs: 'users' | 'stores'
  const [activeTab, setActiveTab] = useState<'users' | 'stores'>('users');

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  // Delete User
  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This will also remove any store they own or reviews they submitted.')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        toast.success('User deleted successfully.');
        fetchUsers();
        fetchStats();
      } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.error || 'Failed to delete user.';
        toast.error(msg);
      }
    }
  };

  // Users Tab States
  const [users, setUsers] = useState<any[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersSortBy, setUsersSortBy] = useState('name');
  const [usersSortOrder, setUsersSortOrder] = useState<'asc' | 'desc'>('asc');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  // Stores Tab States
  const [stores, setStores] = useState<any[]>([]);
  const [storesSearch, setStoresSearch] = useState('');
  const [storesSortBy, setStoresSortBy] = useState('name');
  const [storesSortOrder, setStoresSortOrder] = useState<'asc' | 'desc'>('asc');
  const [storesPage, setStoresPage] = useState(1);
  const [storesTotalPages, setStoresTotalPages] = useState(1);

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Add User Form States
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', address: '', role: 'NORMAL_USER'
  });

  // Add Store Form States
  const [newStore, setNewStore] = useState({
    name: '', email: '', address: '', ownerId: ''
  });
  const [availableOwners, setAvailableOwners] = useState<any[]>([]);
  const [ownerSearchName, setOwnerSearchName] = useState('');

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: {
          search: usersSearch,
          role: usersRoleFilter,
          sortBy: usersSortBy,
          sortOrder: usersSortOrder,
          page: usersPage,
          limit: 8
        }
      });
      setUsers(response.data.users);
      setUsersTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to load users list.');
    }
  };

  // Fetch Stores
  const fetchStores = async () => {
    try {
      const response = await api.get('/admin/stores', {
        params: {
          search: storesSearch,
          sortBy: storesSortBy,
          sortOrder: storesSortOrder,
          page: storesPage,
          limit: 8
        }
      });
      setStores(response.data.stores);
      setStoresTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Fetch stores error:', error);
      toast.error('Failed to load stores list.');
    }
  };

  // Fetch Eligible Owners (who don't own stores yet)
  const fetchAvailableOwners = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { role: 'STORE_OWNER', limit: 100 }
      });
      // Filter out users who already have a storeName associated (means they own a store)
      const unassigned = response.data.users.filter((u: any) => !u.storeName);
      setAvailableOwners(unassigned);
    } catch (error) {
      console.error('Fetch owners error:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchStores();
    }
  }, [activeTab, usersSearch, usersRoleFilter, usersSortBy, usersSortOrder, usersPage, storesSearch, storesSortBy, storesSortOrder, storesPage]);

  // Handle Sorts
  const handleUsersSort = (field: string) => {
    if (usersSortBy === field) {
      setUsersSortOrder(usersSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUsersSortBy(field);
      setUsersSortOrder('asc');
    }
    setUsersPage(1);
  };

  const handleStoresSort = (field: string) => {
    if (storesSortBy === field) {
      setStoresSortOrder(storesSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStoresSortBy(field);
      setStoresSortOrder('asc');
    }
    setStoresPage(1);
  };

  // Add User Submit
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      toast.success('User created successfully!');
      setIsUserModalOpen(false);
      setNewUser({ name: '', email: '', password: '', address: '', role: 'NORMAL_USER' });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to create user.';
      toast.error(msg);
    }
  };

  // Add Store Submit
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let resolvedOwnerId: number | undefined = undefined;
      if (ownerSearchName.trim() !== '') {
        const matchedOwner = availableOwners.find(
          o => o.name.toLowerCase() === ownerSearchName.trim().toLowerCase()
        );
        if (!matchedOwner) {
          toast.error(`No available Store Owner found with name "${ownerSearchName}"`);
          return;
        }
        resolvedOwnerId = matchedOwner.id;
      }

      const payload = {
        name: newStore.name,
        email: newStore.email,
        address: newStore.address,
        ownerId: resolvedOwnerId
      };
      await api.post('/admin/stores', payload);
      toast.success('Store created successfully!');
      setIsStoreModalOpen(false);
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      setOwnerSearchName('');
      fetchStores();
      fetchStats();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to create store.';
      toast.error(msg);
    }
  };

  const renderSortIcon = (sortBy: string, currentField: string, sortOrder: 'asc' | 'desc') => {
    if (sortBy !== currentField) return <ArrowUpDown size={14} className="ml-1 text-slate-500" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-indigo-400 font-bold" />
      : <ArrowDown size={14} className="ml-1 text-indigo-400 font-bold" />;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      {/* Decorative Blobs */}
      <div className="absolute top-10 left-10 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              System Admin Dashboard
            </h1>
            <p className="mt-1 text-slate-400">
              Manage platform stores, assign owners, and monitor ratings database.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:shadow-lg active:scale-98"
            >
              <UserPlus size={16} />
              Add User
            </button>
            <button
              onClick={() => {
                fetchAvailableOwners();
                setIsStoreModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-98"
            >
              <Plus size={16} />
              Add Store
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Users</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Store size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Stores</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{stats.totalStores}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star size={24} className="fill-amber-500/10 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Ratings</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{stats.totalRatings}</h3>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="border-b border-slate-800 flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-lg font-bold border-b-2 px-1 transition-all duration-200 focus:outline-none ${
              activeTab === 'users' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-4 text-lg font-bold border-b-2 px-1 transition-all duration-200 focus:outline-none ${
              activeTab === 'stores' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Manage Stores
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'users' ? (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-900/20 p-4 rounded-2xl border border-slate-800/60">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search name, email, or address..."
                  value={usersSearch}
                  onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {/* Role filter */}
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-3.5 top-3 text-slate-500" size={16} />
                <select
                  value={usersRoleFilter}
                  onChange={(e) => { setUsersRoleFilter(e.target.value); setUsersPage(1); }}
                  className="w-full appearance-none bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Roles</option>
                  <option value="SYSTEM_ADMIN">System Admin</option>
                  <option value="NORMAL_USER">Normal User</option>
                  <option value="STORE_OWNER">Store Owner</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-xl">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-200 uppercase font-semibold text-xs tracking-wider">
                  <tr>
                    <th onClick={() => handleUsersSort('name')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                      <div className="flex items-center">Name {renderSortIcon(usersSortBy, 'name', usersSortOrder)}</div>
                    </th>
                    <th onClick={() => handleUsersSort('email')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                      <div className="flex items-center">Email {renderSortIcon(usersSortBy, 'email', usersSortOrder)}</div>
                    </th>
                    <th onClick={() => handleUsersSort('address')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                      <div className="flex items-center">Address {renderSortIcon(usersSortBy, 'address', usersSortOrder)}</div>
                    </th>
                    <th onClick={() => handleUsersSort('role')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                      <div className="flex items-center">Role {renderSortIcon(usersSortBy, 'role', usersSortOrder)}</div>
                    </th>
                    <th className="px-6 py-4">Store details / Rating</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/10">
                        <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{u.address || <span className="text-slate-600">-</span>}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            u.role === 'SYSTEM_ADMIN' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : u.role === 'STORE_OWNER'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {u.role === 'SYSTEM_ADMIN' ? 'Admin' : u.role === 'STORE_OWNER' ? 'Store Owner' : 'Normal User'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.role === 'STORE_OWNER' ? (
                            u.storeName ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-200">{u.storeName}</span>
                                <span className="flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                                  <Star size={10} className="fill-amber-400" />
                                  {u.storeRating === 0 ? 'No rating' : u.storeRating}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-500 font-medium italic">No store assigned</span>
                            )
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.id !== currentUser?.id ? (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors focus:outline-none"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 italic px-2">You</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">
                        No users found matching requirements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* User Pagination */}
            {usersTotalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={usersPage === 1}
                  onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:border-slate-700 transition"
                >
                  Prev
                </button>
                <span className="flex items-center text-sm font-semibold text-slate-300 px-2">
                  Page {usersPage} of {usersTotalPages}
                </span>
                <button
                  disabled={usersPage === usersTotalPages}
                  onClick={() => setUsersPage(prev => Math.min(prev + 1, usersTotalPages))}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:border-slate-700 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Store Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-900/20 p-4 rounded-2xl border border-slate-800/60">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search store name, email, or address..."
                  value={storesSearch}
                  onChange={(e) => { setStoresSearch(e.target.value); setStoresPage(1); }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Stores Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-xl">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-200 uppercase font-semibold text-xs tracking-wider">
                  <tr>
                    <th onClick={() => handleStoresSort('name')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                      <div className="flex items-center">Store Name {renderSortIcon(storesSortBy, 'name', storesSortOrder)}</div>
                    </th>
                    <th onClick={() => handleStoresSort('email')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                      <div className="flex items-center">Email {renderSortIcon(storesSortBy, 'email', storesSortOrder)}</div>
                    </th>
                    <th onClick={() => handleStoresSort('address')} className="cursor-pointer px-6 py-4 hover:bg-slate-900/40 select-none">
                      <div className="flex items-center">Address {renderSortIcon(storesSortBy, 'address', storesSortOrder)}</div>
                    </th>
                    <th className="px-6 py-4">Owner</th>
                    <th className="px-6 py-4">Overall Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {stores.length > 0 ? (
                    stores.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/10">
                        <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                        <td className="px-6 py-4">{s.email}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{s.address}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-200">{s.owner?.name}</span>
                          <p className="text-xs text-slate-500">{s.owner?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex w-max items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-400 border border-amber-500/20">
                            <Star size={14} className="fill-amber-400" />
                            {s.overallRating === 0 ? 'No ratings' : `${s.overallRating} (${s.totalRatings})`}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">
                        No stores found matching requirements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Stores Pagination */}
            {storesTotalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={storesPage === 1}
                  onClick={() => setStoresPage(prev => Math.max(prev - 1, 1))}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:border-slate-700 transition"
                >
                  Prev
                </button>
                <span className="flex items-center text-sm font-semibold text-slate-300 px-2">
                  Page {storesPage} of {storesTotalPages}
                </span>
                <button
                  disabled={storesPage === storesTotalPages}
                  onClick={() => setStoresPage(prev => Math.min(prev + 1, storesTotalPages))}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:border-slate-700 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add User */}
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <UserPlus size={20} className="text-indigo-400" />
                Add New User
              </h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address (Optional)</label>
                  <input
                    type="text"
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="NORMAL_USER">Normal User</option>
                    <option value="STORE_OWNER">Store Owner</option>
                    <option value="SYSTEM_ADMIN">System Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-800 text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Store */}
        {isStoreModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Store size={20} className="text-indigo-400" />
                Add New Store
              </h3>
              <form onSubmit={handleAddStore} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Gourmet Delights"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newStore.email}
                    onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="store@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={newStore.address}
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="456 Gourmet Ave, Foodtown"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Assign Owner Name (Optional)</label>
                  <input
                    type="text"
                    list="owners-list"
                    value={ownerSearchName}
                    onChange={(e) => setOwnerSearchName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500"
                    placeholder="Type owner's name..."
                  />
                  <datalist id="owners-list">
                    {availableOwners.map((owner) => (
                      <option key={owner.id} value={owner.name} />
                    ))}
                  </datalist>
                  {availableOwners.length === 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Note: No available unassigned store owners on the platform.
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStoreModalOpen(false);
                      setOwnerSearchName('');
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-800 text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md"
                  >
                    Create Store
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;
