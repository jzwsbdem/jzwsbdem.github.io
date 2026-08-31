// ========================================
//  导入 PDF.js
// ========================================
import * as pdfjsLib from 'pdfjs-dist';

// ========================================
//  📚 PDF 文档列表
// ========================================
const PDF_DOCS = {
    doc1: {
        name: '1',
        path: '/Archives/YinDoujinshi/1.pdf',
    },
    doc2: {
        name: '2',
        path: '/Archives/YinDoujinshi/2.pdf',
    },
    doc3: {
        name: '3',
        path: '/Archives/YinDoujinshi/3.pdf',
    },
    doc4: {
        name: '4',
        path: '/Archives/YinDoujinshi/4.pdf',
    },
    doc5: {
        name: '5',
        path: '/Archives/YinDoujinshi/5.pdf',
    },
    doc6: {
        name: '6',
        path: '/Archives/YinDoujinshi/6).pdf',
    },
    doc7: {
        name: '7',
        path: '/Archives/YinDoujinshi/7.pdf',
    },
    doc8: {
        name: '8',
        path: '/Archives/YinDoujinshi/8.pdf',
    },
    doc9: {
        name: '9',
        path: '/Archives/YinDoujinshi/9.pdf',
    },
    doc10: {
        name: '10',
        path: '/Archives/YinDoujinshi/10.pdf',
    },
    doc11: {
        name: '11',
        path: '/Archives/YinDoujinshi/11.pdf',
    },
    doc12: {
        name: '12',
        path: '/Archives/YinDoujinshi/12.pdf',
    },
    doc13: {
        name: '13',
        path: '/Archives/YinDoujinshi/13.pdf',
    },
    doc14: {
        name: '14',
        path: '/Archives/YinDoujinshi/14.pdf',
    },
    doc15: {
        name: '15',
        path: '/Archives/YinDoujinshi/15.pdf',
    },
    doc16: {
        name: '16',
        path: '/Archives/YinDoujinshi/16.pdf',
    },
    doc17: {
        name: '17',
        path: '/Archives/YinDoujinshi/17.pdf',
    },
    doc18: {
        name: '18',
        path: '/Archives/YinDoujinshi/18.pdf',
    },
    doc19: {
        name: '19',
        path: '/Archives/YinDoujinshi/19.pdf',
    },
    doc20: {
        name: '20',
        path: '/Archives/YinDoujinshi/20.pdf',
    },
    doc21: {
        name: '21',
        path: '/Archives/YinDoujinshi/21.pdf',
    },

    doc22: {
        name: '22',
        path: '/Archives/YinDoujinshi/22.pdf',
    },
    doc23: {
        name: '23',
        path: '/Archives/YinDoujinshi/23.pdf',
    },
    doc24: {
        name: '24',
        path: '/Archives/YinDoujinshi/24.pdf',
    },
    doc25: {
        name: '25',
        path: '/Archives/YinDoujinshi/25.pdf',
    },
    doc26: {
        name: '26',
        path: '/Archives/YinDoujinshi/26.pdf',
    },
    doc27: {
        name: '27',
        path: '/Archives/YinDoujinshi/27.pdf',
    },
    doc28: {
        name: '28',
        path: '/Archives/YinDoujinshi/28.pdf',
    },
    doc29: {
        name: '29',
        path: '/Archives/YinDoujinshi/29.pdf',
    },
    doc30: {
        name: '30',
        path: '/Archives/YinDoujinshi/30.pdf',
    },
    doc31: {
        name: '31',
        path: '/Archives/YinDoujinshi/31.pdf',
    },
};

// ========================================
//  DOM 引用
// ========================================
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');
const loadingState = document.getElementById('loadingState');

const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const fileNameSpan = document.getElementById('fileName');

// ========================================
//  状态变量
// ========================================
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
const scale = 1.0;  // 固定缩放，不再变动
let currentDocId = null;

// ========================================
//  配置 PDF.js Worker
// ========================================
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';

// ========================================
//  从 URL 参数获取文档 ID
// ========================================
function getDocIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('doc');
}

