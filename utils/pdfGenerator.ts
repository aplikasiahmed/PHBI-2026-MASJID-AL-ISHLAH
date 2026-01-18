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

export const generatePDF = async (data: AppData, type: 'weekly' | 'donor' | 'expense' | 'all_income' | 'all_financial' | 'accountability') => {
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

  // --- CONFIG GAYA KHUSUS LPJ (Revisi: Padding Kecil agar height tabel kecil) ---
  const lpjStyles: any = {
      fontSize: 8.5, 
      textColor: [0, 0, 0],
      cellPadding: 1.2, // Diperkecil agar tabel tidak memakan tempat
      valign: 'middle',
      overflow: 'linebreak'
  };

  const lpjHeadStyles: any = {
      fontSize: 8.5,
      textColor: [255, 255, 255],
      valign: 'middle',
      halign: 'center',
      fontStyle: 'bold'
  };

  const tableMargin = { top: 42, bottom: 20 };

  // --- DEFINISI LEBAR KOLOM STANDAR AGAR LURUS (NO, TANGGAL, NOMINAL) ---
  // NO = 10, TANGGAL = 30, NOMINAL = 35. Sisanya untuk Deskripsi.
  const colWidthNo = 10;
  const colWidthDate = 30;
  const colWidthNominal = 35;

  // Helper untuk judul Rata Tengah (Standard Reports)
  const addTitle = (title: string, isFirstSection = false, color: [number, number, number] = [0, 0, 0]) => {
    if (!isFirstSection) {
        const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
        startY = lastTableY + 8; 
        if (startY > 280) {
            doc.addPage();
            startY = 46; 
        }
    }
    doc.setFontSize(9); 
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]); 
    doc.text(title, 105, startY, { align: 'center' });
    doc.setTextColor(0, 0, 0); 
    startY += 5; 
  };

  // Helper KHUSUS LPJ: Judul Rata Kiri + Penomoran + Jarak Rapat
  const addLeftTitle = (numberStr: string, title: string, isFirstSection = false) => {
    if (!isFirstSection) {
        const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
        // Jarak antar section
        startY = lastTableY + 6; 
        
        // Cek page break
        if (startY > 280) {
            doc.addPage();
            startY = 46; 
        }
    }
    // REVISI: Ukuran Font Judul Tabel diperkecil menjadi 10 (Ideal)
    doc.setFontSize(10); 
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); 
    // X=15 (Margin Kiri)
    doc.text(`${numberStr}. ${title}`, 15, startY, { align: 'left' });
    
    // Jarak Judul ke Tabel
    startY += 2; 
  };

  // --- LOGIKA KHUSUS: LAPORAN PERTANGGUNG JAWABAN (LPJ) ---
  if (type === 'accountability') {

      // --- JUDUL UTAMA HALAMAN PERTAMA (FONT TIMES, RAPAT) ---
      // Dicetak manual di bawah Kop Surat, hanya sekali di halaman 1
      
      // Menggunakan Font Times
      doc.setFont("times", "bold"); 
      // Ukuran Font diperkecil
      doc.setFontSize(10); 
      // Jarak startY diperpendek (+4 dari kop)
      doc.text("LAPORAN PERTANGGUNG JAWABAN", 108, startY +2 , { align: 'center' });
      
      doc.setFontSize(10);
      // Jarak antar baris diperpendek (+4)
      doc.text("PANITIA PERINGATAN HARI BESAR ISLAM (PHBI)", 108, startY + 6, { align: 'center' });
      doc.text("MAULID NABI MUHAMMAD SAW 1448 H / 2026 M", 108, startY + 10, { align: 'center' });
      
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text("Masjid Jam'i Al-Ishlah Kp. Teriti RW. 04", 108, startY + 14, { align: 'center' });

      // Tambahkan Jarak setelah Judul Utama sebelum masuk ke Tabel I
      // Jarak dikurangi agar tidak memakan tempat (25mm space)
      startY += 20;
      
      // 1. SALDO AWAL (PREVIOUS FUNDS)
      addLeftTitle('I', 'LAPORAN SALDO AWAL (PANITIA SEBELUMNYA)', true);
      
      if (data.previousFunds.length > 0) {
        const rows = data.previousFunds.map((item, idx) => [
            idx + 1,
            formatDate(item.date),
            formatCurrency(item.nominal)
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['NO', 'TANGGAL', 'NOMINAL']],
            body: rows,
            theme: 'grid',
            styles: lpjStyles, 
            showHead: 'everyPage', 
            showFoot: 'lastPage',
            headStyles: { ...lpjHeadStyles, fillColor: [88, 28, 135] }, 
            footStyles: { ...lpjStyles, fillColor: [233, 213, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
            // Lebar kolom NO dan TANGGAL disamakan dengan tabel lain
            columnStyles: { 
                0: { halign: 'center', cellWidth: colWidthNo }, 
                1: { cellWidth: colWidthDate, halign: 'center' },
                2: { halign: 'right' } 
            },
            margin: tableMargin,
            foot: [[
                { content: '', colSpan: 1 },
                { content: 'TOTAL', styles: { halign: 'right'} },
                { content: formatCurrency(data.previousFunds.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
            ]]
        });
     } else {
         doc.setFontSize(10); doc.setFont("helvetica", "italic");
         doc.text("(Tidak ada data dana awal)", 15, startY + 5);
         (doc as any).lastAutoTable = { finalY: startY + 8 };
     }

     // 2. PEMASUKAN MINGGUAN (RINGKASAN SESUAI PERMINTAAN)
     addLeftTitle('II', 'LAPORAN PEMASUKAN MINGGUAN');

     // Grouping Logic: Aggregate per Minggu
     const groupedWeeks: Record<string, { date: string, netTotal: number, name: string }> = {};
     data.weeklyData.forEach(item => {
        if (!groupedWeeks[item.week]) {
            groupedWeeks[item.week] = {
                date: item.date, // Ambil tanggal pertama yang ketemu
                netTotal: 0,
                name: item.week
            };
        }
        groupedWeeks[item.week].netTotal += item.netAmount;
     });

     const summaryWeeks = Object.values(groupedWeeks).sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
     });

     // Format Baru: NO | TANGGAL | MINGGU KE | NOMINAL
     const summaryRows = summaryWeeks.map((item, idx) => [
         idx + 1,
         formatDate(item.date),
         item.name, // MINGGU KE
         formatCurrency(item.netTotal) // NOMINAL
     ]);

     const totalWeeklyNet = summaryWeeks.reduce((a, b) => a + b.netTotal, 0);

     autoTable(doc, {
        startY: startY,
        // REVISI HEADERS: SESUAI REQUEST
        head: [['NO', 'TANGGAL', 'MINGGU KE', 'NOMINAL']], 
        body: summaryRows,
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'everyPage', 
        showFoot: 'lastPage',
        margin: tableMargin,
        headStyles: { ...lpjHeadStyles, fillColor: [13, 148, 136] }, // Tosca
        footStyles: { ...lpjStyles, fillColor: [204, 251, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
        // Kunci Lebar Kolom agar Lurus dengan tabel bawah
        columnStyles: { 
            0: { halign: 'center', cellWidth: colWidthNo }, // NO 10mm
            1: { halign: 'center', cellWidth: colWidthDate }, // TANGGAL 30mm
            2: { halign: 'left', cellWidth: 'auto' }, // MINGGU KE (Auto fill)
            3: { halign: 'right', cellWidth: colWidthNominal } // NOMINAL 35mm
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL', styles: { halign: 'right'} },
            { content: formatCurrency(totalWeeklyNet), styles: { halign: 'right' } }
        ]]
     });

     // 3. PEMASUKAN PROPOSAL / AMPLOP
     addLeftTitle('III', 'LAPORAN PEMASUKAN PROPOSAL / AMPLOP');
     
     const donorRows = data.donors.map((item, idx) => [
         idx + 1,
         formatDate(item.date),
         item.name,
         formatCurrency(item.nominal)
     ]);

     autoTable(doc, {
        startY: startY,
        head: [['NO', 'TANGGAL', 'SUMBER DANA / DONATUR', 'NOMINAL']],
        body: donorRows,
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'everyPage', 
        showFoot: 'lastPage',
        margin: tableMargin,
        headStyles: { ...lpjHeadStyles, fillColor: [30, 64, 175] }, // Blue
        footStyles: { ...lpjStyles, fillColor: [219, 234, 254], textColor: [0, 0, 0], fontStyle: 'bold' },
        // Kunci Lebar Kolom
        columnStyles: { 
            0: { halign: 'center', cellWidth: colWidthNo }, // NO 10mm
            1: { halign: 'center', cellWidth: colWidthDate }, // TANGGAL 30mm
            2: { halign: 'left', cellWidth: 'auto' }, // SUMBER DANA (Auto)
            3: { halign: 'right', cellWidth: colWidthNominal } // NOMINAL 35mm
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL', styles: { halign: 'right' } },
            { content: formatCurrency(data.donors.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
        ]]
     });

     // 4. PENGELUARAN
     addLeftTitle('IV', 'LAPORAN DANA PENGELUARAN');

     const expenseRows = data.expenses.map((item, idx) => [
        idx + 1,
        formatDate(item.date),
        item.purpose,
        formatCurrency(item.nominal)
      ]);
  
      autoTable(doc, {
        startY: startY,
        head: [['NO', 'TANGGAL', 'KEPERLUAN', 'NOMINAL']],
        body: expenseRows,
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'everyPage', 
        showFoot: 'lastPage',
        margin: tableMargin,
        headStyles: { ...lpjHeadStyles, fillColor: [185, 28, 28] }, // Red
        footStyles: { ...lpjStyles, fillColor: [254, 226, 226], textColor: [0, 0, 0], fontStyle: 'bold' },
        // Kunci Lebar Kolom
        columnStyles: { 
            0: { halign: 'center', cellWidth: colWidthNo }, // NO 10mm
            1: { halign: 'center', cellWidth: colWidthDate }, // TANGGAL 30mm
            2: { halign: 'left', cellWidth: 'auto' }, // KEPERLUAN (Auto)
            3: { halign: 'right', cellWidth: colWidthNominal } // NOMINAL 35mm
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL', styles: { halign: 'right' } },
            { content: formatCurrency(data.expenses.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
        ]]
      });

     // 5. REKAPITULASI
     addLeftTitle('V', 'LAPORAN REKAPITULASI DANA PHBI');

     const totalPrev = data.previousFunds.reduce((a,b)=>a+b.nominal,0);
     const totalWeekly = data.weeklyData.reduce((a,b)=>a+b.netAmount,0); // Same as summary total
     const totalDonor = data.donors.reduce((a,b)=>a+b.nominal,0);
     const totalIncome = totalPrev + totalWeekly + totalDonor;
     const totalExpense = data.expenses.reduce((a,b)=>a+b.nominal,0);
     const balance = totalIncome - totalExpense;

     autoTable(doc, {
        startY: startY + 2, 
        head: [['KETERANGAN', 'NOMINAL']],
        body: [
            [{ content: 'Total Saldo Awal (Panitia Sebelumnya)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalPrev), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
            [{ content: 'Total Pemasukan Bersih Mingguan (Ringkasan)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalWeekly), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
            [{ content: 'Total Pemasukan Proposal / Amplop', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalDonor), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
            [{ content: 'TOTAL SEMUA PEMASUKAN', styles: { fontStyle: 'bold', textColor: [6, 78, 59], fontSize: 10 } }, { content: formatCurrency(totalIncome), styles: { fontStyle: 'bold', fontSize: 10, textColor: [6, 78, 59], halign: 'right' } }],
            [{ content: 'TOTAL PENGELUARAN', styles: { fontStyle: 'bold', textColor: [185, 28, 28], fontSize: 10 } }, { content: formatCurrency(totalExpense), styles: { fontStyle: 'bold', fontSize: 10, textColor: [185, 28, 28], halign: 'right' } }],
            [{ content: `SALDO SAAT INI `, styles: { fontStyle: 'bold', textColor: [30, 64, 175], fontSize: 10 } }, { content: formatCurrency(balance), styles: { fontStyle: 'bold', fontSize: 10, textColor: [30, 64, 175], halign: 'right' } }]
        ],
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'firstPage', 
        margin: tableMargin,
        pageBreak: 'avoid', 
        headStyles: { ...lpjHeadStyles, fillColor: [255, 140, 0] }, 
        columnStyles: { 0: { halign: 'left', cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 'auto' } },
        didDrawCell: (hookData) => {
            // Draw Update Date
            if (hookData.section === 'body' && hookData.row.index === 5 && hookData.column.index === 0) {
                const doc = hookData.doc;
                doc.setFont("helvetica", "bold"); doc.setFontSize(11);
                const baseTextWidth = doc.getTextWidth("SALDO SAAT INI ");
                const dateText = ` (Update: ${formatDateTime(data.lastUpdated)})`;
                doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(100);
                const cellX = hookData.cell.x;
                const paddingLeft = hookData.cell.padding('left');
                // @ts-ignore
                const finalY = hookData.cell.textPos ? hookData.cell.textPos.y : (hookData.cell.y + hookData.cell.height / 2 + 1);
                doc.text(dateText, cellX + paddingLeft + baseTextWidth, finalY);
            }
        }
    });

    // Terbilang
    const finalY = (doc as any).lastAutoTable?.finalY;
    if (finalY) {
        const textTerbilang = terbilang(balance);
        doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(0, 0, 0);
        doc.text(`Terbilang : ${textTerbilang} Rupiah`, 196, finalY + 6, { align: 'right' }); 
    }

  } else {
    // --- ELSE: LOGIKA STANDARD REPORT (MINGGUAN DETAIL, DST) ---
    // (Kode lama tetap berjalan di blok ini menggunakan compactStyles)

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

            bodyData.push([
                { content: `Total ${week}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', textColor: [6, 78, 59] } }, 
                { content: formatCurrency(totalGrossWeek), styles: { fontStyle: 'bold', textColor: [6, 78, 59], halign: 'right' } },
                { content: formatCurrency(totalConsWeek), styles: { fontStyle: 'bold', textColor: [185, 28, 28], halign: 'right' } }, 
                { content: formatCurrency(totalCommWeek), styles: { fontStyle: 'bold', textColor: [185, 28, 28], halign: 'right' } }, 
                { content: formatCurrency(totalNetWeek), styles: { fontStyle: 'bold', textColor: [6, 78, 59], halign: 'right' } }
            ]);

            totalGrossAll += totalGrossWeek;
            totalConsAll += totalConsWeek;
            totalCommAll += totalCommWeek;
            totalNetAll += totalNetWeek;
        });

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
            margin: tableMargin, 
            headStyles: {
                ...compactHeadStyles,
                fillColor: [13, 148, 136], 
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' }, 
                1: { cellWidth: 25, halign: 'center' }, 
                2: { cellWidth: 12, halign: 'center' }, 
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const row = data.row.raw as any[];
                    const isSummaryRow = row[0] && typeof row[0] === 'object';
                    if (isSummaryRow) {
                        data.cell.styles.fillColor = [204, 251, 241]; 
                    } else {
                        if (data.column.index === 4 || data.column.index === 5) {
                            data.cell.styles.textColor = [255, 0, 0];
                        }
                    }
                }
            }
        });
    }

    // --- URUTAN 3: DONOR DATA ---
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
        margin: tableMargin, 
        headStyles: { ...compactHeadStyles, fillColor: [30, 64, 175] }, 
        footStyles: { ...compactStyles, fillColor: [219, 234, 254], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 
            0: { halign: 'center', cellWidth: 12 }, 
            1: { cellWidth: 28, halign: 'center' }, 
            2: { cellWidth: 'auto' }, 
            3: { halign: 'right', cellWidth: 35 } 
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL', styles: { halign: 'right' } }, 
            { content: formatCurrency(data.donors.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
        ]]
        });
    }

    // --- URUTAN 4: EXPENSE DATA ---
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
        margin: tableMargin, 
        headStyles: { ...compactHeadStyles, fillColor: [185, 28, 28] }, 
        footStyles: { ...compactStyles, fillColor: [254, 226, 226], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 
            0: { halign: 'center', cellWidth: 12 }, 
            1: { cellWidth: 28, halign: 'center' }, 
            2: { cellWidth: 'auto' }, 
            3: { halign: 'right', cellWidth: 35 } 
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL', styles: { halign: 'right' } },
            { content: formatCurrency(data.expenses.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
        ]]
        });
    }

    // --- URUTAN 5: REKAPITULASI ---
    if (type === 'all_financial') {
        const totalPrev = data.previousFunds.reduce((a,b)=>a+b.nominal,0);
        const totalWeekly = data.weeklyData.reduce((a,b)=>a+b.netAmount,0);
        const totalDonor = data.donors.reduce((a,b)=>a+b.nominal,0);
        const totalIncome = totalPrev + totalWeekly + totalDonor;
        const totalExpense = data.expenses.reduce((a,b)=>a+b.nominal,0);
        const balance = totalIncome - totalExpense;

        const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
        let rekapY = lastTableY + 10; 
        
        if (rekapY > 250) {
            doc.addPage();
            rekapY = 46; 
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
                [{ content: `SALDO SAAT INI `, styles: { fontStyle: 'bold', textColor: [30, 64, 175], fontSize: 10 } }, { content: formatCurrency(balance), styles: { fontStyle: 'bold', fontSize: 10, textColor: [30, 64, 175], halign: 'right' } }]
            ],
            theme: 'grid',
            styles: compactStyles,
            showHead: 'firstPage',
            margin: tableMargin, 
            pageBreak: 'avoid', 
            headStyles: { ...compactHeadStyles, fillColor: [255, 140, 0] }, 
            columnStyles: {
                0: { halign: 'left', cellWidth: 'auto' }, 
                1: { halign: 'right', cellWidth: 'auto' } 
            },
            didDrawCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === 5 && hookData.column.index === 0) {
                    const doc = hookData.doc;
                    
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(10);
                    const baseTextWidth = doc.getTextWidth("SALDO SAAT INI ");
                    
                    const dateText = ` (Update: ${formatDateTime(data.lastUpdated)})`;
                    
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(8);
                    doc.setTextColor(100);

                    const cellX = hookData.cell.x;
                    const paddingLeft = hookData.cell.padding('left');
                    const finalX = cellX + paddingLeft + baseTextWidth;
                    
                    // @ts-ignore
                    const finalY = hookData.cell.textPos ? hookData.cell.textPos.y : (hookData.cell.y + hookData.cell.height / 2 + 1);

                    doc.text(dateText, finalX, finalY);
                }
            }
        });
        
        const finalY = (doc as any).lastAutoTable?.finalY;
        if (finalY) {
            const textTerbilang = terbilang(balance);
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic"); 
            doc.setTextColor(0, 0, 0); 
            doc.text(`Terbilang : ${textTerbilang} Rupiah`, 196, finalY + 6, { align: 'right' }); 
        }
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
          case 'accountability': return 'LAPORAN_PERTANGGUNG_JAWABAN_PHBI'; // File name baru
          default: return `Laporan_PHBI_${reportType}`;
      }
  };

  const fileName = `${getFileName(type)}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
};