//copyright 2015 Jonathan Cox; MIT License

/*TODO: Add an alert on extension that lets user know when they have unanswered
friend requests*/

/*
MESSAGING
*/

/*Listen for external messaging from the website, and update location immediately
after a user registers*/
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
      console.log("message received" + request.registered)
      //Website will wait for a response. If none received, will prompt user to go to Chrome web store
      tick()
      sendResponse({success:'success'})
      /*Set a "registered" item in localStorage so that the program knows to
      run in the future.*/
      window.localStorage.setItem('registered', 'yes');
});

/*Open the sunneversetson.us page when the user clicks the chrome extension
button*/
chrome.browserAction.onClicked.addListener(function(activeTab)
{
    tick()
    var newURL = "http://www.sunneversetson.us/";
    chrome.tabs.create({ url: newURL });
});

/*run the program when the user logs in to their computer, and then run again
every 15 minutes.*/
if (window.localStorage.getItem('registered')) {
    tick()
    setInterval(tick, 900000) //1,000 * 60 * 15
}


//Redirect users who just installed the extension to sunneversetson.us
if (!window.localStorage.getItem('hasSeenIntro')) {
  window.localStorage.setItem('hasSeenIntro', 'yes');
  chrome.tabs.create({
    url: 'http://sunneversetson.us'
  });
}

/*
GET THE USER'S LOCATION AS CITY AND COUNTRY
*/

/*Make AJAX request to Google Maps API, then call the
getCountryAndCity() function to get the country and city names*/
function askGoogleMaps(position) {
    var lat = position.coords.latitude
    var long = position.coords.longitude
    $.ajax({
       url: 'http://maps.googleapis.com/maps/api/geocode/json?latlng='
       +lat+','+long+'&sensor=false',
       success: function(data){
           var formatted = data.results;
           var components = formatted[0]['address_components']
           getCountryAndCity(components)
       }
   })
}
//Use Google's reverse geocoding API to get country and city names
function getCountryAndCity(components) {
    for (i=0;i<components.length;i++) {
        //a city has categories "political" and "locality."
        if (components[i]['types'].indexOf('political')>-1
        && components[i]['types'].indexOf('locality')>-1) {
            var city = components[i]['long_name'];
        }
    }
    for (i=0;i<components.length;i++) {
        //a country has categories "political" and "country"
        if (components[i]['types'].indexOf('political')>-1
        && components[i]['types'].indexOf('country')>-1) {
            var country = components[i]['long_name'];
            makeCorsRequest(city, country);
        };
    };
}

/*
SEND XHR TO THE SITE
*/

// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  /*turn on withCredentials so that the cross-site Access-Control request
  can include headers and cookies. This is necessary so that the site knows
  which user is sending the request.*/
  if ("withCredentials" in xhr) {
    // XHR for Chrome
    xhr.open(method, url, true);
  }
  else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Make the actual CORS request.
function makeCorsRequest(city, country) {
  // Sun Never Sets on Us supports CORS
  var url = 'http://www.sunneversetson.us/update_location/';
  var xhr = createCORSRequest('POST', url);
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  xhr.onerror = function() {
    console.log('There was an error posting location to the Django site.');
  };
  /*Have to specify form encoding so that Django site knows what to do with XHR
  request*/
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
  xhr.send("city="+city+"&country="+country);
}

/*
GET LOCATION AND SEND TO SITE
*/

//Use HTML5 navigator API to get user's latitude and longitude
function tick() {
    navigator.geolocation.getCurrentPosition(askGoogleMaps)
}
