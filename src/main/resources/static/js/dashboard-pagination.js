// dashboard-pagination.js

// Variabel untuk menyimpan state halaman saat ini agar tidak reset ke 0 saat auto-refresh
let currentActivePage = 0;

// Variabel untuk menyimpan data pagination
let latestErrorsPageData = null;

// Fungsi untuk merender pagination (VERSI 1 - yang dipakai)
function renderPagination(pageData) {
    console.log('renderPagination dipanggil dengan:', pageData);

    const paginationUl = document.getElementById('logPagination');
    if (!paginationUl || !pageData) {
        console.error('paginationUl atau pageData tidak ditemukan');
        return;
    }

    paginationUl.innerHTML = '';

    const currentPage = pageData.number;
    const totalPages = pageData.totalPages;

    console.log('Current page:', currentPage, 'Total pages:', totalPages);

    // Tombol Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${pageData.first ? 'disabled' : ''}`;
    const prevButton = document.createElement('a');
    prevButton.className = 'page-link';
    prevButton.href = '#';
    prevButton.textContent = 'Previous';
    if (!pageData.first) {
        prevButton.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Tombol Previous diklik, memuat halaman:', currentPage - 1);
            loadLatestErrors(currentPage - 1);
        });
    }
    prevLi.appendChild(prevButton);
    paginationUl.appendChild(prevLi);

    // Nomor Halaman
    for (let i = 0; i < totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i + 1;
        pageLink.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Halaman', i, 'diklik');
            loadLatestErrors(i);
        });
        li.appendChild(pageLink);
        paginationUl.appendChild(li);
    }

    // Tombol Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${pageData.last ? 'disabled' : ''}`;
    const nextButton = document.createElement('a');
    nextButton.className = 'page-link';
    nextButton.href = '#';
    nextButton.textContent = 'Next';
    if (!pageData.last) {
        nextButton.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Tombol Next diklik, memuat halaman:', currentPage + 1);
            loadLatestErrors(currentPage + 1);
        });
    }
    nextLi.appendChild(nextButton);
    paginationUl.appendChild(nextLi);
}