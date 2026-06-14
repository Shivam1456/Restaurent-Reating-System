import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, User, MapPin, Eye, EyeOff, Loader2, Star, Check, X } from 'lucide-react';

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'NORMAL_USER' | 'STORE_OWNER' | 'SYSTEM_ADMIN'>('NORMAL_USER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real-time validations status
  const [rules, setRules] = useState({
    nameLen: false,
    emailFormat: false,
    addrLen: true,
    passLen: false,
    passUpper: false,
    passSpecial: false,
    passMatch: false
  });

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const specialCharRegex = /[^A-Za-z0-9]/;

    setRules({
      nameLen: name.trim().length >= 3 && name.trim().length <= 60,
      emailFormat: emailRegex.test(email),
      addrLen: address.length <= 400,
      passLen: password.length >= 8 && password.length <= 16,
      passUpper: /[A-Z]/.test(password),
      passSpecial: specialCharRegex.test(password),
      passMatch: password.length > 0 && password === confirmPassword
    });
  }, [name, email, address, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final checks
    if (!rules.nameLen) {
      toast.error('Name must be between 3 and 60 characters.');
      return;
    }
    if (!rules.emailFormat) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!rules.addrLen) {
      toast.error('Address cannot exceed 400 characters.');
      return;
    }
    if (!rules.passLen || !rules.passUpper || !rules.passSpecial) {
      toast.error('Password does not meet the complexity requirements.');
      return;
    }
    if (!rules.passMatch) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup', {
        name,
        email,
        address: address ? address : undefined,
        password,
        role
      });

      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMsg = error.response?.data?.error || 'Registration failed.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background blobs for aesthetics */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 translate-x-1/2 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Star className="text-white fill-white" size={24} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
              Log in instead
            </Link>
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-850 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
              {name && (
                <p className="mt-1.5 flex items-center gap-1 text-xs">
                  {rules.nameLen ? (
                    <span className="text-emerald-400 flex items-center gap-0.5"><Check size={12} /> Name length valid (3-60 chars)</span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5"><X size={12} /> Name must be 3-60 characters</span>
                  )}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-850 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                  placeholder="john@example.com"
                />
              </div>
              {email && (
                <p className="mt-1.5 flex items-center gap-1 text-xs">
                  {rules.emailFormat ? (
                    <span className="text-emerald-400 flex items-center gap-0.5"><Check size={12} /> Email format valid</span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5"><X size={12} /> Email format invalid</span>
                  )}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-300">
                Address <span className="text-xs text-slate-500">(Optional)</span>
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute top-3 left-3 flex items-center pointer-events-none text-slate-500">
                  <MapPin size={18} />
                </div>
                <textarea
                  id="address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-850 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 resize-none"
                  placeholder="123 Main St, Springfield"
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>Max 400 characters</span>
                <span className={address.length > 400 ? 'text-rose-400 font-bold' : ''}>
                  {address.length}/400
                </span>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                Register As
              </label>
              <div className="mt-1 relative rounded-md">
                <select
                  id="role"
                  value={role}
                  onChange={(e: any) => setRole(e.target.value as any)}
                  className="block w-full px-3 py-2.5 border border-slate-850 rounded-xl bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="NORMAL_USER">Normal User (Rate Stores)</option>
                  <option value="STORE_OWNER">Store Owner (View Business Ratings)</option>
                  <option value="SYSTEM_ADMIN">System Administrator (Manage platform)</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-850 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-850 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Password Validation Checklist */}
            {(password || confirmPassword) && (
              <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-850 space-y-2">
                <p className="text-xs font-semibold text-slate-400">Password Checklist:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <span className={`flex items-center gap-1 ${rules.passLen ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {rules.passLen ? <Check size={12} /> : <X size={12} />} 8 to 16 characters
                  </span>
                  <span className={`flex items-center gap-1 ${rules.passUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {rules.passUpper ? <Check size={12} /> : <X size={12} />} At least 1 uppercase
                  </span>
                  <span className={`flex items-center gap-1 ${rules.passSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {rules.passSpecial ? <Check size={12} /> : <X size={12} />} At least 1 special char
                  </span>
                  <span className={`flex items-center gap-1 ${rules.passMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {rules.passMatch ? <Check size={12} /> : <X size={12} />} Passwords match
                  </span>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98"
              >
                {loading ? (
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Signup;
