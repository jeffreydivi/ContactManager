// Use endpoint associated with current server.
let ENDPOINT = "";

let firstName = "";
let lastName = "";
let username = "";
let password = "";

function doLogin()
{
    firstName = "";
    lastName = "";
    username = "";
    password = "";

    username = document.getElementById("username").value;
    password = document.getElementById("password").value;


    // Set the success or failure of the login
    document.getElementById("loginResult").innerText = "";

    let request = new XMLHttpRequest();
    request.open("GET", ENDPOINT + "/user/");
    request.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try {
        request.onreadystatechange = function ()
        {
            // Check if the request was successful and complete
            if (this.readyState === 4 && this.status === 200)
            {
                // Parse the result and capture the id
                let jsonObject = JSON.parse(request.responseText);
                console.log(jsonObject)

                firstName = jsonObject.first_name;
                lastName = jsonObject.last_name;

                // Pro-tip: Avoid innerHTML if you can. It can lead to a cross-site scripting attack if a user-provided string is present.
                // innerText is preferred (usually).
                document.getElementById("current-user").innerText = firstName;

                console.log("Login successful");
                simulatePageChange();
            }
            // If the user isn't found, username/password combo is incorrect
            else if (this.readyState === 4 && this.status === 401)
            {
                document.getElementById("loginResult").innerText = "Incorrect username or password";
                console.error("Incorrect username or password");
                return;
            }
            // Just in case bad config stuff happens.
            else if (this.readyState === 4 && this.status === 0)
            {
                document.getElementById("loginResult").innerText = "Could not log in due to a CORS exception.\nCheck the server's configuration.";
                // JavaScript has stderr too!
                console.error("Could not log in due to a CORS exception. This is likely a server issue or a weird browser extension. Please read https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS for more details.");
            }
            // Don't error when we're still loading!
            else if (this.readyState === 4)
            {
                document.getElementById("loginResult").innerText = "Could not log in.\nHTTP error " + this.status + " Ready state: " + this.readyState;
                return;
            }
        };

        request.send();
    }
    catch(err)
    {
        document.getElementById("loginResult").innerHTML = err.message;
    }

}

