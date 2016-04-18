////https://github.com/phonegap-build/PushPlugin/blob/master/Example/www/index.html

//var pushNotification;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', onDeviceReady, true);
    },
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    receivedEvent: function(id) {
        //var parentElement = document.getElementById(id);
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');

        //listeningElement.setAttribute('style', 'display:none;');
        //receivedElement.setAttribute('style', 'display:block;');
    }
};

function onDeviceReady() {

    var push = PushNotification.init({
        "android": { "senderID": "12345679" },
        "ios": {
            "alert": "true",
            "badge": "true",
            "sound": "true"
        },
        "windows": {}
    });

    push.on('registration', function (data) {
        var _d = data;
        // data.registrationId 
    });

    push.on('notification', function (data) {
        var _d = data;
        // data.message, 
        // data.title, 
        // data.count, 
        // data.sound, 
        // data.image, 
        // data.additionalData 
    });

    push.on('error', function (e) {
        var _e = e;
        // e.message 
    });


    //document.addEventListener("backbutton", function (e) {
    //    if ($("#home").length > 0) {
    //        // call this to get a new token each time. don't call it to reuse existing token.
    //        //pushNotification.unregister(successHandler, errorHandler);
    //        e.preventDefault();
    //        navigator.app.exitApp();
    //    }
    //    else {
    //        navigator.app.backHistory();
    //    }
    //}, false);

    //try {
    //    pushNotification = window.plugins.pushNotification;
    //    $("#app-status-ul").append('<li>registering ' + device.platform + '</li>');
    //    if (device.platform == 'android' || device.platform == 'Android' ||
    //            device.platform == 'amazon-fireos') {
    //        pushNotification.register(successHandler, errorHandler, { "senderID": "661780372179", "ecb": "onNotification" });		// required!
    //    } else {
    //        pushNotification.register(tokenHandler, errorHandler, { "badge": "true", "sound": "true", "alert": "true", "ecb": "onNotificationAPN" });	// required!
    //    }
    //}
    //catch (err) {
    //    txt = "There was an error on this page.\n\n";
    //    txt += "Error description: " + err.message + "\n\n";
    //    alert(txt);
    //}
}

//// handle APNS notifications for iOS
//function onNotificationAPN(e) {
//    if (e.alert) {        
//        // showing an alert also requires the org.apache.cordova.dialogs plugin
//        navigator.notification.alert(e.alert);
//    }

//    if (e.sound) {
//        // playing a sound also requires the org.apache.cordova.media plugin
//        var snd = new Media(e.sound);
//        snd.play();
//    }

//    if (e.badge) {
//        pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
//    }
//}

//// handle GCM notifications for Android
//function onNotification(e) {
//    $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

//    switch (e.event) {
//        case 'registered':
//            if (e.regid.length > 0) {
//                $("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
//                // Your GCM push server needs to know the regID before it can push to this device
//                // here is where you might want to send it the regID for later use.
//                console.log("regID = " + e.regid);
//            }
//            break;

//        case 'message':
//            // if this flag is set, this notification happened while we were in the foreground.
//            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
//            if (e.foreground) {
//                $("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

//                // on Android soundname is outside the payload. 
//                // On Amazon FireOS all custom attributes are contained within payload
//                var soundfile = e.soundname || e.payload.sound;
//                // if the notification contains a soundname, play it.
//                // playing a sound also requires the org.apache.cordova.media plugin
//                var my_media = new Media("/android_asset/www/" + soundfile);
//                my_media.play();
//            }
//            else {	// otherwise we were launched because the user touched a notification in the notification tray.
//                if (e.coldstart)
//                    $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
//                else
//                    $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
//            }

//            $("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
//            //android only
//            $("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
//            //amazon-fireos only
//            $("#app-status-ul").append('<li>MESSAGE -> TIMESTAMP: ' + e.payload.timeStamp + '</li>');
//            break;

//        case 'error':
//            $("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
//            break;

//        default:
//            $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
//            break;
//    }
//}

//function tokenHandler(result) {
//    $("#app-status-ul").append('<li>token: ' + result + '</li>');
//    // Your iOS push server needs to know the token before it can push to this device
//    // here is where you might want to send it the token for later use.
//}

//function successHandler(result) {
//    $("#app-status-ul").append('<li>success:' + result + '</li>');
//}

//function errorHandler(error) {
//    $("#app-status-ul").append('<li>error:' + error + '</li>');
//}