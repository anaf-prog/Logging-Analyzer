// response-config-ui.js
class ResponseConfigUI {
    constructor(manager, codeMirrorInstance = null) {
        this.manager = manager;
        this.codeMirror = codeMirrorInstance;
        this.modals = {};
        this.initElements();
    }

    initElements() {
        this.elements = {
            tableBody: document.getElementById('responseConfigsTableBody'),
            form: document.getElementById('responseConfigForm'),
            configId: document.getElementById('responseConfigId'),
            name: document.getElementById('responseName'),
            format: document.getElementById('responseFormat'),
            description: document.getElementById('responseDescription'),
            template: document.getElementById('responseTemplate'),
            cancelBtn: document.getElementById('cancelResponseEditButton'),
            saveBtn: document.getElementById('saveResponseConfigButton'),
            messageEl: document.getElementById('responseConfigMessage'),
            testBtn: document.getElementById('testResponseButton'),
            confirmDeleteBtn: document.getElementById('confirmDeleteResponseConfigButton'),
            executeTestBtn: document.getElementById('executeTestButton'),
            exampleJsonBtn: document.getElementById('exampleJsonBtn'),
            exampleXmlBtn: document.getElementById('exampleXmlBtn'),
            copyJsonBtn: document.getElementById('copyJsonExampleBtn'),
            copyXmlBtn: document.getElementById('copyXmlExampleBtn')
        };
    }

    renderTable(configs) {
        if (!this.elements.tableBody) return;

        this.elements.tableBody.innerHTML = '';

        if (!configs || configs.length === 0) {
            const row = this.elements.tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'Belum ada konfigurasi response';
            cell.className = 'text-center text-muted';
            return;
        }

        configs.forEach(config => {
            const row = this.elements.tableBody.insertRow();
            row.insertCell().textContent = config.name || '-';
            row.insertCell().innerHTML = `<span class="badge bg-${config.format === 'JSON' ? 'primary' : 'success'}">${config.format}</span>`;
            
            // Kolom Format Response dengan ikon file
            const formatResponseCell = row.insertCell();
            formatResponseCell.className = 'text-center';
            const formatResponseBtn = document.createElement('button');
            formatResponseBtn.className = 'btn btn-sm btn-outline-info';
            formatResponseBtn.innerHTML = '<i class="bi bi-file-text"></i> Lihat';
            formatResponseBtn.title = 'Lihat Format Response';
            formatResponseBtn.onclick = () => this.openFormatResponseModal(config);
            formatResponseCell.appendChild(formatResponseBtn);
            
            row.insertCell().textContent = config.description || '-';
            row.insertCell().textContent = config.createdAt ? new Date(config.createdAt).toLocaleDateString() : '-';
            row.insertCell().textContent = config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : '-';

            const actionCell = row.insertCell();
            actionCell.className = 'text-nowrap';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary me-2';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => this.startEdit(config);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.textContent = 'Hapus';
            deleteBtn.onclick = () => this.openDeleteModal(config);

            actionCell.appendChild(editBtn);
            actionCell.appendChild(deleteBtn);
        });
    }

    resetForm() {
        if (!this.elements.form) return;

        this.elements.configId.value = '';
        this.elements.name.value = '';
        this.elements.format.value = 'JSON';
        this.elements.description.value = '';
        
        if (this.codeMirror) {
            this.codeMirror.setValue('');
            this.codeMirror.setOption("mode", "application/json");
        }

        if (this.elements.cancelBtn) this.elements.cancelBtn.classList.add('d-none');
        if (this.elements.saveBtn) this.elements.saveBtn.textContent = 'Simpan Config';

        this.manager.setCurrentEditing(null);
    }

    startEdit(config) {
        if (!this.elements.form) return;

        this.elements.configId.value = config.id;
        this.elements.name.value = config.name;
        this.elements.format.value = config.format;
        this.elements.description.value = config.description || '';
        
        if (this.codeMirror) {
            this.codeMirror.setValue(config.template);
            const mode = config.format === 'JSON' ? "application/json" : "application/xml";
            this.codeMirror.setOption("mode", mode);
        }

        if (this.elements.cancelBtn) this.elements.cancelBtn.classList.remove('d-none');
        if (this.elements.saveBtn) this.elements.saveBtn.textContent = 'Update Config';

        this.manager.setCurrentEditing(config);
        this.showMessage('Mode edit: ' + config.name);
    }

    showMessage(message, isError = false) {
        if (!this.elements.messageEl) return;

        this.elements.messageEl.textContent = message;
        this.elements.messageEl.className = `mt-2 small ${isError ? 'text-danger' : 'text-success'}`;

        setTimeout(() => {
            if (this.elements.messageEl.textContent === message) {
                this.elements.messageEl.textContent = '';
                this.elements.messageEl.className = 'mt-2 small';
            }
        }, 5000);
    }

    openDeleteModal(config) {
        this.manager.setDeleteTarget(config);
        const nameEl = document.getElementById('deleteResponseConfigName');
        if (nameEl) nameEl.textContent = config.name;

        if (!this.modals.deleteModal) {
            const modalEl = document.getElementById('deleteResponseConfigModal');
            this.modals.deleteModal = new bootstrap.Modal(modalEl);
        }
        this.modals.deleteModal.show();
    }

    openTestModal() {
        if (!this.modals.testModal) {
            const modalEl = document.getElementById('testResponseModal');
            this.modals.testModal = new bootstrap.Modal(modalEl);
        }

        const sampleDataInput = document.getElementById('sampleDataInput');
        if (sampleDataInput && !sampleDataInput.value) {
            sampleDataInput.value = JSON.stringify({
                timestamp: Date.now(),
                status: "success",
                message: "Test message",
                data: { id: 1, name: "example" }
            }, null, 2);
        }

        this.modals.testModal.show();
    }

    openExampleJsonModal() {
        const modalEl = document.getElementById('exampleJsonModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    openExampleXmlModal() {
        const modalEl = document.getElementById('exampleXmlModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    openFormatResponseModal(config) {
        if (!this.modals.formatResponseModal) {
            const modalEl = document.getElementById('formatResponseModal');
            this.modals.formatResponseModal = new bootstrap.Modal(modalEl);
        }

        // Set data modal
        const nameEl = document.getElementById('formatResponseName');
        const typeEl = document.getElementById('formatResponseType');
        const templateEl = document.getElementById('formatResponseTemplate');
        
        if (nameEl) nameEl.textContent = config.name;
        if (typeEl) {
            typeEl.textContent = config.format;
            typeEl.className = `badge bg-${config.format === 'JSON' ? 'primary' : 'success'}`;
        }
        if (templateEl) templateEl.textContent = config.template;

        this.modals.formatResponseModal.show();
    }

    getFormData() {
        return {
            name: this.elements.name?.value.trim(),
            format: this.elements.format?.value,
            template: this.codeMirror ? this.codeMirror.getValue() : this.elements.template?.value,
            description: this.elements.description?.value
        };
    }

    closeDeleteModal() {
        if (this.modals.deleteModal) {
            this.modals.deleteModal.hide();
        }
    }
}