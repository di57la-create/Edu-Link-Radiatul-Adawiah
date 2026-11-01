/* ==========================================================================
   PENGATURAN EDULINK — file ini yang Anda isi sendiri.
   Buka dengan Notepad / editor teks, ubah teks di antara tanda kutip "...",
   simpan, lalu upload ulang ke Netlify. Jangan menghapus tanda kutip,
   koma, atau kurung kurawal.
   ========================================================================== */
window.EDULINK = {

  /* 0) GOOGLE SHEET (opsional, cara termudah mengisi data)
        Tempel tautan "Publikasikan ke web" (format CSV) dari Google Sheet Anda.
        Jika diisi, data di Sheet menggantikan isian di bawah ini.
        Jika dikosongkan, situs memakai isian di file ini. */
  sheetUrl: "",                // contoh: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv"

  /* 1) IDENTITAS (tampil di beranda dan semua bab) */
  guru:    "",                 // contoh: "Budi Santoso, S.Pd."
  sekolah: "",                 // contoh: "SMA Negeri 1 Contoh"
  tahun:   "2026/2027",        // tahun pelajaran

  /* 2) TANYA GURU — isi salah satu atau semuanya, yang kosong tidak ditampilkan */
  tanyaGuru: {
    whatsapp: "",              // nomor WA, contoh: "081234567890" (otomatis diubah ke format 62...)
    form:     "",              // tautan Google Form, contoh: "https://forms.gle/xxxx"
    padlet:   ""               // tautan Padlet,      contoh: "https://padlet.com/xxxx"
  },

  /* 3) PER BAB: alokasi waktu dan video.
        Tempel tautan YouTube biasa (youtube.com/watch?v=... atau youtu.be/...).
        Boleh lebih dari satu video: salin blok { ... }, lalu pisahkan dengan koma. */
  bab: {
    1: {
      alokasi: "2 × 45 menit",
      video: [
        // { judul: "Judul video", durasi: "8 menit", youtube: "https://youtu.be/XXXXXXXXXXX" },
      ]
    },
    2: {
      alokasi: "2 × 45 menit",
      video: [
        // { judul: "Judul video", durasi: "8 menit", youtube: "https://youtu.be/XXXXXXXXXXX" },
      ]
    },
    3: {
      alokasi: "2 × 45 menit",
      video: [
        // { judul: "Judul video", durasi: "8 menit", youtube: "https://youtu.be/XXXXXXXXXXX" },
      ]
    },
    4: {
      alokasi: "2 × 45 menit",
      video: [
        // { judul: "Judul video", durasi: "8 menit", youtube: "https://youtu.be/XXXXXXXXXXX" },
      ]
    },
    5: {
      alokasi: "2 × 45 menit",
      video: [
        // { judul: "Judul video", durasi: "8 menit", youtube: "https://youtu.be/XXXXXXXXXXX" },
      ]
    }
  }
};
