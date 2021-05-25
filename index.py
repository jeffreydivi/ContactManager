# Web server-related
from functools import wraps
from flask import Flask, send_file, request, Response
from flask_cors import CORS, cross_origin
# Database communication
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, ForeignKey
# Other
import json
import bcrypt
import base64
import socket

# Load configuration file
config_name = "config.json"
if socket.gethostname() == "contact-manager":
    config_name = "/var/www/flask/config.json"

with open(config_name) as config_file:
    config = json.load(config_file)

# Initialize Flask, CORS, SQL connection.
app = Flask(__name__, static_url_path="/static")

cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"
app.config["CORS_ORIGINS"] = config["host"]

if not config["local"]:
    db = create_engine(
        f"mysql://{config['sql']['username']}:{config['sql']['password']}@{config['sql']['location']}/{config['sql']['database']}"
    )
else:
    # This is 100% unconfirmed. Please just run MySQL locally.
    print("WARNING: Loading SQLite database.")
    db = create_engine("sqlite:///testing.db")


def errorSchema(err_code):
    description = "Unknown error"
    if err_code == 401:
        description = "You are not logged in."
    elif err_code == 403:
        description = "You do not have permission to view this contact."
    elif err_code == 404:
        description = "Contact not found."
    elif err_code == 500:
        description = "Internal server error."
    elif err_code == 200:
        description = "Success!"

    return {
        "err_code": err_code,
        "description": description
    }


# Authentication
def authenticate(d):
    @wraps(d)
    def wrapper(*args, **kwargs):
        try:
            auth = request.authorization
            if not auth:
                return Response(json.dumps(errorSchema(401)), mimetype="application/json", status=401)
            # (do database checking code here)
            # Access username/password via auth["username"] and auth["password"].
            if False:
                # Return error 401.
                return Response(json.dumps(errorSchema(401)), mimetype="application/json", status=401)

            # Pass user data to the endpoint.
            userData = {
                "user_id": -1,
                "creation": 0,
                "username": auth["username"],
                "first_name": auth['username'],
                "last_name": "ExampleUser"
            }
        except:
            # 500 error.
            return Response(json.dumps(errorSchema(500)), mimetype="application/json", status=500)
        # Everything worked. Carry on!
        return d(userData, *args, **kwargs)

    return wrapper


@app.route("/")
def index():
    """
    Returns the home page.
    :return: Home page.
    """
    return send_file("static/index.html")


@app.route("/user/", methods=["GET"])
@authenticate
def getUser(userData):
    """
    Return the currently logged-in user's account information
    :return: User
    """
    # Just a sample response.
    return userData


@app.route("/user/", methods=["POST"])
def createUser():
    """
    Create a new account.
    :return: User
    """
    return errorSchema(200)


@app.route("/user/", methods=["PATCH"])
@authenticate
def editUser(userData):
    """
    Update the authenticated user's profile
    :return: User
    """
    return errorSchema(200)


@app.route("/contact/list/", methods=["GET"])
@authenticate
def getContactsList(userData):
    """
    Get a list of all contacts
    :return: Contact[]
    """
    return errorSchema(200)


@app.route("/contact/search/", methods=["GET"])
@authenticate
def searchContacts(userData):
    """
    Find all contacts that match a given query.
    :return: Contact[]
    """
    return errorSchema(200)


@app.route("/contact/add/", methods=["POST"])
@authenticate
def createContact(userData):
    """
    Add a new contact.
    :return: Contact
    """
    return errorSchema(200)


@app.route("/contact/<id>/", methods=["GET"])
@authenticate
def getContact(userData, id):
    """
    Get a single contact.
    :return: Contact
    """
    assert id == request.view_args["id"]
    return errorSchema(200)

@app.route("/contact/<id>/", methods=["PATCH"])
@authenticate
def editContact(userData, id):
    """
    Updates a single contact.
    :return: Contact
    """
    assert id == request.view_args["id"]
    return errorSchema(200)


@app.route("/contact/<id>/", methods=["DELETE"])
@authenticate
def deleteContact(userData, id):
    """
    Delete a contact.
    :return: Error200
    """
    assert id == request.view_args["id"]
    return errorSchema(200)


if __name__ == "__main__":
    app.run()