// ========================================
//  显示状态
// ========================================
function showLoading(message = 'Loading...') {
    loadingState.style.display = 'flex';
    loadingState.innerHTML = `
        <div class="spinner"></div>
        <div>${message}</div>
    `;
    canvas.style.display = 'none';
}

function showError(message) {
    loadingState.style.display = 'flex';
    loadingState.innerHTML = `
        <div style="color:#ff6b6b;font-size:18px;">❌ Load Failed</div>
        <div style="color:#ff6b6b;font-size:14px;margin-top:8px;">${message}</div>
        <div style="color:#888;font-size:13px;margin-top:10px;">
            Please check: whether the file exists and whether the path is correct.
        </div>
    `;
    canvas.style.display = 'none';
    pageInfo.textContent = '0 / 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    fileNameSpan.textContent = 'Load Failed';
}

// ========================================
//  🔑 核心：加载并渲染 PDF
// ========================================
async function loadPDFById(docId) {
    currentDocId = docId;

    if (!docId) {
        showError('No document ID specified');
        return;
    }

    const docInfo = PDF_DOCS[docId];
    if (!docInfo) {
        showError(`Document ID not found: ${docId}`);
        console.error('Available document ID:', Object.keys(PDF_DOCS));
        return;
    }

    const { name, path } = docInfo;
    fileNameSpan.textContent = name || 'Loading...';

    try {
        showLoading(`Loading「${name}」...`);

        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - File does not exist or is inaccessible`);
        }

        const arrayBuffer = await response.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
            throw new Error('File is empty (0 bytes)');
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        pdfDoc = await loadingTask.promise;

        totalPages = pdfDoc.numPages;
        currentPage = 1;

        prevBtn.disabled = true;
        nextBtn.disabled = totalPages <= 1;

        fileNameSpan.textContent = `${name} (${totalPages} Pages)`;

        await renderPage(currentPage);

        document.title = `${name} - Reader`;

    } catch (error) {
        console.error('Load Failed:', error);
        let msg = error.message || 'Unknown error';

        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
            msg = `Cannot read file: ${path}\nPlease confirm:\n1. The file exists\n2. The path is correct\n3. You are opening via Live Server (http://)`;
        } else if (msg.includes('Invalid PDF')) {
            msg = 'Invalid PDF file';
        } else if (msg.includes('empty')) {
            msg = `File is empty (0 bytes): ${path}`;
        }

        showError(msg);
        pdfDoc = null;
        fileNameSpan.textContent = 'Load Failed';
    }
}

// ========================================
//  渲染页面
// ========================================
async function renderPage(pageNum) {
    if (!pdfDoc) return;

    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(pixelRatio, pixelRatio);

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
        };

        canvas.style.display = 'none';
        loadingState.style.display = 'flex';
        loadingState.innerHTML = `
            <div class="spinner"></div>
            <div>Rendering page ${pageNum}...</div>
        `;

        await page.render(renderContext).promise;

        canvas.style.display = 'block';
        loadingState.style.display = 'none';

        pageInfo.textContent = `${pageNum} / ${totalPages}`;
        prevBtn.disabled = pageNum <= 1;
        nextBtn.disabled = pageNum >= totalPages;

    } catch (error) {
        console.error('Render failed:', error);
        showError('Render failed: ' + error.message);
    }
}

// ========================================
//  翻页
// ========================================
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
    }
}

// ========================================
//  键盘快捷键
// ========================================
document.addEventListener('keydown', (e) => {
    if (!pdfDoc) return;

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
            e.preventDefault();
            goToPrevPage();
            break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
            e.preventDefault();
            goToNextPage();
            break;
    }
});

// ========================================
//  绑定事件
// ========================================
prevBtn.addEventListener('click', goToPrevPage);
nextBtn.addEventListener('click', goToNextPage);

// ========================================
//  窗口变化重新渲染（防抖）
// ========================================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (pdfDoc) renderPage(currentPage);
    }, 300);
});

// ========================================
//  🚀 启动
// ========================================
const docId = getDocIdFromUrl();
loadPDFById(docId);