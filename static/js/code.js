// Use endpoint associated with current server.
let ENDPOINT = "https://contactmanager.xyz";
// let ENDPOINT = "https://virtserver.swaggerhub.com/jeffreydivi/ContactManager/1.0.0";
let userID = 0;
let firstName = "";
let lastName = "";

function doLogin()
{
    userID = 0;
    firstName = "";
    lastName = "";

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    // let hash = md5(password);

    // Set the success or failure of the login
    document.getElementById("loginResult").innerHTML = "";

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
                userID = jsonObject.user_id;

                firstName = jsonObject.first_name;
                lastName = jsonObject.last_name;

                // Pro-tip: Avoid innerHTML if you can. It can lead to a cross-site scripting attack if a user-provided string is present.
                // innerText is preferred (usually).
                document.getElementById("current-user").innerText = firstName;

                console.log("Login successful");
                saveCookie();
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
    userID = 0;
    firstName = "";
    lastName = "";
    document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";

    // Reset the form
    document.getElementById("login-form").reset();

    // Go back to login page
    simulatePageChange();
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

function createAccount() {
    let api_url = ENDPOINT + "/user/"

    firstName = document.getElementById("new-first").value;
    lastName = document.getElementById("new-last").value;
    let username = document.getElementById("new-username").value;
    let password = document.getElementById("new-pass").value;

    let jsonPayload = {
        first_name: firstName,
        last_name: firstName,
        username: username,
        password: password
    };
    JSON.stringify(jsonPayload);

    console.log(jsonPayload);

    let xhr = new XMLHttpRequest();
    xhr.open("POST", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    try{
        xhr.send(jsonPayload);
    }
    catch(err){
        // error msg
    }
}

function saveCookie()
{
	let minutes = 20;
	let date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",userID=" + userID + ";expires=" + date.toGMTString();
}
