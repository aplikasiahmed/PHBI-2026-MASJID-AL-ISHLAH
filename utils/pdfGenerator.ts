import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppData } from '../types';
import { formatCurrency, formatDate, formatDateTime } from './format';

// Link Logo Baru
const LOGO_URL = "https://bmcenhkcwuxnclmlcriy.supabase.co/storage/v1/object/sign/image/logo%20phbi%20png.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iODZjZjM2NS1mNTBmLTQwMmQtYjUwMC00Mjg3YjVlYTgxYzkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9sb2dvIHBoYmkgcG5nLnBuZyIsImlhdCI6MTc2ODU1OTQxNywiZXhwIjoxODAwMDk1NDE3fQ.njyWJkqHScwEEVDgYKwdbOVpJ6Cr4fZQWAxU_L51_FY";

// Helper: Fungsi Terbilang (Angka ke Kata)
const terbilang = (nilai: number): string => {
  const bilangan = Math.abs(nilai);
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let temp = "";

  if (bilangan < 12) {
    temp = " " + angka[bilangan];
  } else if (bilangan < 20) {
    temp = terbilang(bilangan - 10) + " Belas ";
  } else if (bilangan < 100) {
    temp = terbilang(Math.floor(bilangan / 10)) + " Puluh " + terbilang(bilangan % 10);
  } else if (bilangan < 200) {
    temp = " Seratus " + terbilang(bilangan - 100);
  } else if (bilangan < 1000) {
    temp = terbilang(Math.floor(bilangan / 100)) + " Ratus " + terbilang(bilangan % 100);
  } else if (bilangan < 2000) {
    temp = " Seribu" + terbilang(bilangan - 1000);
  } else if (bilangan < 1000000) {
    temp = terbilang(Math.floor(bilangan / 1000)) + " Ribu " + terbilang(bilangan % 1000);
  } else if (bilangan < 1000000000) {
    temp = terbilang(Math.floor(bilangan / 1000000)) + " Juta " + terbilang(bilangan % 1000000);
  } else if (bilangan < 1000000000000) {
    temp = terbilang(Math.floor(bilangan / 1000000000)) + " Milyar" + terbilang(bilangan % 1000000000);
  }

  return temp.trim();
}

// Helper untuk memuat gambar menjadi Base64
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
};

