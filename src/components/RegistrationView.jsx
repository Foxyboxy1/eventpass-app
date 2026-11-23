import React, { useState, useEffect } from 'react';
import { 
  Coffee, Tag, AlertTriangle, CheckCircle, Plus, 
  Camera, Sparkles, AlertCircle, RefreshCw, Phone, User, Users, Cloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { lookupStudent, submitOrderWithReferral, isFirebaseActive } from '../services/cloudService';

export default function RegistrationView({ 
  settings, 
  onSuccessOrder, 
  openScanner,
  serverIp,
  port
}) {
  // Customer (الضيف المشتري)
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderItem, setOrderItem] = useState('مشروب');

  // Customer Status Check
  const [customerCheckStatus, setCustomerCheckStatus] = useState(null); // null | 'checking' | 'already_claimed' | 'eligible'
  const [customerExistingRecord, setCustomerExistingRecord] = useState(null);

  // Host (صاحب العزومة التابع له)
  const [hostId, setHostId] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [hostData, setHostData] = useState(null);
  const [hostLoading, setHostLoading] = useState(false);

  const [staffName, setStaffName] = useState('كاشير 1');
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // 1. Live Check Customer status
  useEffect(() => {
    const trimmed = customerId.trim();
    if (!trimmed || trimmed.length < 3) {
      setCustomerCheckStatus(null);
      setCustomerExistingRecord(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCustomerCheckStatus('checking');
      try {
        const data = await lookupStudent(trimmed);
        if (data.found) {
          const student = data.student;
          setCustomerExistingRecord(student);
          if (student.name && !customerName) setCustomerName(student.name);
          if (student.phone && !customerPhone) setCustomerPhone(student.phone);

          if (student.guestDiscountClaimed) {
            setCustomerCheckStatus('already_claimed');
          } else {
            setCustomerCheckStatus('eligible');
          }
        } else {
          setCustomerCheckStatus('eligible');
          setCustomerExistingRecord(null);
        }
      } catch (err) {
        console.error(err);
        setCustomerCheckStatus(null);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customerId]);

  // 2. Fetch Host data
  useEffect(() => {
    const trimmed = hostId.trim();
    if (!trimmed || trimmed.length < 3) {
      setHostData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setHostLoading(true);
      try {
        const data = await lookupStudent(trimmed);
        if (data.found) {
          setHostData(data.student);
          if (data.student.name && !hostName) setHostName(data.student.name);
        } else {
          setHostData(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setHostLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [hostId]);

  // Submit Order with Referral
  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setGeneralError('');

    if (!customerId.trim()) {
      setGeneralError('يرجى إدخال رقم ID الطالب المشتري');
      return;
    }
    if (!customerName.trim()) {
      setGeneralError('يرجى إدخال اسم الطالب المشتري لحفظ الداتا');
      return;
    }
    if (!customerPhone.trim()) {
      setGeneralError('يرجى إدخال رقم موبايل الطالب المشتري');
      return;
    }
    if (!hostId.trim()) {
      setGeneralError('يرجى إدخال ID صاحب العزومة (المُضيف)');
      return;
    }
    if (customerId.trim() === hostId.trim()) {
      setGeneralError('لا يمكن للطالب الطلب على الـ ID الخاص به للاستفادة من خصم العزومة!');
      return;
    }

    if (customerCheckStatus === 'already_claimed') {
      setGeneralError('الطالب استفاد بالفعل مسبقاً من خصم الـ 10% كمدعو ولا يمكن تكراره!');
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitOrderWithReferral({
        customerId: customerId.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderItem: orderItem.trim(),
        hostId: hostId.trim(),
        hostNameIfNew: hostName.trim(),
        hostPhoneIfNew: hostPhone.trim(),
        staffName
      });

      confetti({
        particleCount: data.hostProgress?.justUnlockedFreeDrink ? 140 : 70,
        spread: 75,
        origin: { y: 0.6 }
      });

      setCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerCheckStatus(null);
      setCustomerExistingRecord(null);

      onSuccessOrder(data);
    } catch (err) {
      console.error(err);
      setGeneralError(err.message || 'تعذر تسجيل الأوردر، يرجى المحاولة ثانية.');
    } finally {
      setSubmitting(false);
    }
  };

  const targetCount = settings?.targetReferralsForDrink || 5;
  const currentHostCount = hostData?.referralsCount || 0;
  const hostAlreadyClaimedDrink = (hostData?.freeDrinksClaimed || 0) >= 1;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pb-24">
      
      {/* Top Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>تسجيل الأوردر والربط بصاحب العزومة 🎯</span>
              {isFirebaseActive() && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Cloud Live
                </span>
              )}
            </h2>
            <p className="text-xs text-indigo-300">
              الضيف ياخد <span className="font-bold text-teal-300">10% خصم</span> • وصاحب العزومة يجمّع 5 وياخد <span className="font-bold text-amber-300">فري درينك 🥤 (لمرة واحدة)</span>
            </p>
          </div>
        </div>

        <select
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 focus:outline-none"
        >
          <option value="كاشير 1">كاشير 1</option>
          <option value="كاشير 2">كاشير 2</option>
          <option value="البوابة الرئيسية">البوابة الرئيسية</option>
        </select>
      </div>

      {generalError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Main Order Form */}
      <div className="p-5 md:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        
        {/* Customer Section Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">1. بيانات الطالب المشتري (الضيف)</h3>
              <p className="text-xs text-teal-300 font-medium">مستحق: خصم 10% فوري 🏷️</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openScanner((id) => setCustomerId(id), "مسح ID الطالب المشتري")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 text-xs font-bold transition active:scale-95"
            title="كاميرا"
          >
            <Camera className="w-4 h-4 text-indigo-400" />
            <span>كاميرا</span>
          </button>
        </div>

        {/* Customer Inputs */}
        <div className="space-y-3">
          {/* Customer ID */}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="رقم الـ ID الجامعي للطالب (مثال: 20235956) *"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl bg-slate-800/80 border text-white font-mono text-sm placeholder:text-slate-500 placeholder:font-sans focus:outline-none transition ${
                customerCheckStatus === 'already_claimed' 
                  ? 'border-rose-500 bg-rose-950/20 text-rose-300' 
                  : customerCheckStatus === 'eligible' 
                  ? 'border-emerald-500 bg-emerald-950/20' 
                  : 'border-slate-700 focus:border-teal-500'
              }`}
            />
            {customerCheckStatus === 'checking' && (
              <RefreshCw className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 animate-spin" />
            )}
            {customerCheckStatus === 'eligible' && (
              <CheckCircle className="w-4 h-4 absolute left-3 top-3.5 text-emerald-400" />
            )}
            {customerCheckStatus === 'already_claimed' && (
              <AlertCircle className="w-4 h-4 absolute left-3 top-3.5 text-rose-400" />
            )}
          </div>

          {/* Already Claimed Error Banner */}
          {customerCheckStatus === 'already_claimed' && customerExistingRecord && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>⚠️ هذا الطالب مسجل ومستفيد مسبقاً!</span>
              </div>
              <p>
                الطالب (<strong className="text-white">{customerExistingRecord.name}</strong>) استفاد بالفعل من خصم الـ 10% سابقاً كمدعو من (
                <strong className="text-amber-300">{customerExistingRecord.claimedUnderHostName || customerExistingRecord.claimedUnderHostId}</strong>).
              </p>
              <p className="text-rose-400 font-bold">
                لا يمكن أخذ خصم الضيف 10% أكثر من مرة لنفس الـ ID.
              </p>
              <p className="text-[11px] text-slate-300 pt-1">
                💡 لكن يمكنه هو نفسه أن يعزم أصدقائه على الـ ID الخاص به ليكسب فري درينك!
              </p>
            </div>
          )}

          {customerCheckStatus === 'eligible' && customerId && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>الـ ID مؤهل لخصم الـ 10% كضيف ✅</span>
            </div>
          )}

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="اسم الطالب بالكامل (مثال: أحمد محمد) *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-xs focus:border-teal-500 focus:outline-none placeholder:text-slate-500"
              />
              <User className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
            </div>

            <div className="relative">
              <input
                type="tel"
                placeholder="رقم الموبايل (مثال: 01012345678) *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white font-mono text-xs focus:border-teal-500 focus:outline-none placeholder:text-slate-500 placeholder:font-sans"
              />
              <Phone className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
            </div>
          </div>

          {/* Drink / Order Item */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">المشروب المطلوب:</label>
            <input
              type="text"
              placeholder="اسم المشروب (مثال: لاتيه، آيس كوفي، إلخ...)"
              value={orderItem}
              onChange={(e) => setOrderItem(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Host Linking Section */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Coffee className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">2. الربط بصاحب العزومة (المُضيف المحسوب لصالحه) *</h4>
            </div>

            <button
              type="button"
              onClick={() => openScanner((id) => setHostId(id), "مسح ID صاحب العزومة")}
              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>مسح كارنيه المُضيف</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="ID صاحب العزومة (مثال: 20230449) *"
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
            />

            <input
              type="text"
              placeholder="اسم صاحب العزومة (اختياري/إذا كان جديداً)"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Host Status Feedback */}
          {hostId && (
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  صاحب العزومة: {hostData?.name || hostName || `ID: ${hostId}`}
                </span>
                <span className="font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20">
                  {currentHostCount} من {targetCount} أصدقاء
                </span>
              </div>

              {hostAlreadyClaimedDrink ? (
                <p className="text-[11px] text-amber-400 font-bold pt-1">
                  ⚠️ هذا المُضيف استلم بالفعل المشروب المجاني الخاص به سابقاً (وصل للحد الأقصى للعرض: مشروب واحد).
                </p>
              ) : currentHostCount >= targetCount ? (
                <p className="text-[11px] text-emerald-400 font-bold pt-1">
                  🎉 هذا المُضيف مؤهل الآن لاستلام الفري درينك الخاص به من تبويب "فري درينك"!
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  سيتم احتساب هذا الطلب لصالحه (متبقي {targetCount - currentHostCount} طلاب ليكسب فري درينك).
                </p>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={
          submitting || 
          customerCheckStatus === 'already_claimed' || 
          !customerId.trim() || 
          !customerName.trim() || 
          !customerPhone.trim() || 
          !hostId.trim() ||
          customerId.trim() === hostId.trim()
        }
        onClick={handleSubmitOrder}
        className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] ${
          submitting || 
          customerCheckStatus === 'already_claimed' || 
          !customerId.trim() || 
          !customerName.trim() || 
          !customerPhone.trim() || 
          !hostId.trim() ||
          customerId.trim() === hostId.trim()
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            : 'bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 hover:opacity-95 text-slate-950 shadow-teal-500/25'
        }`}
      >
        {submitting ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>جاري الحفظ والتسجيل...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>تسجيل الأوردر وتطبيق خصم 10% ✨</span>
          </>
        )}
      </button>

      {serverIp && (
        <div className="text-center pt-1">
          <p className="text-[11px] text-slate-400">
            📱 رابط الكاشير والمنظمين محلياً:
            <span className="font-mono text-indigo-300 font-bold block mt-0.5">http://{serverIp}:{port || 5000}</span>
          </p>
        </div>
      )}

    </div>
  );
}
