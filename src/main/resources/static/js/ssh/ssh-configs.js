let sshConfigs = [];
let deleteSshConfigTarget = null;
let deleteSshConfigModal = null;
let sshTestStatusTimeoutId = null;
let sshTestMessageTimeoutId = null;
const DEFAULT_LOG_PATH = '/var/log/app.log';

const SSH_TEST_STATUS = {
    success: {
        label: 'Koneksi Berhasil',
        className: 'badge rounded-pill bg-success-subtle text-success-emphasis'
    },
    error: {
        label: 'Koneksi Gagal',
        className: 'badge rounded-pill bg-danger-subtle text-danger-emphasis'
    }
};

function showSshConfigMessage(message, isError = false) {
    const messageEl = document.getElementById('sshConfigMessage');
    if (!messageEl) {
        return;
    }

    if (sshTestMessageTimeoutId) {
        clearTimeout(sshTestMessageTimeoutId);
        sshTestMessageTimeoutId = null;
    }

    messageEl.textContent = message;
    messageEl.className = isError ? 'small text-danger' : 'small text-success';

    sshTestMessageTimeoutId = window.setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'small text-muted';
        sshTestMessageTimeoutId = null;
    }, 5000);
}

function setSshTestStatus(statusKey) {
    const badgeEl = document.getElementById('sshTestStatusBadge');
    if (!badgeEl) {
        return;
    }

    if (sshTestStatusTimeoutId) {
        clearTimeout(sshTestStatusTimeoutId);
        sshTestStatusTimeoutId = null;
    }

    if (!statusKey) {
        badgeEl.textContent = '';
        badgeEl.classList.add('d-none');
        return;
    }

    const status = SSH_TEST_STATUS[statusKey];
    if (!status) {
        badgeEl.textContent = '';
        badgeEl.classList.add('d-none');
        return;
    }

    badgeEl.textContent = status.label;
    badgeEl.className = status.className;
    badgeEl.classList.remove('d-none');
    sshTestStatusTimeoutId = window.setTimeout(() => {
        badgeEl.textContent = '';
        badgeEl.classList.add('d-none');
        sshTestStatusTimeoutId = null;
    }, 5000);
}

function openDeleteSshConfigModal(config) {
    const modalEl = document.getElementById('deleteSshConfigModal');
    const configNameEl = document.getElementById('deleteSshConfigName');
    if (!modalEl || !configNameEl || !window.bootstrap?.Modal) {
        return;
    }

    deleteSshConfigTarget = config;
    configNameEl.textContent = config?.name || '-';

    if (!deleteSshConfigModal) {
        deleteSshConfigModal = new window.bootstrap.Modal(modalEl);
    }
    deleteSshConfigModal.show();
}

function renderSshConfigsTable(configs) {
    const tableBody = document.getElementById('sshConfigsTableBody');
    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = '';

    if (!configs || configs.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = 'Belum ada konfigurasi SSH';
        cell.className = 'text-center text-muted';
        return;
    }

    configs.forEach(config => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = config.name || '-';
        row.insertCell().textContent = config.host || '-';
        row.insertCell().textContent = config.port || 22;
        row.insertCell().textContent = config.username || '-';

        const statusCell = row.insertCell();
        statusCell.textContent = config.enabled ? 'Aktif' : 'Nonaktif';
        statusCell.className = config.enabled ? 'text-success' : 'text-muted';

        const actionCell = row.insertCell();
        actionCell.className = 'text-nowrap';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn btn-sm btn-outline-primary me-2';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => startEditSshConfig(config));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn-sm btn-outline-danger';
        deleteButton.textContent = 'Hapus';
        deleteButton.addEventListener('click', () => openDeleteSshConfigModal(config));

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
    });
}

async function loadSshConfigs() {
    const response = await fetch('/api/ssh-configs');
    if (!response.ok) {
        throw new Error('Gagal memuat konfigurasi SSH');
    }
    sshConfigs = await response.json();
    renderSshConfigsTable(sshConfigs);
}

async function createSshConfig(payload) {
    const response = await fetch('/api/ssh-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Gagal menyimpan konfigurasi SSH');
    }

    return response.json();
}

async function updateSshConfig(id, payload) {
    const response = await fetch(`/api/ssh-configs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Gagal memperbarui konfigurasi SSH');
    }

    return response.json();
}

async function deleteSshConfig(id) {
    const response = await fetch(`/api/ssh-configs/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Gagal menghapus konfigurasi SSH');
    }
    await loadSshConfigs();
}

async function testSshConnection(payload) {
    const response = await fetch('/api/ssh-configs/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || 'Gagal test koneksi SSH');
    }

    return data;
}

