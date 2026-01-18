import React from 'react';
import { Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  const logoUrl = "https://bmcenhkcwuxnclmlcriy.supabase.co/storage/v1/object/sign/image/logo%20phbi%20png.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iODZjZjM2NS1mNTBmLTQwMmQtYjUwMC00Mjg3YjVlYTgxYzkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9sb2dvIHBoYmkgcG5nLnBuZyIsImlhdCI6MTc2ODU0Njc3MCwiZXhwIjoxODAwMDgyNzcwfQ.B-7Ct_J6FK9J5EWEtKqiMCTfS2u6pChn0loK2ZEd6F8";

  return (
    <footer className="bg-primary text-white mt-6 md:mt-12 pt-6 md:pt-10 border-t-4 border-gold">
      <div className="container mx-auto px-4 pb-4 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          
          {/* Identity */}
          <div className="text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-3 mb-2 md:mb-4">
                <div className="bg-white p-1.5 md:p-2 rounded-full shadow-sm">
                    <img 
                      src={logoUrl} 
                      alt="Logo PHBI" 
                      className="w-8 h-8 md:w-10 md:h-10 object-contain" 
                    />
                </div>
                <h3 className="font-serif text-base md:text-xl font-bold">MASJID JAMI' AL-ISHLAH</h3>
             </div>
             <p className="text-[8px] md:text-sm text-gray-300 leading-relaxed mb-2 md:mb-4">
               Kp. Teriti Rw. 04 Desa Karet Kec. Sepatan Kab. Tangerang
             </p>
             <div className="flex flex-col space-y-1 md:space-y-2 text-[8px] md:text-sm text-gray-300">
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <Phone className="w-3 h-3 md:w-4 md:h-4" /> 082123456789 (Panitia)
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-3 h-3 md:w-4 md:h-4" /> masjid.alishlahrw04@gmail.com
                </div>
             </div>
          </div>

          {/* Committee */}
          <div className="text-center">
            <h4 className="font-serif text-xs md:text-lg font-bold mb-2 md:mb-4 text-gold">Panitia Inti PHBI 2026</h4>
            <ul className="space-y-1 md:space-y-2 text-[8px] md:text-sm text-gray-200">
                <li><span className="text-white">Ketua :</span> Ahmad Farhan</li>
                <li><span className="text-white">Wakil Ketua :</span> Farhan</li>
                <li><span className="text-white">Sekretaris :</span> Ahmad Nawasyi</li>
                <li><span className="text-white">Bendahara :</span> Mahendra</li>
            </ul>
          </div>

          {/* Hadith */}
           <div className="bg-emerald-800 p-3 md:p-4 rounded-lg shadow-inner text-[8px] md:text-sm text-gray-200 border border-emerald-700 flex flex-col justify-center items-center">
             <h4 className="text-center font-serif text-xs md:text-lg font-bold mb-2 text-gold">Rasulallah SAW Bersabda</h4>
             <p className="text-center text-[7px] italic leading-relaxed">
               "Jika anak Adam meninggal, terputuslah amalnya kecuali tiga perkara; sedekah jariyah, ilmu yang bermanfaat atau anak saleh yang mendoakan orang tuanya"
             </p>
             <span className="font-semibold mt-2 block not-italic text-[8px] md:text-xs text-emerald-400">
               (HR. Muslim)
             </span>
           </div>
        </div>

        <div className="mt-5 md:mt-10 pt-3 md:pt-6 border-t border-emerald-800 text-center flex flex-col items-center gap-0.5">
          <p className="text-[8px] md:text-xs text-gray-400">
            Sistem Laporan Keuangan PHBI | &copy; 2026 | by : <span className="text-gray-400">nawasyiahmed</span>
          </p>
          <p className="text-[9px] md:text-[11px] text-gray-400 tracking-wide">
            Masjid Jami' Al-Ishlah. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;