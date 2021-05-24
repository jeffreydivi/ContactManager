var userID = 0;
var firstName = "";
var lastName = "";

function doLogin() 
{
    userID = 0;
    firstName = "";
    lastName = "";

    // var username = document.getElementById("username").value;
    // var password = document.getElementById("password").value;
    var username = "pickles";
    var password = "ilovepickles";
    var hash = md5(password);

    // Set the success or faliure of the login
    document.getElementById("loginResult").innerHTML = "";


    // var jsonPayLoad = '{"login" : "' + username + '", "password" : "' + hash + '"}';
    // var url = urlBase + '/Login.' + extension;

    // var xhr = new XMLHttpRequest();
    // xhr.open("POST", url, true);
    // xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    var request = new XMLHttpRequest();
    request.open("GET", "https://virtserver.swaggerhub.com/jeffreydivi/ContactManager/1.0.0/user/");
    request.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + hash));

    try {
        request.onreadystatechange = function () 
        {
            // Check if the request was successful and complete
            if (this.readyState === 4 && this.status === 200) 
            {
                // Parse the result and capture the id
                var jsonObject = JSON.parse(request.responseText);
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

                document.getElementById("current-user").innerHTML = firstName;

                console.log("Login successful");
                saveCookie();
                simulatePageChange();
            }
            // If the user isn't found, username/password combo is incorrect
            else if (this.readyState === 4 && this.status === 401) 
            {
                document.getElementById("loginResult").innerHTML = "Incorrect username or password";
                console.log("Incorrect username or password");
                return;
            } 
            else 
            {
                document.getElementById("loginResult").innerHTML = "Could not log in: HTTP error " + this.status + " Ready state: " + this.readyState;
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
    var loginPage = document.getElementById("login-register");
    var contactPage = document.getElementById("user-contacts");

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
    var loginForm = document.getElementById("login");
    var registerForm = document.getElementById("new-user");

    var title = document.getElementById("title");
    var register = document.getElementById("register");

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
	var minutes = 20;
	var date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));	
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",userID=" + userID + ";expires=" + date.toGMTString();
}