import React, { useState, useEffect } from 'react';
import { 
  Users, Coffee, Tag, Sparkles, Download, RefreshCw, 
  ExternalLink, Layers, ArrowUpRight, ShieldCheck, Wifi
} from 'lucide-react';

export default function DashboardView({ onOpenSettings, serverIp, port }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    window.location.href = '/api/export-csv';
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 pb-24">
      
      {/* Header with Refresh & Settings */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-white">لوحة الإحصائيات الحية</h2>
          <p className="text-xs text-slate-400">متابعة فورية لأداء الإيفنت واستحقاقات العروض</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV</span>
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
          <span className="text-xs text-slate-400 font-semibold block">إجمالي الطلاب الحاضرين</span>
        </div>

        {/* Total Groups */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1 relative overflow-hidden">
          <div className="p-2 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-2">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-2xl md:text-3xl font-black font-mono text-white block">
            {stats?.totalGroups ?? 0}
          </span>
          <span className="text-xs text-slate-400 font-semibold block">مجموعات مسجلة</span>
        </div>

        {/* Free Drinks Issued */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/30 shadow-xl space-y-1 relative overflow-hidden">
          <div className="p-2 w-fit rounded-xl bg-amber-500/20 text-amber-400 mb-2">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="text-2xl md:text-3xl font-black font-mono text-amber-400 block">
            {stats?.totalFreeDrinks ?? 0}
          </span>
          <span className="text-xs text-amber-300/80 font-bold block">مشروب فري درينك 🥤</span>
        </div>

        {/* Discounts Claimed */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-teal-500/10 to-slate-900 border border-teal-500/30 shadow-xl space-y-1 relative overflow-hidden">
          <div className="p-2 w-fit rounded-xl bg-teal-500/20 text-teal-400 mb-2">
            <Tag className="w-5 h-5" />
          </div>
          <span className="text-2xl md:text-3xl font-black font-mono text-teal-400 block">
            {stats?.totalDiscounts ?? 0}
          </span>
          <span className="text-xs text-teal-300/80 font-bold block">خصم ممنوح للصحابه 🏷️</span>
        </div>
      </div>

      {/* Network & Local WiFi Host Info */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">ربط موبايلات المنظمين على نفس الشبكة</h4>
            <p className="text-[11px] text-slate-400">
              افتـح المتصفح من أي هاتف واكتب: <span className="font-mono text-indigo-400 font-bold">http://{stats?.serverIp || serverIp || '192.168.1.X'}:{stats?.port || 5173}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recent Groups Feed */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>آخر المجموعات المسجلة</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">تحديث لحظي</span>
        </div>

        {stats?.recentGroups && stats.recentGroups.length > 0 ? (
          <div className="space-y-3">
            {stats.recentGroups.map((grp) => {
              const time = new Date(grp.registeredAt).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={grp.groupId}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-400">{grp.groupId}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{time}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <span className="text-amber-400">🥤</span>
                      <span>صاحب الدعوة:</span>
                      <span className="font-mono font-bold text-white">{grp.host.id}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-teal-400">🏷️</span>
                      <span>{grp.friends.length} مرافقين</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">
                    IDs الصحابه: <span className="font-mono text-slate-300">{grp.friends.map(f => f.id).join(', ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            لم تسجل أي مجموعة بعد. ابدأ التسجيل من شاشة "تسجيل مجموعة"!
          </div>
        )}
      </div>

    </div>
  );
}
