// dashboard-notification.js
// File untuk fungsi-fungsi notifikasi dan dialog

// Variabel untuk menyimpan timer timeout (dipindahkan dari file utama)
let formMessageTimeout = null;

// Fungsi untuk menampilkan pesan notifikasi
function showFormMessage(message, isError = false) {
    // Buat container notifikasi global jika belum ada
    let notificationContainer = document.getElementById('globalNotification');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'globalNotification';
        notificationContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 250px;';
        document.body.appendChild(notificationContainer);
    }

    // Hapus notifikasi sebelumnya
    const existingNotification = notificationContainer.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }

    if (formMessageTimeout) {
        clearTimeout(formMessageTimeout);
        formMessageTimeout = null;
    }

    // Buat elemen notifikasi baru
    const notification = document.createElement('div');
    notification.className = `notification-toast alert ${isError ? 'alert-danger' : 'alert-success'} shadow`;
    notification.style.cssText = `
        animation: slideInRight 0.3s ease;
        margin-bottom: 10px;
        cursor: pointer;
    `;
    notification.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <span>${message}</span>
            <button type="button" class="btn-close ms-3" style="font-size: 12px;"></button>
        </div>
    `;

    // Tombol close
    const closeBtn = notification.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
        if (formMessageTimeout) {
            clearTimeout(formMessageTimeout);
            formMessageTimeout = null;
        }
    });

    notificationContainer.appendChild(notification);

    // Hilang otomatis setelah 5 detik
    formMessageTimeout = setTimeout(() => {
        notification.style.animation = 'fadeOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
            formMessageTimeout = null;
        }, 300);
    }, 5000);
}

// Fungsi untuk menampilkan dialog konfirmasi
function showConfirmDialog(message, onConfirm, onCancel) {
    const modal = document.getElementById('deleteConfirmModal');
    const messageEl = document.getElementById('deleteConfirmMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    // Set pesan
    messageEl.textContent = message;

    // Tampilkan modal
    modal.style.display = 'flex';

    // Handler confirm
    const handleConfirm = () => {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        if (onConfirm) onConfirm();
    };

    // Handler cancel
    const handleCancel = () => {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        if (onCancel) onCancel();
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    // Klik overlay untuk close
    const overlay = modal.querySelector('.modal-custom-overlay');
    overlay.onclick = () => {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        if (onCancel) onCancel();
    };
}