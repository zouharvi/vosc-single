#!/usr/bin/env python3

from flask import Flask, request
from flask_cors import CORS
from pdf_utils import parse_pdf
import json
import requests
import os
import hashlib

app = Flask(__name__)
CORS(app)

@app.route('/parse_pdf/')
def route_parse_pdf():
    pdfurl = request.values["pdfurl"]
    print(os.path.splitext(pdfurl))

    if os.path.splitext(pdfurl)[1] != ".pdf":
        return json.dumps({"error_msg": "Invalid URL"})

    requesthash = hashlib.md5(pdfurl.encode('utf-8')).hexdigest()
    filename = 'tmp/'+requesthash[:10]

    # download if not cached
    if not os.path.exists(filename):
        filedata = requests.get(pdfurl).content
        open(filename, 'wb').write(filedata)

    data = parse_pdf(filename)
    return json.dumps(data)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=9001)