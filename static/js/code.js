// Use endpoint associated with current server.
let ENDPOINT = "";

let firstName = "";
let lastName = "";
let username = "";
let password = "";

let prevSearch = "";

function doLogin()
{
    firstName = "";
    lastName = "";
    username = "";
    password = "";

    username = document.getElementById("username").value;
    password = document.getElementById("password").value;

    document.getElementById("searchVal").value = "";


    // Set the success or failure of the login
    document.getElementById("loginResult").innerText = "";
    document.getElementById("newUserResult").innerText = "";

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
    document.querySelector("#noContacts > h3").innerText = "Start Your Journey.";
    document.getElementById("noContacts").style.display = "block";
    document.getElementById("searchVal").value = "";

    // Reset the form
    document.getElementById("login-form").reset();
    document.getElementById("registration-form").reset();
    document.getElementById("add-contact-form").reset();
    document.getElementById("loginResult").innerText = "";
    document.getElementById("newUserResult").innerText = "";

    console.log("Logout successful");

    // Go back to login page
    simulatePageChange();
}

// STATUS: working
function deleteContact() {
    let contactID = localStorage.getItem('id');
    console.log("Contact ID: " + contactID);
    let api_url = ENDPOINT + "/contact/" + contactID + "/";

    // send xhr request using xhr.send() and make sure contactID is correct

    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", api_url, true);
    let jsonPayload = JSON.stringify({"id":contactID});

    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Contact deleted");

                // TO DO: re-search for previous search
                // re-search for all contacts
                getContactsList();

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
        xhr.send(jsonPayload);
    }
    catch(err){
        console.error("error in getSingleContact: " + err.message);
    }
}

// STATUS: working
function editContact() {
    let contactID = localStorage.getItem('id');
    console.log("Contact ID: " + contactID);
    let api_url = ENDPOINT + "/contact/" + contactID + "/";

    let contactFirstName = document.getElementById("edit-contact-first-name").value;
    let contactLastName = document.getElementById("edit-contact-last-name").value;
    let contactPhone = document.getElementById("edit-contact-phone").value;
    let contactEmail = document.getElementById("edit-contact-email").value;
    let contactAddress = document.getElementById("edit-contact-address").value;

    $('#edit-contact-popup').modal('hide');

    let xhr = new XMLHttpRequest();
    xhr.open("PATCH", api_url, true);

    let jsonPayload = JSON.stringify({"first_name":contactFirstName, "last_name":contactLastName, "phone":contactPhone, "email":contactEmail, "address":contactAddress});

    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Single contact request returned");

                // TO DO: re-search for previous search
                // re-search for all contacts
                getContactsList();
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
        xhr.send(jsonPayload);
    }
    catch(err){
        console.error("error in getSingleContact: " + err.message);
    }
}

// STATUS: logic working, needs connection to user interface
function getSingleContact() {
    // contactID needs to be set to the contact the user is trying to access
    // **8 is a placeholder for testing**
    let contactID = localStorage.getItem('id');
    let api_url = ENDPOINT + "/contact/" + contactID + "/";

    let xhr = new XMLHttpRequest();
    xhr.open("GET", api_url, true);

    let jsonPayload = JSON.stringify({"id":contactID});

    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                console.log("Single contact request returned");


                let jsonObject = JSON.parse(xhr.responseText);

                console.log("Got contact info for: " + jsonObject.first_name);

                let dateObject = new Date(jsonObject.creation);

                document.getElementById("edit-contact-first-name").value = jsonObject.first_name;
                document.getElementById("edit-contact-last-name").value = jsonObject.last_name;
                document.getElementById("edit-contact-phone").value = jsonObject.phone;
                document.getElementById("edit-contact-email").value = jsonObject.email;
                document.getElementById("edit-contact-address").value = jsonObject.address;
                document.getElementById("created_date").innerText = `Created on ${dateObject.toLocaleDateString()} at ${dateObject.toLocaleTimeString()}.`;
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
        xhr.send(jsonPayload);
    }
    catch(err){
        console.error("error in getSingleContact: " + err.message);
    }
}

