// monitor-ui.js
// Kelas untuk manajemen UI dan Modal

class MonitorUI {
    constructor(core, api) {
        this.core = core;
        this.api = api;
        this.deleteModal = null;
        this.testResponseModal = null;
        this.responsePreviewModal = null;
        this.onConfigSavedCallback = null;
        this.onConfigDeletedCallback = null;
    }

    setCallbacks(onSaved, onDeleted) {
        this.onConfigSavedCallback = onSaved;
        this.onConfigDeletedCallback = onDeleted;
    }

    initModals() {
        const deleteModalEl = document.getElementById('deleteModal');
        const testModalEl = document.getElementById('testResponseModal');
        const previewModalEl = document.getElementById('responsePreviewModal');
        
        if (deleteModalEl) {
            this.deleteModal = new bootstrap.Modal(deleteModalEl);
        }
        if (testModalEl) {
            this.testResponseModal = new bootstrap.Modal(testModalEl);
        }
        if (previewModalEl) {
            this.responsePreviewModal = new bootstrap.Modal(previewModalEl);
        }
    }

    initCodeMirror() {
        const textarea = document.getElementById('responseTemplate');
        if (textarea && !this.core.getCodeMirror()) {
            const cm = CodeMirror.fromTextArea(textarea, {
                lineNumbers: true,
                mode: "application/json",
                theme: "monokai",
                autoCloseBrackets: true,
                matchBrackets: true,
                indentUnit: 2,
                lineWrapping: true
            });

            // Auto-format on paste
            cm.on('paste', (cmInstance, event) => {
                const pastedText = event.clipboardData?.getData('text');
                if (!pastedText) return;
                event.preventDefault();

                const format = document.getElementById('responseFormat')?.value || 'JSON';
                let formatted = pastedText;

                try {
                    if (format === 'JSON') {
                        const parsed = JSON.parse(pastedText);
                        formatted = JSON.stringify(parsed, null, 2);
                    }
                } catch (e) {
                    formatted = pastedText;
                }

                cmInstance.replaceSelection(formatted);
            });

            this.core.setCodeMirror(cm);
        }
    }

    showDeleteModal(id, name) {
        document.getElementById('deleteConfigName').textContent = name;
        document.getElementById('confirmDeleteButton').dataset.id = id;
        this.deleteModal?.show();
    }

    async confirmDelete() {
        const id = document.getElementById('confirmDeleteButton').dataset.id;
        const result = await this.api.deleteConfig(id);
        
        if (result.success && this.onConfigDeletedCallback) {
            this.onConfigDeletedCallback();
            this.deleteModal?.hide();
        }
    }

    showResponsePreview(productName, rawTemplate) {
        let responseTemplate = this.core.decodeTemplate(rawTemplate);
        
        const productNameEl = document.getElementById('responsePreviewProductName');
        const contentEl = document.getElementById('responsePreviewContent');
        
        if (productNameEl) productNameEl.textContent = productName;
        if (contentEl) contentEl.value = responseTemplate;
        
        this.responsePreviewModal?.show();
    }

    openTestModal() {
        this.testResponseModal?.show();
        document.getElementById('testResult').value = '';
    }

    async runTest() {
        const format = document.getElementById('responseFormat').value;
        const template = this.core.getTemplateValue();
        const sampleDataText = document.getElementById('testSampleData').value;
        const resultElement = document.getElementById('testResult');

        try {
            const sampleData = JSON.parse(sampleDataText);
            const testResult = await this.api.testResponse(format, template, sampleData);
            
            if (resultElement) {
                resultElement.value = testResult.success ? testResult.result : 'Error: ' + testResult.error;
            }
        } catch (error) {
            if (resultElement) {
                resultElement.value = 'Error: ' + error.message;
            }
        }
    }

    setExampleJson() {
        const example = this.core.getExampleJson();
        this.core.setTemplateValue(JSON.stringify(example, null, 2));
        document.getElementById('responseFormat').value = 'JSON';
        this.core.updateCodeMirrorMode('JSON');
    }

    setExampleXml() {
        const example = this.core.getExampleXml();
        this.core.setTemplateValue(example);
        document.getElementById('responseFormat').value = 'XML';
        this.core.updateCodeMirrorMode('XML');
    }

    updateTable(configs) {
        const tbody = document.getElementById('monitorConfigsTableBody');
        
        if (!configs || configs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada konfigurasi monitor</td></tr>';
            return;
        }

        tbody.innerHTML = configs.map(config => `
            <tr>
                <td>${this.escapeHtml(config.productName)}</td>
                <td>${this.escapeHtml(config.responseName)}</td>
                <td>
                    <span class="badge ${config.responseFormat === 'JSON' ? 'bg-success' : 'bg-info'}">
                        ${config.responseFormat}
                    </span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-secondary response-preview-btn"
                            data-product-name="${this.escapeHtml(config.productName)}"
                            data-response-template="${this.core.encodeTemplate(config.responseTemplate || '')}">
                        <i class="bi bi-file-earmark-text"></i>
                    </button>
                </td>
                <td>
                    ${config.sshConfig ? `<span class="badge bg-secondary">${this.escapeHtml(config.sshConfig.name)}</span>` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    <span class="badge ${config.enabled ? 'bg-success' : 'bg-danger'}">
                        ${config.enabled ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${new Date(config.createdAt).toLocaleString('id-ID')}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary edit-btn"
                                data-id="${config.id}"
                                data-product-name="${this.escapeHtml(config.productName)}"
                                data-log-path="${this.escapeHtml(config.logPath)}"
                                data-response-format="${config.responseFormat}"
                                data-code-field="${this.escapeHtml(config.codeField || '')}"
                                data-rc-field="${this.escapeHtml(config.rcField || '')}"
                                data-success-codes="${this.escapeHtml(config.successCodes || '0000,00')}"
                                data-json-prefix="${this.escapeHtml(config.jsonPrefix || '')}"
                                data-xml-wrapper-tag="${this.escapeHtml(config.xmlWrapperTag || '')}"
                                data-response-name="${this.escapeHtml(config.responseName)}"
                                data-response-description="${this.escapeHtml(config.responseDescription || '')}"
                                data-response-template="${this.core.encodeTemplate(config.responseTemplate || '')}"
                                data-ssh-config-id="${config.sshConfig ? config.sshConfig.id : ''}"
                                data-enabled="${config.enabled}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger delete-btn"
                                data-id="${config.id}"
                                data-name="${this.escapeHtml(config.productName)}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    scrollToForm() {
        document.getElementById('monitorConfigForm').scrollIntoView({ behavior: 'smooth' });
    }
}