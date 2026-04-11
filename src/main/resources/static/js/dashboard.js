// Data latestErrors dari controller (Thymeleaf inline)
let latestErrors = [];
let monitorConfigs = [];

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

function populateMonitorConfigsTable(configs) {
    const tableBody = document.getElementById('monitorConfigsTableBody');
    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = '';

    if (!configs || configs.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7;
        cell.textContent = 'Belum ada konfigurasi monitor';
        cell.className = 'text-center text-muted';
        return;
    }

    configs.forEach(config => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = config.productName || '-';
        row.insertCell().textContent = config.path || '-';
        row.insertCell().textContent = config.responseFormat || '-';
        row.insertCell().textContent = config.codeField || '-';
        row.insertCell().textContent = config.rcField || '-';
        row.insertCell().textContent = config.enabled ? 'Aktif' : 'Nonaktif';

        const actionCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn btn-sm btn-outline-primary me-2';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', function () {
            startEditMonitorConfig(config);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn-sm btn-outline-danger';
        deleteButton.textContent = 'Hapus';
        deleteButton.addEventListener('click', function () {
            deleteMonitorConfig(config.id);
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
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

function initMonitorConfigsFromServer(serverData) {
    if (serverData && Array.isArray(serverData)) {
        monitorConfigs = serverData;
        populateMonitorConfigsTable(monitorConfigs);
    } else {
        monitorConfigs = [];
        populateMonitorConfigsTable(monitorConfigs);
    }
}

function showFormMessage(message, isError = false) {
    const messageElement = document.getElementById('configFormMessage');
    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className = isError ? 'small text-danger' : 'small text-success';
}

async function loadMonitorConfigs() {
    const response = await fetch('/api/monitor-configs');
    if (!response.ok) {
        throw new Error('Gagal memuat konfigurasi monitor');
    }

    monitorConfigs = await response.json();
    populateMonitorConfigsTable(monitorConfigs);
}

async function loadLatestErrors() {
    const response = await fetch('/dashboard/api/latest-errors');
    if (!response.ok) {
        throw new Error('Gagal memuat data log error terbaru');
    }

    latestErrors = await response.json();
    populateLatestErrorsTable(latestErrors);
}

async function createMonitorConfig(payload) {
    const response = await fetch('/api/monitor-configs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Gagal menyimpan konfigurasi monitor');
    }

    return response.json();
}

async function updateMonitorConfig(id, payload) {
    const response = await fetch(`/api/monitor-configs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Gagal memperbarui konfigurasi monitor');
    }

    return response.json();
}

async function deleteMonitorConfig(id) {
    if (!confirm('Hapus konfigurasi monitor ini?')) {
        return;
    }

    const response = await fetch(`/api/monitor-configs/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        alert('Gagal menghapus konfigurasi monitor');
        return;
    }

    await loadMonitorConfigs();
}

function resetMonitorConfigForm() {
    const form = document.getElementById('monitorConfigForm');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const saveConfigButton = document.getElementById('saveConfigButton');

    if (!form) {
        return;
    }

    form.reset();
    form.configId.value = '';
    form.codeField.value = '';
    form.rcField.value = '';

    if (cancelEditButton) {
        cancelEditButton.classList.add('d-none');
    }

    if (saveConfigButton) {
        saveConfigButton.textContent = 'Simpan Konfigurasi';
    }
}

function startEditMonitorConfig(config) {
    const form = document.getElementById('monitorConfigForm');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const saveConfigButton = document.getElementById('saveConfigButton');

    if (!form) {
        return;
    }

    form.configId.value = config.id || '';
    form.productName.value = config.productName || '';
    form.path.value = config.path || '';
    form.responseFormat.value = config.responseFormat || 'JSON';
    form.codeField.value = config.codeField || '';
    form.rcField.value = config.rcField || '';

    if (cancelEditButton) {
        cancelEditButton.classList.remove('d-none');
    }

    if (saveConfigButton) {
        saveConfigButton.textContent = 'Update Konfigurasi';
    }
}

async function triggerScan() {
    const response = await fetch('/log/scan', {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error('Gagal menjalankan scan');
    }

    return response.text();
}

function bindMonitorConfigForm() {
    const form = document.getElementById('monitorConfigForm');
    const scanNowButton = document.getElementById('scanNowButton');
    const cancelEditButton = document.getElementById('cancelEditButton');

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            const payload = {
                productName: form.productName.value.trim(),
                path: form.path.value.trim(),
                responseFormat: form.responseFormat.value,
                codeField: form.codeField.value.trim(),
                rcField: form.rcField.value.trim()
            };

            try {
                if (form.configId.value) {
                    await updateMonitorConfig(form.configId.value, payload);
                    showFormMessage('Konfigurasi monitor berhasil diperbarui.');
                } else {
                    await createMonitorConfig(payload);
                    showFormMessage('Konfigurasi monitor berhasil disimpan.');
                }
                resetMonitorConfigForm();
                await loadMonitorConfigs();
            } catch (error) {
                showFormMessage(error.message, true);
            }
        });
    }

    if (scanNowButton) {
        scanNowButton.addEventListener('click', async function () {
            try {
                showFormMessage('Menjalankan scan log...');
                await triggerScan();
                await loadLatestErrors();
                showFormMessage('Scan log selesai dijalankan.');
            } catch (error) {
                showFormMessage(error.message, true);
            }
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', function () {
            resetMonitorConfigForm();
            showFormMessage('Mode edit dibatalkan.');
        });
    }
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
    fetchDataAndRenderCharts();
});

// Refresh data setiap 30 detik
setInterval(fetchDataAndRenderCharts, 30000);
