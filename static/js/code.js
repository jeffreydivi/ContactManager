let ENDPOINT = "https://virtserver.swaggerhub.com/jeffreydivi/ContactManager/1.0.0";
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
    let hash = md5(password);

    // Set the success or faliure of the login
    document.getElementById("loginResult").innerHTML = "";


    // let jsonPayLoad = '{"login" : "' + username + '", "password" : "' + hash + '"}';
    // let url = urlBase + '/Login.' + extension;

    // let xhr = new XMLHttpRequest();
    // xhr.open("POST", url, true);
    // xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    let request = new XMLHttpRequest();
    request.open("GET", ENDPOINT + "/user/");
    request.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + hash));

    try {
        request.onreadystatechange = function ()
        {
            // Check if the request was successful and complete
            if (this.readyState === 4 && this.status === 200)
            {
                // Parse the result and capture the id
                let jsonObject = JSON.parse(request.responseText);
                userID = jsonObject.user_id;

                // If the user isn't found, username/password combo is incorrect
                // if (userID < 1)
                // {
                //     console.log("Incorrect username or password");
                //     document.getElementById("loginResult").innerHTML = "Username and password combination incorrect";
                //     return;
                // }

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

// Function to open the new contact popup
function openPopup()
{
    let popup = document.getElementById("popup");
    let contactPage = document.getElementById("contacts-page");

    
    if (popup.style.display === "none")
    {
        contactPage.className = "contacts-page popup-opened";
        popup.style.display = "block";

        console.log(contactPage.className);
    }
}

// Function to close the new contact popup
function closePopup()
{
    let popup = document.getElementById("popup");
    let contactPage = document.getElementById("contacts-page");

    if (popup.style.display === "block")
    {
        popup.style.display = "none";
        // Eliminate blurred background and close popup
        contactPage.classList.remove("popup-opened");
        contactPage.style.filter = "none";
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

function saveCookie()
{
	let minutes = 20;
	let date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",userID=" + userID + ";expires=" + date.toGMTString();
}
