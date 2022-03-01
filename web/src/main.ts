const PDFJS = require('pdfjs-dist');

// The workerSrc property shall be specified.
if (!PDFJS.GlobalWorkerOptions.workerSrc) {
    const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;
    PDFJS.GlobalWorkerOptions.workerSrc = WORKER_URL;
}

let PDF_DISPLAY_RATIO: number | null = null
let PDF_HEIGHT: number | null = null
let PDF_PAGENUMBER = 5

function load_pdf() {
    // async download of PDF
    let loadingTask = PDFJS.getDocument($("#textarea_url").val());
    loadingTask.promise.then(function (pdf: any) {
        console.log('PDF loaded');

        // fetch a specific page
        pdf.getPage(PDF_PAGENUMBER).then(function (page: any) {
            console.log('Page loaded');

            let scale = 1;
            let viewport = page.getViewport({ scale: 1 });
            PDF_DISPLAY_RATIO = Math.min(viewport.width, 500) / viewport.width;
            PDF_HEIGHT = viewport.height
            viewport = page.getViewport({ scale: PDF_DISPLAY_RATIO });

            // Prepare canvas using PDF page dimensions
            let canvas = $("#canvas_pdf").get(0) as HTMLCanvasElement;
            let context = canvas.getContext('2d');
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
}

function is_relevant(textA: string, textB: string) {
    let textAset = (textA.toLowerCase().split(/\s/).map((x) => x.replace(/\W/g, "")))
    let textBset = (textB.toLowerCase().split(/\s/).map((x) => x.replace(/\W/g, "")))

    return textBset.every(val => textAset.includes(val))
}

async function verify_prompt() {
    let prompt = ($("#textarea_prompt").val() as string).toLowerCase()
    let data = await $.ajax({
        url: "http://localhost:9001/parse_pdf/",
        data: { pdfurl: $("#textarea_url").val() },
        dataType: "json",
    });
    let pagedata = data[PDF_PAGENUMBER - 1]
    for (let i = 0; i < pagedata.length; i++) {
        // normalize and remove nonalpha characters
        let text = pagedata[i][0]
        if (is_relevant(text, prompt)) {
            draw_highlight(pagedata[i][1])
            console.log(text, pagedata[i][1])
        }
    }
}

function draw_highlight(bbox: Array<number>) {
    let canvas = $("#canvas_pdf").get(0) as HTMLCanvasElement
    let ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'rgba(255, 255, 150, 0.5)';
    console.log(PDF_DISPLAY_RATIO)
    ctx.fillRect(
        bbox[0] * PDF_DISPLAY_RATIO!,
        (PDF_HEIGHT! - bbox[1]) * PDF_DISPLAY_RATIO!,
        (bbox[2] - bbox[0]) * PDF_DISPLAY_RATIO!,
        (bbox[1] - bbox[3]) * PDF_DISPLAY_RATIO!,
    );
}

$("#button_load").on("click", load_pdf)
$("#button_verify").on("click", verify_prompt)

// when page is loaded
load_pdf()