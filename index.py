# Web server-related
from functools import wraps
from flask import Flask, send_file, request, Response
from flask_cors import CORS, cross_origin
# Database communication
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, ForeignKey, text
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

db = create_engine(
    f"mysql://{config['sql']['username']}:{config['sql']['password']}@{config['sql']['location']}/{config['sql']['database']}"
)


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
    elif err_code == 400:
        description = "Entity already exists."
    else:
        description = "Unknown error."

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

            username = auth['username']
            password = auth['password']
            # create connection for mysql. Rewritten to be more hack-resistant.
            output = db.execute(text("SELECT * FROM Users where Username=:username"), username=username)
            data = output.fetchone()
            if data is None:
                # Return error 401.
                return Response(json.dumps(errorSchema(401)), mimetype="application/json", status=401)

            if not bcrypt.checkpw(password.encode(encoding="ascii"), data['Password'].encode(encoding="ascii")):
                return Response(json.dumps(errorSchema(401)), mimetype="application/json", status=401)

            # Pass user data to the endpoint.
            userData = {
                "user_id": data['UserID'],
                "creation": data['DateCreated'],
                "username": data['Username'],
                # "password": data['Password'],
                "first_name": data['FirstName'],
                "last_name": data['LastName']
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
    data = request.get_json()
    first_name = data["first_name"]
    last_name = data["last_name"]
    username = data["username"]
    password = bcrypt.hashpw(data["password"].encode(encoding="ascii"), bcrypt.gensalt()).decode("ascii")
    try:
        db.execute(text("insert into Users (FirstName, LastName, Username, Password) VALUES(:first, :last, :user, :passwd);"), first=first_name, last=last_name, user=username, passwd=password)
        db_insert_data = db.execute(text("SELECT * FROM Users where Username=:username and Password=:password;"), username=username, password=password).fetchone()
        return {
            "user_id": db_insert_data['UserID'],
            "creation": db_insert_data['DateCreated'],
            "username": db_insert_data['Username'],
            "first_name": db_insert_data['FirstName'],
            "last_name": db_insert_data['LastName']
        }
    except:
        return errorSchema(400)

# not needed. 
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

    data = request.get_json()
    # grabbing user id to link this contact to the user. 
    userId = data['userid'] 
     # retrivering info from the form to create a new contact. 
    first_name = request.form['first_name']
    last_name = request.form['last_name']
    phone = request.form['phone']
    email = request.form['email']
    address = request.form['address']
    # not sure about the id
    id = request.form['id']
    
    try:
        # insert new contact info into database. 
        db.execute(text("insert into Contacts (UserID, FirstName, LastName, Phone, Email, Address) VALUES (:user_id, :first, :last, :phone, :email, :address);"), user_id= userId,  first=first_name, last=last_name, phone = phone, email = email, address = address)
        # create db_insert_data to return the new contact. 
        db_insert_data = db.execute(text("SELECT * FROM Contacts where FirstName=:firstname and LastName=:lastname;"), firstname=first_name, lastname=last_name).fetchone()
        # i think we return the newly created contact? Not sure. 
        return {
            # id of contact itself. 
            "id: ": db_insert_data['ID'],
            # user that is linked to this contact. 
            "user_id": db_insert_data['UserID'],
            "first_name": db_insert_data['FirstName'],
            "last_name": db_insert_data['LastName'],
            #"creation": db_insert_data['DateCreated'],
            "phone": db_insert_data['Phone'],
            "email": db_insert_data['Email'],
            "address": db_insert_data['Adress']
        }
    except:
        return errorSchema(400)


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
    data = request.get_json()
    # grabbing user id to link this contact to the user. 
    UserId = data['userid'] 
     # retrivering info from the form to edit a contact
    first_name = request.form['first_name']
    last_name = request.form['last_name']
    phone = request.form['phone']
    email = request.form['email']
    address = request.form['address']
    
    try:
        # update contact info in database. # not 100% on this, if it will update the contact we want. Should we select a contact first and then update? 
        # "UPDATE Contacts SET FirstName='first_name', LastName='last_name', Phone='phone', Email='email', Address='address' where ID=id"
        db.execute(text("UPDATE Contacts SET FirstName='first_name', LastName='last_name', Phone='phone', Email='email', Address='address' where ID=id")), 
        # create db_insert_data to return the edited contact. 
        db_insert_data = db.execute(text("SELECT * FROM Contacts where FirstName=:firstname and LastName=:lastname;"), firstname=first_name, lastname=last_name).fetchone()
        # i think we return the updated contact, not sure. 
        return {
            # id of contact itself. 
            "id: ": db_insert_data['ID'],
            # user that is linked to this contact. 
            "user_id": db_insert_data['UserID'],
            "first_name": db_insert_data['FirstName'],
            "last_name": db_insert_data['LastName'],
            #"creation": db_insert_data['DateCreated'],
            "phone": db_insert_data['Phone'],
            "email": db_insert_data['Email'],
            "address": db_insert_data['Adress']
        }

    except:
        return errorSchema(500)
        
   
@app.route("/contact/<id>/", methods=["DELETE"])
@authenticate
def deleteContact(userData, id):
    """
    Delete a contact.
    :return: Error200
    """
    # method i saw on stack overflow, not sure if applicable here. 
    #db.session.delete(id)
    #db.session.commit()

    # method i tried to delete contact by id from database. iffy on sql syntax.  
    db.execute(text("DELETE FROM Contacts WHERE id = %s ", (id))) # sqlalchemy. 
    # return message saying contact deleted? 
    # return to the home screen after deleting contact? 

    assert id == request.view_args["id"]
    return errorSchema(200)


if __name__ == "__main__":
    app.run()