// STATUS: working
function searchContactList() {
    let api_url = ENDPOINT + "/contact/search/";

    // get search value
    console.log("Searching for " + document.getElementById("searchVal").value);
    let search = document.getElementById("searchVal").value;
    // Save the previous search
    prevSearch = search;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", api_url, true);
    let jsonPayload = JSON.stringify({"search":search});
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));

    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState === 4)
            {
                // clear old search results
                document.getElementById("contacts-pane").innerHTML = "";
            }
            if (this.readyState === 4 && this.status === 200)
            {
                console.log("Search query returned");
                // contactList = xhr.response;
                let jsonObject = JSON.parse(xhr.responseText);

                if (jsonObject.length === 0)
                    document.getElementById("noContacts").style.display = "block";
                else
                    document.getElementById("noContacts").style.display = "none";

                for (var i = 0; i < jsonObject.length; i++)
                {
                    console.log(jsonObject[i]);
                    console.log("Contact found: " + jsonObject[i].first_name);

                    createContactCard(jsonObject[i].first_name, jsonObject[i].last_name, jsonObject[i].phone, jsonObject[i].email, jsonObject[i].address, jsonObject[i].id);
                }

                if (jsonObject.length === 0)
                    document.querySelector("#noContacts > h3").innerText = "No Contacts Found";

            }
            else if (this.readyState === 4 && this.status === 401)
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
    document.getElementById("contacts-pane").innerHTML = "";

    let api_url = ENDPOINT + "/contact/search/";

    let search = prevSearch;
    console.log("Previous search was: " + search);

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
                console.log("Contact list recieved");
                let jsonObject = JSON.parse(xhr.responseText);

                if (jsonObject.length === 0)
                    document.getElementById("noContacts").style.display = "block";
                else
                    document.getElementById("noContacts").style.display = "none";

                for (var i = 0; i < jsonObject.length; i++)
                {
                    // console.log(jsonObject[i]);
                    // console.log("Contact found: " + jsonObject[i].first_name);

                    createContactCard(jsonObject[i].first_name, jsonObject[i].last_name, jsonObject[i].phone, jsonObject[i].email, jsonObject[i].address, jsonObject[i].id);
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

function clearAddContactForm() {
    document.getElementById("add-contact-form").reset();
    document.getElementById("addContactResult").innerText = "";
}

function checkContactFields(functionCall) {

    if (functionCall.localeCompare('edit-close') == 0)
    {
        document.getElementById("edit-empty-field-error").innerText = "";
        $('#edit-contact-popup').modal('hide');
        return;
    }
    else if (functionCall.localeCompare('add-close') == 0)
    {
        document.getElementById("create-empty-field-error").innerText = "";
        $('#add-contact-popup').modal('hide');
        clearAddContactForm();
        return;
    }

    let contactFirstName = "";
    let contactLastName = "";
    let phone = "";
    let email = "";
    let address = "";
    let blank = "";
    let space = " ";

    contactFirstName = document.getElementById(functionCall + "-contact-first-name").value;
    contactLastName = document.getElementById(functionCall + "-contact-last-name").value;
    phone = document.getElementById(functionCall + "-contact-phone").value;
    email = document.getElementById(functionCall + "-contact-email").value;
    address = document.getElementById(functionCall + "-contact-address").value;


    if ( (contactFirstName.localeCompare(blank) == 0 || contactFirstName.localeCompare(space) == 0) && 
         (contactLastName.localeCompare(blank) == 0 || contactLastName.localeCompare(space) == 0) && 
         (phone.localeCompare(blank) == 0 || phone.localeCompare(space) == 0) && 
         (email.localeCompare(blank) == 0 || email.localeCompare(space) == 0) && 
         (address.localeCompare(blank) == 0 || address.localeCompare(space) == 0) ) {
            document.getElementById(functionCall + "-empty-field-error").innerText = "Cannot save empty contact";
            return;
    }
    else if (contactFirstName.localeCompare(blank) == 0 || contactFirstName.localeCompare(space) == 0) {
        document.getElementById(functionCall + "-empty-field-error").innerText = "First name field is required";
            return;

    }
    else {

        if (contactFirstName.localeCompare(blank)) {

        }

        document.getElementById(functionCall + "-empty-field-error").innerText = "";
        if (functionCall.localeCompare('create') == 0)
            createContact();
        else if (functionCall.localeCompare('edit') == 0)
            editContact();
    }
}

// STATUS: working
function createContact() {
    let contactFirstName = "";
    let contactLastName = "";
    let phone = "";
    let email = "";
    let address = "";

    contactFirstName = document.getElementById("create-contact-first-name").value;
    contactLastName = document.getElementById("create-contact-last-name").value;
    phone = document.getElementById("create-contact-phone").value;
    email = document.getElementById("create-contact-email").value;
    address = document.getElementById("create-contact-address").value;

    $('#add-contact-popup').modal('hide');
    document.getElementById("addContactResult").innerText = "";

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
                document.getElementById("addContactResult").innerText = "Contact successfully added";

                // re-search
                getContactsList();
                // clear the contact form
                clearAddContactForm();
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err){
        console.error("error in createContact: " + err.message);
    }
}

