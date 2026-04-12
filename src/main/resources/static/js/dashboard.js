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

/**
 * Mengisi tabel konfigurasi monitor dengan data dari server
 * Juga membuat tombol aksi (Scan, Edit, Hapus) untuk setiap baris
 */
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
        actionCell.className = 'text-nowrap';

        const btnContainer = document.createElement('div');
        btnContainer.className = 'd-flex flex-wrap gap-2';

        const scanButton = document.createElement('button');
        scanButton.type = 'button';
        scanButton.className = 'btn btn-sm btn-outline-success';
        scanButton.textContent = 'Scan Sekarang';
        scanButton.addEventListener('click', async function () {
            try {
                showFormMessage(`Menjalankan scan log untuk ${config.productName || 'produk'}...`);
                await triggerScan();
                await loadLatestErrors();
                showFormMessage(`Scan log untuk ${config.productName || 'produk'} selesai dijalankan.`);
            } catch (error) {
                showFormMessage(error.message, true);
            }
        });

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

        btnContainer.appendChild(scanButton);
        btnContainer.appendChild(editButton);
        btnContainer.appendChild(deleteButton);

        actionCell.appendChild(btnContainer);
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

// Mengisi data awal konfigurasi monitor dari server 
function initMonitorConfigsFromServer(serverData) {
    if (serverData && Array.isArray(serverData)) {
        monitorConfigs = serverData;
        populateMonitorConfigsTable(monitorConfigs);
    } else {
        monitorConfigs = [];
        populateMonitorConfigsTable(monitorConfigs);
    }
}

/**
 * Memuat ulang data konfigurasi monitor dari API (GET /api/monitor-configs)
 * Digunakan setelah create/update/delete untuk refresh tabel
 */
async function loadMonitorConfigs() {
    const response = await fetch('/api/monitor-configs');
    if (!response.ok) {
        throw new Error('Gagal memuat konfigurasi monitor');
    }

    monitorConfigs = await response.json();
    populateMonitorConfigsTable(monitorConfigs);
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

// Menyimpan konfigurasi monitor baru ke server (POST /api/monitor-configs)
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

// Memperbarui konfigurasi monitor yang sudah ada di server (PUT /api/monitor-configs/{id})
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

// Menghapus konfigurasi monitor (munculkan dialog konfirmasi dulu, lalu DELETE ke server)
async function deleteMonitorConfig(id) {
    const config = monitorConfigs.find(c => c.id === id);
    const productName = config?.productName || 'konfigurasi ini';

    showConfirmDialog(`Yakin ingin menghapus konfigurasi ${productName}?`, async () => {
        try {
            const response = await fetch(`/api/monitor-configs/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Gagal menghapus konfigurasi monitor');
            }

            await loadMonitorConfigs();
            showFormMessage(`Konfigurasi ${productName} berhasil dihapus.`);
        } catch (error) {
            showFormMessage(error.message, true);
        }
    });
}

// Mengosongkan/mereset form tambah/edit konfigurasi monitor
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

// Mengisi form dengan data konfigurasi yang akan diedit (mode edit)
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

//  Menjalankan scan log secara manual (POST /log/scan)
async function triggerScan() {
    const response = await fetch('/log/scan', {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error('Gagal menjalankan scan');
    }

    return response.text();
}

// Submit form (create/update) dan tombol batal edit
function bindMonitorConfigForm() {
    const form = document.getElementById('monitorConfigForm');
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