// File: dashboard-filter.js

/**
 * Fungsi untuk mengupdate pilihan produk di dropdown filter
 */
function updateFilterDropdown(configs) {
    const selectFilter = document.getElementById('filterProductName');
    if (!selectFilter) return;

    const currentSelection = selectFilter.value;
    selectFilter.innerHTML = '<option value="">Semua Produk</option>';

    if (configs && configs.length > 0) {
        configs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.productName;
            option.textContent = config.productName;
            selectFilter.appendChild(option);
        });
    }

    selectFilter.value = currentSelection;
}

/**
 * Logika utama untuk memfilter data tabel Log Error
 */
function applyLogFilter() {
    console.log('applyLogFilter dipanggil - memicu reload server-side');

    // Langsung panggil loadLatestErrors(0, 10)
    // Fungsi ini di dashboard.js akan mengambil nilai filter sendiri dari dropdown/input
    if (typeof loadLatestErrors === 'function') {
        loadLatestErrors(0, 10);
    }

    // Tandai bahwa filter sedang aktif (untuk auto refresh)
    if (typeof window.isFilterActive !== 'undefined') {
        window.isFilterActive = true;
    }
}

/**
 * Reset semua filter
 */
function resetLogFilter() {
    console.log('resetLogFilter dipanggil');

    const productSelect = document.getElementById('filterProductName');
    const searchInput = document.getElementById('searchLogMessage');

    if (productSelect) productSelect.value = '';
    if (searchInput) searchInput.value = '';

    // Tandai filter tidak aktif
    if (typeof window.isFilterActive !== 'undefined') {
        window.isFilterActive = false;
    }

    // Kembalikan ke data normal dari API
    if (typeof loadLatestErrors === 'function') {
        loadLatestErrors(0, 10);
    }
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
            resetLogFilter();
        });
    }

    const searchInput = document.getElementById('searchLogMessage');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                applyLogFilter();
            }
        });
    }
}