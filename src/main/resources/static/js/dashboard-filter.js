// File: dashboard-filter.js

/**
 * Fungsi untuk mengupdate pilihan produk di dropdown filter
 * @param {Array} configs - List konfigurasi dari server
 */
function updateFilterDropdown(configs) {
    const selectFilter = document.getElementById('filterProductName');
    if (!selectFilter) return;

    // Simpan nilai yang sedang dipilih agar tidak hilang saat update
    const currentSelection = selectFilter.value;

    // Reset dropdown tapi sisakan "Semua Produk"
    selectFilter.innerHTML = '<option value="">Semua Produk</option>';

    if (configs && configs.length > 0) {
        configs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.productName;
            option.textContent = config.productName;
            selectFilter.appendChild(option);
        });
    }

    // Kembalikan nilai yang dipilih sebelumnya jika masih ada
    selectFilter.value = currentSelection;
}

/**
 * Logika utama untuk memfilter data tabel Log Error
 */
function applyLogFilter() {
    const productSelect = document.getElementById('filterProductName');
    const searchInput = document.getElementById('searchLogMessage');

    if (!productSelect || !searchInput) return;

    const selectedProduct = productSelect.value.toLowerCase();
    const searchText = searchInput.value.toLowerCase();

    // latestErrors diambil dari scope global (dashboard.js)
    const filteredData = latestErrors.filter(error => {
        // Cek filter produk
        const matchesProduct = selectedProduct === '' ||
            (error.productName && error.productName.toLowerCase() === selectedProduct);

        // Cek filter teks (message atau identifier)
        const messageMatch = error.message && error.message.toLowerCase().includes(searchText);
        const identifierMatch = error.identifier && error.identifier.toLowerCase().includes(searchText);
        const matchesSearch = searchText === '' || (messageMatch || identifierMatch);

        return matchesProduct && matchesSearch;
    });

    // Panggil fungsi render yang ada di dashboard.js
    populateLatestErrorsTable(filteredData);
}

/**
 * Menghubungkan event listener ke tombol-tombol filter
 */
function bindLogFilterEvents() {
    const btnSearch = document.getElementById('btnSearchLog');
    const btnReset = document.getElementById('btnResetFilter');

    if (btnSearch) {
        btnSearch.addEventListener('click', function () {
            applyLogFilter();
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', function () {
            document.getElementById('filterProductName').value = '';
            document.getElementById('searchLogMessage').value = '';
            // Render ulang data asli tanpa filter
            populateLatestErrorsTable(latestErrors);
        });
    }

    // Opsional: Tekan 'Enter' di input search langsung cari
    const searchInput = document.getElementById('searchLogMessage');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                applyLogFilter();
            }
        });
    }
}