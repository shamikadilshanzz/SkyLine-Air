import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, Plane, ShieldCheck, Ticket, Hotel, ArrowRight } from 'lucide-react';
import { DEMO_ACCOUNTS } from '../../data/mockData';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('passenger@skyline.com');
  const [password, setPassword] = useState('passenger123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('PASSENGER');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const roleOptions = [
    { id: 'PASSENGER', label: 'Passenger', icon: User, color: 'hover:border-blue-500 hover:bg-blue-50/50' },
    { id: 'TICKETING_OFFICER', label: 'Ticketing Officer', icon: Ticket, color: 'hover:border-emerald-500 hover:bg-emerald-50/50' },
    { id: 'ADMIN', label: 'Airline Admin', icon: ShieldCheck, color: 'hover:border-amber-500 hover:bg-amber-50/50' },
    { id: 'HOTEL_MANAGER', label: 'Hotel Manager', icon: Hotel, color: 'hover:border-purple-500 hover:bg-purple-50/50' },
  ];

  const handleSelectDemoAccount = (roleId) => {
    const demo = DEMO_ACCOUNTS[roleId];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      setSelectedRole(roleId);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    if (isRegister && !name) {
      setError('Please enter your full name.');
      return;
    }

    try {
      const { loginUserApi, registerUserApi } = await import('../../api/apiService');
      let userToLogin = null;

      if (!isRegister) {
        userToLogin = await loginUserApi(email, password);
      } else {
        userToLogin = await registerUserApi({
          fullName: name,
          email: email,
          passwordHash: password,
          phoneNumber: phone || '+1 555-0192',
          role: selectedRole,
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
        });
      }

      if (userToLogin) {
        onLoginSuccess(userToLogin);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check backend connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Hero */}
        <div className="hero-gradient p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
              <Plane className="w-4 h-4 text-white transform -rotate-45" />
            </div>
            <span className="font-bold text-lg">SkyLine Air Portal</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            {isRegister ? 'Create Role Account' : 'Sign In to Your Account'}
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            {isRegister 
              ? 'Register with your assigned role to access customized features' 
              : 'Select your role or enter your email & password to log in'}
          </p>
        </div>

        {/* Quick Demo Login Preset Buttons */}
        {!isRegister && (
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-2">
              Select Role Demo Login Preset (1-Click):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((r) => {
                const IconComp = r.icon;
                const isCurrent = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectDemoAccount(r.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md'
                        : `bg-white text-slate-700 border-slate-200 ${r.color}`
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-blue-600'}`} />
                    <span className="truncate font-semibold">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="passenger@skyline.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Login Role</label>
            <select 
              value={selectedRole}
              onChange={(e) => {
                const newRole = e.target.value;
                setSelectedRole(newRole);
                if (DEMO_ACCOUNTS[newRole]) {
                  setEmail(DEMO_ACCOUNTS[newRole].email);
                  setPassword(DEMO_ACCOUNTS[newRole].password);
                }
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none text-slate-900"
            >
              <option value="PASSENGER">Passenger (User)</option>
              <option value="TICKETING_OFFICER">Ticketing Officer</option>
              <option value="ADMIN">Airline Administrator</option>
              <option value="HOTEL_MANAGER">Hotel Manager</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 mt-2"
          >
            <span>{isRegister ? 'Register Account' : `Sign In as ${roleOptions.find(r => r.id === selectedRole)?.label}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register Here"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

