// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js';
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    where,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDmI0zRauvzaL4oEuXinkmXhGiwTsYxYQc",
    authDomain: "insan-cemerlang-ee7af.firebaseapp.com",
    projectId: "insan-cemerlang-ee7af",
    storageBucket: "insan-cemerlang-ee7af.firebasestorage.app",
    messagingSenderId: "1047091827759",
    appId: "1:1047091827759:web:0f1742d6f3922f856de2da",
    measurementId: "G-GL8J5GC8XB"
};

// Initialize Firebase
const aplikasi = initializeApp(firebaseConfig);
const basisdata = getFirestore(aplikasi);

// Firebase Functions
async function ambilDaftarBarang() {
    const refDokumen = collection(basisdata, "barang");
    const kueri = query(refDokumen, orderBy("nama"));
    const cuplikanKueri = await getDocs(kueri);

    let hasilKueri = [];
    cuplikanKueri.forEach((dokumen) => {
        hasilKueri.push({
            id: dokumen.id,
            nama: dokumen.data().nama,
            harga: dokumen.data().harga,
            kategori: dokumen.data().kategori,
            gambar: dokumen.data().gambar || null
        });
    });

    return hasilKueri;
}

async function ambilDaftarPenjualan() {
    const refDokumen = collection(basisdata, "penjualan");
    const kueri = query(refDokumen, orderBy("tanggal", "desc"));
    const cuplikanKueri = await getDocs(kueri);

    let hasilKueri = [];
    cuplikanKueri.forEach((dokumen) => {
        const data = dokumen.data();
        hasilKueri.push({
            id: dokumen.id,
            items: data.items,
            totalHarga: data.totalHarga,
            metodeBayar: data.metodeBayar,
            tanggal: data.tanggal.toDate()
        });
    });

    return hasilKueri;
}

async function tambahBarang(nama, harga, kategori, gambar = null) {
    try {
        const refDokumen = await addDoc(collection(basisdata, "barang"), {
            nama: nama,
            harga: parseInt(harga),
            kategori: kategori,
            gambar: gambar
        });
        console.log("Berhasil menyimpan data barang");
        return true;
    } catch (error) {
        console.log("Gagal menyimpan data barang", error);
        return false;
    }
}

async function ubahBarang(id, nama, harga, kategori, gambar = null) {
    try {
        const refDokumen = doc(basisdata, "barang", id);
        await updateDoc(refDokumen, {
            nama: nama,
            harga: parseInt(harga),
            kategori: kategori,
            gambar: gambar
        });
        console.log("Berhasil mengubah data barang");
        return true;
    } catch (error) {
        console.log("Gagal mengubah data barang", error);
        return false;
    }
}

async function hapusBarang(id) {
    try {
        await deleteDoc(doc(basisdata, "barang", id));
        console.log("Berhasil menghapus data barang");
        return true;
    } catch (error) {
        console.log("Gagal menghapus data barang", error);
        return false;
    }
}

async function tambahPenjualan(keranjang, totalHarga, metodeBayar) {
    try {
        const refDokumen = await addDoc(collection(basisdata, "penjualan"), {
            items: keranjang,
            totalHarga: totalHarga,
            metodeBayar: metodeBayar,
            tanggal: Timestamp.now()
        });
        console.log("Berhasil menyimpan data penjualan");
        return true;
    } catch (error) {
        console.log("Gagal menyimpan data penjualan", error);
        return false;
    }
}

// Export functions to global scope
window.ambilDaftarBarang = ambilDaftarBarang;
window.tambahBarang = tambahBarang;
window.ubahBarang = ubahBarang;
window.hapusBarang = hapusBarang;
window.ambilDaftarPenjualan = ambilDaftarPenjualan;
window.tambahPenjualan = tambahPenjualan;

