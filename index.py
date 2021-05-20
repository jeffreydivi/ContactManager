from flask import Flask, send_file, request, Response
import json
import bcrypt
import base64
import threading
import os

app = Flask(__name__, static_url_path="/static")


@app.route("/")
def index():
    return send_file("static/index.html")


if __name__ == "__main__":
    app.run()
