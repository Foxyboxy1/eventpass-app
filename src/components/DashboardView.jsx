import React, { useState, useEffect } from 'react';
import { 
  Users, Coffee, Tag, Sparkles, Download, RefreshCw, 
  Layers, Cloud, ShieldCheck
} from 'lucide-react';
import { fetchStats, exportCsvClientSide, isFirebaseActive } from '../services/cloudService';

export default function DashboardView({ onOpenSettings, serverIp, port }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    exportCsvClientSide();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>لوحة الإحصائيات الحية</span>
            {isFirebaseActive() && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1 border border-emerald-500/30">
                <Cloud className="w-3 h-3" /> Cloud Firestore
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">متابعة فورية ومباشرة من السحاب</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>تحميل Excel</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Students */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1 relative overflow-hidden">
          <div className="p-2 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 mb-2">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl md:text-3xl font-black font-mono text-white block">
            {stats?.totalStudents ?? 0}
          </span>
          <span className="text-xs text-slate-400 font-semibold block">إجمالي الطلاب بالداتا</span>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1 relative overflow-hidden">
          <div className="p-2 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-2">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-2xl md:text-3xl font-black font-mono text-white block">
            {stats?.totalOrders ?? 0}
          </span>
          <span className="text-xs text-slate-400 font-semibold block">أوردرات مسجلة</span>
        </div>

        {/* Free Drinks Earned / Claimed */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/30 shadow-xl space-y-1 relative overflow-hidden">
          <div className="p-2 w-fit rounded-xl bg-amber-500/20 text-amber-400 mb-2">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="text-2xl md:text-3xl font-black font-mono text-amber-400 block">
            {stats?.totalFreeDrinksClaimed ?? 0} / {stats?.totalFreeDrinksEarned ?? 0}
          </span>
          <span className="text-xs text-amber-300/80 font-bold block">مشروبات فري درينك 🥤</span>
        </div>

        {/* Discounts Given */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-teal-500/10 to-slate-900 border border-teal-500/30 shadow-xl space-y-1 relative overflow-hidden">
          <div className="p-2 w-fit rounded-xl bg-teal-500/20 text-teal-400 mb-2">
            <Tag className="w-5 h-5" />
          </div>
          <span className="text-2xl md:text-3xl font-black font-mono text-teal-400 block">
            {stats?.totalDiscountsGiven ?? 0}
          </span>
          <span className="text-xs text-teal-300/80 font-bold block">خصومات 10% ممنوحة 🏷️</span>
        </div>
      </div>

      {/* Cloud Status Card */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">قاعدة البيانات السحابية (Firebase Firestore)</h4>
            <p className="text-[11px] text-slate-400">
              متصلة سحابياً بنجاح • أي موبايل يسجل يسمّع فوراً في السحاب
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