export const generatePDF = async (data: AppData, type: 'weekly' | 'donor' | 'expense' | 'all_income' | 'all_financial') => {
  // SETTING UKURAN KERTAS F4 (210mm x 330mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 330] 
  });
  
  // --- 1. PREPARE LOGO (Muat sekali di awal) ---
  let logoBase64 = '';
  try {
    logoBase64 = await getBase64ImageFromURL(LOGO_URL);
  } catch (error) {
    console.error("Gagal memuat Logo", error);
  }

  // --- 2. FUNGSI UNTUK MENGGAMBAR HEADER/KOP SURAT ---
  // Fungsi ini akan dipanggil untuk SETIAP halaman di akhir script
  const printHeader = (doc: jsPDF) => {
      const centerX = 112; 

      // Render Logo jika berhasil dimuat
      if (logoBase64) {
         doc.addImage(logoBase64, 'PNG', 15, 8, 26, 26); 
      }

      doc.setTextColor(0, 0, 0); // Hitam

      // Baris 1: PANITIA HARI BESAR ISLAM
      doc.setFont("times", "bold");
      doc.setFontSize(14); 
      doc.text("PANITIA HARI BESAR ISLAM", centerX, 15, { align: 'center' });
      
      // Baris 2: MAULID NABI MUHAMMAD SAW
      doc.setFontSize(14); 
      doc.text("MAULID NABI MUHAMMAD SAW", centerX, 21, { align: 'center' });
      
      // Baris 3: DEWAN KEMAKMURAN MASJID...
      doc.setFontSize(14);
      doc.text("DEWAN KEMAKMURAN MASJID (DKM) JAMI' AL-ISHLAH", centerX, 27, { align: 'center' });
      
      // Baris 4: Alamat
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text("Jl. H.A Djuminta Kp. Teriti Rw. 04 Desa Karet Kec. Sepatan Kab. Tangerang", centerX, 33, { align: 'center' });

      // C. Garis Pembatas (Double Line)
      doc.setLineWidth(0.5);
      doc.line(10, 37, 200, 37); // Garis Tebal
      
      doc.setLineWidth(0.3); 
      doc.line(10, 38, 200, 38); // Garis Tipis
      doc.setLineWidth(0.1); // Reset default width
  };

  // --- 3. LOGIKA TABLE & ISI ---
  let startY = 46; 

  // --- CONFIG GAYA TABEL SUPER COMPACT (HEMAT KERTAS) ---
  const compactStyles: any = {
      fontSize: 8,
      textColor: [0, 0, 0],       
      cellPadding: 1.5,  
      valign: 'middle',
      overflow: 'linebreak'
  };
  
  const compactHeadStyles: any = {
      fontSize: 8,
      textColor: [255, 255, 255],       
      valign: 'middle',
      halign: 'center'
  };

  // REVISI PENTING: Margin Top diubah jadi 42 agar tidak menabrak Kop Surat di halaman berikutnya
  const tableMargin = { top: 42, bottom: 20 };

  // Helper untuk menambah judul section dan cek halaman baru
  const addTitle = (title: string, isFirstSection = false, color: [number, number, number] = [0, 0, 0]) => {
    // Jika bukan section pertama, kita cek apakah perlu halaman baru atau space tambahan
    if (!isFirstSection) {
        const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
        startY = lastTableY + 8; // Jarak antar SECTION tabel diperkecil
        
        // REVISI: Batas bawah diperketat (280mm) agar tabel tidak terpotong di kaki halaman
        // Kertas F4 tinggi 330mm. 280mm menyisakan 50mm untuk footer & margin.
        if (startY > 280) {
            doc.addPage();
            startY = 46; // Reset StartY jika pindah halaman (sesuai tinggi kop surat + gap)
        }
    }

    doc.setFontSize(9); // Font judul section diperkecil
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]); 
    doc.text(title, 105, startY, { align: 'center' });
    doc.setTextColor(0, 0, 0); 
    startY += 5; // Jarak judul ke tabel di bawahnya (Default)
  };

  // --- URUTAN 1: PREVIOUS FUNDS (PANITIA SEBELUMNYA) ---
  if (type === 'all_financial' || type === 'all_income') {
     addTitle('LAPORAN SALDO AWAL (PANITIA SEBELUMNYA)', true);
     
     if (data.previousFunds.length > 0) {
        const rows = data.previousFunds.map((item, idx) => [
            idx + 1,
            formatDate(item.date),
            formatCurrency(item.nominal)
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['No', 'TANGGAL', 'NOMINAL']],
            body: rows,
            theme: 'grid',
            styles: compactStyles,
            showHead: 'firstPage',
            showFoot: 'lastPage',
            headStyles: { ...compactHeadStyles, fillColor: [88, 28, 135] }, 
            footStyles: { ...compactStyles, fillColor: [233, 213, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 0: { halign: 'center', textColor: [0, 0, 0], cellWidth: 15 }, 2: { halign: 'right', textColor: [0, 0, 0]} },
            margin: tableMargin, // UPDATE MARGIN
            foot: [[
                { content: '', colSpan: 1, styles: { textColor: [0, 0, 0] }},
                { content: 'TOTAL', styles: { halign: 'right'} },
                { content: formatCurrency(data.previousFunds.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right', textColor: [0, 0, 0] } }
            ]]
        });
     } else {
         doc.setFontSize(8);
         doc.setFont("helvetica", "italic");
         doc.text("(Tidak ada data dana awal)", 105, startY + 4, { align: 'center' });
         (doc as any).lastAutoTable = { finalY: startY + 8 }; 
     }
  }

  // --- URUTAN 2: WEEKLY DATA (PEMASUKAN MINGGUAN) ---
  if (type === 'weekly' || type === 'all_income' || type === 'all_financial') {
    addTitle('LAPORAN PEMASUKAN MINGGUAN (PER RT)', type !== 'all_financial' && type !== 'all_income');
    
    // Grouping Data
    const groupedByWeek: Record<string, any[]> = {};
    data.weeklyData.forEach(item => {
        if (!groupedByWeek[item.week]) groupedByWeek[item.week] = [];
        groupedByWeek[item.week].push(item);
    });

    const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    const bodyData: any[] = [];
    let totalGrossAll = 0;
    let totalConsAll = 0;
    let totalCommAll = 0;
    let totalNetAll = 0;

    sortedWeeks.forEach(week => {
        const items = groupedByWeek[week];
        // Sort items by RT
        items.sort((a, b) => a.rt.localeCompare(b.rt));

        let totalGrossWeek = 0;
        let totalConsWeek = 0;
        let totalCommWeek = 0;
        let totalNetWeek = 0;

        items.forEach(item => {
            bodyData.push([
                item.week,
                formatDate(item.date),
                item.rt,
                formatCurrency(item.grossAmount),
                formatCurrency(item.consumptionCut),
                formatCurrency(item.commissionCut),
                formatCurrency(item.netAmount)
            ]);
            totalGrossWeek += item.grossAmount;
            totalConsWeek += item.consumptionCut;
            totalCommWeek += item.commissionCut;
            totalNetWeek += item.netAmount;
        });

        // Add Subtotal Row Per Week
        bodyData.push([
            { content: `Total ${week}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', textColor: [6, 78, 59] } }, // Tosca text
            { content: formatCurrency(totalGrossWeek), styles: { fontStyle: 'bold', textColor: [6, 78, 59], halign: 'right' } },
            { content: formatCurrency(totalConsWeek), styles: { fontStyle: 'bold', textColor: [185, 28, 28], halign: 'right' } }, // Red
            { content: formatCurrency(totalCommWeek), styles: { fontStyle: 'bold', textColor: [185, 28, 28], halign: 'right' } }, // Red
            { content: formatCurrency(totalNetWeek), styles: { fontStyle: 'bold', textColor: [6, 78, 59], halign: 'right' } }
        ]);

        totalGrossAll += totalGrossWeek;
        totalConsAll += totalConsWeek;
        totalCommAll += totalCommWeek;
        totalNetAll += totalNetWeek;
    });

    // Grand Total Row (Ditambahkan ke BODY agar otomatis di paling bawah, tidak berulang)
    bodyData.push([
        { content: 'TOTAL PENDAPATAN BERSIH ', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8  } },
        { content: formatCurrency(totalGrossAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } },
        { content: formatCurrency(totalConsAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } },
        { content: formatCurrency(totalCommAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } },
        { content: formatCurrency(totalNetAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } }
    ]);

    autoTable(doc, {
        startY: startY,
        head: [['MINGGU', 'TANGGAL', 'RT', 'PEMASUKAN', 'KONSUMSI 5%', 'KOMISI 10%', 'PENDAPATAN BERSIH']],
        body: bodyData,
        theme: 'grid',
        styles: compactStyles,
        showHead: 'firstPage',
        margin: tableMargin, // UPDATE MARGIN
        headStyles: {
            ...compactHeadStyles,
            fillColor: [13, 148, 136], // Header Hijau Tosca
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' }, // Minggu
            1: { cellWidth: 25, halign: 'center' }, // Tanggal
            2: { cellWidth: 12, halign: 'center' }, // RT
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
        },
        didParseCell: (data) => {
             if (data.section === 'body') {
                const row = data.row.raw as any[];
                
                // Cek jika ini baris Subtotal atau Grand Total (berdasarkan struktur object di col 1)
                const isSummaryRow = row[0] && typeof row[0] === 'object';
                
                if (isSummaryRow) {
                    // Background Tosca Muda untuk baris total
                    data.cell.styles.fillColor = [204, 251, 241]; 
                } else {
                    // Warna teks Merah untuk kolom potongan di baris biasa
                    if (data.column.index === 4 || data.column.index === 5) {
                         data.cell.styles.textColor = [255, 0, 0];
                    }
                }
             }
        }
    });
  }

  // --- URUTAN 3: DONOR DATA (PEMASUKAN PROPOSAL / AMPLOP) ---
  if (type === 'donor' || type === 'all_income' || type === 'all_financial') {
    addTitle('LAPORAN PEMASUKAN PROPOSAL / AMPLOP', type === 'donor');

    const rows = data.donors.map((item, idx) => [
      idx + 1,
      formatDate(item.date),
      item.name,
      formatCurrency(item.nominal)
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['NO', 'TANGGAL', 'SUMBER DANA / DONATUR', 'NOMINAL']],
      body: rows,
      theme: 'grid',
      styles: compactStyles,
      showHead: 'firstPage',
      showFoot: 'lastPage',
      margin: tableMargin, // UPDATE MARGIN
      headStyles: { ...compactHeadStyles, fillColor: [30, 64, 175] }, 
      footStyles: { ...compactStyles, fillColor: [219, 234, 254], textColor: [0, 0, 0], fontStyle: 'bold' },
      // REVISI KOLOM: Tanggal fixed, Sumber Dana auto
      columnStyles: { 
          0: { halign: 'center', cellWidth: 12 }, 
          1: { cellWidth: 28, halign: 'center' }, // Tanggal fixed
          2: { cellWidth: 'auto' }, // Sumber Dana auto
          3: { halign: 'right', cellWidth: 35 } 
      },
      foot: [[
          { content: '', colSpan: 2 },
          { content: 'TOTAL', styles: { halign: 'right' } }, 
          { content: formatCurrency(data.donors.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
      ]]
    });
  }

  // --- URUTAN 4: EXPENSE DATA (PENGELUARAN) ---
  if (type === 'expense' || type === 'all_financial') {
    addTitle('LAPORAN DANA PENGELUARAN', type === 'expense');
    
    const rows = data.expenses.map((item, idx) => [
      idx + 1,
      formatDate(item.date),
      item.purpose,
      formatCurrency(item.nominal)
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['NO', 'TANGGAL', 'KEPERLUAN', 'NOMINAL']],
      body: rows,
      theme: 'grid',
      styles: compactStyles,
      showHead: 'firstPage',
      showFoot: 'lastPage',
      margin: tableMargin, // UPDATE MARGIN
      headStyles: { ...compactHeadStyles, fillColor: [185, 28, 28] }, 
      footStyles: { ...compactStyles, fillColor: [254, 226, 226], textColor: [0, 0, 0], fontStyle: 'bold' },
      // REVISI KOLOM: Tanggal fixed, Keperluan auto
      columnStyles: { 
          0: { halign: 'center', cellWidth: 12 }, 
          1: { cellWidth: 28, halign: 'center' }, // Tanggal fixed
          2: { cellWidth: 'auto' }, // Keperluan auto
          3: { halign: 'right', cellWidth: 35 } 
      },
      foot: [[
          { content: '', colSpan: 2 },
          { content: 'TOTAL', styles: { halign: 'right' } },
          { content: formatCurrency(data.expenses.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
      ]]
    });
  }

  // --- URUTAN 5: REKAPITULASI (RECAP) ---
  if (type === 'all_financial') {
      const totalPrev = data.previousFunds.reduce((a,b)=>a+b.nominal,0);
      const totalWeekly = data.weeklyData.reduce((a,b)=>a+b.netAmount,0);
      const totalDonor = data.donors.reduce((a,b)=>a+b.nominal,0);
      const totalIncome = totalPrev + totalWeekly + totalDonor;
      const totalExpense = data.expenses.reduce((a,b)=>a+b.nominal,0);
      const balance = totalIncome - totalExpense;

      // Cek halaman baru untuk rekap
      const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
      let rekapY = lastTableY + 10; // Beri jarak sedikit dari tabel sebelumnya
      
      // REVISI PENTING: Ambang batas (Threshold) Page Break Diperketat
      if (rekapY > 250) {
          doc.addPage();
          rekapY = 46; // Reset ke posisi aman dibawah Kop Surat
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("LAPORAN REKAPITULASI DANA PHBI", 105, rekapY, { align: 'center' });

      autoTable(doc, {
          startY: rekapY + 4, 
          head: [['KETERANGAN', 'NOMINAL']],
          body: [
              [{ content: 'Total Saldo Awal (Panitia Sebelumnya)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalPrev), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
              [{ content: 'Total Pemasukan Bersih Mingguan (Per RT)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalWeekly), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
              [{ content: 'Total Pemasukan Proposal / Amplop', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalDonor), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
              [{ content: 'TOTAL SEMUA PEMASUKAN', styles: { fontStyle: 'bold', textColor: [6, 78, 59], fontSize: 10 } }, { content: formatCurrency(totalIncome), styles: { fontStyle: 'bold', fontSize: 10, textColor: [6, 78, 59], halign: 'right' } }],
              [{ content: 'TOTAL PENGELUARAN', styles: { fontStyle: 'bold', textColor: [185, 28, 28], fontSize: 10 } }, { content: formatCurrency(totalExpense), styles: { fontStyle: 'bold', fontSize: 10, textColor: [185, 28, 28], halign: 'right' } }],
              // UPDATE: Menggunakan formatDateTime pada Tanggal
              [{ content: `SALDO SAAT INI `, styles: { fontStyle: 'bold', textColor: [30, 64, 175], fontSize: 10 } }, { content: formatCurrency(balance), styles: { fontStyle: 'bold', fontSize: 10, textColor: [30, 64, 175], halign: 'right' } }]
          ],
          theme: 'grid',
          styles: compactStyles,
          showHead: 'firstPage',
          margin: tableMargin, // UPDATE MARGIN
          pageBreak: 'avoid', 
          headStyles: { ...compactHeadStyles, fillColor: [255, 140, 0] }, 
          columnStyles: {
            0: { halign: 'left', cellWidth: 'auto' }, 
            1: { halign: 'right', cellWidth: 'auto' } 
          },
          didDrawCell: (hookData) => {
               if (hookData.section === 'body' && hookData.row.index === 5 && hookData.column.index === 0) {
                   const doc = hookData.doc;
                   
                   // 1. Hitung lebar teks "SISA SALDO SAAT INI" (Bold)
                   doc.setFont("helvetica", "bold");
                   doc.setFontSize(10);
                   const baseTextWidth = doc.getTextWidth("SALDO SAAT INI ");
                   
                   // 2. Siapkan teks Tanggal (UPDATE: formatDateTime)
                   const dateText = ` (Update: ${formatDateTime(data.lastUpdated)})`;
                   
                   // 3. Set Font Italic untuk Tanggal
                   doc.setFont("helvetica", "italic");
                   doc.setFontSize(8);
                   doc.setTextColor(100);

                   // 4. Hitung Posisi X dan Y
                   const cellX = hookData.cell.x;
                   const paddingLeft = hookData.cell.padding('left');
                   const finalX = cellX + paddingLeft + baseTextWidth;
                   
                   // Gunakan textPos.y jika ada (baseline), jika tidak estimasi tengah
                   // @ts-ignore
                   const finalY = hookData.cell.textPos ? hookData.cell.textPos.y : (hookData.cell.y + hookData.cell.height / 2 + 1);

                   // 5. Gambar Teks
                   doc.text(dateText, finalX, finalY);
               }
          }
      });
      
      // --- TERBILANG SECTION ---
      // Ambil posisi Y terakhir setelah tabel selesai
      const finalY = (doc as any).lastAutoTable?.finalY;
      if (finalY) {
          const textTerbilang = terbilang(balance);
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic"); // Font Miring
          doc.setTextColor(0, 0, 0); // Warna Hitam
          // Geser ke Kanan (align: right, x: 196)
          doc.text(`Terbilang : ${textTerbilang} Rupiah`, 196, finalY + 6, { align: 'right' }); 
      }
  }

  // --- 4. GLOBAL LOOP: CETAK HEADER & FOOTER DI SEMUA HALAMAN ---
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // A. CETAK HEADER (KOP SURAT)
    printHeader(doc);

    // B. CETAK FOOTER
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID');
    const timeStr = now.toLocaleTimeString('id-ID');
    
    doc.text(`Diunduh pada: ${dateStr}, Pukul : ${timeStr}`, 15, doc.internal.pageSize.height - 10);
    doc.text(`Hal ${i} dari ${pageCount}`, 195, doc.internal.pageSize.height - 10, { align: 'right' });
  }

  // Logika Penamaan File
  const getFileName = (reportType: string) => {
      switch (reportType) {
          case 'all_financial': return 'Laporan_PHBI_Rekapitulasi';
          case 'weekly': return 'Laporan_PHBI_Mingguan_Per_RT';
          case 'donor': return 'Laporan_PHBI_Proposal_Amplop';
          case 'expense': return 'Laporan_PHBI_Pengeluaran';
          case 'all_income': return 'Laporan_PHBI_Gabungan_Pemasukan';
          default: return `Laporan_PHBI_${reportType}`;
      }
  };

  const fileName = `${getFileName(type)}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
};