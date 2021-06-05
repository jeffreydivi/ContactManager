# Other
from datetime import datetime, timedelta, tzinfo
import bcrypt
import hashlib
import json
import socket
import logging
import logging
from functools import wraps
# Web server-related
from flask import Flask, send_file, request, Response, make_response
from flask_cors import CORS
# Database communication
from sqlalchemy import create_engine, text, exc
from sqlalchemy.sql.functions import user

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
    f"mysql+mysqlconnector://{config['sql']['username']}:{config['sql']['password']}@{config['sql']['location']}/{config['sql']['database']}"
)


def errorSchema(err_code, description=None):
    if not description:
        description = "Unknown error"
        if err_code == 400:
            description = "Bad request. Please read the docs at http://docs.contactmanager.xyz."
        elif err_code == 401:
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
        elif err_code == 501:
            description = "Endpoint not implemented."
        else:
            description = "Unknown error."
    else:
        description = str(description)

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

            # Did we get a hashed string (auth-via-cookie)?
            if len(password) == 69 and password.index("$256$") == 0:
                # It's a hashed bcrypt string. Use alternate auth check.
                matchWith = "$256$" + hashlib.sha256(data["Password"].encode("ascii")).hexdigest()
                if not (data["Username"] == username and password == matchWith):
                    return Response(json.dumps(errorSchema(401)), mimetype="application/json", status=401)
            else:
                if not bcrypt.checkpw(password.encode(encoding="ascii"), data['Password'].encode(encoding="ascii")):
                    return Response(json.dumps(errorSchema(401)), mimetype="application/json", status=401)

            # Pass user data to the endpoint.
            userData = {
                "user_id": data['UserID'],
                "creation": data['DateCreated'].strftime("%a, %d %b %Y %H:%M:%S GMT"),
                "username": data['Username'],
                "password": data['Password'],
                "first_name": data['FirstName'],
                "last_name": data['LastName']
            }
        except Exception as e:
            # 500 error.
            return Response(json.dumps(errorSchema(500, description=e)), mimetype="application/json", status=500)
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

# Test status: WORKING
@app.route("/user/", methods=["GET"])
@authenticate
def getUser(userData):
    """
    Return the currently logged-in user's account information
    :return: User
    """
    # Just a sample response.
    passwd = "$256$" + hashlib.sha256(userData["password"].encode("ascii")).hexdigest()
    del userData["password"]
    expiry = datetime.now() + timedelta(minutes=20, hours=5)
    resp = make_response(userData)
    resp.set_cookie("username", userData["username"], expires=expiry)
    resp.set_cookie("firstName", userData["first_name"], expires=expiry)
    resp.set_cookie("lastName", userData["last_name"], expires=expiry)
    resp.set_cookie("password", passwd, expires=expiry)
    return resp

# Test status: WORKING
@app.route("/user/", methods=["POST"])
def createUser():
    """
    Create a new account.
    :return: User
    """
    data = request.get_json(force=True)
    first_name = data["first_name"]
    last_name = data["last_name"]
    username = data["username"]
    password = bcrypt.hashpw(data["password"].encode(encoding="ascii"), bcrypt.gensalt()).decode("ascii")
    try:
        db.execute(
            text("insert into Users (FirstName, LastName, Username, Password) VALUES(:first, :last, :user, :passwd);"),
            first=first_name, last=last_name, user=username, passwd=password)
        db_insert_data = db.execute(text("SELECT * FROM Users where Username=:username and Password=:password;"),
                                    username=username, password=password).fetchone()
        resp = make_response({
            "user_id": db_insert_data['UserID'],
            "creation": db_insert_data['DateCreated'].strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "username": db_insert_data['Username'],
            "first_name": db_insert_data['FirstName'],
            "last_name": db_insert_data['LastName']
        })
        expiry = datetime.now() + timedelta(minutes=20, hours=5)
        resp.set_cookie("username", db_insert_data["Username"], expires=expiry)
        resp.set_cookie("password", "$256$" + hashlib.sha256(db_insert_data["Password"].encode("ascii")).hexdigest(), expires=expiry)
        resp.set_cookie("firstName", db_insert_data["FirstName"], expires=expiry)
        resp.set_cookie("lastName", db_insert_data["LastName"], expires=expiry)
        return resp
    except exc.IntegrityError:
        return Response(json.dumps(errorSchema(400)), mimetype="application/json", status=400)
    except Exception as e:
        return Response(json.dumps(errorSchema(500, description=e)), mimetype="application/json", status=500)

