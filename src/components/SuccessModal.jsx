import React from 'react';
import { CheckCircle2, Coffee, Tag, ArrowRight, Sparkles, User, Gift } from 'lucide-react';

export default function SuccessModal({ isOpen, data, onClose }) {
  if (!isOpen || !data) return null;

  const { order, hostProgress } = data;
  const justUnlocked = hostProgress?.justUnlockedFreeDrink;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-teal-500/40 rounded-3xl p-6 md:p-7 shadow-2xl text-center overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-3 rounded-2xl bg-teal-500/20 text-teal-400 mb-3 border border-teal-500/30 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-xl md:text-2xl font-black text-white mb-1">
          تم تسجيل الأوردر بنجاح! 🎉
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          كود الأوردر: <span className="font-mono text-teal-400 font-bold">{order?.orderId}</span>
        </p>

        {/* Customer Discount Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/15 to-emerald-500/10 border border-teal-500/30 text-right space-y-1 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-teal-300 font-bold">الطالب المشتري (الضيف)</span>
            <span className="px-2 py-0.5 rounded-lg bg-teal-500 text-slate-950 font-black text-xs">
              خصم 10% 🏷️
            </span>
          </div>
          <span className="text-base font-bold text-white block">{order?.customerName}</span>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-teal-500/20">
            <span>الطلب: <strong className="text-white">{order?.orderItem}</strong></span>
            <span className="font-mono text-[11px] text-slate-400">{order?.customerPhone}</span>
          </div>
        </div>

        {/* Host Progress Card */}
        <div className={`p-4 rounded-2xl border text-right space-y-2 mb-6 ${
          justUnlocked 
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 animate-pulse' 
            : 'bg-slate-800/80 border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                صاحب العزومة: <strong className="text-amber-400">{hostProgress?.hostName}</strong>
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20">
              {hostProgress?.currentCount} / {hostProgress?.targetCount}
            </span>
          </div>

          {justUnlocked ? (
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-lg">
              <Gift className="w-4 h-4" />
              <span>مبروك! {hostProgress?.hostName} استحق فري درينك 🥤 الآن!</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              تم احتساب هذا الأوردر لصالح {hostProgress?.hostName} (متبقي {hostProgress?.targetCount - (hostProgress?.currentCount % hostProgress?.targetCount)} ويكسب فري درينك).
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:opacity-95 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <span>تسجيل طلب الطالب التالي في الطابور</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>

      </div>
    </div>
  );
}
