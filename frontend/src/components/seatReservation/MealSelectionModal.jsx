import React, { useState } from 'react';
import { 
  X, 
  Utensils, 
  Sparkles, 
  Check, 
  Info, 
  Flame, 
  ChefHat, 
  ShieldAlert, 
  Plus, 
  ArrowRight, 
  Coffee, 
  Wine, 
  Heart,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { PRESET_MEALS, CUSTOM_MEAL_OPTIONS } from '../../data/mealData';

export default function MealSelectionModal({ isOpen, onClose, selectedMeal, onSelectMeal }) {
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'custom'
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Custom Meal Builder state
  const [customProtein, setCustomProtein] = useState(CUSTOM_MEAL_OPTIONS.proteins[0]);
  const [customSide, setCustomSide] = useState(CUSTOM_MEAL_OPTIONS.sides[0]);
  const [customBeverage, setCustomBeverage] = useState(CUSTOM_MEAL_OPTIONS.beverages[0]);
  const [customDessert, setCustomDessert] = useState(CUSTOM_MEAL_OPTIONS.desserts[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Preset detail preview modal state
  const [previewMeal, setPreviewMeal] = useState(null);

  if (!isOpen) return null;

  // Filter preset meals
  const filteredPresets = PRESET_MEALS.filter(meal => {
    if (filterCategory === 'All') return true;
    if (filterCategory === 'Free') return meal.price === 0;
    if (filterCategory === 'Gourmet') return meal.price > 0;
    return meal.dietaryTags.some(tag => tag.toLowerCase().includes(filterCategory.toLowerCase())) || meal.category === filterCategory;
  });

  // Calculate custom meal price & calories
  const customMealBasePrice = 12; // Base custom tray charge
  const customMealPrice = customMealBasePrice + 
    (customProtein?.price || 0) + 
    (customSide?.price || 0) + 
    (customBeverage?.price || 0) + 
    (customDessert?.price || 0);

  const customMealCalories = (customProtein?.calories || 0) + (customSide?.calories || 0) + (customDessert?.calories || 0);

  const handleConfirmCustomMeal = () => {
    const mealObj = {
      type: 'CUSTOM',
      id: `custom-${Date.now()}`,
      name: `Custom Meal (${customProtein.name} + ${customSide.name})`,
      category: 'Custom Chef Tray',
      price: customMealPrice,
      calories: `${customMealCalories} kcal`,
      dietaryTags: ['Custom Crafted'],
      description: `Protein: ${customProtein.name}, Side: ${customSide.name}, Beverage: ${customBeverage.name}, Dessert: ${customDessert.name}.`,
      image: customProtein.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      customDetails: {
        protein: customProtein.name,
        side: customSide.name,
        beverage: customBeverage.name,
        dessert: customDessert.name,
        specialInstructions
      }
    };
    onSelectMeal(mealObj);
    onClose();
  };

  const handleSelectPresetMeal = (meal) => {
    const mealObj = {
      type: 'PRESET',
      ...meal
    };
    onSelectMeal(mealObj);
    onClose();
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="hero-gradient text-white p-6 flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-200 uppercase tracking-widest">
                <span>In-Flight Culinary Dining</span>
                <span>•</span>
                <span>Extension</span>
              </div>
              <h2 className="text-xl font-black text-white">Select In-Flight Meal & Dining Experience</h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 gap-4">
          <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-extrabold gap-1">
            <button
              onClick={() => setActiveTab('preset')}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'preset'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Gourmet Preset Meals (With Photos)</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'custom'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Craft Your Custom Meal</span>
              <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase">New</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-semibold hidden md:block">
            Complimentary & Premium Chef Selections
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: PRESET MEALS WITH PHOTOS */}
          {activeTab === 'preset' && (
            <div className="space-y-6">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                <span className="text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {['All', 'Free', 'Gourmet', 'Vegetarian', 'Vegan', 'Halal', 'Standard'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                      filterCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Meal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPresets.map((meal) => {
                  const isSelected = selectedMeal?.id === meal.id;

                  return (
                    <div 
                      key={meal.id}
                      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-xl relative ${
                        isSelected 
                          ? 'border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/20' 
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Dish Image Header */}
                      <div className="relative h-44 overflow-hidden bg-slate-100">
                        <img 
                          src={meal.image} 
                          alt={meal.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />
                        
                        {/* Price Badge */}
                        <div className="absolute top-3 right-3">
                          {meal.price === 0 ? (
                            <span className="bg-emerald-500/90 backdrop-blur text-white text-xs font-black px-3 py-1 rounded-full shadow-lg border border-emerald-300/30">
                              FREE / Included
                            </span>
                          ) : (
                            <span className="bg-amber-500/90 backdrop-blur text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-lg border border-amber-300">
                              +${meal.price}.00
                            </span>
                          )}
                        </div>

                        {/* Popular / Badge */}
                        {meal.badge && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-blue-600/90 backdrop-blur text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-md">
                              {meal.badge}
                            </span>
                          </div>
                        )}

                        {/* Title overlay */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider">
                            {meal.category}
                          </span>
                          <h4 className="font-extrabold text-sm leading-tight text-white drop-shadow">
                            {meal.name}
                          </h4>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {meal.description}
                        </p>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {/* Tags & Calories */}
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                            <div className="flex flex-wrap gap-1">
                              {meal.dietaryTags.map(tag => (
                                <span key={tag} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="flex items-center gap-1 font-mono text-slate-600 text-[10px]">
                              <Flame className="w-3 h-3 text-amber-500" />
                              {meal.calories}
                            </span>
                          </div>

                          {/* Select Action Button */}
                          <button
                            type="button"
                            onClick={() => handleSelectPresetMeal(meal)}
                            className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-900 hover:bg-blue-600 text-white shadow'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Currently Selected</span>
                              </>
                            ) : (
                              <>
                                <span>Choose This Meal</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CRAFT CUSTOM MEAL BUILDER */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              
              {/* Introduction Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Custom Executive Chef Meal Assembly</h4>
                  <p className="text-[11px] text-slate-600">
                    Handpick your favorite gourmet protein base, side, signature beverage, and dessert. Made fresh for your flight.
                  </p>
                </div>
              </div>

              {/* Grid: Options Selector on Left, Live Tray Preview on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Build Steps */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Step 1: Main Protein */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                      Choose Main Course / Protein
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {CUSTOM_MEAL_OPTIONS.proteins.map((p) => {
                        const isSelected = customProtein.id === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setCustomProtein(p)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/30'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-lg">{p.icon}</span>
                              <div className="truncate">
                                <div className="text-xs font-extrabold text-slate-900 truncate">{p.name}</div>
                                <div className="text-[10px] font-semibold text-slate-500">{p.calories} kcal</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                              {p.price === 0 ? 'Free' : `+$${p.price}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Side Dish */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                      Choose Side Dish / Carbohydrate
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {CUSTOM_MEAL_OPTIONS.sides.map((s) => {
                        const isSelected = customSide.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setCustomSide(s)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/30'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-lg">{s.icon}</span>
                              <span className="text-xs font-extrabold text-slate-900 truncate">{s.name}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                              {s.price === 0 ? 'Free' : `+$${s.price}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Beverage & Dessert */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Drink */}
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                        In-Flight Drink
                      </label>
                      <select
                        value={customBeverage.id}
                        onChange={(e) => setCustomBeverage(CUSTOM_MEAL_OPTIONS.beverages.find(b => b.id === e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {CUSTOM_MEAL_OPTIONS.beverages.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.icon} {b.name} ({b.price === 0 ? 'Free' : `+$${b.price}`})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dessert */}
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                        Dessert
                      </label>
                      <select
                        value={customDessert.id}
                        onChange={(e) => setCustomDessert(CUSTOM_MEAL_OPTIONS.desserts.find(d => d.id === e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {CUSTOM_MEAL_OPTIONS.desserts.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.icon} {d.name} ({d.price === 0 ? 'Free' : `+$${d.price}`})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Special Preparation Instructions */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      Special Dietary Notes / Allergies (Optional)
                    </label>
                    <input
                      type="text"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g. No peanut oil, dressing on side, low sodium, extra hot..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                {/* Right Column: Interactive Live Tray Summary */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4" /> Live Tray Composite
                      </span>
                      <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        {customMealCalories} Calories
                      </span>
                    </div>

                    {/* Tray Items List */}
                    <div className="space-y-3 text-xs">
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{customProtein.icon}</span>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Main Protein</div>
                            <div className="font-extrabold text-slate-100">{customProtein.name}</div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-300">
                          {customProtein.price === 0 ? 'Included' : `+$${customProtein.price}`}
                        </span>
                      </div>

                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{customSide.icon}</span>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Side Dish</div>
                            <div className="font-extrabold text-slate-100">{customSide.name}</div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-300">
                          {customSide.price === 0 ? 'Included' : `+$${customSide.price}`}
                        </span>
                      </div>

                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{customBeverage.icon}</span>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Beverage</div>
                            <div className="font-extrabold text-slate-100">{customBeverage.name}</div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-300">
                          {customBeverage.price === 0 ? 'Included' : `+$${customBeverage.price}`}
                        </span>
                      </div>

                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{customDessert.icon}</span>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Dessert</div>
                            <div className="font-extrabold text-slate-100">{customDessert.name}</div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-300">
                          {customDessert.price === 0 ? 'Included' : `+$${customDessert.price}`}
                        </span>
                      </div>

                      {specialInstructions && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-200">
                          <strong className="text-amber-300">Notes:</strong> {specialInstructions}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Custom Tray Total Price</span>
                      <div className="text-2xl font-black text-amber-300">
                        ${customMealPrice}.00
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmCustomMeal}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Select Custom Meal</span>
                    </button>
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