// Main Application Logic
$(document).ready(function() {
    let daftarBarang = [];
    let daftarPenjualan = [];
    let keranjang = [];
    let editBarangId = null;
    let metodeBayar = 'cash';
    let gambarBarang = null;

    // Initialize application
    muatDaftarBarang();
    muatDaftarPenjualan();

    // Event handler for tabs
    $('.nav-link[data-tab]').click(function() {
        const tabId = $(this).data('tab');
        
        // Update active tab
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        
        // Show appropriate tab content
        $('.tab-content').addClass('d-none');
        $(`#tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).removeClass('d-none');
        
        // If transaction tab, reload product list
        if (tabId === 'transaksi') {
            muatBarangUntukTransaksi();
        }
    });

    // Event handler for add product button
    $('#btnTambahBarang').click(function() {
        editBarangId = null;
        $('#modalBarangTitle').text('Tambah Barang');
        $('#formBarang')[0].reset();
        $('#imagePreview').html('<span>Pratinjau gambar akan muncul di sini</span>');
        gambarBarang = null;
        $('#modalBarang').modal('show');
    });

    // Event handler for image input
    $('#gambarBarang').change(function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#imagePreview').html(`<img src="${e.target.result}" alt="Preview">`);
                gambarBarang = e.target.result; // Save image data URL
            };
            reader.readAsDataURL(file);
        } else {
            $('#imagePreview').html('<span>Pratinjau gambar akan muncul di sini</span>');
            gambarBarang = null;
        }
    });

    // Event handler for save product
    $('#btnSimpanBarang').click(async function() {
        const nama = $('#namaBarang').val();
        const harga = $('#hargaBarang').val();
        const kategori = $('#kategoriBarang').val();
        
        if (!nama || !harga) {
            alert('Nama dan harga barang harus diisi!');
            return;
        }
        
        let berhasil;
        if (editBarangId) {
            berhasil = await ubahBarang(editBarangId, nama, harga, kategori, gambarBarang);
        } else {
            berhasil = await tambahBarang(nama, harga, kategori, gambarBarang);
        }
        
        if (berhasil) {
            $('#modalBarang').modal('hide');
            muatDaftarBarang();
            if ($('#tabTransaksi').hasClass('d-none') === false) {
                muatBarangUntukTransaksi();
            }
        }
    });

    // Event handler for process transaction button
    $('#btnProsesTransaksi').click(async function() {
        if (keranjang.length === 0) {
            alert('Keranjang masih kosong!');
            return;
        }
        
        const uangDibayar = parseInt($('#uangDibayar').val()) || 0;
        const totalHarga = hitungTotalKeranjang();
        
        if (uangDibayar < totalHarga) {
            alert('Uang yang dibayarkan kurang!');
            return;
        }
        
        const berhasil = await tambahPenjualan(keranjang, totalHarga, metodeBayar);
        
        if (berhasil) {
            tampilkanStruk(totalHarga, uangDibayar, metodeBayar);
            keranjang = [];
            renderKeranjang();
            $('#uangDibayar').val('');
            muatDaftarPenjualan();
        }
    });

    // Event handler for reset transaction button
    $('#btnResetTransaksi').click(function() {
        keranjang = [];
        renderKeranjang();
        $('#uangDibayar').val('');
    });

    // Event handler for paid amount input
    $('#uangDibayar').on('input', function() {
        hitungKembalian();
    });

    // Event handler for print receipt button
    $('#btnCetakStruk').click(function() {
        window.print();
    });

    // Event handler for product search in transaction
    $('#cariBarang').on('input', function() {
        muatBarangUntukTransaksi();
    });

    // Event handler for category filter
    $('.category-btn').click(function() {
        $('.category-btn').removeClass('active');
        $(this).addClass('active');
        muatBarangUntukTransaksi();
    });

    // Event handler for payment method
    $('.payment-option').click(function() {
        $('.payment-option').removeClass('active');
        $(this).addClass('active');
        metodeBayar = $(this).data('method');
    });

    // Function to load product list
    async function muatDaftarBarang() {
        daftarBarang = await ambilDaftarBarang();
        renderDaftarBarang();
        updateTotalBarang();
    }

    // Function to load sales list
    async function muatDaftarPenjualan() {
        daftarPenjualan = await ambilDaftarPenjualan();
        updateTotalPenjualan();
    }

    // Function to render product list
    function renderDaftarBarang() {
        const tbody = $('#tbodyBarang');
        tbody.empty();
        
        if (daftarBarang.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p>Tidak ada data barang</p>
                            <button class="btn btn-primary" id="btnTambahBarangFromEmpty">
                                <i class="fas fa-plus me-1"></i>Tambah Barang
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            $('#btnTambahBarangFromEmpty').click(function() {
                $('#btnTambahBarang').click();
            });
            
            return;
        }
        
        daftarBarang.forEach((barang, index) => {
            const icon = getIconByCategory(barang.kategori);
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        ${barang.gambar ? 
                            `<img src="${barang.gambar}" alt="${barang.nama}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 
                            `<div class="bg-light rounded d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                <i class="fas ${icon} text-muted"></i>
                            </div>`
                        }
                    </td>
                    <td>
                        <i class="fas ${icon} me-2 text-primary"></i>
                        ${barang.nama}
                    </td>
                    <td>${formatRupiah(barang.harga)}</td>
                    <td>
                        <span class="badge ${getBadgeColor(barang.kategori)}">
                            ${getCategoryName(barang.kategori)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-barang" data-id="${barang.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger hapus-barang" data-id="${barang.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
        
        // Event handler for edit product buttons
        $('.edit-barang').click(function() {
            const id = $(this).data('id');
            const barang = daftarBarang.find(b => b.id === id);
            
            if (barang) {
                editBarangId = id;
                $('#modalBarangTitle').text('Edit Barang');
                $('#namaBarang').val(barang.nama);
                $('#hargaBarang').val(barang.harga);
                $('#kategoriBarang').val(barang.kategori);
                
                if (barang.gambar) {
                    $('#imagePreview').html(`<img src="${barang.gambar}" alt="Preview">`);
                    gambarBarang = barang.gambar;
                } else {
                    $('#imagePreview').html('<span>Pratinjau gambar akan muncul di sini</span>');
                    gambarBarang = null;
                }
                
                $('#modalBarang').modal('show');
            }
        });
        
        // Event handler for delete product buttons
        $('.hapus-barang').click(async function() {
            const id = $(this).data('id');
            if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
                const berhasil = await hapusBarang(id);
                if (berhasil) {
                    muatDaftarBarang();
                    if ($('#tabTransaksi').hasClass('d-none') === false) {
                        muatBarangUntukTransaksi();
                    }
                }
            }
        });
    }

    // Function to load products for transaction
    function muatBarangUntukTransaksi() {
        const kataKunci = $('#cariBarang').val().toLowerCase();
        const kategoriFilter = $('.category-btn.active').data('category');
        
        let barangTersaring = daftarBarang;
        
        if (kataKunci) {
            barangTersaring = barangTersaring.filter(barang => 
                barang.nama.toLowerCase().includes(kataKunci)
            );
        }
        
        if (kategoriFilter && kategoriFilter !== 'semua') {
            barangTersaring = barangTersaring.filter(barang => 
                barang.kategori === kategoriFilter
            );
        }
        
        renderBarangUntukTransaksi(barangTersaring);
    }

    // Function to render products for transaction
    function renderBarangUntukTransaksi(daftarBarang) {
        const container = $('#daftarBarangTransaksi');
        container.empty();
        
        if (daftarBarang.length === 0) {
            container.append(`
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Tidak ada barang yang sesuai</p>
                    </div>
                </div>
            `);
            return;
        }
        
        daftarBarang.forEach(barang => {
            const icon = getIconByCategory(barang.kategori);
            const card = `
                <div class="col-md-4 mb-3">
                    <div class="product-card" data-id="${barang.id}">
                        <div class="product-image">
                            ${barang.gambar ? 
                                `<img src="${barang.gambar}" alt="${barang.nama}">` : 
                                `<div class="product-image-placeholder">
                                    <i class="fas ${icon}"></i>
                                </div>`
                            }
                        </div>
                        <div class="p-3">
                            <h5 class="card-title">${barang.nama}</h5>
                            <p class="card-text text-primary fw-bold">${formatRupiah(barang.harga)}</p>
                            <button class="btn btn-primary w-100 tambah-ke-keranjang">
                                <i class="fas fa-plus me-1"></i> Tambah
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.append(card);
        });
        
        // Event handler for add to cart buttons
        $('.tambah-ke-keranjang').click(function() {
            const id = $(this).closest('.product-card').data('id');
            tambahKeKeranjang(id);
        });
    }

    // Function to add product to cart
    function tambahKeKeranjang(id) {
        const barang = daftarBarang.find(b => b.id === id);
        
        if (barang) {
            const itemDiKeranjang = keranjang.find(item => item.id === id);
            
            if (itemDiKeranjang) {
                itemDiKeranjang.jumlah += 1;
                itemDiKeranjang.total = itemDiKeranjang.jumlah * itemDiKeranjang.harga;
            } else {
                keranjang.push({
                    id: barang.id,
                    nama: barang.nama,
                    harga: barang.harga,
                    jumlah: 1,
                    total: barang.harga
                });
            }
            
            renderKeranjang();
        }
    }

    // Function to render cart
    function renderKeranjang() {
        const container = $('#keranjang');
        container.empty();
        
        if (keranjang.length === 0) {
            container.append(`
                <div class="empty-state py-4">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Keranjang kosong</p>
                </div>
            `);
            $('#subtotalHarga').text(formatRupiah(0));
            $('#pajakHarga').text(formatRupiah(0));
            $('#totalHarga').text(formatRupiah(0));
            $('#jumlahItemKeranjang').text('0');
            $('#kembalian').text(formatRupiah(0));
            return;
        }
        
        keranjang.forEach(item => {
            const row = `
                <div class="cart-item">
                    <div>
                        <h6 class="mb-1">${item.nama}</h6>
                        <p class="mb-0 text-muted">${formatRupiah(item.harga)}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="btn btn-sm btn-outline-primary kurangi-item" data-id="${item.id}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="quantity-badge">${item.jumlah}</div>
                        <button class="btn btn-sm btn-outline-primary tambah-item" data-id="${item.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-2 hapus-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.append(row);
        });
        
        // Event handler for increase item buttons
        $('.tambah-item').click(function() {
            const id = $(this).data('id');
            tambahKeKeranjang(id);
        });
        
        // Event handler for decrease item buttons
        $('.kurangi-item').click(function() {
            const id = $(this).data('id');
            const item = keranjang.find(item => item.id === id);
            
            if (item) {
                if (item.jumlah > 1) {
                    item.jumlah -= 1;
                    item.total = item.jumlah * item.harga;
                } else {
                    keranjang = keranjang.filter(i => i.id !== id);
                }
                renderKeranjang();
            }
        });
        
        // Event handler for remove item buttons
        $('.hapus-item').click(function() {
            const id = $(this).data('id');
            keranjang = keranjang.filter(item => item.id !== id);
            renderKeranjang();
        });
        
        const totalHarga = hitungTotalKeranjang();
        const pajak = Math.round(totalHarga * 0.1);
        const subtotal = totalHarga - pajak;
        
        $('#subtotalHarga').text(formatRupiah(subtotal));
        $('#pajakHarga').text(formatRupiah(pajak));
        $('#totalHarga').text(formatRupiah(totalHarga));
        
        // Calculate item count
        const jumlahItem = keranjang.reduce((total, item) => total + item.jumlah, 0);
        $('#jumlahItemKeranjang').text(jumlahItem);
        
        // Update change
        hitungKembalian();
    }

    // Function to calculate cart total
    function hitungTotalKeranjang() {
        return keranjang.reduce((total, item) => total + item.total, 0);
    }

    // Function to calculate change
    function hitungKembalian() {
        const uangDibayar = parseInt($('#uangDibayar').val()) || 0;
        const totalHarga = hitungTotalKeranjang();
        const kembalian = uangDibayar - totalHarga;
        $('#kembalian').text(formatRupiah(kembalian >= 0 ? kembalian : 0));
    }

        // Function to display receipt
    function tampilkanStruk(totalHarga, uangDibayar, metodeBayar) {
        const strukContent = $('#strukContent');
        strukContent.empty();
        
        // Hapus header yang duplikat, gunakan header yang sudah ada di modal struk
        // Langsung tambahkan konten transaksi tanpa header tambahan

        // Tanggal
        const tanggal = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        strukContent.append(`<div class="struk-item"><span>Tanggal:</span><span>${tanggal}</span></div>`);
        strukContent.append(`<div class="struk-item"><span>Kasir:</span><span>Admin</span></div>`);
        
        // Barang
        strukContent.append('<div style="margin: 10px 0; border-top: 1px dashed #000;"></div>');
        keranjang.forEach(item => {
            strukContent.append(`
                <div class="struk-item">
                    <span>${item.nama}</span>
                    <span>${item.jumlah} x ${formatRupiah(item.harga)}</span>
                </div>
                <div class="struk-item">
                    <span></span>
                    <span>${formatRupiah(item.total)}</span>
                </div>
            `);
        });
        
        // Total, pembayaran, dan kembalian
        strukContent.append('<div style="margin: 10px 0; border-top: 1px dashed #000;"></div>');
        const pajak = Math.round(totalHarga * 0.1);
        const subtotal = totalHarga - pajak;
        
        strukContent.append(`<div class="struk-item"><span>Subtotal:</span><span>${formatRupiah(subtotal)}</span></div>`);
        strukContent.append(`<div class="struk-item"><span>Pajak (10%):</span><span>${formatRupiah(pajak)}</span></div>`);
        strukContent.append(`<div class="struk-item struk-total"><span>Total:</span><span>${formatRupiah(totalHarga)}</span></div>`);
        strukContent.append(`<div class="struk-item"><span>Bayar (${metodeBayar === 'cash' ? 'Cash' : 'Transfer'}):</span><span>${formatRupiah(uangDibayar)}</span></div>`);
        strukContent.append(`<div class="struk-item"><span>Kembalian:</span><span>${formatRupiah(uangDibayar - totalHarga)}</span></div>`);
        
        // Footer
        strukContent.append('<div style="margin: 10px 0; border-top: 1px dashed #000;"></div>');
        strukContent.append('<div class="text-center">Terima kasih atas kunjungan Anda</div>');
        
        $('#modalStruk').modal('show');
    }

    // Function to update product count
    function updateTotalBarang() {
        $('#totalBarangTersedia').text(daftarBarang.length);
    }

    // Function to update sales total
    function updateTotalPenjualan() {
        const today = new Date().toDateString();
        const totalHariIni = daftarPenjualan
            .filter(penjualan => penjualan.tanggal.toDateString() === today)
            .reduce((total, penjualan) => total + penjualan.totalHarga, 0);
        
        $('#totalPenjualanHariIni').text(formatRupiah(totalHariIni));
    }

    // Function to format currency
    function formatRupiah(angka) {
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Function to get icon by category
    function getIconByCategory(kategori) {
        switch(kategori) {
            case 'snack': return 'fa-cookie';
            case 'food': return 'fa-utensils';
            case 'drink': return 'fa-coffee';
            case 'menu-anak': return 'fa-child';
            case 'tambahan': return 'fa-plus-circle';
            default: return 'fa-box';
        }
    }

    // Function to get category display name
    function getCategoryName(kategori) {
        switch(kategori) {
            case 'snack': return 'Snack';
            case 'food': return 'Food';
            case 'drink': return 'Drink';
            case 'menu-anak': return 'Menu Anak';
            case 'tambahan': return 'Menu Tambahan';
            default: return kategori;
        }
    }

    // Function to get badge color by category
    function getBadgeColor(kategori) {
        switch(kategori) {
            case 'snack': return 'bg-warning';
            case 'food': return 'bg-success';
            case 'drink': return 'bg-info';
            case 'menu-anak': return 'bg-primary';
            case 'tambahan': return 'bg-secondary';
            default: return 'bg-light text-dark';
        }
    }
});
        
