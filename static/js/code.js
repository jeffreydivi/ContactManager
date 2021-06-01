// Use endpoint associated with current server.
let ENDPOINT = "https://contactmanager.xyz";

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
    firstName = "";
    lastName = "";
    username = "";
    password = "";
    document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";

    // Reset the form
    document.getElementById("login-form").reset();
    document.getElementById("registration-form").reset();
    document.getElementById("loginResult").innerText = "";
    document.getElementById("newUserResult").innerText = "";
    
    console.log("Logout successful");

    // Go back to login page
    simulatePageChange();
}

function createAccount() {
    firstName = "";
    lastName = "";
    username = "";
    password = "";

    let api_url = ENDPOINT + "/user/"
    
    firstName = document.getElementById("new-first").value;
    lastName = document.getElementById("new-last").value;
    username = document.getElementById("new-username").value;
    password = document.getElementById("new-pass").value;
    
    let jsonPayload = '{"first_name" : "' + firstName + '", "last_name" : "' + lastName + '", "username" : "' + username + '", "password" : "' + password + '"}';
    
    console.log(jsonPayload);
    
    let xhr = new XMLHttpRequest();
    xhr.open("POST", api_url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    
    try{
        xhr.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                document.getElementById("newUserResult").innerText = "Registration successful";
                console.log("Registration successful");
            }
            else if (this.readyState == 4 && this.status == 400)
            {
                document.getElementById("newUserResult").innerText = "User with this username already exits";
                console.error("User with this username already exits");
                return;
            }
        };
        xhr.send(jsonPayload);
        saveCookie();
        doLoginAfterCreate();
    }
    catch(err){
        document.getElementById("newUserResult").innerHTML = err.message;
    }
    
}

function doLoginAfterCreate() 
{
    readCookie();
    console.log(username + " " + password);
    document.getElementById("current-user").innerText = firstName;
    console.log("Login successful");
    simulatePageChange();
}

function readCookie()
{
	var data = document.cookie;
	var splits = data.split(",");
	for(var i = 0; i < splits.length; i++) 
	{
        var thisOne = splits[i].trim();
		var tokens = thisOne.split("=");
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

function saveCookie()
{
    let minutes = 20;
	let date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",username=" + username + ",password=" + password + ";expires=" + date.toGMTString();
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