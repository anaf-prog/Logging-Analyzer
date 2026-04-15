// File utama (dashboard.js)

// Data latestErrors dari controller (Thymeleaf inline)
let latestErrors = [];

let monitorConfigs = [];

// Variabel untuk menyimpan callback delete
let pendingDeleteId = null;

// Track apakah filter sedang aktif
let isFilterActive = false;

// Fungsi untuk format waktu
function formatTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Fungsi untuk mengisi tabel latest errors
function populateLatestErrorsTable(errors) {
    const tableBody = document.getElementById('latestErrorsTableBody');
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }

    tableBody.innerHTML = '';

    if (!errors || errors.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'Tidak ada data error';
        cell.className = 'text-center';
        return;
    }

    errors.forEach(error => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = error.productName || '-';
        row.insertCell().textContent = error.level || '-';
        row.insertCell().textContent = error.logTime ? new Date(error.logTime).toLocaleString('id-ID') : '-';
        row.insertCell().textContent = error.message || '-';
        row.insertCell().textContent = error.identifier || '-';
    });
}

// Inisialisasi data dari server (Thymeleaf)
function initDataFromServer(serverData) {
    if (serverData && Array.isArray(serverData)) {
        latestErrors = serverData;
        console.log('Data initialized:', latestErrors.length, 'errors');
        populateLatestErrorsTable(latestErrors);
    } else {
        latestErrors = [];
    }
}

// ========== FUNGSI CEK STATUS FILTER ==========
function checkFilterStatus() {
    const productSelect = document.getElementById('filterProductName');
    const searchInput = document.getElementById('searchLogMessage');

    const isProductFilter = productSelect && productSelect.value !== '';
    const isSearchFilter = searchInput && searchInput.value !== '';

    isFilterActive = isProductFilter || isSearchFilter;

    return isFilterActive;
}

// ========== FUNGSI AUTO REFRESH YANG AMAN ==========
async function autoRefreshData() {
    // Cek apakah filter sedang aktif
    if (checkFilterStatus()) {
        console.log('Auto refresh dilewati karena filter aktif');
        return;  // Jangan lakukan apa-apa kalau filter aktif
    }

    console.log('Auto refresh berjalan, memuat halaman:', currentActivePage);
    await loadLatestErrors(currentActivePage, 10);
}

function resetFilter() {
    document.getElementById('filterProductName').value = '';
    document.getElementById('searchLogMessage').value = '';

    // Reset flag filter
    isFilterActive = false;

    // Render ulang data asli
    if (typeof loadLatestErrors === 'function') {
        loadLatestErrors(currentActivePage || 0, 10);
    }
}

// Memuat ulang data error terbaru dari API (GET /dashboard/api/latest-errors)
async function loadLatestErrors(page = 0, size = 10) {
    const pageNum = parseInt(page);
    const validatedPage = isNaN(pageNum) ? 0 : pageNum;

    currentActivePage = validatedPage;

    try {
        const response = await fetch(`/dashboard/api/latest-errors?page=${validatedPage}&size=${size}`);
        if (!response.ok) {
            throw new Error('Gagal memuat data log error terbaru');
        }

        const data = await response.json();
        console.log('RESPONSE API:', data);

        const pageInfo = data.page || {};

        const normalizedData = {
            content: data.content || [],
            totalPages: pageInfo.totalPages || 0,
            number: pageInfo.number || 0,
            first: pageInfo.first || false,
            last: pageInfo.last || false,
            size: pageInfo.size || size,
            totalElements: pageInfo.totalElements || 0
        };

        console.log('Normalized data:', normalizedData);

        // Simpan data lengkap untuk pagination
        latestErrorsPageData = normalizedData;
        // Simpan data content (array) ke latestErrors agar filter tidak pecah
        latestErrors = normalizedData.content;

        // Render tabel dengan data content
        populateLatestErrorsTable(latestErrors);

        // Render pagination dengan data yang sudah dinormalisasi
        renderPagination(normalizedData);

    } catch (error) {
        console.error('Error loading errors:', error);
    }
}

async function fetchDataAndRenderCharts() {
    try {
        // Cek jika sedang dalam mode filter
        const isFilterActiveNow = checkFilterStatus();

        if (isFilterActiveNow) {
            console.log('Filter aktif, refresh dilewati');
            return;  // JANGAN refresh kalau filter aktif
        }

        // Jika tidak filter, load halaman biasa
        await loadLatestErrors(currentActivePage, 10);

    } catch (error) {
        console.error('Error di fetchDataAndRenderCharts:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing dashboard...');

    if (typeof window.serverLatestErrors !== 'undefined' && window.serverLatestErrors) {
        initDataFromServer(window.serverLatestErrors);
    } else if (typeof serverLatestErrors !== 'undefined') {
        initDataFromServer(serverLatestErrors);
    } else {
        initDataFromServer([]);
    }

    if (typeof window.serverMonitorConfigs !== 'undefined' && window.serverMonitorConfigs) {
        initMonitorConfigsFromServer(window.serverMonitorConfigs);
    } else {
        initMonitorConfigsFromServer([]);
    }

    bindMonitorConfigForm();
    resetMonitorConfigForm();
    bindLogFilterEvents();

    // Load data awal
    setTimeout(() => {
        loadLatestErrors(0, 10);
    }, 100);
});

setInterval(autoRefreshData, 5000);