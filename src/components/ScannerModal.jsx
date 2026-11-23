import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

export default function ScannerModal({ isOpen, onClose, onScanSuccess, title = "مسح باركود أو QR كارنيه الطالب" }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        false
      );

      scanner.render(
        (decodedText) => {
          // Play a small beep / vibrate if supported
          if (navigator.vibrate) navigator.vibrate(100);
          onScanSuccess(decodedText.trim());
          scanner.clear();
          onClose();
        },
        (error) => {
          // ignore continuous scanning errors
        }
      );

      scannerRef.current = scanner;
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
          <Camera className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-400 mb-4">
          وجّه كاميرا الهاتف نحو الباركود أو الـ QR الموجود على كارنيه الجامعة
        </p>

        <div id="reader" className="overflow-hidden rounded-2xl bg-black border border-slate-800 min-h-[250px]"></div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
        >
          إلغاء والعودة للإدخال اليدوي
        </button>
      </div>
    </div>
  );
}
