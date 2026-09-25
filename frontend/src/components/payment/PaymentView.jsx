import React, { useState, useEffect } from 'react';
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
  Star,
  RefreshCw,
  Clock,
  Key,
  Send,
  ArrowRight
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

  // User Destination Email for Real-Time OTP Verification
  const initialEmail =
    reservationData?.passenger?.email ||
    reservationData?.passengers?.[0]?.email ||
    user?.email ||
    'passenger@skylineair.com';
  const [otpEmail, setOtpEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // OTP Modal State & Live Timer
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [demoOtpPreview, setDemoOtpPreview] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

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

  // Synchronize initial email when user/reservation changes
  useEffect(() => {
    if (user?.email && !otpEmail) {
      setOtpEmail(user.email);
    }
  }, [user]);

  // Live Countdown Timer for OTP Expiration
  useEffect(() => {
    let interval = null;
    if (showOtpModal && otpTimer > 0 && !paymentCompleted) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (otpTimer === 0) {
      setOtpError('Your verification code has expired. Please click "Resend Code" to receive a fresh OTP.');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOtpModal, otpTimer, paymentCompleted]);

  // Resend Cooldown Timer (30s)
  useEffect(() => {
    let cdInterval = null;
    if (resendCooldown > 0) {
      cdInterval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (cdInterval) clearInterval(cdInterval);
    };
  }, [resendCooldown]);

  // Trigger Backend Real-Time Email OTP Dispatch
  const triggerSendOtp = async (targetEmailAddress) => {
    const emailToSend = (targetEmailAddress || otpEmail || user?.email || 'passenger@skylineair.com').trim();
    setIsSendingOtp(true);
    setOtpError('');
    setOtpSuccessMessage('');

    try {
      const { sendPaymentOtpApi } = await import('../../api/apiService');
      const response = await sendPaymentOtpApi({
        email: emailToSend,
        passengerName: cardName || user?.name || reservationData?.passenger?.firstName ? `${reservationData?.passenger?.firstName} ${reservationData?.passenger?.lastName}` : 'Valued Passenger',
        amount: totalAmount,
        pnr: reservationData?.pnr || 'SK-PENDING'
      });

      setOtpTimer(300); // Reset to 5 mins
      setResendCooldown(30); // 30 seconds cooldown
      setOtpSuccessMessage(response?.message || `Real-time OTP verification code sent to ${emailToSend}`);
      if (response?.otpPreview) {
        setDemoOtpPreview(response.otpPreview);
      }
    } catch (err) {
      console.warn('[PaymentView] OTP Send error:', err.message);
      setOtpError(`Could not dispatch OTP email: ${err.message}. Please check connection.`);
    } finally {
      setIsSendingOtp(false);
    }
  };

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

  const handleStartPayment = async (e) => {
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

    // Open OTP modal and trigger real-time email dispatch
    setOtpInput('');
    setShowOtpModal(true);
    await triggerSendOtp(otpEmail);
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.trim().length < 4) {
      setOtpError('Please enter the 6-digit verification code received in your email.');
      return;
    }

    if (otpTimer === 0) {
      setOtpError('Your code has expired. Please click "Resend Code" to generate a new OTP.');
      return;
    }

    setIsProcessing(true);
    setOtpError('');

    try {
      const { verifyPaymentOtpApi, createReservationApi, processPaymentApi } = await import('../../api/apiService');

      // 1. Verify OTP with Spring Boot backend
      await verifyPaymentOtpApi({
        email: otpEmail.trim(),
        otpCode: otpInput.trim()
      });

      // 2. If OTP is valid, proceed with booking finalization
      const generatedTxn = `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const resRecord = await createReservationApi({
        pnrCode: reservationData?.pnr || `SK-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, ''), 10) : null),
        userName: user?.name || (reservationData?.passenger?.firstName ? `${reservationData.passenger.firstName} ${reservationData.passenger.lastName}` : (cardName || 'Passenger')),
        userEmail: otpEmail || user?.email || 'passenger@skylineair.com',
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

                {/* Email OTP Verification Notice */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Security Verification</span>
                    <span className="text-[11px] font-medium text-slate-700 block truncate">
                      A 6-digit real-time OTP will be sent to <strong>{otpEmail}</strong> to authorize this payment.
                    </span>
                  </div>
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
                  🏨 Book layover hotel
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

      {/* Real-Time Email OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 md:p-8 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200`}>

            {/* Ambient Background Accent */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl" />

            {/* Header Badge */}
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
              <ShieldCheck className="h-7 w-7" />
              {isSendingOtp && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] font-bold text-white items-center justify-center">!</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">SkyLine 3D-Secure 2.0</span>
              <h3 className="text-xl font-black text-slate-900">Email OTP Verification</h3>
              <p className="text-xs text-slate-500">
                A 6-digit authorization code has been dispatched for <strong className="text-slate-900 font-bold">${totalAmount} USD</strong>.
              </p>
            </div>

            {/* Target Email Chip */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100/80 text-blue-600 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Recipient Email</span>
                  {!isEditingEmail ? (
                    <span className="font-mono text-xs font-bold text-slate-900 truncate block">{otpEmail}</span>
                  ) : (
                    <input
                      type="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full rounded-lg border border-blue-400 bg-white px-2 py-0.5 text-xs font-bold text-slate-900 outline-none"
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isEditingEmail) {
                    triggerSendOtp(otpEmail);
                    setIsEditingEmail(false);
                  } else {
                    setIsEditingEmail(true);
                  }
                }}
                className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100/60 transition"
              >
                {isEditingEmail ? 'Update & Send' : 'Change'}
              </button>
            </div>

            {/* Notification / Success Status Banner */}
            {otpSuccessMessage && !otpError && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate">{otpSuccessMessage}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {otpError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-xs font-bold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{otpError}</span>
              </div>
            )}

            {/* OTP Code Input Field */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={otpInput}
                placeholder="• • • • • •"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtpInput(val);
                  if (otpError) setOtpError('');
                }}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3.5 text-center font-mono text-3xl font-black tracking-[0.4em] text-blue-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
              />

              {/* Expiry Countdown Timer */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div className={`flex items-center gap-1.5 font-bold ${otpTimer < 60 ? 'text-red-600 animate-pulse' : 'text-slate-600'}`}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Expires in: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isSendingOtp}
                  onClick={() => triggerSendOtp(otpEmail)}
                  className="flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3 w-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Preview Badge (Helpful for quick test runs) */}
            {demoOtpPreview && (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-blue-200 bg-blue-50/70 p-2 text-xs">
                <span className="text-slate-600 text-[11px]">Server Generated Code:</span>
                <button
                  type="button"
                  onClick={() => setOtpInput(demoOtpPreview)}
                  className="font-mono font-black text-blue-600 hover:underline bg-white px-2 py-0.5 rounded border border-blue-200"
                  title="Click to auto-fill OTP"
                >
                  {demoOtpPreview} (Auto-Fill)
                </button>
              </div>
            )}

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleVerifyOtp}
                disabled={isProcessing || isSendingOtp || !otpInput}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black disabled:opacity-50 ${PRIMARY_BTN}`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying & Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Verify Code & Pay ${totalAmount}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpError('');
                }}
                className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Cancel & return to payment options
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}