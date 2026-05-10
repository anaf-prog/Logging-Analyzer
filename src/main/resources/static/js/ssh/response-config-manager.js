// response-config-manager.js
class ResponseConfigManager {
    constructor() {
        this.configs = [];
        this.currentEditingConfig = null;
        this.deleteTarget = null;
    }

    async loadConfigs() {
        try {
            const response = await fetch('/api/response-configs');
            if (!response.ok) throw new Error('Gagal memuat konfigurasi response');
            this.configs = await response.json();
            return this.configs;
        } catch (error) {
            throw error;
        }
    }

    async saveConfig(configData, id = null) {
        const url = id ? `/api/response-configs/${id}` : '/api/response-configs';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Gagal menyimpan konfigurasi response');
        }

        return response.json();
    }

    async deleteConfig(id) {
        const response = await fetch(`/api/response-configs/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Gagal menghapus konfigurasi response');
    }

    async testTemplate(format, template, sampleData) {
        const response = await fetch('/api/response-configs/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, template, sampleData })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal generate response');
        return result;
    }

    getConfigs() {
        return this.configs;
    }

    setCurrentEditing(config) {
        this.currentEditingConfig = config;
    }

    getCurrentEditing() {
        return this.currentEditingConfig;
    }

    setDeleteTarget(config) {
        this.deleteTarget = config;
    }

    getDeleteTarget() {
        return this.deleteTarget;
    }

    clearDeleteTarget() {
        this.deleteTarget = null;
    }
}