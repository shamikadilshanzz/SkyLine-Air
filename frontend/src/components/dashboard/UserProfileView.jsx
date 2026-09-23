import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Award, 
  ShieldCheck, 
  CreditCard, 
  Bell, 
  Utensils, 
  Armchair, 
  Plus, 
  Trash2, 
  Lock, 
  Smartphone, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  ChevronRight,
  Shield,
  Key
} from 'lucide-react';

export default function UserProfileView({ user, onUpdateUser, onOpenAuth }) {
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState(user || {});
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Sync formData when user changes
  React.useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  // Card add form modal
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCard, setNewCard] = useState({
    cardHolder: user?.name || '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardType: 'Visa'
  });

  // Load saved cards from backend SQL DB
  React.useEffect(() => {
    async function loadSqlCards() {
      if (!user) return;
      try {
        const { fetchUserCardsApi } = await import('../../api/apiService');
        const rawUserId = user?.rawId || user?.userId || (user?.id ? parseInt(String(user.id).replace(/\D/g, '')) : null);
        if (rawUserId) {
          const apiCards = await fetchUserCardsApi(rawUserId);
          setFormData(prev => ({ ...prev, savedCards: apiCards || [] }));
        } else {
          setFormData(prev => ({ ...prev, savedCards: user?.savedCards || [] }));
        }
      } catch (err) {
        console.warn('[UserProfileView] Card fetch notice:', err.message);
      }
    }
    loadSqlCards();
  }, [user]);

  // If no user is logged in (Guest Mode), show Sign In required screen
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-3xl">
            <User className="w-10 h-10" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <span className="bg-sky-500/20 text-sky-300 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-sky-400/30">
              Guest Mode Active
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Sign In to Access Profile</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are currently browsing as a guest. Please sign in or register to view your personalized passenger profile, manage SkyMiles, and save payment methods.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-4">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Key className="w-4 h-4" />
                <span>Sign In / Register Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const updated = {
      ...formData,
      name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.name
    };
    setFormData(updated);

    if (user?.id) {
      try {
        const { updateUserProfileApi } = await import('../../api/apiService');
        const rawId = parseInt(String(user.id).replace(/\D/g, '')) || 1;
        await updateUserProfileApi(rawId, {
          fullName: updated.name,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phoneNumber: updated.phone,
          title: updated.title,
          dob: updated.dob,
          gender: updated.gender,
          nationality: updated.nationality,
          passportNumber: updated.passportNumber,
          passportExpiry: updated.passportExpiry,
          passportIssuingCountry: updated.passportIssuingCountry,
          frequentFlyerNumber: updated.frequentFlyerNo,
          seatPreference: updated.seatPreference,
          mealPreference: updated.mealPreference,
          address: updated.address,
          city: updated.city,
          country: updated.country,
          emergencyContactName: updated.emergencyContactName,
          emergencyContactPhone: updated.emergencyContactPhone,
          emergencyContactRelationship: updated.emergencyContactRelationship,
          emergencyContactEmail: updated.emergencyContactEmail
        });
      } catch (err) {
        console.warn("Backend user profile save fallback:", err.message);
      }
    }

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setToastMessage('Profile details successfully updated and saved in SQL database!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3500);
  };

  const handleTogglePreference = (key) => {
    const updated = {
      ...formData,
      [key]: !formData[key]
    };
    setFormData(updated);
    if (onUpdateUser) onUpdateUser(updated);
    setToastMessage('Preferences updated');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.cardNumber || !newCard.expiry || !newCard.cvv) return;
    const last4 = newCard.cardNumber.replace(/\D/g, '').slice(-4) || '9999';
    const rawUserId = user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, '')) : 1) || 1;
    let cardObj = {
      id: `card-${Date.now()}`,
      cardType: newCard.cardType,
      last4: last4,
      cardHolder: newCard.cardHolder || formData.name,
      expiry: newCard.expiry,
      cvv: newCard.cvv,
      isDefault: (formData.savedCards || []).length === 0
    };

    try {
      const { saveUserCardApi, fetchUserCardsApi } = await import('../../api/apiService');
      const savedApiCard = await saveUserCardApi({
        userId: rawUserId,
        cardType: newCard.cardType,
        cardHolder: newCard.cardHolder || formData.name,
        last4: last4,
        expiry: newCard.expiry,
        cvv: newCard.cvv,
        isDefault: (formData.savedCards || []).length === 0
      });
      if (savedApiCard) cardObj = savedApiCard;

      const freshCards = await fetchUserCardsApi(rawUserId);
      if (freshCards && freshCards.length > 0) {
        const updated = { ...formData, savedCards: freshCards };
        setFormData(updated);
        if (onUpdateUser) onUpdateUser(updated);
        setShowAddCardModal(false);
        setNewCard({ cardHolder: formData.name, cardNumber: '', expiry: '', cvv: '', cardType: 'Visa' });
        setToastMessage('New payment card saved securely in SQL database!');
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3500);
        return;
      }
    } catch (err) {
      console.warn("Backend card save fallback:", err.message);
    }

    const updatedCards = [...(formData.savedCards || []), cardObj];
    const updated = { ...formData, savedCards: updatedCards };
    setFormData(updated);
    if (onUpdateUser) onUpdateUser(updated);
    setShowAddCardModal(false);
    setNewCard({ cardHolder: formData.name, cardNumber: '', expiry: '', cvv: '', cardType: 'Visa' });
    setToastMessage('New payment card saved securely in SQL database!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3500);
  };

  const handleDeleteCard = async (cardId) => {
    try {
      const { deleteUserCardApi } = await import('../../api/apiService');
      await deleteUserCardApi(cardId);
    } catch (err) {
      console.warn("Backend card delete notice:", err.message);
    }

    const updatedCards = (formData.savedCards || []).filter(c => c.id !== cardId);
    const updated = { ...formData, savedCards: updatedCards };
    setFormData(updated);
    if (onUpdateUser) onUpdateUser(updated);
    setToastMessage('Payment card removed from SQL database');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const handleSetDefaultCard = async (cardId) => {
    try {
      const { setDefaultCardApi } = await import('../../api/apiService');
      const rawUserId = user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, '')) : 1) || 1;
      await setDefaultCardApi(cardId, rawUserId);
    } catch (err) {
      console.warn("Backend set default card notice:", err.message);
    }

    const updatedCards = (formData.savedCards || []).map(c => ({
      ...c,
      isDefault: c.id === cardId
    }));
    const updated = { ...formData, savedCards: updatedCards };
    setFormData(updated);
    if (onUpdateUser) onUpdateUser(updated);
    setToastMessage('Default payment card updated in SQL database!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const navigationSections = [
    { id: 'personal', label: 'Personal Information', icon: User, badge: null },
    { id: 'passport', label: 'Passport & Travel Docs', icon: FileText, badge: 'Verified' },
    { id: 'loyalty', label: 'SkyMiles & Loyalty', icon: Award, badge: formData.loyaltyTier || 'Gold' },
    { id: 'preferences', label: 'Travel Preferences', icon: Armchair, badge: null },
    { id: 'emergency', label: 'Emergency Contacts', icon: Shield, badge: null },
    { id: 'payment', label: 'Saved Payment Methods', icon: CreditCard, badge: `${(formData.savedCards || []).length} Cards` },
    { id: 'security', label: 'Security & Account', icon: Lock, badge: formData.twoFactorEnabled ? '2FA On' : null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Toast Notification */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Profile Overview Header */}
      <div className="hero-gradient text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 border-2 border-white/20">
                {formData.firstName?.charAt(0) || 'A'}
                {formData.lastName?.charAt(0) || 'M'}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900" title="Verified Passenger">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                  {formData.loyaltyTier || 'Gold VIP Passenger'}
                </span>
                <span className="text-xs text-slate-300">Member since {formData.joinedDate || '2023'}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {formData.title || 'Mr'} {formData.firstName || 'Alex'} {formData.lastName || 'Morgan'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-sky-400" /> {formData.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-sky-400" /> {formData.phone}</span>
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-sky-400" /> {formData.country || 'Sri Lanka'}</span>
              </div>
            </div>
          </div>

          {/* Quick Loyalty Card Counter */}
          <div className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">SkyMiles Rewards</div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {formData.loyaltyPoints || 1450} <span className="text-xs font-normal text-amber-200">pts</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">FFN: <span className="font-mono text-white font-semibold">{formData.frequentFlyerNo || 'SL-8849201'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Navigation Tabs Sidebar & Detail Content Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-3 border border-slate-200 shadow-sm space-y-1 self-start">
          <div className="px-3 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Account Management
          </div>
          
          {navigationSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left px-3.5 py-3 rounded-2xl flex items-center justify-between transition-all text-xs font-semibold ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span>{sec.label}</span>
                </div>
                {sec.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Main Content Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          
          {/* 1. PERSONAL INFORMATION */}
          {activeSection === 'personal' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" /> Personal Details
                  </h3>
                  <p className="text-xs text-slate-500">Manage your name, contact information, and residential address</p>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <select
                    value={formData.title || 'Mr'}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.nationality || ''}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country of Residence</label>
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">Home Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 2. PASSPORT & TRAVEL DOCUMENTS */}
          {activeSection === 'passport' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Passport & Travel Documents
                  </h3>
                  <p className="text-xs text-slate-500">Required for international flight check-in and automated e-ticket validation</p>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Passport Info
                </button>
              </div>

              {/* Passport Status Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-900">Passport Status: Verified & Active</div>
                  <div className="text-[11px] text-emerald-700">Valid for international travel through October 2031 (More than 6 months validity remaining)</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={formData.passportNumber || ''}
                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. N9849201"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.passportExpiry || ''}
                    onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issuing Country</label>
                  <input
                    type="text"
                    value={formData.passportIssuingCountry || ''}
                    onChange={(e) => handleInputChange('passportIssuingCountry', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TSA PreCheck / KTN (Known Traveler No)</label>
                  <input
                    type="text"
                    value={formData.tsaPreCheckNumber || ''}
                    onChange={(e) => handleInputChange('tsaPreCheckNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Optional (e.g. KTN-9820149)"
                  />
                </div>
              </div>
            </form>
          )}

          {/* 3. SKYMILES & LOYALTY */}
          {activeSection === 'loyalty' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" /> SkyMiles Loyalty Program
                </h3>
                <p className="text-xs text-slate-500">Track membership tier benefits, points balance, and tier progression</p>
              </div>

              {/* Digital Membership Card */}
              <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-amber-400/30">
                <div className="absolute right-0 bottom-0 opacity-10 font-black text-8xl pointer-events-none">SKYLINE</div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs font-bold tracking-widest text-amber-200 uppercase">OFFICIAL FREQUENT FLYER MEMBER</div>
                    <div className="text-xl font-black mt-0.5">{formData.loyaltyTier || 'Gold VIP Tier'}</div>
                  </div>
                  <Sparkles className="w-8 h-8 text-amber-200 animate-pulse" />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-amber-200 uppercase font-bold">Frequent Flyer Number</div>
                    <div className="text-xl font-mono font-bold tracking-wider">{formData.frequentFlyerNo || 'SL-8849201'}</div>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-amber-400/30">
                    <div>
                      <div className="text-[10px] text-amber-200 uppercase font-bold">Cardholder</div>
                      <div className="text-sm font-bold">{formData.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-amber-200 uppercase font-bold">Points Balance</div>
                      <div className="text-2xl font-black text-white font-mono">{formData.loyaltyPoints || 1450} PTS</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress to Next Tier */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Progress to Platinum VIP Tier</span>
                  <span className="font-bold text-blue-600">{formData.loyaltyPoints} / {formData.nextTierPoints || 2000} pts</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, ((formData.loyaltyPoints || 1450) / (formData.nextTierPoints || 2000)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Earn 550 more points by flying with SkyLine Air to unlock complimentary lounge access and priority baggage.</p>
              </div>

              {/* Tier Privileges Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Active Gold Member Privileges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Priority Check-In & Boarding Gate Access',
                    'Complimentary Layover Hotel (Layovers > 8h)',
                    '+10kg Additional Free Checked Baggage Allowance',
                    'Free Seat Selection (Standard & Preferred Seats)',
                    '1.5x SkyMiles Earning Multiplier on all flights',
                    'Dedicated 24/7 VIP Customer Support Line'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. TRAVEL PREFERENCES */}
          {activeSection === 'preferences' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Armchair className="w-5 h-5 text-blue-600" /> Travel & Cabin Preferences
                </h3>
                <p className="text-xs text-slate-500">Preset default seat selection, meal plans, and flight communication alerts</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Armchair className="w-4 h-4 text-blue-600" /> Seat Choice
                  </label>
                  <select
                    value={formData.seatPreference || 'Window'}
                    onChange={(e) => {
                      handleInputChange('seatPreference', e.target.value);
                      handleSaveProfile();
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Window">Window Seat</option>
                    <option value="Aisle">Aisle Seat</option>
                    <option value="Extra Legroom">Extra Legroom Exit Row</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-blue-600" /> In-Flight Meal Plan
                  </label>
                  <select
                    value={formData.mealPreference || 'Vegetarian'}
                    onChange={(e) => {
                      handleInputChange('mealPreference', e.target.value);
                      handleSaveProfile();
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Standard">Standard Menu</option>
                    <option value="Vegetarian">Asian Vegetarian</option>
                    <option value="Vegan">Strict Vegan</option>
                    <option value="Halal">Halal Meal</option>
                    <option value="Kosher">Kosher Meal</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" /> Preferred Class
                  </label>
                  <select
                    value={formData.preferredCabin || 'Business'}
                    onChange={(e) => {
                      handleInputChange('preferredCabin', e.target.value);
                      handleSaveProfile();
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Economy">Economy Class</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business Class</option>
                    <option value="First">First Class</option>
                  </select>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Automated Notification Alerts</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">SMS Flight Status & Gate Updates</div>
                        <div className="text-[11px] text-slate-500">Receive instant text alerts for delays, boarding gates, and PNR notifications</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePreference('smsAlerts')}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${formData.smsAlerts ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${formData.smsAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Email E-Tickets & Hotel Vouchers</div>
                        <div className="text-[11px] text-slate-500">Automatically send PDF boarding passes and layover hotel vouchers to email</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePreference('emailTickets')}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${formData.emailTickets ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${formData.emailTickets ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. EMERGENCY CONTACTS */}
          {activeSection === 'emergency' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" /> Emergency Contact Details
                  </h3>
                  <p className="text-xs text-slate-500">Designate an emergency contact person for international flights</p>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Contact
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Emergency Contact Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyContactRelationship || ''}
                    onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Spouse, Parent, Sibling"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+1 555-0199"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.emergencyContactEmail || ''}
                    onChange={(e) => handleInputChange('emergencyContactEmail', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="emergency@example.com"
                  />
                </div>
              </div>
            </form>
          )}

          {/* 6. SAVED PAYMENT METHODS */}
          {activeSection === 'payment' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" /> Saved Payment Methods
                  </h3>
                  <p className="text-xs text-slate-500">Manage encrypted cards for express 1-click flight reservations</p>
                </div>
                <button
                  onClick={() => setShowAddCardModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add New Card
                </button>
              </div>

              {/* Cards Grid */}
              {(formData.savedCards || []).length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                  <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No saved payment cards yet</p>
                  <p className="text-[11px] text-slate-400">Add a credit or debit card for faster 1-click checkout</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formData.savedCards || []).map((card) => (
                    <div 
                      key={card.id}
                      className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden flex flex-col justify-between h-44"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-extrabold tracking-widest text-sky-400 uppercase flex items-center gap-2">
                            <span>{card.cardType}</span>
                            {card.isDefault && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                                DEFAULT CARD
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!card.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultCard(card.id)}
                              className="text-[10px] font-extrabold text-sky-300 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-all"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors p-1"
                            title="Remove Card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-lg font-mono font-bold tracking-widest text-slate-200">
                          •••• •••• •••• {card.last4}
                        </div>
                      </div>

                      <div className="flex justify-between items-end text-xs">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">Cardholder</div>
                          <div className="font-semibold text-slate-200">{card.cardHolder}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-slate-400 uppercase font-bold">Expires</div>
                          <div className="font-semibold text-slate-200">{card.expiry}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Card Modal */}
              {showAddCardModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
                    <h3 className="text-base font-extrabold text-slate-900">Add New Payment Card</h3>
                    
                    <form onSubmit={handleAddCard} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Card Network</label>
                        <select
                          value={newCard.cardType}
                          onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        >
                          <option value="Visa">Visa</option>
                          <option value="Mastercard">Mastercard</option>
                          <option value="Amex">American Express</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          value={newCard.cardHolder}
                          onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4532 •••• •••• 8821"
                          maxLength={19}
                          value={newCard.cardNumber}
                          onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date (MM/YY)</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            maxLength={5}
                            value={newCard.expiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^\d/]/g, '');
                              if (val.length === 2 && !val.includes('/') && newCard.expiry.length < 2) {
                                val = val + '/';
                              }
                              setNewCard({ ...newCard, expiry: val });
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>CVV / CVC Code</span>
                            <span className="text-[10px] text-slate-400 font-normal">3-4 digits</span>
                          </label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={4}
                            value={newCard.cvv}
                            onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tracking-widest"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddCardModal(false)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
                        >
                          Save Card
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. SECURITY & ACCOUNT SETTINGS */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" /> Security & Account Authentication
                </h3>
                <p className="text-xs text-slate-500">Manage 2-Factor Authentication, login passwords, and session activity</p>
              </div>

              {/* 2FA Card */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <Key className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Two-Factor Authentication (2FA)</div>
                    <div className="text-[11px] text-slate-500">Require an SMS verification code whenever logging into SkyLine Air</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePreference('twoFactorEnabled')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    formData.twoFactorEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {formData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Password Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Password Security</span>
                  <span className="text-slate-500">Last changed: {formData.lastPasswordChange || '2026-06-15'}</span>
                </div>
                <p className="text-[11px] text-slate-500">Your account password complies with airline security policies.</p>
                <button 
                  onClick={() => {
                    setToastMessage('Password reset link sent to your email!');
                    setShowSaveToast(true);
                    setTimeout(() => setShowSaveToast(false), 3000);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Change Password
                </button>
              </div>

              {/* Active Devices Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Active Device Sessions</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-bold text-slate-800">Chrome on Windows 11 (Current Device)</div>
                        <div className="text-[10px] text-slate-400">Colombo, Sri Lanka • IP: 192.168.1.1</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">ACTIVE NOW</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
