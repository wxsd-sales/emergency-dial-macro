/********************************************************
 *
 * Macro Author:      	Taylor Hanson
 *                    	Solutions Engineer
 *                   	  tahanson@cisco.com
 *                    	Cisco Systems
 *
 * Version: 1-0-0
 * Released: 06/18/24
 *
 * Example macro which adds devices to an Instant Webex Meeting.
 * Requests other devices using the /devices GET API and a Bot Token.
 * Invites those other devices to the Instant Meeting.
 * 
 * Other Devices should have the Auto Answer Macro.
 * Full Readme, source code and license details for this macro
 * are available on Github:
 * https://github.com/wxsd-sales/emergency-dial-macro
 *
 ********************************************************/

import xapi from 'xapi';

/********************************************************
* Settings - 
* The only Setting that must be configured in this macro is BOT_TOKEN
* Create a bot on developer.webex.com, then in Control Hub,
* Add this bot to each Answering device's workspace as Read Only in Control Hub.
*********************************************************/
const config = {
      "bot_token": "",
      // "client_id": "",
      // "client_secret": "",
      // "refresh_token": "",
      // "tag": "emergency_dial"
}

const HOMESCREEN_CONTROLS_HIDDEN = true; //Can be set to true to "lock" homescreen, or false to allow default device functionality on Homescreen.
const MACRO_NAME = "Emergency Dial";
const MACRO_COLOR = "#e01b2f";


/********** DO NOT CHANGE BELOW VARIABLES UNLESS YOU ARE MODIFYING THE WORKFLOW *************************/
const refreshSeconds = 86400;//Only applicable if using Service App - how often to refresh the token, in seconds.
var SYSTEM_SIP_URI; //Do not manually set.
var ACCESS_TOKEN; //Do not manually set.
var REQUIRE_TAG = false; //Do not manually set.

xapi.event.on('UserInterface Extensions Panel Clicked', async function(event){
    console.log(event.PanelId, " pressed");
    if(event.PanelId == 'emergency_dial'){
      xapi.command("UserInterface Message Prompt Display", {
        Title: "Emergency Dial",
        Text: 'This is for emergencies only. Do you want to continue?',
        FeedbackId: 'meeting_start',
        'Option.1': 'Continue',
        'Option.2': 'Exit',
      }).catch((error) => { 
        console.error("Prompt Display Error:")
        console.error(error); 
      });
    } else if(event.PanelId == "end_meeting"){
      const calls = await xapi.Status.Conference.Call.get();
      if (calls.length == 0) return;
      const call = calls.pop();
      if(call.SessionType != 'InstantMeeting') return;
      xapi.Command.Conference.EndMeeting({ CallId: call.id});
    }
});


xapi.event.on('UserInterface Message Prompt Response', async function(event){
  console.log('FeedbackId: ' + event.FeedbackId + ' Option: '+ event.OptionId);
  switch(event.FeedbackId){
    case 'meeting_start':
      switch(event.OptionId){
        case '1':   // continue with meeting start / invite others.
          await xapi.Config.UserInterface.InstantMeeting.Invite.set("ManualAdd");
          xapi.Command.Webex.Meetings.InstantMeeting.Start();
          break;
        case '2':   // exit the prompt without starting a meeting
          break;
      }
  }
});

xapi.Event.CallSuccessful.on(async event => {
  console.log('Call Success Event:', event);
  const calls = await xapi.Status.Conference.Call.get();
  if (calls.length == 0) return;
  const call = calls.pop();
  if(call.SessionType != 'InstantMeeting') return;
  let resp = await listJoinDevices();
  let devices = JSON.parse(resp.Body).items;
  if(devices.length > 0){
    let added_devices = [];
    for (let device of devices){
      if(device.primarySipUrl !== SYSTEM_SIP_URI){
        if(added_devices.indexOf(device.primarySipUrl) < 0){
          console.log("Adding Device:", device.primarySipUrl);
          xapi.Command.Conference.Participant.Add({ CallId: call.id, DisplayName: device.displayName, Number: device.primarySipUrl }).catch((e) => {
            console.error("Participant Add Error:");
            console.error(e);
          });
          added_devices.push(device.primarySipUrl);
        } else {
          console.log(`Already dialed ${device.primarySipUrl}, likely pulled a navigator or accessory from this workspace when listing devices.`);
        }
      }
    }
  } else {
    console.warn("No devices found to add to the meeting.  If using config['bot token'] add the bot to the device workspace in CH.");
    console.warn("If using service app (config - client_id, client_secret, refresh_token, tag) tag the devices (not workspace) in CH.")
  }
});

