// monitor-api.js
// Kelas untuk komunikasi API

class MonitorAPI {
    constructor(core) {
        this.core = core;
    }

    async saveConfig() {
        const config = this.core.getFormData();
        const id = config.id;
        
        try {
            const url = id ? `/api/monitor-configs/${id}` : '/api/monitor-configs';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.showMessage('success', id ? 'Konfigurasi berhasil diperbarui' : 'Konfigurasi berhasil disimpan');
                this.core.resetFormState();
                return { success: true };
            } else {
                const error = await response.text();
                this.showMessage('error', 'Gagal menyimpan konfigurasi: ' + error);
                return { success: false, error: error };
            }
        } catch (error) {
            this.showMessage('error', 'Error: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    async deleteConfig(id) {
        try {
            const response = await fetch(`/api/monitor-configs/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showMessage('success', 'Konfigurasi berhasil dihapus');
                return { success: true };
            } else {
                const error = await response.text();
                this.showMessage('error', 'Gagal menghapus konfigurasi: ' + error);
                return { success: false, error: error };
            }
        } catch (error) {
            this.showMessage('error', 'Error: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    async loadConfigs() {
        try {
            const response = await fetch('/api/monitor-configs');
            if (response.ok) {
                const configs = await response.json();
                return configs;
            }
            return [];
        } catch (error) {
            console.error('Error loading configs:', error);
            return [];
        }
    }

    async testResponse(format, template, sampleData) {
        try {
            const response = await fetch('/api/monitor-configs/test-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    format: format,
                    template: template,
                    sampleData: sampleData
                })
            });

            if (response.ok) {
                const result = await response.json();
                return { success: true, result: result.generatedResponse };
            } else {
                const error = await response.text();
                return { success: false, error: error };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    showMessage(type, message) {
        const messageElement = document.getElementById('monitorConfigMessage');
        if (!messageElement) return;
        
        messageElement.textContent = message;
        messageElement.className = `small ${type === 'success' ? 'text-success' : 'text-danger'}`;
        
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'small text-muted';
        }, 5000);
    }
}