function resetSshConfigForm() {
    const form = document.getElementById('sshConfigForm');
    const cancelButton = document.getElementById('cancelSshEditButton');
    const saveButton = document.getElementById('saveSshConfigButton');

    if (!form) {
        return;
    }

    form.reset();
    form.sshConfigId.value = '';
    form.port.value = 22;
    form.enabled.checked = true;
    form.dataset.existingLogPath = '';

    if (cancelButton) {
        cancelButton.classList.add('d-none');
    }
    if (saveButton) {
        saveButton.textContent = 'Simpan Config';
    }
    setSshTestStatus();
}

function startEditSshConfig(config) {
    const form = document.getElementById('sshConfigForm');
    const cancelButton = document.getElementById('cancelSshEditButton');
    const saveButton = document.getElementById('saveSshConfigButton');

    if (!form) {
        return;
    }

    form.sshConfigId.value = config.id || '';
    form.name.value = config.name || '';
    form.host.value = config.host || '';
    form.port.value = config.port || 22;
    form.username.value = config.username || '';
    form.password.value = config.password || '';
    form.sudoPassword.value = config.sudoPassword || '';
    form.dataset.existingLogPath = config.logPath || '';
    form.enabled.checked = !!config.enabled;

    if (cancelButton) {
        cancelButton.classList.remove('d-none');
    }
    if (saveButton) {
        saveButton.textContent = 'Update Config';
    }
    setSshTestStatus();
}

function bindSshConfigForm() {
    const form = document.getElementById('sshConfigForm');
    const cancelButton = document.getElementById('cancelSshEditButton');
    const testButton = document.getElementById('testSshConnectionButton');
    const confirmDeleteButton = document.getElementById('confirmDeleteSshConfigButton');

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            const payload = {
                name: form.name.value.trim(),
                host: form.host.value.trim(),
                port: Number(form.port.value || 22),
                username: form.username.value.trim(),
                password: form.password.value,
                sudoPassword: form.sudoPassword.value,
                logPath: (form.dataset.existingLogPath || DEFAULT_LOG_PATH),
                enabled: form.enabled.checked
            };

            try {
                if (form.sshConfigId.value) {
                    await updateSshConfig(form.sshConfigId.value, payload);
                    showSshConfigMessage('Konfigurasi SSH berhasil diperbarui.');
                } else {
                    await createSshConfig(payload);
                    showSshConfigMessage('Konfigurasi SSH berhasil disimpan.');
                }

                resetSshConfigForm();
                await loadSshConfigs();
            } catch (error) {
                showSshConfigMessage(error.message, true);
            }
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', function () {
            resetSshConfigForm();
            showSshConfigMessage('Mode edit dibatalkan.');
        });
    }

    if (form && testButton) {
        ['host', 'port', 'username', 'password'].forEach(fieldName => {
            const field = form[fieldName];
            if (field) {
                field.addEventListener('input', () => {
                    setSshTestStatus();
                    if (sshTestMessageTimeoutId) {
                        clearTimeout(sshTestMessageTimeoutId);
                        sshTestMessageTimeoutId = null;
                    }
                });
            }
        });

        testButton.addEventListener('click', async function () {
            const host = form.host.value.trim();
            const port = Number(form.port.value || 22);
            const username = form.username.value.trim();
            const password = form.password.value;

            if (!host || !username || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
                showSshConfigMessage(
                    'Untuk test koneksi, isi host, port (1-65535), username, dan password.',
                    true
                );
                setSshTestStatus('error');
                return;
            }

            try {
                testButton.disabled = true;
                testButton.textContent = 'Testing...';
                const result = await testSshConnection({ host, port, username, password });
                showSshConfigMessage(result?.message || 'Koneksi SSH berhasil.');
                setSshTestStatus('success');
            } catch (error) {
                showSshConfigMessage(error.message, true);
                setSshTestStatus('error');
            } finally {
                testButton.disabled = false;
                testButton.textContent = 'Test Koneksi';
            }
        });
    }

    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', async function () {
            if (!deleteSshConfigTarget?.id) {
                return;
            }

            try {
                confirmDeleteButton.disabled = true;
                await deleteSshConfig(deleteSshConfigTarget.id);
                deleteSshConfigModal?.hide();
                showSshConfigMessage('Konfigurasi SSH berhasil dihapus.');
            } catch (error) {
                showSshConfigMessage(error.message, true);
            } finally {
                confirmDeleteButton.disabled = false;
                deleteSshConfigTarget = null;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    sshConfigs = Array.isArray(window.serverSshConfigs) ? window.serverSshConfigs : [];
    renderSshConfigsTable(sshConfigs);
    bindSshConfigForm();
    setSshTestStatus();
});


