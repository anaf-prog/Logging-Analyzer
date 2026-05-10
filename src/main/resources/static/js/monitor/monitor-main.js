// monitor-main.js
// Kelas utama yang mengkoordinasikan semua komponen

class MonitorConfigManager {
    constructor() {
        this.core = new MonitorCore();
        this.api = new MonitorAPI(this.core);
        this.ui = new MonitorUI(this.core, this.api);
        
        this.init();
    }

    async init() {
        this.ui.initModals();
        this.ui.initCodeMirror();
        this.initEventListeners();
        await this.loadConfigs();
    }

    initEventListeners() {
        // Form submission
        const form = document.getElementById('monitorConfigForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveConfig();
            });
        }

        // Buttons
        const saveBtn = document.getElementById('saveMonitorConfigButton');
        const cancelBtn = document.getElementById('cancelEditButton');
        const testBtn = document.getElementById('testResponseButton');
        const runTestBtn = document.getElementById('runTestButton');
        const exampleJsonBtn = document.getElementById('exampleJsonButton');
        const exampleXmlBtn = document.getElementById('exampleXmlButton');
        const confirmDeleteBtn = document.getElementById('confirmDeleteButton');

        if (saveBtn) saveBtn.addEventListener('click', () => this.saveConfig());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelEdit());
        if (testBtn) testBtn.addEventListener('click', () => this.ui.openTestModal());
        if (runTestBtn) runTestBtn.addEventListener('click', () => this.ui.runTest());
        if (exampleJsonBtn) exampleJsonBtn.addEventListener('click', () => this.ui.setExampleJson());
        if (exampleXmlBtn) exampleXmlBtn.addEventListener('click', () => this.ui.setExampleXml());
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => this.ui.confirmDelete());

        // Format change handler
        const formatSelect = document.getElementById('responseFormat');
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                this.core.updateCodeMirrorMode(e.target.value);
            });
        }

        // Set callbacks for UI
        this.ui.setCallbacks(
            () => this.loadConfigs(),
            () => this.loadConfigs()
        );
    }

    async saveConfig() {
        const result = await this.api.saveConfig();
        if (result.success) {
            await this.loadConfigs();
        }
    }

    cancelEdit() {
        this.core.resetFormState();
    }

    editConfig(button) {
        const data = button.dataset;
        this.core.populateForm(data);
        this.ui.scrollToForm();
    }

    showDeleteModal(button) {
        const id = button.dataset.id;
        const name = button.dataset.name;
        this.ui.showDeleteModal(id, name);
    }

    showResponsePreview(button) {
        const productName = button.dataset.productName || '-';
        const responseTemplate = button.dataset.responseTemplate || '';
        this.ui.showResponsePreview(productName, responseTemplate);
    }

    async loadConfigs() {
        const configs = await this.api.loadConfigs();
        this.ui.updateTable(configs);
        this.attachTableEventListeners();
    }

    attachTableEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.removeEventListener('click', this.boundEditHandler);
            this.boundEditHandler = () => this.editConfig(btn);
            btn.addEventListener('click', this.boundEditHandler);
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.removeEventListener('click', this.boundDeleteHandler);
            this.boundDeleteHandler = () => this.showDeleteModal(btn);
            btn.addEventListener('click', this.boundDeleteHandler);
        });

        // Preview buttons
        document.querySelectorAll('.response-preview-btn').forEach(btn => {
            btn.removeEventListener('click', this.boundPreviewHandler);
            this.boundPreviewHandler = () => this.showResponsePreview(btn);
            btn.addEventListener('click', this.boundPreviewHandler);
        });
    }
}

// Initialize when DOM is ready
let monitorConfigManager = null;

document.addEventListener('DOMContentLoaded', () => {
    monitorConfigManager = new MonitorConfigManager();
});