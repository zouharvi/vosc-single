const PDFJS = require('pdfjs-dist');

let url = 'https://arxiv.org/pdf/2201.09651.pdf';

// The workerSrc property shall be specified.
if (!PDFJS.GlobalWorkerOptions.workerSrc) {
    const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;
    PDFJS.GlobalWorkerOptions.workerSrc = WORKER_URL;
}

// Asynchronous download of PDF
let loadingTask = PDFJS.getDocument(url);
loadingTask.promise.then(function (pdf: any) {
    console.log('PDF loaded');

    // Fetch the first page
    let pageNumber = 3;
    pdf.getPage(pageNumber).then(function (page: any) {
        console.log('Page loaded');

        let scale = 1;
        let viewport = page.getViewport({ scale: 1 });
        let ratio = Math.min(viewport.width, 500) / viewport.width;
        viewport = page.getViewport({ scale: ratio });

        // Prepare canvas using PDF page dimensions
        let canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
        let context = canvas?.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        let renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        let renderTask = page.render(renderContext);
        renderTask.promise.then(function () {
            console.log('Page rendered');
        });
    });
}, function (reason: any) {
    // PDF loading error
    console.error(reason);
});