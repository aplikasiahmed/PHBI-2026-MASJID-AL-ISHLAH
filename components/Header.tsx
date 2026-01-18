import React from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const logoUrl = "https://bmcenhkcwuxnclmlcriy.supabase.co/storage/v1/object/sign/image/logo%20phbi%20png.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iODZjZjM2NS1mNTBmLTQwMmQtYjUwMC00Mjg3YjVlYTgxYzkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9sb2dvIHBoYmkgcG5nLnBuZyIsImlhdCI6MTc2ODU0Njc3MCwiZXhwIjoxODAwMDgyNzcwfQ.B-7Ct_J6FK9J5EWEtKqiMCTfS2u6pChn0loK2ZEd6F8";

  return (
    <header className="sticky top-0 z-50 bg-primary text-white shadow-lg border-b-4 border-gold">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-3">
        
        {/* Logo & Text Container */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-white p-1.5 md:p-2 rounded-full flex-shrink-0 shadow-sm">
            <img 
              src={logoUrl} 
              alt="Logo PHBI" 
              className="w-6 h-6 md:w-9 md:h-9 object-contain" 
            /> 
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-sm md:text-2xl font-bold tracking-wide leading-tight truncate md:whitespace-normal">
              MASJID JAMI' AL-ISHLAH
            </h1>
            <p className="text-[10px] md:text-sm text-gray-200 font-light truncate">
              Kp. Teriti Rw. 04 Desa Karet Kec. Sepatan Kab. Tangerang
            </p>
          </div>
        </div>

        {/* Login Button */}
        <button 
          onClick={onLoginClick}
          className="bg-secondary hover:bg-emerald-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition flex-shrink-0 flex items-center gap-2 shadow-md border border-emerald-600"
        >
          <User className="w-4 h-4" />
          <span>MASUK</span>
        </button>
      </div>
    </header>
  );
};

export default Header;