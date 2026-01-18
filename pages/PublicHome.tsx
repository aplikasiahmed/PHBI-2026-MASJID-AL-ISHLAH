import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import SummaryCard from '../components/SummaryCard';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { X, ChevronDown, Wallet, TrendingDown, TrendingUp, Copy, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { generatePDF } from '../utils/pdfGenerator';

const PublicHome: React.FC = () => {
  const { publishedData } = useData();
  const [activeDetail, setActiveDetail] = useState<'income' | 'expense' | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  
  // Ref untuk memastikan auto-select hanya terjadi sekali saat data pertama kali dimuat
  const hasSetInitialWeek = useRef(false);

  // URL Assets
  const bcaLogoUrl = "https://bmcenhkcwuxnclmlcriy.supabase.co/storage/v1/object/sign/image/BCA%20icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iODZjZjM2NS1mNTBmLTQwMmQtYjUwMC00Mjg3YjVlYTgxYzkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9CQ0EgaWNvbi5wbmciLCJpYXQiOjE3Njg1NDg3NjUsImV4cCI6MTgwMDA4NDc2NX0.D0kVRrFXun72PZeP3Uxvdk-uwC3IjiL5eH30JstwMrY";
  const waLogoUrl = "https://bmcenhkcwuxnclmlcriy.supabase.co/storage/v1/object/sign/image/WhatsApp_icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iODZjZjM2NS1mNTBmLTQwMmQtYjUwMC00Mjg3YjVlYTgxYzkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9XaGF0c0FwcF9pY29uLnBuZyIsImlhdCI6MTc2ODU0ODQ4NywiZXhwIjoxODAwMDg0NDg3fQ.7Jb2tyrgNr5wSEX1yz-ByWL3RMQqdlQk0-kqUlc1B6I";

  // Calculations
  const totalPrevious = publishedData.previousFunds.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalWeekly = publishedData.weeklyData.reduce((acc, curr) => acc + curr.netAmount, 0);
  const totalDonors = publishedData.donors.reduce((acc, curr) => acc + curr.nominal, 0);
  
  const totalIncome = totalPrevious + totalWeekly + totalDonors;
  const totalExpense = publishedData.expenses.reduce((acc, curr) => acc + curr.nominal, 0);
  const balance = totalIncome - totalExpense;

  // Filter Weekly Data
  const weeks = Array.from(new Set(publishedData.weeklyData.map(d => d.week))).sort();
  
  // AUTO SELECT LATEST WEEK LOGIC
  useEffect(() => {
    // Jalankan logika jika data mingguan tersedia dan belum pernah diset otomatis sebelumnya
    if (publishedData.weeklyData.length > 0 && !hasSetInitialWeek.current) {
        const uniqueWeeks = Array.from(new Set(publishedData.weeklyData.map(d => d.week)));
        
        // Sortir Descending (Minggu ke-10, Minggu ke-9, ... Minggu ke-1)
        // Menggunakan regex untuk mengambil angkanya saja agar urutannya benar secara numerik
        uniqueWeeks.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '') || '0');
            const numB = parseInt(b.replace(/\D/g, '') || '0');
            return numB - numA;
        });

        if (uniqueWeeks.length > 0) {
            setSelectedWeek(uniqueWeeks[0]); // Set ke minggu terakhir (terbesar)
            hasSetInitialWeek.current = true; // Tandai flag agar tidak mereset pilihan user jika ada update background
        }
    }
  }, [publishedData.weeklyData]);

  const filteredWeekly = selectedWeek === 'all' 
    ? publishedData.weeklyData 
    : publishedData.weeklyData.filter(d => d.week === selectedWeek);

  // Grouped Weekly Totals for display logic
  const totalGrossWeek = filteredWeekly.reduce((acc, c) => acc + c.grossAmount, 0);
  const totalConsWeek = filteredWeekly.reduce((acc, c) => acc + c.consumptionCut, 0);
  const totalCommWeek = filteredWeekly.reduce((acc, c) => acc + c.commissionCut, 0);
  const totalNetWeek = filteredWeekly.reduce((acc, c) => acc + c.netAmount, 0);


  const handleCopyRekening = () => {
    navigator.clipboard.writeText('7296012717');
    Swal.fire({
      icon: 'success',
      title: 'Disalin',
      text: 'Nomor Rekening BCA berhasil disalin',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleKonfirmasi = () => {
    const message = "Assalamu'alaikum Saya sudah transfer donasi untuk PHBI Maulid 2026. Mohon konfirmasi pencatatan dana. Berikut bukti transferan saya";
    window.open(`https://wa.me/62895411875877?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadReport = () => {
    Swal.fire({
      title: 'Downlaod Laporan?',
      text: "Anda akan mendownloand Laporan Keuangan PHBI",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2563eb', // Blue
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, download',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        generatePDF(publishedData, 'all_financial');
      }
    });
  };

  return (
    <div className="pb-8 min-h-screen bg-gray-50">
      
      {/* TITLE SECTION */}
      <div className="bg-white py-6 md:py-12 px-4 text-center border-b border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-gold to-primary"></div>
        <h2 className="text-xl md:text-4xl font-serif font-bold text-primary mb-1 md:mb-3 drop-shadow-sm">SISTEM KEUANGAN PHBI</h2>
        <p className="text-xs md:text-xl text-secondary font-medium tracking-wide">Maulid Nabi Muhammad SAW 1448 H | 2026 M</p>
      </div>

      <div id="report-start" className="container mx-auto px-4 mt-4 md:mt-8 space-y-4 md:space-y-12">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 animate-fade-in-up">
          <SummaryCard 
                title="Total Pemasukan" 
                amount={totalIncome} 
                type="income" 
                onDetailClick={() => setActiveDetail('income')} 
            />
          <SummaryCard 
                title="Total Pengeluaran" 
                amount={totalExpense} 
                type="expense" 
                onDetailClick={() => {
                const el = document.getElementById('expense-section');
                el?.scrollIntoView({ behavior: 'smooth' });
                }} 
            />
          <SummaryCard 
                title="Saldo Saat Ini" 
                amount={balance} 
                type="balance"
                // UPDATE: Menggunakan formatDateTime untuk menampilkan Jam
                subtitle={`Update: ${formatDateTime(publishedData.lastUpdated)}`}
            />
        </div>

        {/* Detail Popup for Income (Compact Mobile Version) */}
        {activeDetail === 'income' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden animate-fade-in-up">
              <div className="bg-primary p-3 md:p-4 flex justify-between items-center text-white">
                <h3 className="font-serif font-bold text-sm md:text-lg">Rincian Total Pemasukan</h3>
                <button onClick={() => setActiveDetail(null)} className="hover:bg-emerald-800 p-1 rounded-full transition"><X size={18} /></button>
              </div>
              <div className="p-3 md:p-5 space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-1.5 md:pb-2">
                  <span className="text-gray-600 font-medium">Panitia Sebelumnya</span>
                  <span className="font-bold text-gray-800">{formatCurrency(totalPrevious)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5 md:pb-2">
                  <span className="text-gray-600 font-medium">Total Bersih Mingguan (Per RT)</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(totalWeekly)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5 md:pb-2">
                  <span className="text-gray-600 font-medium">Proposal/Amplop</span>
                  <span className="font-bold text-blue-600">{formatCurrency(totalDonors)}</span>
                </div>
                <div className="flex justify-between pt-1.5 mt-1 text-sm md:text-lg font-bold text-primary bg-emerald-50 p-2 md:p-3 rounded-lg">
                  <span>TOTAL PEMASUKAN</span>
                  <span>{formatCurrency(totalIncome)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Mingguan (Per RT) */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* REVISI: items-center menjadi items-start untuk mobile agar rata kiri */}
          <div className="p-3 md:p-6 bg-emerald-50 border-b border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-600 p-1 md:p-1.5 rounded-lg text-white"><TrendingUp size={16} className="md:w-5 md:h-5" /></div>
                <h3 className="text-sm md:text-xl font-serif font-bold text-primary">Pemasukan Mingguan (Per RT)</h3>
            </div>
            <div className="relative w-full md:w-auto">
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full md:w-56 appearance-none bg-white border border-emerald-200 text-gray-700 text-[8px] md:text-sm rounded-full pl-3 pr-8 py-1.5 md:py-2 focus:ring-1 focus:ring-primary focus:border-primary shadow-sm font-medium"
              >
                <option value="all">Tampilkan Semua Minggu</option>
                {weeks.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-emerald-600">
                <ChevronDown size={8} className="md:w-3.5 md:h-3.5" />
              </div>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Minggu / Tanggal</th>
                  <th className="px-6 py-4">RT / Wilayah</th>
                  <th className="px-6 py-4 text-right">Pemasukan Kotor</th>
                  <th className="px-6 py-4 text-right text-red-500">Potongan 5%</th>
                  <th className="px-6 py-4 text-right text-red-500">Potongan 10%</th>
                  <th className="px-6 py-4 text-right text-emerald-700 bg-emerald-50/50">Pendapatan Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWeekly.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">Belum ada data pemasukan mingguan</td></tr>
                ) : (
                  filteredWeekly.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition duration-150">
                      <td className="px-6 py-4">
                        <span className="inline-block bg-gray-200 rounded px-2 py-0.5 text-[10px] font-bold text-gray-600 mb-1">{item.week}</span>
                        <div className="text-gray-500 text-xs">{formatDate(item.date)}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">{item.rt}</td>
                      <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(item.grossAmount)}</td>
                      <td className="px-6 py-4 text-right text-red-400 text-xs">-{formatCurrency(item.consumptionCut)}</td>
                      <td className="px-6 py-4 text-right text-red-400 text-xs">-{formatCurrency(item.commissionCut)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700 text-base bg-emerald-50/30">{formatCurrency(item.netAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200 text-gray-700">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-right uppercase text-xs">Total Pendapatan Bersih</td>
                  <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(totalGrossWeek)}</td>
                  <td className="px-6 py-4 text-right text-red-600 text-xs">-{formatCurrency(totalConsWeek)}</td>
                  <td className="px-6 py-4 text-right text-red-600 text-xs">-{formatCurrency(totalCommWeek)}</td>
                  <td className="px-6 py-4 text-right text-lg text-primary bg-emerald-100/50">{formatCurrency(totalNetWeek)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Card View (Optimized SUPER COMPACT for Small Screens) */}
          <div className="md:hidden bg-gray-50 p-1.5 space-y-1.5">
             {filteredWeekly.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300 text-xs italic">Belum ada data untuk ditampilkan</div>
             ) : (
                <>
                {filteredWeekly.map((item) => (
                    <div key={item.id} className="bg-white p-2 rounded-md shadow-sm border border-gray-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-0.5 h-full bg-emerald-500"></div>
                        <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-100 pl-1.5">
                            <div>
                                <span className="block font-bold text-gray-800 text-[8px] tracking-wide leading-none">{item.week}</span>
                                <span className="text-[7px] text-gray-600 flex items-center gap-1 mt-0.5 leading-none">{formatDate(item.date)}</span>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full">{item.rt}</span>
                        </div>
                        <div className="pl-1.5 space-y-0.5">
                            <div className="flex justify-between text-[8px] text-gray-800">
                                <span>Pemasukan Kotor</span>
                                <span>{formatCurrency(item.grossAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-red-600">
                                <span>Potongan 5%</span>
                                <span>-{formatCurrency(item.consumptionCut)}</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-red-600">
                                <span>Potongan 10%</span>
                                <span>-{formatCurrency(item.commissionCut)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100 mt-0.5">
                                <span className="font-bold text-gray-700 text-[8px]">Pendapatan Bersih</span>
                                <span className="font-bold text-[9px] text-primary">{formatCurrency(item.netAmount)}</span>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* TOTAL BERSIH (Mobile Footer - Smaller) */}
                <div className="bg-gradient-to-r from-primary to-emerald-800 text-white p-2 rounded-lg shadow-lg mt-10 sticky bottom-4 z-10 border border-gold/30">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-[9px] uppercase tracking-wider opacity-90">
                           Total Pendapatan Bersih
                        </span>
                        <span className="font-bold text-sm text-gold">{formatCurrency(totalNetWeek)}</span>
                    </div>
                    <div className="text-[8px] text-emerald-200 text-right italic leading-none">
                        {selectedWeek === 'all' ? '*dari Semua Minggu' : `*dari ${selectedWeek}`}
                    </div>
                </div>
                </>
             )}
          </div>
        </section>

        {/* Section: Proposal / Amplop */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-3 md:p-6 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1 md:p-1.5 rounded-lg text-white"><Wallet size={16} className="md:w-5 md:h-5" /></div>
                <h3 className="text-sm md:text-xl font-serif font-bold text-blue-900">Pemasukan Proposal / Amplop</h3>
            </div>
          </div>
          
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 w-12 text-center">No</th>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Sumber Dana</th>
                  <th className="px-6 py-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {publishedData.donors.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">Belum ada data pemasukan proposal</td></tr>
                ) : (
                  publishedData.donors.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition">
                      <td className="px-6 py-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600">{formatDate(item.date)}</td>
                      <td className="px-6 py-3 font-semibold text-gray-800">{item.name}</td>
                      <td className="px-6 py-3 text-right font-bold text-blue-700 text-sm whitespace-nowrap bg-blue-50/30">{formatCurrency(item.nominal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right uppercase text-sm text-gray-600">Total Pemasukan Lainnya</td>
                  <td className="px-6 py-3 text-right text-xl text-blue-800 whitespace-nowrap">{formatCurrency(totalDonors)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* MOBILE TABLE VIEW (Fixed Layout & Non-Scrollable) */}
          <div className="md:hidden bg-white">
            <table className="w-full text-[10px] text-left table-fixed">
                <thead className="bg-blue-50 text-blue-900 font-bold uppercase tracking-wider">
                    <tr>
                        <th className="w-8 py-2 text-center border-b border-blue-100 border-r">No</th>
                        {/* UPDATE: Tanggal diperlebar (w-24) dan judul Header rata tengah */}
                        <th className="w-24 px-1 py-2 border-b border-blue-100 border-r text-center">Tanggal</th>
                        {/* UPDATE: Judul Rata Tengah, Auto Width */}
                        <th className="px-2 py-2 border-b border-blue-100 border-r text-center">Sumber Dana</th>
                        {/* Judul Rata Tengah */}
                        <th className="w-20 px-1 py-2 text-center border-b border-blue-100">Nominal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {publishedData.donors.length === 0 ? (
                         <tr><td colSpan={4} className="py-4 text-center text-gray-400 italic">Belum ada data</td></tr>
                    ) : (
                        publishedData.donors.map((item, idx) => (
                            <tr key={item.id} className="odd:bg-white even:bg-gray-50">
                                <td className="py-2 text-center text-gray-500 font-mono align-top border-r border-gray-100">{idx + 1}</td>
                                <td className="px-1 py-2 text-center text-gray-500 align-top border-r border-gray-100 leading-tight">
                                    {formatDate(item.date)}
                                </td>
                                <td className="px-2 py-2 align-top border-r border-gray-100">
                                    {/* FONT NORMAL (REMOVED FONT-BOLD) */}
                                    <div className="text-gray-800 break-words leading-tight">{item.name}</div>
                                </td>
                                <td className="px-1 py-2 text-right font-bold text-blue-700 align-top">
                                    {formatCurrency(item.nominal)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                {publishedData.donors.length > 0 && (
                    <tfoot className="bg-blue-50 font-bold border-t-2 border-blue-100">
                        <tr>
                            <td colSpan={3} className="px-2 py-2 text-right text-blue-900 uppercase text-[9px]">Total</td>
                            <td className="px-1 py-2 text-right text-blue-900 text-[10px]">{formatCurrency(totalDonors)}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
          </div>
        </section>

        {/* Section: Pengeluaran */}
        <section id="expense-section" className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-3 md:p-6 bg-red-50 border-b border-red-100">
             <div className="flex items-center gap-2">
                <div className="bg-red-600 p-1 md:p-1.5 rounded-lg text-white"><TrendingDown size={16} className="md:w-5 md:h-5" /></div>
                <h3 className="text-sm md:text-xl font-serif font-bold text-red-900">Rincian Pengeluaran</h3>
            </div>
          </div>
          
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 w-12 text-center">No</th>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Keperluan</th>
                  <th className="px-6 py-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {publishedData.expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">Belum ada data pengeluaran</td></tr>
                ) : (
                  publishedData.expenses.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-red-50/30 transition">
                      <td className="px-6 py-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600">{formatDate(item.date)}</td>
                      <td className="px-6 py-3 text-gray-800 font-medium">{item.purpose}</td>
                      <td className="px-6 py-3 text-right font-bold text-red-600 text-sm whitespace-nowrap bg-red-50/30">{formatCurrency(item.nominal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right uppercase text-sm text-gray-600">Total Pengeluaran</td>
                  <td className="px-6 py-3 text-right text-xl text-red-800 whitespace-nowrap">{formatCurrency(totalExpense)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* MOBILE TABLE VIEW (Fixed Layout & Non-Scrollable) */}
          <div className="md:hidden bg-white">
            <table className="w-full text-[10px] text-left table-fixed">
                <thead className="bg-red-50 text-red-900 font-bold uppercase tracking-wider">
                    <tr>
                        <th className="w-8 py-2 text-center border-b border-red-100 border-r">No</th>
                        {/* UPDATE: Tanggal diperlebar (w-24) dan judul Header rata tengah */}
                        <th className="w-24 px-1 py-2 border-b border-red-100 border-r text-center">Tanggal</th>
                        {/* UPDATE: Judul Rata Tengah, Auto Width */}
                        <th className="px-2 py-2 border-b border-red-100 border-r text-center">Keperluan</th>
                        {/* Judul Rata Tengah */}
                        <th className="w-20 px-1 py-2 text-center border-b border-red-100">Nominal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {publishedData.expenses.length === 0 ? (
                         <tr><td colSpan={4} className="py-4 text-center text-gray-400 italic">Belum ada data</td></tr>
                    ) : (
                        publishedData.expenses.map((item, idx) => (
                            <tr key={item.id} className="odd:bg-white even:bg-gray-50">
                                <td className="py-2 text-center text-gray-500 font-mono align-top border-r border-gray-100">{idx + 1}</td>
                                <td className="px-1 py-2 text-center text-gray-500 align-top border-r border-gray-100 leading-tight">
                                    {formatDate(item.date)}
                                </td>
                                <td className="px-2 py-2 align-top border-r border-gray-100">
                                    {/* FONT NORMAL (REMOVED FONT-BOLD) */}
                                    <div className="text-gray-800 break-words leading-tight">{item.purpose}</div>
                                </td>
                                <td className="px-1 py-2 text-right font-bold text-red-600 align-top">
                                    {formatCurrency(item.nominal)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                {publishedData.expenses.length > 0 && (
                    <tfoot className="bg-red-50 font-bold border-t-2 border-red-100">
                        <tr>
                            <td colSpan={3} className="px-2 py-2 text-right text-red-900 uppercase text-[9px]">Total</td>
                            <td className="px-1 py-2 text-right text-red-900 text-[10px]">{formatCurrency(totalExpense)}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
          </div>
        </section>

        {/* DOWNLOAD PDF BUTTON - Revised Style */}
        <div className="mt-6 mb-3 flex justify-center animate-fade-in-up px-4">
            <button 
                onClick={handleDownloadReport}
                className="group bg-red-600 border border-white hover:bg-white text-white hover:text-red-600 active:bg-white active:text-red-600 px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 md:gap-2 transform active:scale-95 hover:scale-105 w-fit animate-pulse"
            >
                <div className="bg-white group-hover:bg-red-600 text-red-600 group-hover:text-white hover:text-white group-active:bg-red-600 group-active:text-white p-0.5 md:p-1 rounded-full transition-colors flex-shrink-0">
                    <FileText size={12} className="md:w-3.5 md:h-3.5" />
                </div>
                <span className="text-[10px] md:text-xs tracking-wide text-center leading-none">Download Laporan Keuangan PHBI (PDF)</span>
            </button>
        </div>

        {/* INFO REKENING & KONFIRMASI WA */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-8 relative overflow-hidden mt-6">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-gold to-primary"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                
                {/* Rekening Info */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1 w-full md:w-auto">
                    {/* UPDATED TITLE & SUBTITLE */}
                    <h3 className="font-serif text-base md:text-4xl font-bold text-gray-800 whitespace-nowrap">Ayo Sukseskan Acara PHBI</h3>
                    <p className="text-[11px] md:text-sm text-gray-500 pb-2">dapat donasikan melalui transfer Bank</p>
                    
                    <div className="bg-blue-50 border border-blue-200 p-3 md:p-4 rounded-xl flex items-center gap-3 shadow-sm w-full md:w-auto justify-center md:justify-start">
                        <img src={bcaLogoUrl} alt="BCA" className="h-12 md:h-16 object-contain" />
                        <div>
                            <p className="text-[9px] md:text-[10px] uppercase text-gray-500 font-bold tracking-wider">Bank Central Asia (BCA)</p>
                            <p className="text-base md:text-3xl font-mono font-bold text-gray-800 tracking-wider">7296012717</p>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <p className="text-[10px] md:text-xs text-gray-600 font-semibold ">a.n Mahendera</p>
                                {/* TOMBOL MERAH */}
                                <button onClick={handleCopyRekening} className="text-white bg-red-600 hover:bg-red-700 p-1 rounded transition shadow-sm" title="Salin No Rek">
                                    <Copy size={11} className="md:w-3 md:h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Confirmation */}
                <div className="flex flex-col items-center justify-center space-y-2 w-full md:w-auto">
                    <p className="text-xs md:text-sm text-gray-500 max-w-xs text-center">
                        Sudah transfer? Mohon konfirmasi ke panitia.
                    </p>
                    <button 
                        onClick={handleKonfirmasi}
                        className="group bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition transform hover:scale-105 w-fit"
                    >
                        <img src={waLogoUrl} alt="WA" className="w-5 h-5 md:w-8 md:h-8" /> 
                        <span className="text-xs md:text-lg">Konfirmasi WhatsApp</span>
                    </button>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default PublicHome;