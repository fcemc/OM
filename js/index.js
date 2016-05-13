//https://github.com/phonegap-build/PushPlugin/blob/master/Example/www/index.html

var pushNotification;

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('deviceready', onDeviceReady, true);
    },
    onDeviceReady: function () {
        app.receivedEvent('deviceready');
    },
    receivedEvent: function (id) {
        var _id = id;
        //var parentElement = document.getElementById(id);
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');

        //listeningElement.setAttribute('style', 'display:none;');
        //receivedElement.setAttribute('style', 'display:block;');
    }
};

function onDeviceReady() {
    document.addEventListener("resume", onResume, false);
    document.addEventListener("backbutton", function (e) {
        if ($("#home").length > 0) {
            // call this to get a new token each time. don't call it to reuse existing token.
            //pushNotification.unregister(successHandler, errorHandler);
            e.preventDefault();
            navigator.app.exitApp();
        }
        else {
            navigator.app.backHistory();
        }
    }, false);

    try {
        pushNotification = window.plugins.pushNotification;
        if (device.platform == 'android' || device.platform == 'Android' || device.platform == 'amazon-fireos') {
            pushNotification.register(successHandler, errorHandler, { "senderID": "18994795059", "ecb": "onNotification" });		// required!            
        } else {
            pushNotification.register(tokenHandler, errorHandler, { "badge": "true", "sound": "true", "alert": "true", "ecb": "onNotificationAPN" });	// required!
        }
    }
    catch (err) {
        txt = "There was an error on this page.\n\n";
        txt += "Error description: " + err.message + "\n\n";
        alert(txt);
    }
}

function onResume() {
    getOutages();
}


// handle APNS notifications for iOS
function onNotificationAPN(e) {
    if (e.alert) {
        // showing an alert also requires the org.apache.cordova.dialogs plugin
        navigator.notification.alert(e.alert, fakeCallback, "APN Error", "onNotificationAPN");
    }

    if (e.sound) {
        // playing a sound also requires the org.apache.cordova.media plugin
        //var snd = new Media(e.sound);
        var snd = new Media("FCEMCsound.WAV");
        snd.play();
    }

    if (e.badge) {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, e.badge);
    }
}

function tokenHandler(result) {
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.    
    localStorage.setItem("fcemcOMS_clientType", "iOS");
    localStorage.setItem("fcemcOMS_did", result);
    localStorage.setItem("fcemcOMS_uuid", device.uuid);

}


// handle GCM notifications for Android
function onNotification(e) {
    switch (e.event) {
        case 'registered':
            if (e.regid.length > 0) {
                // Your GCM push server needs to know the regID before it can push to this device
                // here is where you might want to send it the regID for later use.
                localStorage.setItem("fcemcOMS_clientType", "Android");
                localStorage.setItem("fcemcOMS_did", e.regid);
                localStorage.setItem("fcemcOMS_uuid", device.uuid);
            }
            break;

        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if (e.foreground) {
                // on Android soundname is outside the payload. 
                // On Amazon FireOS all custom attributes are contained within payload
                var soundfile = e.soundname || e.payload.sound;
                // if the notification contains a soundname, play it.
                // playing a sound also requires the org.apache.cordova.media plugin
                //var my_media = new Media("/android_asset/www/" + soundfile);
                var my_media = new Media("/android_asset/www/FCEMCsound.WAV");
                my_media.play();
            }
            else {	// otherwise we were launched because the user touched a notification in the notification tray.
                if (e.coldstart)
                    var e = e.coldstart;
                else
                    //$("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');        
                    var e = e.coldstart;
            }

            //cordova.plugins.notification.badge.set(e.payload.msgcnt);

            //$("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
            ////android only
            //$("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
            ////amazon-fireos only
            //$("#app-status-ul").append('<li>MESSAGE -> TIMESTAMP: ' + e.payload.timeStamp + '</li>');
            break;

        case 'error':
            var e = e.msg;
            break;

        default:
            $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
            break;
    }
}

function successHandler(result) {
    var r = result;
}

function errorHandler(error) {
    var r = result;
}