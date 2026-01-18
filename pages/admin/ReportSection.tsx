import React from 'react';
import { useData } from '../../context/DataContext';
import { generatePDF } from '../../utils/pdfGenerator';
import { generateExcel } from '../../utils/excelGenerator';
import { FileText, FileSpreadsheet } from 'lucide-react';

const ReportSection: React.FC = () => {
  const { publishedData } = useData();

  const reportTypes = [
    { label: 'Pemasukan Mingguan (Per RT)', type: 'weekly', color: 'border-emerald-600 text-emerald-800 bg-emerald-50' },
    { label: 'Pemasukan Proposal / Amplop', type: 'donor', color: 'border-blue-600 text-blue-800 bg-blue-50' },
    { label: 'Dana Pengeluaran', type: 'expense', color: 'border-red-600 text-red-800 bg-red-50' },
    { label: 'TOTAL Pemasukan (Gabungan)', type: 'all_income', color: 'border-primary text-primary bg-emerald-100' },
    { label: 'Laporan Keuangan Lengkap (Semua)', type: 'all_financial', color: 'border-purple-800 text-purple-900 bg-purple-100' },
    // MENU BARU
    { label: 'LAPORAN PERTANGGUNG JAWABAN', type: 'accountability', color: 'border-gray-800 text-gray-900 bg-gray-100 shadow-md ring-1 ring-gray-200' },
  ];

  return (
    <div className="space-y-3 md:space-y-6">
       <div className="border-b pb-2">
           <h2 className="text-sm md:text-2xl font-bold text-gray-800">Laporan Keuangan (Arsip)</h2>
           <p className="text-[10px] md:text-base text-gray-600 mt-0.5">Unduh laporan dalam format PDF atau Excel berdasarkan data yang sudah dipublikasikan.</p>
       </div>

       <div className="space-y-2 md:space-y-3">
         {reportTypes.map((rpt, idx) => (
             <div key={idx} className={`flex flex-row justify-between items-center p-2.5 md:p-4 rounded-lg border-l-4 shadow-sm ${rpt.color} bg-white border border-gray-200 gap-2 md:gap-3`}>
                <div className="flex-1">
                    <h3 className={`font-bold text-[10px] md:text-lg leading-tight ${rpt.type === 'accountability' ? 'uppercase tracking-wide' : ''}`}>{rpt.label}</h3>
                    {/* REVISI: Teks keterangan dihapus sesuai permintaan */}
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                    {/* Tombol PDF */}
                    <button
                        onClick={() => generatePDF(publishedData, rpt.type as any)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 md:px-3 md:py-2 rounded md:rounded-lg shadow transition flex items-center justify-center gap-1 text-[10px] md:text-sm active:scale-95 font-bold"
                    >
                        <FileText size={12} className="md:w-4 md:h-4" /> 
                        <span>PDF</span>
                    </button>

                    {/* Tombol Excel */}
                    <button
                        onClick={() => generateExcel(publishedData, rpt.type as any)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 md:px-3 md:py-2 rounded md:rounded-lg shadow transition flex items-center justify-center gap-1 text-[10px] md:text-sm active:scale-95 font-bold"
                    >
                        <FileSpreadsheet size={12} className="md:w-4 md:h-4" /> 
                        <span>Excel</span>
                    </button>
                </div>
             </div>
         ))}
       </div>
    </div>
  );
};

export default ReportSection;