# Test status: DEPRECATED
@app.route("/user/", methods=["PATCH"])
@authenticate
def editUser(userData):
    """
    Update the authenticated user's profile
    :return: User
    """
    return Response(json.dumps(errorSchema(501)), mimetype="application/json", status=501)

# Test status: WORKING
@app.route("/contact/list/", methods=["GET"])
@authenticate
def getContactsList(userData):
    """
    Get a list of all contacts
    :return: Contact[]
    """
    try:
        # try to fetch contacts from database, for the given user.
        contacts = db.execute(text("SELECT * FROM Contacts where UserID=:uid;"), uid=userData['user_id']).fetchall()
        # Sadly, we can't just serve it as-is. We have to do it like this.
        fin = []
        for row in contacts:
            fin.append({
                "user_id": row["UserID"],
                "id": row["ID"],
                "creation": row["DateCreated"].strftime("%a, %d %b %Y %H:%M:%S GMT"),
                "first_name": row["FirstName"],
                "last_name": row["LastName"],
                "full_name": row["FullName"],
                "phone": row["Phone"],
                "email": row["Email"],
                "address": row["Address"]
            })
        return Response(json.dumps(fin), mimetype="application/json")
    except Exception as e:
        # return error that a server error (5xx) resulted in an access error.
        return errorSchema(500, description=e)



# Test status: Work Needed
# Just a note: GET requests can't support a JSON body. So we'll use a POST instead.
@app.route("/contact/search/", methods=["POST"])
@authenticate
def searchContacts(userData):
    """
    Find all contacts that match a given query.
    :return: Contact[]
    """
    # grabbing the json info that the user wants to search.
    data = request.get_json(force=True)
    try:
        # grab the text typed by the user and store in search. (most certainly vulnerable code!)
        search = data["search"].replace(";", "").replace("--", "")
        # try to search the database for a contact that matches the search query.
        # TODO: fix the search query. What if we search for "Rose T"? This will yield issues. Or is this what the professor wants?
        search_result = db.execute(text("SELECT * FROM Contacts WHERE FullName LIKE '%" + search + "%' and UserID=:uid"), search=search, uid=userData['user_id']).fetchall()
        # Sadly, we can't just serve it as-is. We have to do it like this.
        fin = []
        for row in search_result:
            fin.append({
                "user_id": row["UserID"],
                "id": row["ID"],
                "creation": row["DateCreated"].strftime("%a, %d %b %Y %H:%M:%S GMT"),
                "first_name": row["FirstName"],
                "last_name": row["LastName"],
                "full_name": row["FullName"],
                "phone": row["Phone"],
                "email": row["Email"],
                "address": row["Address"]
            })
        return Response(json.dumps(fin), mimetype="application/json")
    except Exception as e:
        # contact not found.
        return errorSchema(500, description=e)


# Test status: WORKING
@app.route("/contact/add/", methods=["POST"])
@authenticate
def createContact(userData):
    data = request.get_json(force=True)
    # grabbing user id to link this contact to the user.
    userId = userData['user_id']
    # retrieving info from the form to create a new contact.
    try:
        first_name = data['first_name']
    except:
        first_name = ""

    try:
        last_name = data['last_name']
    except:
        last_name = ""

    try:
        phone = data['phone']
    except:
        phone = ""

    try:
        email = data['email']
    except:
        email = ""

    try:
        address = data['address']
    except:
        address = ""

    try:
        # concatenate the first and last name
        full_name = first_name + " " + last_name

        # insert new contact info into database.
        # db.execute(text(
        #     "insert into Contacts (UserID, FirstName, LastName, FullName, Phone, Email, Address) VALUES (:user_id, :first_name, :last_name, :full_name, :phone, :email, :address);"),
        #            user_id=userId, first_name=first_name, last_name=last_name, full_name=full_name, phone=phone, email=email, address=address)
        db.execute(text(
            "insert into Contacts (UserID, FirstName, LastName, FullName, Phone, Email, Address) VALUES (:user_id, :first_name, :last_name, :full_name, :phone, :email, :address);"),
                   user_id=userId, first_name=first_name, last_name=last_name, full_name=full_name, phone=phone, email=email, address=address)


        # create db_insert_data to return the new contact.
        db_insert_data = db.execute(text("SELECT * FROM Contacts where Email=:email"),
                                    email=email).fetchone()

        # i think we return the newly created contact? Not sure. [we do.]
        return {
            # id of contact itself.
            "id": db_insert_data['ID'],
            # user that is linked to this contact.
            "user_id": db_insert_data['UserID'],
            "first_name": db_insert_data['FirstName'],
            "last_name": db_insert_data['LastName'],
            "full_name": db_insert_data['FullName'],
            "creation": db_insert_data['DateCreated'].strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "phone": db_insert_data['Phone'],
            "email": db_insert_data['Email'],
            "address": db_insert_data['Address']
        }
    except exc.IntegrityError:
        return Response(json.dumps(errorSchema(400)), mimetype="application/json", status=400)
    except Exception as e:
        return Response(json.dumps(errorSchema(500, description=e)), mimetype="application/json", status=500)


