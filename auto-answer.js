/********************************************************
 *
 * Macro Authors:      	William Mills
 *                    	Solutions Engineer
 *                   	  wimills@cisco.com
 * 
 *                      Taylor Hanson
 *                    	Solutions Engineer
 *                   	  tahanson@cisco.com
 *                    	Cisco Systems
 *
 * Version: 1-0-0
 * Released: 06/18/24
 *
 * This macro automatically hangups any existing calls,
 * and answers a Meeting Invite/Add *IF* the inviter is
 * listed in AUTOANSWER_NUMBERS
 * 
 * Full Readme, source code and license details for this macro
 * are available on Github:
 * https://github.com/wxsd-sales/emergency-dial-macro
 *
 ********************************************************/
 
import xapi from 'xapi';

/********************************************************
* Settings - 
* The only Setting that must be configured in this macro is AUTOANSWER_NUMBERS.
* All other configuration changes are optional
********************************************************/

//AUTOANSWER_NUMBERS Should be an array of strings.  Value can be found in the device's web view under Spark SharedAccount ID:
// https://X.X.X.X/web/configurations/status/Spark
const AUTOANSWER_NUMBERS = [''];

const ANSWER_MUTED = true;
const AUTOANSWER_DELAY_SECONDS = 0;
var autoanswerhandler;


function normaliseRemoteURI(number){
  var regex = /^(sip:|h323:|spark:|h320:|webex:|locus:)/gi;
  number = number.replace(regex, '');
  //console.log('Normalised Remote URI to ' + number);
  return number;
}

async function answerCall(callId){
  let calls = await xapi.Status.Conference.Call.get()
  for(let call of calls){
    //console.log(call);
    if(call.id !== callId){
      console.log("Disconnecting from CallId:", call.id);
      await xapi.Command.Call.Disconnect({ CallId: call.id });
    } else {
      console.log("Skipping disconnect for emergency meeting, CallId:", call.id);
    }
  }
  xapi.command('Call Accept').then(async function(){
    if(ANSWER_MUTED){
      let value = await xapi.Status.Audio.Microphones.Mute.get()
      console.log(`Mute:${value}`);
      if(value === "Off"){
        console.log("Muting microphones.");
        xapi.Command.Audio.Microphones.Mute();
      } else {
        console.log("Muting microphones in 1 second.");
        setTimeout(function(){xapi.Command.Audio.Microphones.Mute()}, 1000);
      }
    }
  }).catch((error) =>{
    console.error(error);
  });
}

xapi.event.on('IncomingCallIndication', async function (event){
  console.log(event);
  if(AUTOANSWER_NUMBERS.includes(normaliseRemoteURI(event.RemoteURI))){
      xapi.command("UserInterface Message Alert Display", {Title: 'Incoming Autoanswer-number', Text: 'This call will automatically be answered after ' + AUTOANSWER_DELAY_SECONDS + ' seconds', Duration: AUTOANSWER_DELAY_SECONDS});
      autoanswerhandler = setTimeout(async function(){ await answerCall(event.CallId) }, AUTOANSWER_DELAY_SECONDS * 1000);
  }
});


xapi.status.on('Call Status', (status) => {
  if(status === 'Connected'){
      clearTimeout(autoanswerhandler);
      //console.log('Call was accepted before auto-answer was performed');
      xapi.command("UserInterface Message Alert Clear");
  }
});

xapi.event.on('CallDisconnect', (event) => {
      clearTimeout(autoanswerhandler);
      //console.log('Call was disconnected before auto-answer was performed');
      xapi.command("UserInterface Message Alert Clear");
});

