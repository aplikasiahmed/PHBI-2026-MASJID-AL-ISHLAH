import React from 'react';
import { useData } from '../../context/DataContext';
import Swal from 'sweetalert2';
import { Trash, AlertTriangle, ShieldAlert } from 'lucide-react';

const ResetSection: React.FC = () => {
  const { resetData } = useData();

  // TEMPAT GANTI KODE ID SERVER HARDCODED
  const AUTH_CODE = "ALISHLAH2026";

  const handleReset = async (type: 'all' | 'previous' | 'weekly' | 'donor' | 'expense', label: string) => {
    // 1. Tampilkan Popup Konfirmasi dengan Input Password
    const { value: inputCode } = await Swal.fire({
        title: `Reset Data ${label}?`,
        html: `
            <p class="text-sm text-gray-600 mb-4">Tindakan ini <b>TIDAK BISA DIBATALKAN</b>. Data akan hilang permanen dari database.</p>
            <div class="text-left bg-red-50 p-2 rounded border border-red-100 text-red-800 text-xs font-bold mb-2 flex items-center gap-2">
                 🔐 Masukkan Kode ID Server
            </div>
        `,
        icon: 'warning',
        input: 'password', // Input type password agar tersembunyi
        inputPlaceholder: 'Kode ID Server...',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Reset Data',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (!value) {
                return 'Kode ID Server wajib diisi!';
            }
        }
    });

    // 2. Cek Kode ID Server
    if (inputCode) {
        if (inputCode === AUTH_CODE) {
            // JIKA KODE BENAR -> EKSEKUSI RESET
            resetData(type);
            Swal.fire({
                title: 'Berhasil Direset!',
                text: `Data ${label} berhasil dibersihkan dari database.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            // JIKA KODE SALAH
            Swal.fire({
                title: 'Kode ID Server Gagal!',
                text: 'Kode ID Server yang Anda masukkan SALAH. Data tidak dihapus.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    }
  };

  return (
    <div className="space-y-3 md:space-y-6">
       <h2 className="text-xs md:text-2xl font-bold text-red-800 border-b pb-1 md:pb-2 flex items-center gap-1.5 md:gap-2">
           <AlertTriangle size={16} className="md:w-6 md:h-6" /> Reset Data (Database)
       </h2>
       
       <div className="bg-red-50 border border-red-200 p-2 md:p-4 rounded-lg flex gap-2 md:gap-3 items-start">
           <ShieldAlert className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
           <div className="text-red-800 text-[9px] md:text-sm leading-relaxed">
               <strong>PERINGATAN KEAMANAN:</strong><br/>
               Fitur ini menghapus data langsung dari Server Database. Tindakan ini tidak dapat dibatalkan. 
               Diperlukan <b>Kode ID Server</b> untuk melanjutkan proses reset.
           </div>
       </div>

       <div className="space-y-1.5 md:space-y-4">
           {[
               { id: 'previous', label: 'Data Panitia Sebelumnya' },
               { id: 'weekly', label: 'Data Mingguan (Per RT)' },
               { id: 'donor', label: 'Data Donatur / Amplop' },
               { id: 'expense', label: 'Data Pengeluaran' },
               { id: 'all', label: 'SEMUA DATA (SELURUHNYA)', danger: true }
           ].map((item) => (
               <div key={item.id} className={`flex items-center justify-between p-1.5 md:p-4 shadow-sm rounded border ${item.danger ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                   <span className={`font-bold text-[9px] md:text-base ${item.danger ? 'text-red-700' : 'text-gray-700'}`}>
                       {item.label}
                   </span>
                   <button 
                    onClick={() => handleReset(item.id as any, item.label)}
                    className={`px-2 py-1 md:px-4 md:py-2 rounded text-white text-[9px] md:text-sm font-bold flex items-center gap-1 md:gap-2 active:scale-95 transition shadow-sm ${item.danger ? 'bg-red-700 hover:bg-red-900' : 'bg-orange-500 hover:bg-orange-600'}`}
                   >
                       <Trash size={10} className="md:w-4 md:h-4" /> Reset
                   </button>
               </div>
           ))}
       </div>
    </div>
  );
};

export default ResetSection;