
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  
  const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  
  const datePart = date.toLocaleDateString('id-ID', optionsDate);
  // Mengganti separator waktu default (kadang titik di id-ID) menjadi titik dua (:)
  const timePart = date.toLocaleTimeString('id-ID', optionsTime).replace(/\./g, ':');
  
  return `${datePart}, Pukul ${timePart}`;
};

export const calculateWeeklyCuts = (gross: number) => {
  const consumption = gross * 0.05;
  const commission = gross * 0.10;
  const net = gross - consumption - commission;
  return { consumption, commission, net };
};
