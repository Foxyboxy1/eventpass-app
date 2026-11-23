import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, Clock, Users, Coffee, Tag, AlertCircle, Phone } from 'lucide-react';

export default function SearchView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchRecords = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/records?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setRecords(data.records || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords('');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords(searchTerm);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pb-24">
      {/* Search Header */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white">البحث والتحقق من الطلاب والداتا</h2>
          <p className="text-xs text-slate-400">
            البحث بالـ ID أو بالاسم أو برقم الموبايل للتأكد من حالة الطالب
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="اكتب رقم الـ ID أو الاسم أو رقم الموبايل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-semibold">
        <span>نتائج الداتا المسجلة ({records.length} طالب)</span>
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              fetchRecords('');
            }}
            className="text-indigo-400 hover:underline"
          >
            عرض الكل
          </button>
        )}
      </div>

      {/* Records List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          جاري البحث في قاعدة البيانات...
        </div>
      ) : records.length > 0 ? (
        <div className="space-y-3">
          {records.map((item) => {
            const isHost = item.role === 'host';
            const dateStr = new Date(item.registeredAt).toLocaleString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition ${
                  isHost 
                    ? 'bg-gradient-to-r from-amber-500/10 to-slate-900 border-amber-500/30' 
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${
                      isHost ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'
                    }`}>
                      {isHost ? <Coffee className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{item.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isHost 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        }`}>
                          {isHost ? 'صاحب دعوة (Host)' : 'مرافق (Guest)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>ID: {item.id}</span>
                        <span>•</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {item.phone || 'بدون رقم'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-[11px] font-mono text-slate-400 block">{dateStr}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{item.groupId}</span>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{item.reward}</span>
                  </div>

                  {!isHost && item.hostName && (
                    <div className="text-slate-400 text-[11px]">
                      بدعوة من: <span className="text-amber-400 font-bold">{item.hostName}</span> ({item.hostPhone || item.hostId})
                    </div>
                  )}

                  {isHost && (
                    <div className="text-slate-400 text-[11px]">
                      معه: <span className="text-teal-400 font-bold">{item.friendsCount || 4} أصدقاء</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 px-4 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">لم يتم العثور على أي نتائج</h3>
          <p className="text-xs text-slate-500">
            {searchTerm ? `البيانات الخاصة بـ "${searchTerm}" غير مسجلة في قاعدة البيانات، مما يعني أنه لم يستلم العرض بعد.` : 'لا يوجد طلاب مسجلين حتى الآن.'}
          </p>
        </div>
      )}
    </div>
  );
}
