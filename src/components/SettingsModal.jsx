import React, { useState } from 'react';
import { X, Settings, ShieldAlert, Save, RefreshCw, Download } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSave, onReset, onExport }) {
  const [formData, setFormData] = useState({
    eventName: settings?.eventName || "إيفنت الجامعة الترحيبي",
    venueName: settings?.venueName || "كافيه / لاونج المكان",
    minFriendsForDrink: settings?.minFriendsForDrink || 1,
    discountValue: settings?.discountValue || "20%",
    adminPin: "1234"
  });

  const [resetPin, setResetPin] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleResetDB = async () => {
    if (!resetPin) {
      alert("يرجى إدخال رمز PIN للتأكيد");
      return;
    }
    setLoading(true);
    const ok = await onReset(resetPin);
    setLoading(false);
    if (ok) {
      setShowResetConfirm(false);
      setResetPin("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">إعدادات المنظومة والإيفنت</h3>
            <p className="text-xs text-slate-400">تخصيص قواعد الخصم وبيانات الفعالية</p>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم الإيفنت</label>
            <input
              type="text"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المكان / الفرع</label>
            <input
              type="text"
              value={formData.venueName}
              onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">أقل عدد صحاب للمشروب المجاني</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.minFriendsForDrink}
                onChange={(e) => setFormData({ ...formData, minFriendsForDrink: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">قيمة الخصم للصحابه</label>
              <input
                type="text"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder="20% أو 25 جنيه"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التعديلات</span>
          </button>
        </form>

        <hr className="my-6 border-slate-800" />

        {/* Quick Tools */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">أدوات إضافية</h4>
          
          <button
            onClick={onExport}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تحميل ملف الإكسل (CSV) بجميع الطلاب المسجلين</span>
          </button>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>تصفير ومسح بيانات الإيفنت (Reset Database)</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
              <p className="text-xs text-rose-300 font-bold">
                ⚠️ تحذير: هذا الإجراء سيمسح جميع بيانات الطلاب المسجلين بالكامل! أدخل رمز PIN (الافتراضي: 1234):
              </p>
              <input
                type="password"
                placeholder="رمز PIN"
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/40 text-white text-center font-mono text-sm focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleResetDB}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                >
                  {loading ? 'جاري المسح...' : 'تأكيد المسح النهائي'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="py-2 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
