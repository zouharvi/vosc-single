#!/usr/bin/env python3

from flask import Flask, request
from flask_cors import CORS
from pdf_utils import parse_pdf
import json
import requests
import os
import hashlib
import pickle
from encoder import encode
import tqdm

app = Flask(__name__)
CORS(app)


@app.route('/parse_pdf/')
def route_parse_pdf():
    pdfurl = request.values["pdfurl"]

    if os.path.splitext(pdfurl)[1] != ".pdf":
        return json.dumps({"error_msg": "Invalid URL"})

    requesthash = hashlib.md5(pdfurl.encode('utf-8')).hexdigest()
    dirname = 'tmp/' + requesthash[:16] + "/"
    os.makedirs(dirname, exist_ok=True)

    # download if not cached
    if not os.path.exists(dirname + "doc.pdf"):
        filedata = requests.get(pdfurl).content
        open(dirname + "doc.pdf", 'wb').write(filedata)

    data = parse_pdf(dirname + "doc.pdf")

    data = [
        [
            # currently only take the first sentence
            (encode(span[0].split(". ")[0]), span[1], span[2])
            for span in page
        ]
        for page in tqdm.tqdm(data)
    ]
    return json.dumps(data)


@app.route('/encode_prompt/')
def route_encode_prompt():
    text = request.values["text"]
    return json.dumps([encode(text)])


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=9001)
