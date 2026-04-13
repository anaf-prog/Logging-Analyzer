// File pecahan: dashboard-monitor.js
// Berisi semua fungsi yang berkaitan dengan manajemen konfigurasi monitor

// Mengisi data awal konfigurasi monitor dari server 
function initMonitorConfigsFromServer(serverData) {
    if (serverData && Array.isArray(serverData)) {
        monitorConfigs = serverData;
        populateMonitorConfigsTable(monitorConfigs);

        if (typeof updateFilterDropdown === 'function') {
            updateFilterDropdown(monitorConfigs);
        }
        
    } else {
        monitorConfigs = [];
        populateMonitorConfigsTable(monitorConfigs);
    }
}

/**
 * Mengisi tabel konfigurasi monitor dengan data dari server
 * Kolom disesuaikan menjadi 9 kolom sesuai header HTML
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
        cell.colSpan = 9; // Sesuaikan menjadi 9 sesuai jumlah th
        cell.textContent = 'Belum ada konfigurasi monitor';
        cell.className = 'text-center text-muted';
        return;
    }

    configs.forEach(config => {
        const row = tableBody.insertRow();

        // 1. Nama Produk
        row.insertCell().textContent = config.productName || '-';

        // 2. Path (Gunakan title untuk hover agar path lengkap tetap bisa dibaca)
        const pathCell = row.insertCell();
        pathCell.textContent = config.path || '-';
        pathCell.title = config.path || '';

        // 3. Format
        row.insertCell().textContent = config.responseFormat || '-';

        // 4. JSON Prefix
        row.insertCell().textContent = config.jsonPrefix || '-';

        // 5. XML Wrapper
        row.insertCell().textContent = config.xmlWrapperTag || '-';

        // 6. Skip Code
        row.insertCell().textContent = config.codeField || '-';

        // 7. Skip RC
        row.insertCell().textContent = config.rcField || '-';

        // 8. Status (Gunakan class status-aktif yang kita buat di CSS)
        const statusCell = row.insertCell();
        statusCell.textContent = config.enabled ? 'Aktif' : 'Nonaktif';
        if (config.enabled) statusCell.className = 'status-aktif';

        // 9. Aksi
        const actionCell = row.insertCell();
        actionCell.className = 'text-nowrap';

        const btnContainer = document.createElement('div');
        btnContainer.className = 'd-flex flex-wrap gap-2 btn-action-group';

        // Tombol Scan
        const scanButton = document.createElement('button');
        scanButton.type = 'button';
        scanButton.className = 'btn btn-sm btn-outline-success';
        scanButton.textContent = 'Scan'; // Dipendekkan agar hemat tempat
        scanButton.addEventListener('click', async function () {
            try {
                showFormMessage(`Menjalankan scan log untuk ${config.productName || 'produk'}...`);
                await triggerScan();
                await loadLatestErrors();
                showFormMessage(`Scan log untuk ${config.productName || 'produk'} selesai.`);
            } catch (error) {
                showFormMessage(error.message, true);
            }
        });

        // Tombol Edit
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn btn-sm btn-outline-primary';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', function () {
            startEditMonitorConfig(config);
        });

        // Tombol Hapus
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
    form.jsonPrefix.value = '';
    form.xmlWrapperTag.value = '';

    form.responseFormat.dispatchEvent(new Event('change'));

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
    form.jsonPrefix.value = config.jsonPrefix || '';
    form.xmlWrapperTag.value = config.xmlWrapperTag || '';

    form.responseFormat.dispatchEvent(new Event('change'));

    if (cancelEditButton) {
        cancelEditButton.classList.remove('d-none');
    }

    if (saveConfigButton) {
        saveConfigButton.textContent = 'Update Konfigurasi';
    }
}

// Menjalankan scan log secara manual (POST /log/scan)
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
                rcField: form.rcField.value.trim(),
                jsonPrefix: form.jsonPrefix.value.trim(),
                xmlWrapperTag: form.xmlWrapperTag.value.trim()
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