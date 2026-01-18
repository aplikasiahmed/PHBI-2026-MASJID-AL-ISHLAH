import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      {/* UPDATE: Ukuran w-[90%] dan max-w-[320px] untuk mobile agar kecil & rapi */}
      <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-[320px] md:max-w-md overflow-hidden animate-fade-in-up transform transition-all scale-100">
        {/* Header Lebih Kecil di Mobile (p-2.5) */}
        <div className="bg-primary p-2.5 md:p-4 flex justify-between items-center text-white border-b border-emerald-800">
          <h3 className="font-serif font-bold text-sm md:text-lg tracking-wide">{title}</h3>
          <button onClick={onClose} className="hover:text-red-300 transition-colors p-1 rounded-full hover:bg-emerald-800">
            <X size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
        {/* Body Padding Lebih Kecil (p-3) */}
        <div className="p-3 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;