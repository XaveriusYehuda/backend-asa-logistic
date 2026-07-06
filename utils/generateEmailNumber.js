function generateEmailNumber(service_type) {
    // 1. Generate angka random 5 digit (00001 - 99999)
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    const formattedNum = String(randomNum).padStart(5, '0');

    const serviceType = `${
      service_type === 'Export_Handling' ? "ASA-EXP" : 
      service_type === 'Import_Clearance' ? "ASA-IMP" : 
      service_type === 'Domestic_Delivery' ? "ASA-DD" : 
      service_type === 'International_FF' ? "ASA-FF" : 
      service_type === 'Undername_Export' ? "ASA-UDNE" : "ASA-UDNI"}`;

    // 2. Ambil bulan saat ini dan ubah ke angka Romawi
    const now = new Date();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const currentRomanMonth = romanMonths[now.getMonth()];

    // 3. Ambil tahun saat ini secara dinamis
    const currentYear = now.getFullYear();

    // 4. Gabungkan semua komponen sesuai format
    return `${formattedNum}/${serviceType}/${currentRomanMonth}/${currentYear}`;
}

// Cara penggunaan:
// console.log(generateEmailNumber()); // Output contoh: 48291/ASA-LOG/VI/2026

module.exports = generateEmailNumber;