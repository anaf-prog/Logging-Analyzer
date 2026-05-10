// monitor-core.js
// Kelas inti untuk manajemen state dan utilitas

class MonitorCore {
    constructor() {
        this.responseCodeMirror = null;
        this.currentEditId = null;
    }

    setCodeMirror(cm) {
        this.responseCodeMirror = cm;
    }

    getCodeMirror() {
        return this.responseCodeMirror;
    }

    setCurrentEditId(id) {
        this.currentEditId = id;
    }

    getCurrentEditId() {
        return this.currentEditId;
    }

    updateCodeMirrorMode(format) {
        if (this.responseCodeMirror) {
            const mode = format === 'JSON' ? "application/json" : "application/xml";
            this.responseCodeMirror.setOption("mode", mode);
        }
    }

    getTemplateValue() {
        return this.responseCodeMirror ? this.responseCodeMirror.getValue() : document.getElementById('responseTemplate').value;
    }

    setTemplateValue(value) {
        if (this.responseCodeMirror) {
            this.responseCodeMirror.setValue(value);
        } else {
            document.getElementById('responseTemplate').value = value;
        }
    }

    encodeTemplate(template) {
        try {
            return encodeURIComponent(template || '');
        } catch (e) {
            return template || '';
        }
    }

    decodeTemplate(template) {
        try {
            return decodeURIComponent(template || '');
        } catch (e) {
            return template || '';
        }
    }

    getFormData() {
        const form = document.getElementById('monitorConfigForm');
        const formData = new FormData(form);
        
        return {
            id: document.getElementById('monitorConfigId').value,
            productName: formData.get('productName'),
            logPath: formData.get('logPath'),
            responseFormat: formData.get('responseFormat'),
            codeField: formData.get('codeField'),
            rcField: formData.get('rcField'),
            successCodes: formData.get('successCodes') || '0000,00',
            jsonPrefix: formData.get('jsonPrefix'),
            xmlWrapperTag: formData.get('xmlWrapperTag'),
            responseName: formData.get('responseName'),
            responseTemplate: this.getTemplateValue(),
            responseDescription: formData.get('responseDescription'),
            sshConfigId: formData.get('sshConfigId') ? parseInt(formData.get('sshConfigId')) : null,
            enabled: formData.has('enabled')
        };
    }

    resetFormState() {
        const form = document.getElementById('monitorConfigForm');
        if (form) form.reset();
        document.getElementById('monitorConfigId').value = '';
        document.getElementById('saveMonitorConfigButton').textContent = 'Simpan Config';
        document.getElementById('cancelEditButton').classList.add('d-none');
        
        if (this.responseCodeMirror) {
            this.responseCodeMirror.setValue('');
        }

        const successCodesInput = document.getElementById('successCodes');
        if (successCodesInput) successCodesInput.value = '0000,00';
        
        const enabledCheckbox = document.getElementById('enabled');
        if (enabledCheckbox) enabledCheckbox.checked = true;
        
        this.currentEditId = null;
    }

    populateForm(data) {
        document.getElementById('monitorConfigId').value = data.id || '';
        document.getElementById('productName').value = data.productName || '';
        document.getElementById('logPath').value = data.logPath || '';
        document.getElementById('responseFormat').value = data.responseFormat || '';
        document.getElementById('codeField').value = data.codeField || '';
        document.getElementById('rcField').value = data.rcField || '';
        document.getElementById('successCodes').value = data.successCodes || '0000,00';
        document.getElementById('jsonPrefix').value = data.jsonPrefix || '';
        document.getElementById('xmlWrapperTag').value = data.xmlWrapperTag || '';
        document.getElementById('responseName').value = data.responseName || '';
        document.getElementById('responseDescription').value = data.responseDescription || '';
        document.getElementById('sshConfigId').value = data.sshConfigId || '';
        
        const enabledCheckbox = document.getElementById('enabled');
        if (enabledCheckbox) {
            enabledCheckbox.checked = data.enabled === 'true' || data.enabled === true;
        }

        if (this.responseCodeMirror) {
            const template = this.decodeTemplate(data.responseTemplate || '');
            this.responseCodeMirror.setValue(template);
        }

        this.updateCodeMirrorMode(data.responseFormat || 'JSON');
        
        document.getElementById('saveMonitorConfigButton').textContent = 'Update Config';
        document.getElementById('cancelEditButton').classList.remove('d-none');
        
        this.currentEditId = data.id;
    }

    getExampleJson() {
        return {
            "status": "{{status}}",
            "message": "{{message}}",
            "data": {
                "code": "{{code}}",
                "timestamp": "{{timestamp}}",
                "product": "{{productName}}"
            }
        };
    }

    getExampleXml() {
        return `<?xml version="1.0" encoding="UTF-8"?>
                <response>
                    <status>{{status}}</status>
                    <message>{{message}}</message>
                    <data>
                        <code>{{code}}</code>
                        <timestamp>{{timestamp}}</timestamp>
                        <product>{{productName}}</product>
                    </data>
                </response>`;
    }
}