async function listJoinDevices(){
  let url = "https://webexapis.com/v1/devices";
  if(REQUIRE_TAG){
    url += `?tag=${config['tag']}`
  }
  console.log(`list devices url: ${url}`);
  let requestConfig = {
    //AllowInsecureHTTPS: true,
    Header: ["Content-Type: application/json", "Authorization: Bearer " + ACCESS_TOKEN],
    ResultBody: "PlainText",
    Url: url
  };
  return xapi.Command.HttpClient.Get(requestConfig);
}

async function refreshToken(){
  try{
      let requestConfig = {
        Header: ["Content-Type: application/x-www-form-urlencoded"],
        ResultBody: "PlainText",
        Url: "https://webexapis.com/v1/access_token"
      };
      let paramString = `client_id=${config["client_id"]}&client_secret=${config["client_secret"]}&refresh_token=${config["refresh_token"]}&grant_type=refresh_token`;
      let resp = await xapi.Command.HttpClient.Post(requestConfig, paramString);
      let body = JSON.parse(resp.Body);
      console.log("Refreshed Token:");
      console.log(body);
      ACCESS_TOKEN = body["access_token"];
  } catch (e){
    console.error('refreshToken error:');
    console.error(e);
  }
}

async function main(){
  xapi.command('UserInterface Extensions Panel Save', {
      PanelId: 'emergency_dial'
    }, `<Extensions>
      <Version>1.8</Version>
      <Panel>
        <Order>1</Order>
        <Location>HomeScreen</Location>
        <Icon>Helpdesk</Icon>
        <Color>${MACRO_COLOR}</Color>
        <Name>${MACRO_NAME}</Name>
        <ActivityType>Custom</ActivityType>
      </Panel>
    </Extensions>`
  );


  if(HOMESCREEN_CONTROLS_HIDDEN){
    //xapi.Config.UserInterface.Features.HideAll.set(true);
    xapi.Config.UserInterface.Features.Call.Start.set("Hidden");
    xapi.Config.UserInterface.Features.Call.JoinWebex.set("Hidden");
    xapi.Config.UserInterface.Features.Call.JoinZoom.set("Hidden");
    xapi.Config.UserInterface.Features.Call.JoinMicrosoftTeamsDirectGuestJoin.set("Hidden");
    xapi.Config.UserInterface.Features.Call.JoinGoogleMeet.set("Hidden");
    xapi.Config.UserInterface.Help.Tips.set("Hidden");
    xapi.Config.UserInterface.Features.Files.Start.set("Hidden");
    xapi.Config.UserInterface.Features.Share.Start.set("Hidden");
    xapi.Config.UserInterface.Features.Whiteboard.Start.set("Hidden");
    xapi.Config.UserInterface.Features.Calendar.Start.set("Hidden");
    xapi.Config.UserInterface.SettingsMenu.Visibility.set("Hidden");
    xapi.Config.UserInterface.RoomStatusMenu.Visibility.set("Hidden");
    xapi.Config.UserInterface.Features.Call.End.set("Hidden");
  }
  if(config["bot_token"]){
    ACCESS_TOKEN = config["bot_token"];
    console.log("Using Bot Token - Bot will need to be added to each answering device workspace as Read Only in Control Hub.");
  } else if(config["client_id"] && config["client_secret"] && config["refresh_token"] && config["tag"]) {
    REQUIRE_TAG = true;
    await refreshToken();
    setInterval(refreshToken, refreshSeconds * 1000);
    console.log(`Using Service App Token - Answering devices will need to be tagged as ${config["tag"]} in Control Hub`);
  } else {
    console.error(`'config' variable must be an Object containing either a 'bot_token' key OR if using a service app, 'client_id', 'client_secret', 'refresh_token', and 'tag' keys.`);
    console.error(`'bot_token' is simpler, and used if all answering devices are in workspace mode.`);
    console.error(`setting up a service app requires more configuration (4 keys in 'config'), but supports answering devices in personal mode.`);
    return;
  }
  
  let contactInfo = await xapi.Status.UserInterface.ContactInfo.ContactMethod.get()
  if(contactInfo.length > 0){
    for(let contact of contactInfo){
      if(contact.Number && contact.Number.indexOf("@") > 0){
          SYSTEM_SIP_URI = contact.Number;
          console.log(`my sipUrl: ${SYSTEM_SIP_URI}`); 
          break;
      }
    }
  }
}
main();


