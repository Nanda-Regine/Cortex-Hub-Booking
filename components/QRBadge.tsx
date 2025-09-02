'use client';

import { useEffect, useRef } from 'react';

type Props = { code?: string };

export default function QRBadge({ code }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const c = canvasRef.current;
    if (!code || !c) return;

    // set explicit size for crisper QR (optional)
    c.width = 180;
    c.height = 180;

    (async () => {
      try {
        const QR = await import('qrcode');
        if (!isMounted || !canvasRef.current) return;
        await QR.toCanvas(canvasRef.current, code, {
          width: 180,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
      } catch (err) {
        console.error('QR render error:', err);
      }
    })();

    return () => {
      isMounted = false;
      // optional: clear canvas on unmount or prop change
      const ctx = c.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    };
  }, [code]);

  const handleDownload = () => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cortexhub-qr.png';
    a.click();
  };

  return (
    <div className="card flex items-center gap-3">
      <div>
        <div className="text-sm text-slate-600">Your entry QR</div>
        <canvas ref={canvasRef} className="rounded bg-white p-2" />
        <button className="btn mt-2" onClick={handleDownload} disabled={!code}>
          Download QR
        </button>
      </div>
    </div>
  );
}