# Test status: WORKING
@app.route("/contact/<id>/", methods=["GET"])
@authenticate
def getContact(userData, id):
    """
    Get a single contact.
    :return: Contact
    """
    # Reminder: make sure the contact you request exists!
    assert id == request.view_args["id"]

    try:
        # try to fetch contact from database, where the id matches and the userID matches, therefore the contact is owned by the user.
        contact = db.execute(text("SELECT * FROM Contacts where ID=:id AND UserID=:uid;"), id=id, uid=userData['user_id']).fetchone()
        return {
            "user_id": contact["UserID"],
            "id": contact["ID"],
            "creation": contact["DateCreated"].strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "first_name": contact["FirstName"],
            "last_name": contact["LastName"],
            "full_name": contact['FullName'],
            "phone": contact["Phone"],
            "email": contact["Email"],
            "address": contact["Address"]
        }
    except:
        # return error that we cannot access this contact.
        return Response(json.dumps(errorSchema(404)), mimetype="application/json", status=404)




# Test status: WORKING
@app.route("/contact/<id>/", methods=["PATCH"])
@authenticate
def editContact(userData, id):
    """
    Updates a single contact.
    :return: Contact
    """
    data = request.get_json(force=True)
    db_org_data = db.execute(text("SELECT * FROM Contacts where ID=:id AND UserID=:uid;"),
                                id=id, uid=userData['user_id']).fetchone()

    if not db_org_data:
        return Response(json.dumps(errorSchema(404)), mimetype="application/json", status=404)

    # grabbing user id to link this contact to the user.
    UserId = userData['user_id']
    # retrieving info from the form to edit a contact
    try:
        first_name = data['first_name']
    except:
        first_name = db_org_data["FirstName"]

    try:
        last_name = data['last_name']
    except:
        last_name = db_org_data["LastName"]

    try:
        phone = data['phone']
    except:
        phone = db_org_data["Phone"]

    try:
        email = data['email']
    except:
        email = db_org_data["Email"]

    try:
        address = data['address']
    except:
        address = db_org_data["Address"]

    id = db_org_data["ID"]

    try:
        # concatenate the first and last name
        full_name = first_name + " " + last_name

        # update contact info in database. # not 100% on this, if it will update the contact we want. Should we select a contact first and then update?
        # "UPDATE Contacts SET FirstName='first_name', LastName='last_name', Phone='phone', Email='email', Address='address' where ID=id"
        db.execute(text(
            "UPDATE Contacts SET FirstName=:first_name, LastName=:last_name, FullName=:full_name, Phone=:phone, Email=:email, Address=:address where ID=:id"),
                                    first_name=first_name, last_name=last_name, full_name=full_name, phone=phone, email=email, address=address, id=id),
        # create db_insert_data to return the edited contact.
        db_insert_data = db.execute(text("SELECT * FROM Contacts where ID=:id"),
                                    id=id).fetchone()
        # i think we return the updated contact, not sure.
        return {
            # id of contact itself.
            "id": db_insert_data['ID'],
            # user that is linked to this contact.
            "user_id": db_insert_data['UserID'],
            "first_name": db_insert_data['FirstName'],
            "last_name": db_insert_data['LastName'],
            "full_name": db_insert_data['FullName'],
            "creation": db_insert_data['DateCreated'].strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "phone": db_insert_data['Phone'],
            "email": db_insert_data['Email'],
            "address": db_insert_data['Address']
        }

    except Exception as e:
        return Response(json.dumps(errorSchema(500, description=e)), mimetype="application/json", status=500)

# Test status: WORKING
@app.route("/contact/<id>/", methods=["DELETE"])
@authenticate
def deleteContact(userData, id):
    """
    Delete a contact.
    :return: Error200
    """
    assert id == request.view_args["id"]

    # method i tried to delete contact by id from database. iffy on sql syntax.
    db.execute(text("DELETE FROM Contacts WHERE id = :id "), id=id)
    return errorSchema(200)


if __name__ == "__main__":
    app.run()
