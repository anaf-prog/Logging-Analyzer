// File utama (dashboard.js)
// Data latestErrors dari controller (Thymeleaf inline)
let latestErrors = [];
let monitorConfigs = [];

// Variabel untuk menyimpan callback delete
let pendingDeleteId = null;

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

// Memuat ulang data error terbaru dari API (GET /dashboard/api/latest-errors)
async function loadLatestErrors() {
    const response = await fetch('/dashboard/api/latest-errors');
    if (!response.ok) {
        throw new Error('Gagal memuat data log error terbaru');
    }

    latestErrors = await response.json();
    populateLatestErrorsTable(latestErrors);
}

async function fetchDataAndRenderCharts() {
    try {
        await loadLatestErrors();
    } catch (error) {
        console.error(error);
    }
}

// Panggil fungsi saat halaman dimuat
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
    fetchDataAndRenderCharts();
});

// Refresh data setiap 30 detik
setInterval(fetchDataAndRenderCharts, 30000);