import React, { useState, useEffect } from 'react';
import { 
  Coffee, Search, BarChart3, Settings, ShieldCheck, 
  Smartphone, Sparkles, Gift, ShoppingBag 
} from 'lucide-react';

import RegistrationView from './components/RegistrationView';
import HostRedeemView from './components/HostRedeemView';
import SearchView from './components/SearchView';
import DashboardView from './components/DashboardView';
import ScannerModal from './components/ScannerModal';
import SuccessModal from './components/SuccessModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('order'); // 'order' | 'rewards' | 'search' | 'dashboard'
  const [settings, setSettings] = useState({
    eventName: "إيفنت الجامعة - نظام العزومة والإحالات",
    venueName: "كافيه / لاونج المكان",
    targetReferralsForDrink: 5,
    discountValue: "10%",
    adminPin: "1234"
  });

  const [serverIp, setServerIp] = useState('');
  const [port, setPort] = useState(5000);

  // Modals state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerCallback, setScannerCallback] = useState(null);
  const [scannerTitle, setScannerTitle] = useState('');

  const [successData, setSuccessData] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load Initial Settings & IP
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
        if (data.serverIp) setServerIp(data.serverIp);
        if (data.port) setPort(data.port);
      })
      .catch(err => console.error('Could not load initial stats:', err));
  }, []);

  const handleOpenScanner = (onDecoded, title) => {
    setScannerCallback(() => onDecoded);
    setScannerTitle(title || "مسح باركود الكارنيه");
    setScannerOpen(true);
  };

  const handleScanSuccess = (decodedText) => {
    if (scannerCallback) {
      scannerCallback(decodedText);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDB = async (pin) => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        return true;
      } else {
        alert(data.error || 'فشل التصفير');
        return false;
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black text-lg">
              ☕
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                <span>EventPass</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  كاشير / Staff
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                نظام عروض الإيفنت والعزومة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="الإعدادات"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 px-4 pt-4">
        {activeTab === 'order' && (
          <RegistrationView
            settings={settings}
            onSuccessOrder={(data) => setSuccessData(data)}
            openScanner={handleOpenScanner}
            serverIp={serverIp}
            port={port}
          />
        )}

        {activeTab === 'rewards' && (
          <HostRedeemView />
        )}

        {activeTab === 'search' && (
          <SearchView />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenSettings={() => setSettingsOpen(true)}
            serverIp={serverIp}
            port={port}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5">
          
          <button
            onClick={() => setActiveTab('order')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition duration-200 ${
              activeTab === 'order'
                ? 'bg-teal-600 text-white font-bold shadow-lg shadow-teal-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">أوردر وخصم</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition duration-200 ${
              activeTab === 'rewards'
                ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Gift className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">فري درينك</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition duration-200 ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Search className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">الداتا والتحقق</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">الإحصائيات</span>
          </button>

        </div>
      </nav>

      {/* Modals */}
      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={scannerTitle}
      />

      <SuccessModal
        isOpen={Boolean(successData)}
        data={successData}
        onClose={() => setSuccessData(null)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onReset={handleResetDB}
        onExport={() => { window.location.href = '/api/export-csv'; }}
      />

    </div>
  );
}