function doLogOut()
{
    firstName = "";
    lastName = "";
    username = "";
    password = "";

    let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++)
    {
        let currentCookie = cookies[i].trim();
        currentCookie = currentCookie.split("=");
        document.cookie += `${currentCookie[1]}=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }

    // clear contacts pane
    document.getElementById("contacts-pane").innerHTML = "";

    // Reset the form
    document.getElementById("login-form").reset();
    document.getElementById("registration-form").reset();
    document.getElementById("loginResult").innerText = "";
    document.getElementById("newUserResult").innerText = "";

    console.log("Logout successful");

    // Go back to login page
    simulatePageChange();
}

// STATUS: logic working, needs connection to user interface
function deleteContact() {
    // contactID needs to be set to the contact the user is trying to access
    // **8 is a placeholder for testing**
    let contactID = 8;
    let api_url = ENDPOINT + "/contact/" + contactID + "/";
    let contact;

    // send xhr request using xhr.send() and make sure contactID is correct

    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Contact deleted");
                contact = xhr.response
                console.log(contact);
            }
            else if (this.readyState == 4 && this.status == 401)
            {
                console.error("You are not logged in.");
            }
            else if (this.readyState == 4 && this.status == 403)
            {
                console.error("You do not have permission to view this contact.");
            }
            else if (this.readyState == 4 && this.status == 404)
            {
                console.error("Contact not found.");
            }
        };
        xhr.send();
    }
    catch(err){
        console.error("error in getSingleContact: " + err.message);
    }
}

// STATUS: WIP
function editContact() {
    // contactID needs to be set to the contact the user is trying to access
    // **8 is a placeholder for testing**
    let contactID = 8;
    let api_url = ENDPOINT + "/contact/" + contactID + "/";
    let contact;

    // pull data using getElementByID.value in edit screen
    // set that equal to the body of the xhr request
    // send body to index.py with xhr.send();
    // contact updated

    let xhr = new XMLHttpRequest();
    xhr.open("PATCH", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Single contact request returned");
                contact = xhr.response
                console.log(contact);
            }
            else if (this.readyState == 4 && this.status == 401)
            {
                console.error("You are not logged in.");
            }
            else if (this.readyState == 4 && this.status == 403)
            {
                console.error("You do not have permission to view this contact.");
            }
            else if (this.readyState == 4 && this.status == 404)
            {
                console.error("Contact not found.");
            }
        };
        xhr.send();
    }
    catch(err){
        console.error("error in getSingleContact: " + err.message);
    }
}

// STATUS: logic working, needs connection to user interface
function getSingleContact() {
    // contactID needs to be set to the contact the user is trying to access
    // **8 is a placeholder for testing**
    let contactID = 8;
    let api_url = ENDPOINT + "/contact/" + contactID + "/";
    let contact;

    let xhr = new XMLHttpRequest();
    xhr.open("GET", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Single contact request returned");
                contact = xhr.response
                console.log(contact);
            }
            else if (this.readyState == 4 && this.status == 401)
            {
                console.error("You are not logged in.");
            }
            else if (this.readyState == 4 && this.status == 403)
            {
                console.error("You do not have permission to view this contact.");
            }
            else if (this.readyState == 4 && this.status == 404)
            {
                console.error("Contact not found.");
            }
        };
        xhr.send();
    }
    catch(err){
        console.error("error in getSingleContact: " + err.message);
    }
}

// STATUS: JS partially finished
// Waiting on API python function for search to be finished before full js implementation
function searchContactList() {
    // clear old search results
    document.getElementById("contacts-pane").innerHTML = "";

    let api_url = ENDPOINT + "/contact/search/";

    // get search value
    console.log("Searching for " + document.getElementById("searchVal").value);
    let search = document.getElementById("searchVal").value;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", api_url, true);
    let jsonPayload = JSON.stringify({"search":search});
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Search query returned");
                // contactList = xhr.response;
                let jsonObject = JSON.parse(xhr.responseText);

                for (var i = 0; i < jsonObject.length; i++)
                {
                    console.log("Contact found: " + jsonObject[i].first_name);

                    createContactCard(jsonObject[i].first_name, jsonObject[i].last_name, jsonObject[i].phone, jsonObject[i].email, jsonObject[i].address);
                }

            }
            else if (this.readyState == 4 && this.status == 401)
            {
                console.error("You are not logged in.");
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err){
        console.error("error in getContactsList: " + err.message);
    }
}

// STATUS: working
function getContactsList() {
    let api_url = ENDPOINT + "/contact/list/";
    let contactList;

    let xhr = new XMLHttpRequest();
    xhr.open("GET", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Contact list recieved");
                contactList = xhr.response
                console.log(contactList);
            }
            else if (this.readyState == 4 && this.status == 401)
            {
                console.error("You are not logged in.");
            }
        };
        xhr.send();
    }
    catch(err){
        console.error("error in getContactsList: " + err.message);
    }
}

// STATUS: working
function createContact() {
    let contactFirstName = "";
    let contactLastName = "";
    let phone = "";
    let email = "";
    let address = "";

    contactFirstName = document.getElementById("new-contact-first-name").value;
    contactLastName = document.getElementById("new-contact-last-name").value;
    phone = document.getElementById("new-contact-phone").value;
    email = document.getElementById("new-contact-email").value;
    address = document.getElementById("new-contact-address").value;

    let jsonPayload = '{"first_name" : "' + contactFirstName + '", "last_name" : "' + contactLastName + '", "phone" : "' + phone + '", "email" : "' + email + '", "address" : "' + address + '"}';
    let api_url = ENDPOINT + "/contact/add/";

    let xhr = new XMLHttpRequest();
    xhr.open("POST", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Contact added");
            }
        };
        xhr.send(jsonPayload);
        // not final contact card
        createContactCard(contactFirstName, contactLastName, phone, email, address);
    }
    catch(err){
        console.error("error in createContact: " + err.message);
    }
}

function createContactCard(firstName, lastName, phone, email, address) {

    document.getElementById("contacts-pane").innerHTML +=

        "<div class='card' style='width: 25em;'>" +
            "<div class='card-body'>" +
                "<h5 class='card-title'><span id='contact-first-name'>" + firstName + " " + "</span><span id='contact-last-name'>" + lastName + "</span></h5>" +
                "<p class='card-text'><span id='contact-phone'>Phone: " + phone + "</span><span id='contact-email'> <br> Email: " + email + "</span><span id='contact-add'> <br> Address: " + address + "</span></p>" +
                "<button type='button' class='edit-btn btn btn-primary mr-2' id='edit-btn' data-toggle='modal' data-target='#edit-contact-popup'>Edit</button>" +
                "<button type='button' class='btn btn-danger delete-btn' id='delete-btn' data-toggle='modal' data-target='#delete-contact-popup'>Delete</button>" +
            "</div>" +
        "</div>";
}

// STATUS: working
function createAccount() {
    firstName = "";
    lastName = "";
    username = "";
    password = "";

    console.log(username)
    console.log(password)

    firstName = document.getElementById("new-first").value;
    lastName = document.getElementById("new-last").value;
    username = document.getElementById("new-username").value;
    password = document.getElementById("new-pass").value;

    let jsonPayload = '{"first_name" : "' + firstName + '", "last_name" : "' + lastName + '", "username" : "' + username + '", "password" : "' + password + '"}';
    let api_url = ENDPOINT + "/user/";

    console.log(jsonPayload);

    let xhr = new XMLHttpRequest();
    xhr.open("POST", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    try {
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                document.getElementById("newUserResult").innerText = "Registration successful";
                console.log("Registration successful");
                doLoginAfterCreate(true);
            }
            else if (this.readyState == 4 && this.status == 400)
            {
                document.getElementById("newUserResult").innerText = "User with this username already exits";
                console.error("User with this username already exits");
                return;
            }
        };
        xhr.send(jsonPayload)
    }
    catch(err){
        document.getElementById("newUserResult").innerHTML = err.message;
    }

}

// STATUS: working
function doLoginAfterCreate(doAnimate)
{
    readCookie();
    console.log(username + " " + password);
    document.getElementById("current-user").innerText = firstName;
    console.log("Login successful");
    simulatePageChange();
}

function readCookie()
{
	let data = document.cookie;
	let splits = data.split(";");
	for (let i = 0; i < splits.length; i++)
	{
        let thisOne = splits[i].trim();
		let tokens = thisOne.split("=");
		if( tokens[0] == "firstName" )
		{
			firstName = tokens[1];
		}
		else if( tokens[0] == "lastName" )
		{
            lastName = tokens[1];
		}
        else if( tokens[0] == "username" )
		{
            username = tokens[1];
		}
        else if( tokens[0] == "password" )
		{
            password = tokens[1];
		}
	}
}


// Function to simulate login page change
function simulatePageChange()
{
    let loginPage = document.getElementById("login-register");
    let contactPage = document.getElementById("user-contacts");

    if (contactPage.style.display === "none")
    {
        contactPage.style.display = "block";
        loginPage.style.display = "none";
    }
    else
    {
        // Go back to login form
        let registerForm = document.getElementById("new-user");
        if (registerForm.style.display === "block")
        {
            switchForms();
        }
        loginPage.style.display = "block";

        contactPage.style.display = "none";
    }
}

// Function to switch from login to register form and vice versa
function switchForms()
{
    let loginForm = document.getElementById("login");
    let registerForm = document.getElementById("new-user");

    let title = document.getElementById("title");
    let register = document.getElementById("register");

    if (registerForm.style.display === "none")
    {
        registerForm.style.display = "block";
        register.style.display = "block";

        loginForm.style.display = "none";
        title.style.display = "none";
    }
    else
    {
        loginForm.style.display = "block";
        title.style.display = "block";

        registerForm.style.display = "none";
        register.style.display = "none";
    }
}

window.onload = (evt) => {
    if (document.cookie.indexOf("password=") != -1)
        doLoginAfterCreate(false);
}
