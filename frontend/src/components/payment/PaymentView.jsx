import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  QrCode,
  Barcode,
  Lock,
  Sparkles,
  Award,
  AlertCircle,
  FileText,
  Mail,
  MessageSquare,
  Hotel,
  Building2,
  MapPin,
  Bed,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ---------- shared style tokens (same as LayoverHotelView / UserDashboard) ---------- */
const CARD = 'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]';
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';

export default function PaymentView({
  reservationData,
  user,
  onUpdateUser,
  onPaymentSuccess,
  onNavigateToHotels
}) {
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD', 'NETBANKING', 'PAYPAL', 'POINTS'
  const [isProcessing, setIsProcessing] = useState(false);

  // Saved Cards state initialized from user profile or loaded from SQL DB
  const [userSavedCards, setUserSavedCards] = useState(user?.savedCards || []);

  React.useEffect(() => {
    async function loadSqlUserCards() {
      if (!user) {
        setUserSavedCards([]);
        return;
      }
      try {
        const { fetchUserCardsApi } = await import('../../api/apiService');
        const rawUserId = user?.rawId || user?.userId || (user?.id ? parseInt(String(user.id).replace(/\D/g, '')) : null);
        if (rawUserId) {
          const apiCards = await fetchUserCardsApi(rawUserId);
          setUserSavedCards(apiCards || []);
        } else {
          setUserSavedCards(user.savedCards || []);
        }
      } catch (err) {
        console.warn('[PaymentView] SQL Card fetch notice:', err.message);
      }
    }
    loadSqlUserCards();
  }, [user]);

  const defaultCard = userSavedCards.find(c => c.isDefault) || userSavedCards[0] || null;
  const [selectedCardId, setSelectedCardId] = useState(defaultCard?.id || 'new');

  const [cardNumber, setCardNumber] = useState(defaultCard ? `•••• •••• •••• ${defaultCard.last4}` : '');
  const [expiry, setExpiry] = useState(defaultCard?.expiry || '');
  const [cvv, setCvv] = useState(defaultCard?.cvv || '');
  const [cardName, setCardName] = useState(defaultCard?.cardHolder || (reservationData?.passenger?.firstName ? `${reservationData.passenger.firstName} ${reservationData.passenger.lastName}` : (user?.name || '')));
  const [cardNetwork, setCardNetwork] = useState(defaultCard?.cardType || 'Visa');
  const [saveNewCardToProfile, setSaveNewCardToProfile] = useState(false);

  React.useEffect(() => {
    if (userSavedCards && userSavedCards.length > 0) {
      const def = userSavedCards.find(c => c.isDefault) || userSavedCards[0];
      setSelectedCardId(def.id);
      setCardNumber(`•••• •••• •••• ${def.last4}`);
      setExpiry(def.expiry);
      setCvv(def.cvv || '');
      setCardName(def.cardHolder);
      setCardNetwork(def.cardType);
    } else {
      setSelectedCardId('new');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardName(reservationData?.passenger?.firstName ? `${reservationData.passenger.firstName} ${reservationData.passenger.lastName}` : (user?.name || ''));
      setCardNetwork('Visa');
    }
  }, [userSavedCards]);

  const handleSelectSavedCard = (card) => {
    setSelectedCardId(card.id);
    setCardNumber(`•••• •••• •••• ${card.last4}`);
    setExpiry(card.expiry);
    setCvv(card.cvv || '');
    setCardName(card.cardHolder);
    setCardNetwork(card.cardType);
  };

  const handleSelectNewCard = () => {
    setSelectedCardId('new');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardName(reservationData?.passenger?.firstName ? `${reservationData.passenger.firstName} ${reservationData.passenger.lastName}` : 'Alex Morgan');
    setCardNetwork('Visa');
  };

  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('883920');
  const [paymentCompleted, setPaymentCompleted] = useState(
    Boolean(
      reservationData?.status === 'CONFIRMED' ||
      reservationData?.bookingStatus === 'CONFIRMED' ||
      reservationData?.paymentStatus === 'PAID'
    )
  );
  const [transactionRef, setTransactionRef] = useState(
    reservationData?.transactionRef || 'TXN-9938102938'
  );

  // Multi-Passenger Fare calculations
  const passengerCount = reservationData?.passengers?.length || reservationData?.passengerCount || reservationData?.flight?.passengers || 1;
  const effectiveCabinClass = (
    reservationData?.cabinClass ||
    reservationData?.flight?.cabinClass ||
    reservationData?.selectedClass ||
    reservationData?.flight?.selectedClass ||
    (reservationData?.passengers && reservationData.passengers[0]?.cabinClass) ||
    'ECONOMY'
  ).toUpperCase();
  const unitPrice = reservationData?.unitPrice || reservationData?.flight?.unitPrice || reservationData?.flight?.priceEconomy || 350;
  const baseFare = reservationData?.baseFlightPrice || (unitPrice * passengerCount);
  const taxesFees = 45 * passengerCount;
  const fuelSurcharge = 25 * passengerCount;
  const baggageFee = reservationData?.extraBaggageFee || 0;
  const mealFee = reservationData?.mealFee || reservationData?.passenger?.mealDetails?.price || 0;
  const hotelFee = reservationData?.hotelPrice || reservationData?.selectedHotel?.totalPrice || 0;
  const pointsDiscount = usePoints ? 50 : 0;
  const totalAmount = reservationData?.totalAmount
    ? Math.max(0, reservationData.totalAmount - discountAmount - pointsDiscount)
    : Math.max(0, baseFare + taxesFees + fuelSurcharge + baggageFee + mealFee + hotelFee - discountAmount - pointsDiscount);

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'SKY2026') {
      setDiscountAmount(50);
    } else {
      alert('Invalid promo code. Try SKY2026 for $50 off!');
    }
  };

  const [cardValidationError, setCardValidationError] = useState('');

  const handleStartPayment = (e) => {
    e.preventDefault();
    setCardValidationError('');

    if (paymentMethod === 'CARD') {
      if (!cardName || cardName.trim().length < 3) {
        setCardValidationError('Please enter a valid Cardholder Full Name (at least 3 characters).');
        return;
      }

      const digitsOnly = cardNumber.replace(/\D/g, '');
      const isMaskedSaved = cardNumber.includes('••••') && digitsOnly.length >= 4;
      if (!isMaskedSaved && digitsOnly.length < 13) {
        setCardValidationError('Please enter a valid Credit or Debit Card Number (13 to 19 digits).');
        return;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
      if (!expiryRegex.test(expiry.trim())) {
        setCardValidationError('Please enter a valid Expiry Date in MM/YY format (e.g. 12/28).');
        return;
      }

      if (!cvv || !/^\d{3,4}$/.test(cvv.trim())) {
        setCardValidationError('Please enter a valid 3 or 4-digit CVV / CVC security code.');
        return;
      }
    }

    setShowOtpModal(true);
  };

  const handleVerifyOtp = async () => {
    setIsProcessing(true);
    const generatedTxn = `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    try {
      const { createReservationApi, processPaymentApi } = await import('../../api/apiService');
      const resRecord = await createReservationApi({
        pnrCode: reservationData?.pnr || `SK-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, '')) || 1 : 1),
        userName: user?.name || reservationData?.passenger?.firstName ? `${reservationData.passenger.firstName} ${reservationData.passenger.lastName}` : 'Alex Morgan',
        userEmail: user?.email || 'alex.morgan@skyline.com',
        flightId: reservationData?.flight?.rawId || 1,
        flightNumber: reservationData?.flight?.flightNumber || 'SL-204',
        origin: reservationData?.flight?.origin || 'CMB',
        destination: reservationData?.flight?.destination || 'LHR',
        departureTime: reservationData?.flight?.departureTime || '2026-09-10T10:15:00',
        cabinClass: effectiveCabinClass,
        totalAmount: totalAmount,
        bookingStatus: 'PENDING_PAYMENT',
        hasLayover: reservationData?.flight?.hasLayover || false,
        layoverCity: reservationData?.flight?.layoverCity,
        layoverAirport: reservationData?.flight?.layoverAirport,
        layoverDurationHours: reservationData?.flight?.layoverDurationHours || 0,
        hotelBooked: !!(reservationData?.hotelBooked || reservationData?.selectedHotel),
        hotelId: reservationData?.selectedHotel?.rawId || (reservationData?.selectedHotel?.id ? parseInt(String(reservationData.selectedHotel.id).replace(/\D/g, '')) : null),
        hotelName: reservationData?.selectedHotel?.name,
        hotelCity: reservationData?.selectedHotel?.city,
        hotelCountry: reservationData?.selectedHotel?.country,
        hotelRoomType: reservationData?.selectedHotel?.roomType,
        hotelPrice: hotelFee,
        hotelVoucherCode: reservationData?.selectedHotel?.voucherCode || (reservationData?.selectedHotel ? `HTV-${Math.floor(100000 + Math.random() * 900000)}` : null),
        passengers: (reservationData?.passengers && reservationData.passengers.length > 0)
          ? reservationData.passengers.map(p => ({
            title: p.title || 'Mr',
            firstName: p.firstName || 'Alex',
            lastName: p.lastName || 'Morgan',
            dob: p.dob || '1992-05-14',
            passportNumber: p.passport || 'N9849201',
            nationality: p.nationality || 'Sri Lanka',
            seatNumber: p.seat || '14A',
            cabinClass: p.cabinClass || effectiveCabinClass,
            mealPreference: p.mealDetails?.name || p.meal || 'Standard',
            extraBaggageKg: p.extraBaggageKg || 0
          }))
          : [
            {
              title: reservationData?.passenger?.title || 'Mr',
              firstName: reservationData?.passenger?.firstName || 'Alex',
              lastName: reservationData?.passenger?.lastName || 'Morgan',
              dob: reservationData?.passenger?.dob || '1992-05-14',
              passportNumber: reservationData?.passenger?.passport || 'N9849201',
              nationality: reservationData?.passenger?.nationality || 'Sri Lanka',
              seatNumber: reservationData?.seat || '14A',
              cabinClass: effectiveCabinClass,
              mealPreference: reservationData?.passenger?.mealDetails?.name || 'Standard',
              extraBaggageKg: reservationData?.passenger?.extraBaggageKg || 0
            }
          ]
      });

      const resId = resRecord?.reservationId || resRecord?.id || 1;
      await processPaymentApi({
        reservationId: resId,
        transactionReference: generatedTxn,
        paymentMethod: paymentMethod === 'CARD' ? `${cardNetwork} CARD` : paymentMethod.toUpperCase(),
        amount: totalAmount,
        paymentStatus: 'SUCCESS'
      });

      // Automatically record hotel booking if hotel was selected
      if (reservationData?.selectedHotel) {
        try {
          const { bookHotelApi } = await import('../../api/apiService');
          await bookHotelApi({
            hotelId: reservationData.selectedHotel.rawId || (reservationData.selectedHotel.id ? parseInt(String(reservationData.selectedHotel.id).replace(/\D/g, '')) : 1) || 1,
            hotelName: reservationData.selectedHotel.name,
            userId: user?.rawId || null,
            guestEmail: user?.email || null,
            voucherCode: reservationData?.selectedHotel?.voucherCode || reservationData?.hotelVoucherCode || null,
            reservationId: resId,
            pnrCode: resRecord?.pnrCode || reservationData?.pnr,
            passengerName: user?.name || (reservationData?.passenger?.firstName ? `${reservationData.passenger.firstName} ${reservationData.passenger.lastName}` : 'Alex Morgan'),
            roomType: reservationData.selectedHotel.roomType || 'Deluxe Transit Suite',
            isComplimentary: false,
            amount: hotelFee,
            bookingStatus: 'CONFIRMED'
          });
        } catch (hErr) {
          console.warn('[PaymentView] Backend hotel booking notice:', hErr.message);
        }
      }

      setIsProcessing(false);
      setShowOtpModal(false);
      setPaymentCompleted(true);
      setTransactionRef(generatedTxn);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          ...reservationData,
          cabinClass: effectiveCabinClass,
          selectedClass: effectiveCabinClass,
          flight: {
            ...(reservationData?.flight || {}),
            cabinClass: effectiveCabinClass,
            selectedClass: effectiveCabinClass
          },
          pnr: resRecord?.pnrCode || reservationData?.pnr,
          transactionRef: generatedTxn,
          status: 'CONFIRMED'
        });
      }
    } catch (err) {
      setIsProcessing(false);
      alert(`Payment Failed: ${err.message}`);
      return;
    }

    // Save new card to profile & SQL DB if selected
    if (selectedCardId === 'new' && saveNewCardToProfile) {
      const last4 = cardNumber.replace(/\D/g, '').slice(-4) || '8892';
      const rawUserId = user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, '')) : 1) || 1;
      let newCardObj = {
        id: `card-${Date.now()}`,
        cardType: cardNetwork || 'Visa',
        last4: last4,
        cardHolder: cardName || 'Alex Morgan',
        expiry: expiry || '08/28',
        cvv: cvv || '',
        isDefault: (userSavedCards || []).length === 0
      };

      try {
        const { saveUserCardApi } = await import('../../api/apiService');
        const savedCard = await saveUserCardApi({
          userId: rawUserId,
          cardType: cardNetwork || 'Visa',
          cardHolder: cardName || 'Alex Morgan',
          last4: last4,
          expiry: expiry || '08/28',
          cvv: cvv || '',
          isDefault: (userSavedCards || []).length === 0
        });
        if (savedCard) newCardObj = savedCard;
      } catch (err) {
        console.warn("Backend card save notice:", err.message);
      }

      setUserSavedCards(prev => [...prev, newCardObj]);
      if (onUpdateUser && user) {
        onUpdateUser({
          ...user,
          savedCards: [...(user.savedCards || []), newCardObj]
        });
      }
    }

    // Trigger Confetti Celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // fallback ignore
    }

    onPaymentSuccess({
      ...reservationData,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      transactionRef: generatedTxn,
      paidAmount: totalAmount
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <style>{`
        @keyframes sl-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
        .sl-pop { animation: sl-pop .5s cubic-bezier(.2,.8,.2,1) both }
        @media (prefers-reduced-motion: reduce) { .sl-pop { animation: none } }
      `}</style>

      {/* Step Indicator Header */}
      <div className={`no-print flex items-center justify-between ${CARD} p-4`}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
          <span className="text-sm font-extrabold text-slate-900">Process online payment & generate e-ticket</span>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          🔒 256-bit SSL encrypted payment gateway
        </span>
      </div>

      {!paymentCompleted ? (
        /* PAYMENT FORM & BREAKDOWN GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Payment Form */}
          <div className={`lg:col-span-7 space-y-6 ${CARD} p-6 md:p-8`}>
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CreditCard className="h-4.5 w-4.5" />
              </span>
              Select payment method
            </h3>

            {/* Payment Options Pill Tabs */}
            <div className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-100 p-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`rounded-xl py-2.5 transition-all ${paymentMethod === 'CARD' ? PRIMARY_BTN : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`rounded-xl py-2.5 transition-all ${paymentMethod === 'NETBANKING' ? PRIMARY_BTN : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Banking
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('PAYPAL')}
                className={`rounded-xl py-2.5 transition-all ${paymentMethod === 'PAYPAL' ? PRIMARY_BTN : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                E-Wallet
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('POINTS')}
                className={`rounded-xl py-2.5 transition-all ${paymentMethod === 'POINTS' ? PRIMARY_BTN : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Miles
              </button>
            </div>

            {/* Credit Card Input Form */}
            {paymentMethod === 'CARD' && (
              <form onSubmit={handleStartPayment} className="space-y-4">
                {cardValidationError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{cardValidationError}</span>
                  </div>
                )}

                {/* Saved Cards Selector from User Profile (Only shown when user has saved cards) */}
                {userSavedCards && userSavedCards.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        Select Saved Payment Card from Profile
                      </label>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                        ⚡ Express 1-click payment
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {userSavedCards.map((card) => {
                        const isSelected = selectedCardId === card.id;
                        return (
                          <div
                            key={card.id}
                            onClick={() => handleSelectSavedCard(card)}
                            className={`flex items-center justify-between rounded-2xl border p-3 transition-all cursor-pointer ${isSelected
                              ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>

                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-900">{card.cardType}</span>
                                  <span className="font-mono text-xs font-bold text-slate-700">•••• {card.last4}</span>
                                  {card.isDefault && (
                                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800">
                                      DEFAULT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {card.cardHolder} • Exp {card.expiry}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* New Card Option */}
                      <div
                        onClick={handleSelectNewCard}
                        className={`flex items-center justify-between rounded-2xl border border-dashed p-3 transition-all cursor-pointer ${selectedCardId === 'new'
                          ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedCardId === 'new' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                            }`}>
                            {selectedCardId === 'new' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">+ Add / Enter New Card</div>
                            <div className="text-[10px] text-slate-500">Pay with a different card</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Visualizer (Only shown when a saved card is selected) */}
                {userSavedCards && userSavedCards.length > 0 && selectedCardId !== 'new' && (
                  <div className={`relative overflow-hidden rounded-2xl ${NAVY} p-4 text-white shadow-lg shadow-blue-900/20 space-y-4`}>
                    <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="relative flex justify-between items-center">
                      <span className="text-xs font-mono font-bold tracking-widest text-blue-100/70">SKYLINE SKYPASS CARD</span>
                      <span className="font-extrabold text-sm text-sky-300 uppercase">{cardNetwork || 'VISA'}</span>
                    </div>
                    <div className="relative text-lg font-mono tracking-widest font-bold pt-2">{cardNumber || '•••• •••• •••• ••••'}</div>
                    <div className="relative flex justify-between items-center text-xs">
                      <div>
                        <div className="text-[9px] uppercase text-blue-100/60">Card Holder</div>
                        <div className="font-semibold">{cardName || 'Cardholder Name'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-blue-100/60">Expires</div>
                        <div className="font-semibold">{expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Card Entry Header when user has no saved cards */}
                {(!userSavedCards || userSavedCards.length === 0) && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Enter Payment Card Details</h4>
                      <p className="text-[10px] text-slate-500">Pay securely with Credit or Debit Card</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">Visa</span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">Mastercard</span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">Amex</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Full Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="4532 •••• •••• 8892"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVV Security Code</label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="382"
                    />
                  </div>
                </div>

                {selectedCardId === 'new' && (
                  <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-blue-900">
                      <input
                        type="checkbox"
                        checked={saveNewCardToProfile}
                        onChange={(e) => setSaveNewCardToProfile(e.target.checked)}
                        className="h-4 w-4 rounded accent-blue-600"
                      />
                      <span>Save card to my profile for future 1-click bookings</span>
                    </label>
                  </div>
                )}

                {/* Loyalty Points Checkbox */}
                <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <Award className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-indigo-900">Redeem Skyline Miles</div>
                      <div className="text-[11px] text-indigo-700">Use 1,000 miles for $50 instant discount</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className={`group flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-extrabold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 ${PRIMARY_BTN}`}
                >
                  <Lock className="h-4 w-4" />
                  <span>Authorize & pay ${totalAmount} USD</span>
                </button>
              </form>
            )}

            {paymentMethod !== 'CARD' && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-800">Redirecting to payment provider gateway</h4>
                <p className="mx-auto max-w-sm text-xs text-slate-500">
                  You will be securely redirected to complete authentication via {paymentMethod}.
                </p>
                <button
                  onClick={handleStartPayment}
                  className={`rounded-xl px-6 py-3 text-xs font-bold ${PRIMARY_BTN}`}
                >
                  Proceed to secure checkout
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Transparent Price Calculation */}
          <div className={`lg:col-span-5 space-y-6 ${CARD} p-6 md:p-8`}>
            <h3 className="border-b border-slate-100 pb-3 text-lg font-extrabold text-slate-900">
              Transparent fare breakdown
            </h3>

            {/* Flight Summary Card */}
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>PNR Reference</span>
                <span className="font-mono text-blue-600">{reservationData?.pnr || 'SK-784920'}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Flight Route</span>
                <span>{reservationData?.flight?.origin || 'CMB'} → {reservationData?.flight?.destination || 'SIN'}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Cabin Class</span>
                <span className={`font-extrabold ${effectiveCabinClass === 'BUSINESS' ? 'text-blue-600' : effectiveCabinClass === 'FIRST' ? 'text-amber-600' : 'text-slate-800'}`}>
                  {effectiveCabinClass} CLASS
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Seat Assigned</span>
                <span className="font-bold text-slate-900">{reservationData?.seat || '14A'}</span>
              </div>
              {reservationData?.selectedHotel && (
                <div className="flex justify-between items-center text-xs text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-lg border border-indigo-100 font-medium">
                  <span className="flex items-center gap-1">
                    <Hotel className="w-3.5 h-3.5" /> Hotel Reserved
                  </span>
                  <span className="font-bold truncate max-w-[200px]">{reservationData.selectedHotel.name}</span>
                </div>
              )}
            </div>

            {/* Itemized Line Items */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Base Airfare ({passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'} @ ${unitPrice})</span>
                <span className="font-semibold text-slate-900">${baseFare.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between">
                <span>Government Taxes & Aviation Fees ({passengerCount} x $45)</span>
                <span className="font-semibold text-slate-900">${taxesFees}.00</span>
              </div>
              <div className="flex justify-between">
                <span>Airline Fuel Surcharge ({passengerCount} x $25)</span>
                <span className="font-semibold text-slate-900">${fuelSurcharge}.00</span>
              </div>
              {baggageFee > 0 && (
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Extra Check-in Baggage</span>
                  <span className="font-semibold">+${baggageFee}.00</span>
                </div>
              )}

              {/* In-Flight Meal Line Item */}
              <div className="flex justify-between text-amber-700 font-medium">
                <span className="truncate pr-2">
                  In-Flight Dining Addons ({passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'})
                </span>
                <span className="font-bold shrink-0">
                  {mealFee > 0 ? `+$${mealFee}.00` : 'Free'}
                </span>
              </div>

              {/* Hotel Accommodation Line Item */}
              {hotelFee > 0 && (
                <div className="flex justify-between text-indigo-700 font-semibold bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                  <span className="truncate pr-2">
                    🏨 Hotel Stay ({reservationData?.selectedHotel?.name || 'Transit Stay'} • {reservationData?.selectedHotel?.roomType || '1 Night'})
                  </span>
                  <span className="font-bold shrink-0">+${hotelFee}.00</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Code Discount (SKY2026)</span>
                  <span>-${discountAmount}.00</span>
                </div>
              )}
              {usePoints && (
                <div className="flex justify-between text-indigo-600 font-bold">
                  <span>Skyline Loyalty Miles Redemption</span>
                  <span>-$50.00</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-extrabold text-slate-900">
                <span>Total Amount Due</span>
                <span className="text-2xl text-blue-600 font-black">${totalAmount.toLocaleString()} USD</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="pt-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">Apply discount promo code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="e.g. SKY2026"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold uppercase outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CONFIRMED BOOKING & E-TICKET DISPLAY */
        <div className="space-y-6 printable-eticket">

          {/* Confirmed Alert Banner */}
          <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-2xl shadow-emerald-600/25">
            <div className="flex items-center gap-4">
              <div className="sl-pop flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-black">Payment confirmed & {passengerCount} e-ticket(s) issued!</h3>
                <p className="text-xs text-emerald-100">
                  Transaction ref: <span className="font-mono font-bold">{transactionRef}</span> · Confirmation email & SMS dispatched to passenger(s).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-emerald-900 shadow-md transition hover:bg-emerald-50"
              >
                <Printer className="h-4 w-4" /> Print e-tickets
              </button>

              {reservationData?.flight?.hasLayover && (
                <button
                  onClick={onNavigateToHotels}
                  className="flex animate-bounce items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md transition hover:bg-amber-300"
                >
                  🏨 Book layover hotel (UC-06)
                </button>
              )}
            </div>
          </div>

          {/* Printable E-Ticket Card */}
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-2xl">
            {/* Ticket Blue Header */}
            <div className={`relative flex items-center justify-between overflow-hidden ${NAVY} p-6 text-white`}>
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="relative">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-300">Official electronic boarding pass ({passengerCount} passengers)</span>
                <h2 className="mt-0.5 text-2xl font-black">SkyLine Air</h2>
              </div>
              <div className="relative text-right">
                <span className="block text-xs text-blue-100/70">Booking reference (PNR)</span>
                <span className="font-mono text-2xl font-black tracking-wider text-amber-300">
                  {reservationData?.pnr || 'SK-784920'}
                </span>
              </div>
            </div>

            {/* Ticket Body Content */}
            <div className="p-6 md:p-8 space-y-6">

              {/* Route & Times for Each Passenger */}
              {(reservationData?.passengers || [reservationData?.passenger || {}]).map((pass, pIdx) => (
                <div key={pIdx} className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Passenger {pIdx + 1} Name</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {pass.title || 'Mr.'} {pass.firstName || 'Alex'} {pass.lastName || 'Morgan'}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">Passport: {pass.passport || 'N9849201'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Flight Number</span>
                    <span className="text-base font-extrabold text-blue-600 font-mono">
                      {reservationData?.flight?.flightNumber || 'SL-204'}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">Aircraft: {reservationData?.flight?.aircraft || 'Boeing 787-9'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cabin & Seat Number</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {effectiveCabinClass} CLASS • Seat {pass.seat || reservationData?.seat || '14A'}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">Boarding Zone: {pIdx + 1} | Gate: B14</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Confirmed In-Flight Meal</span>
                    <span className="text-xs font-extrabold text-slate-900 block truncate mt-0.5">
                      🍱 {pass.mealDetails?.name || pass.meal || 'Standard Gourmet'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {pass.mealDetails?.type === 'CUSTOM' ? 'Custom Crafted Chef Tray' : (pass.mealDetails?.calories || 'Complimentary')}
                    </span>
                  </div>
                </div>
              ))}

              {/* Confirmed Hotel Accommodation Voucher on E-Ticket */}
              {(reservationData?.selectedHotel || reservationData?.hotelBooked) && (
                <div className={`relative overflow-hidden rounded-2xl ${NAVY} p-6 text-white border border-white/10 shadow-lg shadow-blue-900/20 space-y-4`}>
                  <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />
                  <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-sky-300 flex items-center justify-center font-bold">
                        <Hotel className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider block">
                          OFFICIAL AIRLINE PARTNER HOTEL VOUCHER
                        </span>
                        <h4 className="text-lg font-black text-white">
                          {reservationData?.selectedHotel?.name || 'SkyLine Partner Airport Hotel'}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-blue-100/60 uppercase font-bold block">HOTEL VOUCHER CODE</span>
                      <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                        {reservationData?.selectedHotel?.voucherCode || reservationData?.hotelVoucherCode || `HTV-${reservationData?.pnr?.replace(/\D/g, '') || '884920'}`}
                      </span>
                    </div>
                  </div>

                  <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-blue-100/60 uppercase block font-bold">Hotel Destination</span>
                      <span className="font-extrabold text-white text-sm">
                        {reservationData?.selectedHotel?.city || reservationData?.flight?.destinationCity || 'Destination'}, {reservationData?.selectedHotel?.country || 'Partner Destination'}
                      </span>
                      <span className="text-[10px] text-blue-100/60 block mt-0.5">
                        Airport Code: {reservationData?.selectedHotel?.airportCode || reservationData?.flight?.destination || 'LHR'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-100/60 uppercase block font-bold">Confirmed Suite</span>
                      <span className="font-extrabold text-sky-300 text-sm">
                        {reservationData?.selectedHotel?.roomType || 'Deluxe Transit Suite'}
                      </span>
                      <span className="text-[10px] text-blue-100/60 block mt-0.5">
                        Duration: {reservationData?.selectedHotel?.numberOfNights || 1} Night(s) Guaranteed
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-100/60 uppercase block font-bold">Accommodation Fare</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        ${reservationData?.hotelPrice || reservationData?.selectedHotel?.totalPrice || 0}.00 USD
                      </span>
                      <span className="text-[10px] text-emerald-300 block mt-0.5">
                        ✓ Included & Paid on Ticket
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-100/60 uppercase block font-bold">Check-In Status</span>
                      <span className="font-extrabold text-emerald-400 text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Confirmed Check-in
                      </span>
                      <span className="text-[10px] text-blue-100/60 block mt-0.5">
                        Present PNR & Voucher at Desk
                      </span>
                    </div>
                  </div>

                  <div className="relative p-3 bg-white/10 rounded-xl text-xs text-blue-100 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Complimentary 24/7 Airport Shuttle Included:</strong> Follow airport signage to Hotel Shuttle Zone outside Terminal Baggage Claim. Present this boarding pass voucher upon check-in.
                    </span>
                  </div>
                </div>
              )}

              {/* Barcode & QR Code Section */}
              <div className="flex flex-col items-center justify-between gap-6 border-t border-dashed border-slate-300 pt-4 md:flex-row">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Scan at security checkpoint</span>
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 font-mono text-xs tracking-widest text-slate-700">
                    *M1MORGAN/ALEX ESK784920 CMBSINSL 0204 253Y014A0001*
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-xl bg-slate-900 p-2 text-white">
                    <QrCode className="h-16 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm space-y-4 p-6 text-center ${CARD}`}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">3D Secure OTP verification</h3>
              <p className="mt-1 text-xs text-slate-500">
                Enter the 6-digit authorization code sent to your registered phone number for ${totalAmount} USD.
              </p>
            </div>

            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-center font-mono text-xl font-bold tracking-widest outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={isProcessing}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-extrabold disabled:opacity-70 ${PRIMARY_BTN}`}
            >
              {isProcessing ? 'Verifying with bank...' : 'Authorize transaction'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}