function saveContactInfo(id) {
    localStorage.setItem("id", id);
}

function createContactCard(firstName, lastName, phone, email, address, id) {

    document.getElementById("contacts-pane").innerHTML +=

        `<div class='card contact-card'>
        <div class='card-body'>
            <img class="pfp" src="https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=retro&size=225">
            <h5 class='card-title'>
                <span id='contact-first-name'>${firstName}</span>
                <span id='contact-last-name'>${lastName}</span>
            </h5>
            <p class='card-text'>
                <span id='contact-phone'>Phone: ${phoneNumberIfy(phone)}</span>
                <br>
                <span id='contact-email'>Email: ${email}</span>
                <br>
                <span id='contact-add'>Address: ${address}</span>
            </p>
            <button type='button' class='edit-btn btn btn-primary mr-2' id='edit-btn' data-toggle='modal' data-target='#edit-contact-popup' onclick='saveContactInfo(${id}); getSingleContact()'>Edit</button>
            <button type='button' class='btn btn-danger delete-btn' id='delete-btn' data-toggle='modal' data-target='#delete-contact-popup' onclick='saveContactInfo(${id})'>Delete</button>
        </div>
    </div>`;
}

// STATUS: working
function createAccount() {
    firstName = "";
    lastName = "";
    username = "";
    password = "";

    document.getElementById("loginResult").innerText = "";
    document.getElementById("newUserResult").innerText = "";

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
                document.getElementById("newUserResult").innerText = xhr.response.description;
                return;
            }
        };
        xhr.responseType = "json";
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
    document.getElementById("loginResult").innerText = "";
    document.getElementById("newUserResult").innerText = "";

    let loginPage = document.getElementById("login-register");
    let contactPage = document.getElementById("user-contacts");

    if (contactPage.style.display === "none")
    {
        contactPage.classList.add("page-transition");
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
    document.getElementById("loginResult").innerText = "";
    document.getElementById("newUserResult").innerText = "";

    let loginForm = document.getElementById("login");
    let registerForm = document.getElementById("new-user");

    let title = document.getElementById("title");
    let register = document.getElementById("register");

    if (registerForm.style.display === "none")
    {
        registerForm.style.display = "block";
        register.style.display = "block";

        registerForm.classList.add("form-animate-in");
        register.classList.add("form-animate-in");

        loginForm.style.display = "none";
        title.style.display = "none";

    }
    else
    {
        loginForm.style.display = "block";
        title.style.display = "inline";

        registerForm.style.display = "none";
        register.style.display = "none";
    }
}

// Turn phone number string into a general format.
function phoneNumberIfy(str) {
    let num = str.replaceAll(/\D/g, "");
    if (num.length === 10)
        return `(${num.substring(0,3)}) ${num.substring(3,6)}-${num.substring(6)}`;
    else
        return str;
}

window.onload = (evt) => {
    // Log in automatically (if possible)
    if (document.cookie.indexOf("password=") !== -1)
        doLoginAfterCreate(false);

    // Click-enter-to-submit code
    document.getElementById("searchVal").onkeyup = (evt) => {
        searchContactList();
    }
    document.getElementById("password").onkeyup = (evt) => {
        if (evt.key === "Enter")
            doLogin();
    }
    document.getElementById("username").onkeyup = (evt) => {
        if (evt.key === "Enter")
            doLogin();
    }
    document.getElementById("new-username").onkeyup = (evt) => {
        if (evt.key === "Enter")
            createAccount();
    }
    document.getElementById("new-password").onkeyup = (evt) => {
        if (evt.key === "Enter")
            createAccount();
    }
    document.getElementById("new-first").onkeyup = (evt) => {
        if (evt.key === "Enter")
            createAccount();
    }
    document.getElementById("new-last").onkeyup = (evt) => {
        if (evt.key === "Enter")
            createAccount();
    }
}
