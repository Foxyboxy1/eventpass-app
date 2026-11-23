import React, { useState, useEffect } from 'react';
import { Coffee, CheckCircle, Gift, RefreshCw, AlertCircle, Phone, User, Clock, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchStats, redeemFreeDrink } from '../services/cloudService';

export default function HostRedeemView() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState(null);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchStats();
      setHosts(data.hosts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRedeem = async (hostId) => {
    setRedeemingId(hostId);
    setMessage(null);
    try {
      const res = await redeemFreeDrink(hostId);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setMessage({ type: 'success', text: res.message });
      loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'تعذر الصرف' });
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">مكافآت أصحاب العزومات (الفري درينك 🥤)</h2>
          <p className="text-xs text-slate-400">متابعة وصرف المشروب المجاني لكل مُضيف جمع 5 أصدقاء (مشروب واحد فقط)</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold text-center animate-in fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Hosts Cards */}
      {hosts.length > 0 ? (
        <div className="space-y-4">
          {hosts.map((host) => {
            const alreadyClaimed = (host.freeDrinksClaimed || 0) >= 1;
            const hasUnlocked = (host.referralsCount || 0) >= 5;
            const canRedeem = hasUnlocked && !alreadyClaimed;

            return (
              <div
                key={host.id}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 transition"
              >
                {/* Host Info Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-black">
                      🥤
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{host.name}</h3>
                      <span className="text-xs text-slate-400 font-mono block">
                        ID: {host.id} {host.phone ? `• ${host.phone}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-xs text-slate-400 block">إجمالي الأصدقاء</span>
                    <span className="text-lg font-black text-amber-400">{host.referralsCount} / 5</span>
                  </div>
                </div>

                {/* Redeem Action & Status */}
                {alreadyClaimed ? (
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>تم صرف المشروب المجاني لهذا المُضيف مسبقاً (استوفى الحد الأقصى للعرض) ✅</span>
                  </div>
                ) : canRedeem ? (
                  <button
                    onClick={() => handleRedeem(host.id)}
                    disabled={redeemingId === host.id}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    <span>صرف الفري درينك الآن لـ ({host.name}) 🥤</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-800/40 text-slate-400 text-center text-xs">
                    متبقي {5 - (host.referralsCount || 0)} أصدقاء ليكسب المشروب المجاني.
                  </div>
                )}

                {/* Referred Students List */}
                {host.referralsList && host.referralsList.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      الطلاب المسجلين على ID هذا المُضيف:
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {host.referralsList.map((ref, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-white">{ref.customerName}</span>
                            <span className="text-slate-400 text-[10px]">({ref.orderItem})</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">{ref.customerPhone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 px-4 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">لا يوجد أصحاب عزومات مسجلين بعد</h3>
          <p className="text-xs text-slate-500">
            عندما يطلب الطلاب برقم ID صاحب العزومة ستظهر حساباتهم ومكافآتهم هنا تلقائياً!
          </p>
        </div>
      )}
    </div>
  );
}
