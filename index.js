const express=require('express');
const app=express();

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

app.use(express.json())
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), listEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
var auth2;
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  // const oAuth2Client = new google.auth.OAuth2(
  //     client_id, client_secret, redirect_uris[0]);
  
      auth2 = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(auth2, callback);
    auth2.setCredentials(JSON.parse(token));
    callback(auth2);

  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

var cal;

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  cal = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

// function callMe(){
//   console.log("BHIMA");
// }

// [END calendar_quickstart]
module.exports = {
  SCOPES,
  listEvents
};

app.post("/api/addevent",(req,res)=>{

  const summary = req.body.summary;
  const starttime=req.body.start;
  const endtime=req.body.end;
  const description=req.body.description;
  const at=req.body.attendees.split(",");
  //attendees.push();
  console.log(at)

  at2 = [];
  at.forEach(element => {
    at2.push({"email":element})
  });

  
  // starttime = Date.now;
  // endtime = Date.now;

  var event = {
    'summary': summary,
    'description': description,
    'start': {
      'dateTime': starttime,
      'timeZone': 'IST'
    },
    'end': {
      'dateTime': endtime,
      'timeZone': 'IST'
    },
    'attendees': at2,
    // 'reminders': {
    //   'useDefault': false,
    //   'overrides': [
    //     {'method': 'email', 'minutes': 24 * 60},
    //     {'method': 'popup', 'minutes': 10}
    //   ]
    // },
    'status' : 'confirmed'
  };
  
  cal.events.insert({
    auth: auth2,
    'calendarId': 'primary',
    'resource': event
  },(err, res2) => {
    if (err) {
        console.log(err);
    } else {
        res.send(res2.data);
        console.log(res2.data)
    }
    });
})

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
app.get('/api',(req,res)=>{
  // const calendar = google.calendar({version: 'v3', auth});
  cal.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res2) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res2.data.items;
    if (events.length) {
      const eventlist = [];
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        //res.send(`${start} - ${event.summary}`);
         event1 = {eventtime: start, eventsummary: event.summary, description: event.description, attendees: event.attendees};
         eventlist.push(event1);
        //eventlist = [...eventlist,event1];


      });
      // console.log(eventlist);
      res.send(eventlist);
    } else {
      res.send('No upcoming events found.');
    }
  });

})

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
  console.log(`listening at ${PORT}`);
})