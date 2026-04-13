/**
 * Dynamic Form - Toggle JSON/XML fields
 * Hanya untuk menampilkan/menyembunyikan field berdasarkan pilihan format
 */

document.addEventListener('DOMContentLoaded', function() {
    const formatSelect = document.getElementById('responseFormat');
    const jsonDiv = document.getElementById('jsonPrefixDiv');
    const xmlDiv = document.getElementById('xmlWrapperDiv');
    
    if (!formatSelect || !jsonDiv || !xmlDiv) return;
    
    function toggleFields() {
        const format = formatSelect.value;
        
        if (format === 'JSON') {
            jsonDiv.style.display = 'block';
            xmlDiv.style.display = 'none';
        } else if (format === 'XML') {
            jsonDiv.style.display = 'none';
            xmlDiv.style.display = 'block';
        } else { // AUTO
            jsonDiv.style.display = 'block';
            xmlDiv.style.display = 'block';
        }
    }
    
    formatSelect.addEventListener('change', toggleFields);
    toggleFields(); // Jalankan sekali saat load
});