import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Sparkles, Volume2 } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-qr-code-reader-node';

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Initialize scanner when modal opens
    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError(null);
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          if (isMounted) {
            setCameras(devices.map(d => ({ id: d.id, label: d.label || `Kamera ${d.id}` })));
            // Prefer environment (back) camera if available
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
            const defaultCamId = backCamera ? backCamera.id : devices[0].id;
            setSelectedCameraId(defaultCamId);
            startScanner(defaultCamId);
          }
        } else {
          if (isMounted) setCameraError('Tidak ada perangkat kamera ditemukan pada perangkat ini.');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Camera init error:', err);
          setCameraError(err.message || 'Gagal mengakses kamera. Mohon berikan izin kamera pada browser.');
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (cameraId: string) => {
    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 280, height: 180 }
        },
        (decodedText) => {
          // Play audio beep sound
          playBeepSound();
          onScanSuccess(decodedText);
          onClose();
        },
        () => {
          // Ignore frame decode failures
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setCameraError('Gagal menjalankan kamera: ' + (err.message || err));
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz beep
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-800 space-y-4 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-800 text-white">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pemindai Barcode Kamera</h3>
              <p className="text-xs text-zinc-400">Arahkan kamera ke barcode produk</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Selector dropdown if multiple */}
        {cameras.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Pilih Kamera:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startScanner(e.target.value);
              }}
              className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error state */}
        {cameraError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">Akses Kamera Terkendala</p>
              <p className="mt-1 text-amber-200/80">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Scanner Viewport Box */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-video flex items-center justify-center">
          <div id={readerElementId} className="w-full h-full" />

          {/* Target Scan Guide Overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-emerald-400 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)] relative animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Suara beep aktif saat barcode terbaca</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
