import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../utils/format';
import Swal from 'sweetalert2';
import { UploadCloud, AlertCircle, Clock } from 'lucide-react';

const PreviewSection: React.FC = () => {
  const { stagedData, publishData } = useData();
  
  // State untuk menyimpan waktu saat ini (Realtime)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Efek Timer: Update waktu setiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Tampilan di Input: "20 Januari 2026 Waktu : 14:30:45"
  const getDisplayTime = () => {
    const datePart = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(currentDate);
    const timePart = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(currentDate).replace(/\./g, ':');
    return `${datePart} Waktu : ${timePart}`;
  };

  const handlePublish = () => {
    // Validasi Ketersediaan Data
    const hasData = 
        stagedData.previousFunds.length > 0 || 
        stagedData.weeklyData.length > 0 || 
        stagedData.donors.length > 0 || 
        stagedData.expenses.length > 0;

    if (!hasData) {
        Swal.fire({
            icon: 'info',
            title: 'Data Masih Kosong',
            text: 'Belum ada data baru untuk dipublikasikan. Silakan input data terlebih dahulu pada menu "Input Data".',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    // Konfirmasi Eksekusi
    Swal.fire({
      title: 'Publikasikan Data?',
      text: "Yakin Data ditampilkan ke Publik.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#047857',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Publikasikan',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        publishData(currentDate.toISOString());
      }
    });
  };

  const totalStagedIncome = 
    stagedData.previousFunds.reduce((a,b)=>a+b.nominal,0) + 
    stagedData.weeklyData.reduce((a,b)=>a+b.netAmount,0) + 
    stagedData.donors.reduce((a,b)=>a+b.nominal,0);
  
  const totalStagedExpense = stagedData.expenses.reduce((a,b)=>a+b.nominal,0);

  return (
    <div className="space-y-3 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-2 md:pb-4 gap-2 md:gap-4">
        <div>
           <h2 className="text-xs md:text-2xl font-bold text-gray-800">Preview Data (Draft)</h2>
           <p className="text-[9px] md:text-sm text-gray-500">Data ini belum dilihat publik sampai Anda menekan tombol Publikasikan.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
             {/* Date Display (Realtime Clock) - REVISED WIDTH: md:w-72 */}
             <div className="w-full md:w-72 flex-shrink-0">
                 <label className="block text-[9px] md:text-xs font-bold text-gray-600 mb-0.5 md:mb-1 flex items-center gap-1">
                    <Clock size={10} className="text-gray-500"/> Tanggal & Waktu Update Realtime
                 </label>
                 <input 
                    type="text" 
                    value={getDisplayTime()} 
                    readOnly
                    className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-0 md:px-4 md:py-2 text-[10px] md:text-sm text-gray-600 font-bold cursor-not-allowed focus:outline-none h-[28px] md:h-auto leading-none appearance-none shadow-inner"
                 />
             </div>

             <button 
                onClick={handlePublish}
                className="w-full md:w-auto bg-red-600 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse mt-1 md:mt-0 text-[10px] md:text-base hover:bg-red-700 active:bg-green-600 active:animate-none transition-colors duration-200"
            >
                <UploadCloud size={14} className="md:w-5 md:h-5" /> PUBLIKASIKAN DATA
            </button>
        </div>
      </div>
      {/* ... sisanya tetap sama ... */}
      <div className="grid grid-cols-2 gap-2 md:gap-6">
        <div className="bg-emerald-50 p-2 md:p-4 rounded-lg border border-emerald-200">
            <h3 className="font-bold text-emerald-800 text-[9px] md:text-base uppercase tracking-wider">Total Pemasukan (Draft)</h3>
            <p className="text-xs md:text-2xl font-bold text-emerald-900 mt-0.5 md:mt-1">{formatCurrency(totalStagedIncome)}</p>
        </div>
        <div className="bg-red-50 p-2 md:p-4 rounded-lg border border-red-200">
            <h3 className="font-bold text-red-800 text-[9px] md:text-base uppercase tracking-wider">Total Pengeluaran (Draft)</h3>
            <p className="text-xs md:text-2xl font-bold text-red-900 mt-0.5 md:mt-1">{formatCurrency(totalStagedExpense)}</p>
        </div>
      </div>

      <div className="space-y-2 md:space-y-4">
        <h3 className="font-bold text-gray-700 text-[10px] md:text-base">Ringkasan Item Belum Dipublikasi</h3>
        
        {stagedData.previousFunds.length > 0 && (
            <div className="bg-white border rounded p-2 md:p-4">
                <h4 className="font-bold mb-1 md:mb-2 text-[9px] md:text-sm text-purple-700 uppercase">Dana Awal ({stagedData.previousFunds.length} items)</h4>
                <div className="max-h-40 overflow-y-auto text-[9px] md:text-sm space-y-0.5 md:space-y-1">
                    {stagedData.previousFunds.map(d => (
                        <div key={d.id} className="flex justify-between py-0.5 md:py-1 border-b border-gray-50 last:border-0">
                            <span>{formatDate(d.date)}</span>
                            <span className="font-mono font-medium">{formatCurrency(d.nominal)}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {stagedData.weeklyData.length > 0 && (
            <div className="bg-white border rounded p-2 md:p-4">
                <h4 className="font-bold mb-1 md:mb-2 text-[9px] md:text-sm text-gray-600 uppercase">Mingguan ({stagedData.weeklyData.length} items)</h4>
                <div className="max-h-40 overflow-y-auto text-[9px] md:text-sm space-y-0.5 md:space-y-1">
                    {stagedData.weeklyData.map(d => (
                        <div key={d.id} className="flex justify-between py-0.5 md:py-1 border-b border-gray-50 last:border-0">
                            <span>{d.week} - {d.rt}</span>
                            <span className="font-mono font-medium">{formatCurrency(d.netAmount)}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {stagedData.donors.length > 0 && (
             <div className="bg-white border rounded p-2 md:p-4">
             <h4 className="font-bold mb-1 md:mb-2 text-[9px] md:text-sm text-blue-700 uppercase">Proposal / Amplop ({stagedData.donors.length} items)</h4>
             <div className="max-h-40 overflow-y-auto text-[9px] md:text-sm space-y-0.5 md:space-y-1">
                 {stagedData.donors.map(d => (
                     <div key={d.id} className="flex justify-between py-0.5 md:py-1 border-b border-gray-50 last:border-0">
                         <span>{d.name}</span>
                         <span className="font-mono font-medium">{formatCurrency(d.nominal)}</span>
                     </div>
                 ))}
             </div>
         </div>
        )}

        {stagedData.expenses.length > 0 && (
             <div className="bg-white border rounded p-2 md:p-4">
             <h4 className="font-bold mb-1 md:mb-2 text-[9px] md:text-sm text-red-700 uppercase">Pengeluaran ({stagedData.expenses.length} items)</h4>
             <div className="max-h-40 overflow-y-auto text-[9px] md:text-sm space-y-0.5 md:space-y-1">
                 {stagedData.expenses.map(d => (
                     <div key={d.id} className="flex justify-between py-0.5 md:py-1 border-b border-gray-50 last:border-0">
                         <span>{d.purpose}</span>
                         <span className="font-mono text-red-600 font-medium">{formatCurrency(d.nominal)}</span>
                     </div>
                 ))}
             </div>
         </div>
        )}

        {stagedData.previousFunds.length === 0 && stagedData.weeklyData.length === 0 && stagedData.donors.length === 0 && stagedData.expenses.length === 0 && (
            <div className="text-center py-6 md:py-10 bg-gray-50 text-gray-400 rounded-lg flex flex-col items-center">
                <AlertCircle size={20} className="mb-1 md:w-12 md:h-12"/>
                <p className="text-[10px] md:text-base">Tidak ada data baru untuk dipublikasikan.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PreviewSection;