// response-configs.js (refactored)
let responseConfigManager = null;
let responseConfigUI = null;
let responseConfigHelper = null;
let responseCodeMirror = null;

function initCodeMirror() {
    const textarea = document.getElementById('responseTemplate');
    if (textarea && !responseCodeMirror) {
        responseCodeMirror = CodeMirror.fromTextArea(textarea, {
            lineNumbers: true,
            mode: "application/json",
            theme: "monokai",
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            lineWrapping: true
        });

        document.getElementById('responseFormat')?.addEventListener('change', function (e) {
            const mode = e.target.value === 'JSON' ? "application/json" : "application/xml";
            responseCodeMirror.setOption("mode", mode);
        });

        // ✅ Auto-format saat paste
        responseCodeMirror.on('paste', function(cm, event) {
            const pastedText = event.clipboardData?.getData('text');
            if (!pastedText) return;

            event.preventDefault();

            const format = document.getElementById('responseFormat')?.value || 'JSON';
            let formatted = pastedText;

            try {
                if (format === 'JSON') {
                    formatted = formatJsonTemplate(pastedText);
                } else {
                    formatted = formatXmlTemplate(pastedText);
                }
            } catch (e) {
                // Kalau gagal format, pakai teks asli
                formatted = pastedText;
            }

            cm.replaceSelection(formatted);
        });
    }
}

// Format JSON dengan tetap mempertahankan placeholder ${...}
function formatJsonTemplate(text) {
    const placeholders = [];
    const escaped = text.replace(/\$\{[^}]+\}/g, (match) => {
        placeholders.push(match);
        return `"__PLACEHOLDER_${placeholders.length - 1}__"`;
    });

    // Coba parse dan pretty-print
    const parsed = JSON.parse(escaped);
    let result = JSON.stringify(parsed, null, 2);

    // Kembalikan placeholder, hapus tanda kutip yang mengelilinginya jika memang bukan string
    result = result.replace(/"__PLACEHOLDER_(\d+)__"/g, (match, index) => {
        return placeholders[parseInt(index)];
    });

    return result;
}

// Format XML sederhana
function formatXmlTemplate(text) {
    let formatted = '';
    let indent = 0;
    const lines = text.replace(/>\s*</g, '>\n<').trim().split('\n');

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith('</')) {
            indent--;
        }

        formatted += '  '.repeat(Math.max(0, indent)) + line + '\n';

        if (!line.startsWith('</') && !line.endsWith('/>') && line.startsWith('<') && !line.includes('</')) {
            indent++;
        }
    });

    return formatted.trimEnd();
}

function bindResponseConfigEvents() {
    // Submit form via save button
    const saveBtn = document.getElementById('saveResponseConfigButton');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const formData = responseConfigUI.getFormData();
            
            if (!formData.name) {
                responseConfigUI.showMessage('Nama response config harus diisi', true);
                return;
            }
            if (!formData.template) {
                responseConfigUI.showMessage('Template response harus diisi', true);
                return;
            }

            try {
                const id = responseConfigUI.elements.configId.value;
                await responseConfigManager.saveConfig(formData, id || null);
                responseConfigUI.showMessage(`Konfigurasi response berhasil ${id ? 'diupdate' : 'disimpan'}`);
                responseConfigUI.resetForm();
                
                const configs = await responseConfigManager.loadConfigs();
                responseConfigUI.renderTable(configs);
            } catch (error) {
                responseConfigUI.showMessage(error.message, true);
            }
        });
    }

    // Cancel edit button
    const cancelBtn = document.getElementById('cancelResponseEditButton');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            responseConfigUI.resetForm();
            responseConfigUI.showMessage('Mode edit dibatalkan');
        });
    }

    // Test button
    const testBtn = document.getElementById('testResponseButton');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            responseConfigUI.openTestModal();
        });
    }

    // Execute test button
    const executeTestBtn = document.getElementById('executeTestButton');
    if (executeTestBtn) {
        executeTestBtn.addEventListener('click', async () => {
            await responseConfigHelper.handleTestTemplate();
        });
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteResponseConfigButton');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const target = responseConfigManager.getDeleteTarget();
            if (!target?.id) return;

            try {
                confirmDeleteBtn.disabled = true;
                await responseConfigManager.deleteConfig(target.id);
                responseConfigUI.closeDeleteModal();
                responseConfigUI.showMessage('Konfigurasi response berhasil dihapus');
                
                const configs = await responseConfigManager.loadConfigs();
                responseConfigUI.renderTable(configs);
            } catch (error) {
                responseConfigUI.showMessage(error.message, true);
            } finally {
                confirmDeleteBtn.disabled = false;
                responseConfigManager.clearDeleteTarget();
            }
        });
    }

    // Example buttons
    const exampleJsonBtn = document.getElementById('exampleJsonButton');
    if (exampleJsonBtn) {
        exampleJsonBtn.addEventListener('click', () => {
            responseConfigUI.openExampleJsonModal();
        });
    }

    const exampleXmlBtn = document.getElementById('exampleXmlButton');
    if (exampleXmlBtn) {
        exampleXmlBtn.addEventListener('click', () => {
            responseConfigUI.openExampleXmlModal();
        });
    }

    // Copy buttons
    const copyJsonBtn = document.getElementById('copyJsonExampleBtn');
    if (copyJsonBtn) {
        copyJsonBtn.addEventListener('click', () => {
            responseConfigHelper.copyJsonExample();
        });
    }

    const copyXmlBtn = document.getElementById('copyXmlExampleBtn');
    if (copyXmlBtn) {
        copyXmlBtn.addEventListener('click', () => {
            responseConfigHelper.copyXmlExample();
        });
    }

    // Format response modal buttons
    const copyFormatBtn = document.getElementById('copyFormatResponseBtn');
    if (copyFormatBtn) {
        copyFormatBtn.addEventListener('click', () => {
            const templateEl = document.getElementById('formatResponseTemplate');
            if (templateEl) {
                navigator.clipboard.writeText(templateEl.textContent).then(() => {
                    responseConfigUI.showMessage('Template berhasil disalin');
                }).catch(() => {
                    responseConfigUI.showMessage('Gagal menyalin template', true);
                });
            }
        });
    }

    const downloadFormatBtn = document.getElementById('downloadFormatResponseBtn');
    if (downloadFormatBtn) {
        downloadFormatBtn.addEventListener('click', () => {
            const nameEl = document.getElementById('formatResponseName');
            const typeEl = document.getElementById('formatResponseType');
            const templateEl = document.getElementById('formatResponseTemplate');
            
            if (nameEl && typeEl && templateEl) {
                const filename = `${nameEl.textContent}_response.${typeEl.textContent.toLowerCase()}`;
                const content = templateEl.textContent;
                
                const blob = new Blob([content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                responseConfigUI.showMessage(`File ${filename} berhasil diunduh`);
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize classes
    responseConfigManager = new ResponseConfigManager();
    responseConfigManager.configs = Array.isArray(window.serverResponseConfigs) ? window.serverResponseConfigs : [];
    
    initCodeMirror();
    
    responseConfigUI = new ResponseConfigUI(responseConfigManager, responseCodeMirror);
    responseConfigHelper = new ResponseConfigHelper(responseConfigUI);
    
    // Make manager available globally for helper
    window.responseConfigManager = responseConfigManager;
    
    // Render initial table
    responseConfigUI.renderTable(responseConfigManager.getConfigs());
    
    // Bind events
    bindResponseConfigEvents();
});