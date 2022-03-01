from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import PDFPageAggregator
from pdfminer.layout import LAParams, LTTextBox, LTTextLine, LTFigure

def filter_text(text):
    """Heuristically get only textual segments"""
    # short segments
    if len(text) < 40 or len(text.split()) < 5:
        return False

    # not enough alphanumeric over nonalphanumeric characters
    alpha_count = len([x for x in text if x.isalpha()])
    if alpha_count/len(text) < 0.6:
        return False

    return True

def parse_layout(layout):
    """Function to recursively parse the layout tree."""

    data = []
    for lt_obj in layout:
        if isinstance(lt_obj, LTTextBox) or isinstance(lt_obj, LTTextLine):
            data.append((lt_obj.get_text(), lt_obj.bbox, lt_obj.__class__.__name__))
        elif isinstance(lt_obj, LTFigure):
            # recurse
            data += parse_layout(lt_obj)
    return data

def parse_pdf(pdf_loc):
    fp = open(pdf_loc, 'rb')
    parser = PDFParser(fp)
    doc = PDFDocument(parser)

    rsrcmgr = PDFResourceManager()
    laparams = LAParams()
    device = PDFPageAggregator(rsrcmgr, laparams=laparams)
    interpreter = PDFPageInterpreter(rsrcmgr, device)

    data_all = []
    for page in PDFPage.create_pages(doc):
        interpreter.process_page(page)
        layout = device.get_result()

        data = parse_layout(layout)
        # filter only textual entry
        data = [x for x in data if filter_text(x[0])]

        data_all.append(data)

    return data_all