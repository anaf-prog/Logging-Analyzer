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
    console.log('applyLogFilter dipanggil');

    const productSelect = document.getElementById('filterProductName');
    const searchInput = document.getElementById('searchLogMessage');

    if (!productSelect || !searchInput) return;

    const selectedProduct = productSelect.value.toLowerCase();
    const searchText = searchInput.value.toLowerCase();

    // Gunakan data dari variable global latestErrors
    const filteredData = latestErrors.filter(error => {
        const matchesProduct = selectedProduct === '' ||
            (error.productName && error.productName.toLowerCase() === selectedProduct);
        const messageMatch = error.message && error.message.toLowerCase().includes(searchText);
        const identifierMatch = error.identifier && error.identifier.toLowerCase().includes(searchText);
        const matchesSearch = searchText === '' || (messageMatch || identifierMatch);
        return matchesProduct && matchesSearch;
    });

    console.log('Filtered data length:', filteredData.length);

    // Tampilkan data yang sudah difilter
    populateLatestErrorsTable(filteredData);

    // Render ulang pagination untuk data yang difilter
    if (typeof renderPagination === 'function') {
        const pageSize = 10;
        const totalPagesData = Math.max(1, Math.ceil(filteredData.length / pageSize));

        const fakePageData = {
            number: 0,
            totalPages: totalPagesData,
            first: filteredData.length === 0,
            last: filteredData.length <= pageSize,
            size: pageSize,
            totalElements: filteredData.length
        };

        renderPagination(fakePageData);
    }

    // Tandai bahwa filter sedang aktif (akan dipakai oleh auto refresh)
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