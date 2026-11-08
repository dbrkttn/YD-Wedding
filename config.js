/*
 * Semua detail undangan ada di file ini.
 * Every invitation detail lives here.
 */
window.UNDANGAN = {
    // Format: YYYY-MM-DD. Hari, tanggal, dan bulan di halaman dihitung otomatis.
    tanggal: '2026-12-26',

    // Selisih dari UTC dan zona waktu lokasi acara (WIB).
    offsetUtc: '+07:00',
    zonaWaktu: 'Asia/Jakarta',
    labelZona: 'WIB',

    mempelai: {
        wanita: {
            panggilan: 'Yundhai',
            namaLengkap: 'Ayundhai Elantra',
            keterangan: 'Putri kedua dari',
            ayah: 'Bapak Syaiful Bachri',
            ibu: 'Ibu Sri Hartatik',
            asal: 'Gendongan, Tingkir, Salatiga, Jawa Tengah',
        },
        pria: {
            panggilan: 'Dobrak',
            namaLengkap: 'Dobrak Tirani Tegak Nurani',
            keterangan: 'Putra pertama dari',
            ayah: 'Bapak Kusuma Prabawa',
            ibu: 'Ibu Anik Restianik',
            asal: 'Tamanmartani, Kalasan, Sleman, D.I. Yogyakarta',
        },
    },

    akad: {
        jam: '09.00',
        mulai: '09:00',
    },

    resepsi: {
        sesi: ['11.00 - 12.00', '12.00 - 13.00'],
        selesai: '13:00',
    },

    tempat: {
        // \n = pindah baris pada jadwal di dalam bingkai.
        nama: ['Gedung Balai\nPrajurit Makutarama', 'Salatiga'],
        // Tautan tombol "Buka Google Maps" dan kata kunci peta di halaman.
        mapsUrl: 'https://maps.app.goo.gl/GDxsPb4EtZCYH9uT9',
        petaKataKunci: 'Gedung Balai Prajurit Makutarama, Salatiga',
    },

    // Kosongkan ('') jika tidak ingin memakai musik.
    musik: 'assets/musik.mp3',

    // Urutan di sini = urutan di galeri. Sumber asli ada di folder "Galeri".
    galeri: [
        { src: 'assets/photos/galeri/01.webp', alt: 'Bersulang dengan dua gelas' },
        { src: 'assets/photos/galeri/02.webp', alt: 'Berbaring sambil memegang potongan jeruk' },
        { src: 'assets/photos/galeri/03.webp', alt: 'Piknik berdua di atas rumput' },
        { src: 'assets/photos/galeri/04.webp', alt: 'Bergandengan tangan sambil duduk di rumput' },
        { src: 'assets/photos/galeri/05.webp', alt: 'Saling menatap dan tersenyum' },
        { src: 'assets/photos/galeri/06.webp', alt: 'Wajah berdua dari dekat' },
        { src: 'assets/photos/galeri/07.webp', alt: 'Berdiri di taman dengan buket mawar merah' },
        { src: 'assets/photos/galeri/08.webp', alt: 'Berjalan bergandengan di bawah pepohonan' },
        { src: 'assets/photos/galeri/09.webp', alt: 'Duduk berdua di taman berhias lampu' },
        { src: 'assets/photos/galeri/10.webp', alt: 'Berpose di depan dinding gelap' },
        { src: 'assets/photos/galeri/11.webp', alt: 'Bersama buket bunga di ruangan berdinding kayu' },
        { src: 'assets/photos/galeri/12.webp', alt: 'Berfoto di kebun binatang' },
        { src: 'assets/photos/galeri/13.webp', alt: 'Mendaki gunung' },
        { src: 'assets/photos/galeri/14.webp', alt: 'Swafoto di tepi danau' },
        { src: 'assets/photos/galeri/15.webp', alt: 'Swafoto di depan air terjun' },
        { src: 'assets/photos/galeri/16.webp', alt: 'Empat foto dari photobooth' },
        { src: 'assets/photos/galeri/17.webp', alt: 'Swafoto di depan candi' },
        { src: 'assets/photos/galeri/18.webp', alt: 'Swafoto di kafe' },
    ],

    // Tempel URL Web App dari Google Apps Script di sini (lihat README.md).
    // Selama kosong, formulir berjalan dalam mode contoh dan tidak mengirim data.
    rsvpUrl: 'https://script.google.com/macros/s/AKfycbyRblKk9mGIQ9N-5PUHt9DOFErCAAzX7e7c6ErFSdx_LeLqc2j40OIWjlwiHUOpZsCk/exec',
};
