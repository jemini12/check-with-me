'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { useSwipeGesture } from '../lib/hooks/useSwipeGesture';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxHeight?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = '90vh'
}: BottomSheetProps) {
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Swipe down to dismiss on mobile
  const sheetRef = useSwipeGesture<HTMLDivElement>({
    onSwipeDown: () => {
      if (isMobile && contentRef.current?.scrollTop === 0) {
        onClose();
      }
    },
    threshold: 80,
  });

  if (!isOpen) return null;

  const modalClasses = isMobile
    ? 'fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300'
    : 'bg-white rounded-lg max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end md:items-center md:justify-center p-0 md:p-4 z-50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sheet-title' : undefined}
    >
      <div
        ref={sheetRef}
        className={modalClasses}
        style={{
          maxHeight: isMobile ? maxHeight : '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 id="sheet-title" className="text-2xl font-bold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto p-6"
          style={{
            maxHeight: isMobile ? `calc(${maxHeight} - 120px)` : '80vh',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
