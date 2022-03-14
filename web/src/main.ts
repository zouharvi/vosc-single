const PDFJS = require('pdfjs-dist');

// The workerSrc property shall be specified.
if (!PDFJS.GlobalWorkerOptions.workerSrc) {
    const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;
    PDFJS.GlobalWorkerOptions.workerSrc = WORKER_URL;
}

let PDF_DISPLAY_RATIO: number
let PDF_HEIGHT: number
let PDF_PAGENUMBER = 5
let PDF_VECS: [number[], any, any][][]

async function load_pdf() {
    // async download of PDF
    console.log($("#textarea_url").val())
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

    // server load
    let data = await $.ajax({
        url: "http://localhost:9001/parse_pdf/",
        data: { pdfurl: $("#textarea_url").val() },
        dataType: "json",
    });
    PDF_VECS = data
}

function is_relevant_subset(textA: string, textB: string) {
    let textAset = (textA.toLowerCase().split(/\s/).map((x) => x.replace(/\W/g, "")))
    let textBset = (textB.toLowerCase().split(/\s/).map((x) => x.replace(/\W/g, "")))

    return textBset.every(val => textAset.includes(val))
}

function is_relevant_vec(vecs: number[][], textB: number[]) {
    // TODO
    return true
}

async function verify_prompt() {
    let prompt = ($("#textarea_prompt").val() as string).toLowerCase()
    let data = await $.ajax({
        url: "http://localhost:9001/encode_prompt/",
        data: { text: prompt },
        dataType: "json",
    });
    // currently the return is [encode(prompt)]
    let prompt_vec = data[0]

    let min_d = global.Infinity
    let min_i = -1
    for (let i = 0; i < PDF_VECS[PDF_PAGENUMBER-1].length; i++) {
        let dist = l2_distance(
            vector_norm(PDF_VECS[PDF_PAGENUMBER-1][i][0]),
            vector_norm(prompt_vec)
        )
        console.log(dist, i)
        if (dist < min_d) {
            min_d = dist
            min_i = i
        }
    }
    console.log(min_d, min_i)
    draw_highlight(PDF_VECS[PDF_PAGENUMBER-1][min_i][1])
}

function vector_norm(vec: number[]) {
    let sum_square = vec.map((x) => x*x).reduce((prev: number, current: number) => prev + current, 0)
    let length = Math.sqrt(sum_square)
    
    return vec.map((x) => x/length)
}

function l2_distance(vecA: number[], vecB: number[]) : number {
    let total_sum = 0.0
    // TODO: change to reduce
    for(let i = 0; i < vecA.length && i < vecB.length; i++) {
        total_sum += Math.pow(vecA[i]-vecB[i], 2)
    }
    // sqrt can be skipped because we're doing only comparison anyway
    return Math.sqrt(total_sum)
}

function cos_distance(vecA: number[], vecB: number[]) : number {
    let total_sum = 0.0
    // TODO: change to reduce
    for(let i = 0; i < vecA.length && i < vecB.length; i++) {
        total_sum += vecA[i]*vecB[i]
    }
    // invert so that it can be used in place of l2 and we try to minimize
    return -total_sum
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