import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

const SignaturePad = ({ onSave, onCancel, signerName, title = "Add Signature" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.beginPath();

    if (e.type === 'mousedown') {
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    } else if (e.type === 'touchstart') {
      e.preventDefault();
      const touch = e.touches[0];
      ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }

    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    if (e.type === 'mousemove') {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    } else if (e.type === 'touchmove') {
      e.preventDefault();
      const touch = e.touches[0];
      ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }

    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            {signerName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Signing as: <span className="font-medium">{signerName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-64 cursor-crosshair touch-none"
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">Sign here</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Draw your signature using your mouse or touch screen
          </p>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <button
            onClick={clearSignature}
            disabled={!hasSignature}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasSignature}
              className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              Save Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
