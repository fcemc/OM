var tryingToReconnect = false, user;

$(document).ready(function () {

    //adjust for status bar in iOS
    if (/iPad|iPod|iPhone/i.test(navigator.userAgent)) {
        $("body").css("background-color", "black");
        $("div[role='dialog']").css("background-color", "#efecec");
        $(".pg").css({ "margin-top": "20px" });
    }



    if (navigator.onLine) {
        checkCookie();

        getSpinner();
        $("#spinCont").hide();

        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": false,
            "positionClass": "toast-bottom-right",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "0",
            "hideDuration": "0",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }

        var pushNotification = window.plugins.pushNotification;

        $.connection.hub.url = "http://gis.fourcty.org/FCEMCrest/signalr/hubs";

        $.connection.hub.logging = true;

        var mainChat = $.connection.mainHub;
        mainChat.client.broadcastMessage = function (data, option) {

            pushNotification.setApplicationIconBadgeNumber("Test", 0);

            console.log("Test");

            if (tryingToReconnect)  //catch in case reconnected doesn't get called
            {
                tryingToReconnect = false;
            }

            switch (option) {
                case "AVL":
                    AVLResults(data);
                    break;
                case "OUTAGE":
                    listOutages(data);
                    break;
                case "SCADA":
                    listSCADAOutages(data);
                    break;
                default:
            }
        };

        $.connection.hub.start().done(function () {
            //init();  //intalize after login is validated
        });

        $.connection.hub.disconnected(function () {
            if (tryingToReconnect) {
                setTimeout(function () {
                    $.connection.hub.start().done(function () { init(); });
                }, 5000); // Restart connection after 5 seconds.
            }
        });

        $.connection.hub.reconnecting(function () {
            toastr["error"]("Network connection lost! Trying to restore connection...");
            tryingToReconnect = true;
        });

        $.connection.hub.reconnected(function () {
            toastr["success"]("Connection restored!");
            tryingToReconnect = false;
        });
    }
    else {
        var r = confirm("No network connection detected, check setting and try again!");
        if (r == true) {
            window.location.reload();
        }
        else {
            $.mobile.pageContainer.pagecontainer("change", "#pageLogin");
        }
    }
});

//region Login&Cookies
function checkLogin() {
    user = $("#un").val().trim();
    var _pw = $("#pw").val().trim();
    var paramItems = user + "|" + _pw;
    $.ajax({
        type: "GET",
        url: "http://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/authenticateYouSir/" + paramItems,
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            if (results.authenticateYouSirResult) {
                $("#loginError").text("");
                
                $.mobile.pageContainer.pagecontainer("change", "#page1");
                
                $("#spinCont").show();

                if (localStorage.fcemcOMS_uname == undefined) {
                    setCookie(user, _pw, 1); //expires 1 day from inital login
                }

                register();
                initLoad();
                
            }
            else {
                window.localStorage.clear();
                $("#loginError").text("Login Unsucessful");
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
            if (!(navigator.onLine)) {
                $("#loginError").text("No network connection - cannot login!");
            }
            else {
                //$("#loginError").text("Login Unsucessful");
            }
        }
    });
}

function setCookie(u, p, t) {
    window.localStorage.clear();
    localStorage.setItem("fcemcOMS_uname", u);
    localStorage.setItem("fcemcOMS_pass", p);
    var d = new Date();
    d.setDate(d.getDate() + t);
    localStorage.setItem("fcemcOMS_timeout", d);
}

function getCookie() {
    var isCookies = false;
    if (localStorage.fcemcOMS_uname != null && localStorage.fcemcOMS_pass != null) {
        isCookies = true;
    }
    return isCookies;
}

function checkCookie() {
    var valid = getCookie();
    if (valid == true) {
        if (new Date(localStorage.fcemcOMS_timeout) > new Date()) {
            $("#un").val(localStorage.fcemcOMS_uname);
            $("#pw").val(localStorage.fcemcOMS_pass);
        }
        else {
            localStorage.clear();
        }
    }
}
//endregion

function register() {
    $.ajax({
        type: "GET",
        url: "http://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/initalizeLink",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            var r = results;
            //Everthing is ok, server side code initailized        
            //var r = results;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var t = textStatus;
            var e = errorThrown;
            //alert(errorThrown);
            //var t = textStatus;
        }
    });
}

function initLoad() {
    //// do these for inital data loading...
    $("#spinCont").show();
    getAVL();
    getOutages();
    getSCADAOutages();
}

function getAVL() {
    $.ajax({
        type: "GET",
        url: "http://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/getAVLstatus",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            AVLResults(results.getAVLstatusResult);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
        }
    });
}

function getOutages() {
    $.ajax({
        type: "GET",
        //url: "http://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/getOUTAGECASES",
        url: "http://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/getOUTAGECASES_TEST",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            //listOutages(results.getOUTAGECASESResult);
            listOutages(results.getOUTAGECASES_TESTResult);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
        }
    });
}

function getSCADAOutages() {
    $.ajax({
        type: "GET",
        url: "http://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/ALLSTATUS",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            listSCADAOutages(results.ALLSTATUSResult);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
        }
    });
}

function listOutages(data) {
    if (data.length > 0) {
        var _string = "<div data-role='collapsible-set'>";
        for (i = 0; i < data.length; i++) {
            _string += "<div data-role='collapsible'><h3>" + data[i].CASENUM + "</h3>";
            _string += "<div class='accdEntry'><b>Customer Count:</b> " + data[i].CUSTCOUNT + "</div>";
            _string += "<div class='accdEntry'><b>Assigned To:</b> " + data[i].ASSIGNEDTO + "</div>";
            _string += "<div class='accdEntry'><b>Start Time:</b> " + data[i].TIMESTRT + "</div>";
            _string += "<div class='accdEntry'><b>Start Date:</b> " + data[i].DATESTRT + "</div>";
            _string += "<div class='accdEntry'><b>Element:</b> " + data[i].ELEMENT + "</div>";
            _string += "<div class='accdEntry'><b>Element ID:</b> " + data[i].ELEMENTID + "</div>";
            _string += "<div class='accdEntry'><b>Pole Number:</b> " + data[i].POLENUM + "</div>";
            _string += "<div class='accdEntry'><b>Case Status:</b> " + data[i].CASESTATUS + "</div>";

            //Calls Bundle
            if (data[i].CASESTATUS === "Predicted") {
                _string += '<div><button style="background-color:orange;" onclick="confirmOtage(\'' + data[i].CASENUM.toString() + '\');" class="ui-btn ui-corner-all">Confirm Outage</button></div>';
            }
            else if (data[i].CASESTATUS === "Confirmed" || data[i].CASESTATUS === "CauseUnknown")
            {
                _string += '<div><button style="background-color:red;" onclick="processOutage(\'' + data[i].CASENUM.toString() + '\');" class="ui-btn ui-corner-all">Close Outage</button></div>';
            }          

            _string += "</div>";
        }
        _string += "</div>";

        $("#outage").html("");
        $("#outage").html(_string.toString());
        $('#outage [data-role=collapsible-set]').collapsibleset();

        navigator.notification.beep(1);
        navigator.notification.vibrate(1000);
    }
    else if (data.length == 0) {
        $("#outage").html("");
    }
    $("#spinCont").hide();
}

function listSCADAOutages(data) {

    if (data[0].scadaCircuits.length != 0 || data[0].scadaFaults.length != 0 || data[0].scadaSubs.length != 0) {

        var _string = "<div data-role='collapsible-set'>";

        if (data[0].scadaCircuits.length > 0) {
            var _data = data[0].scadaCircuits;
            for (i = 0; i < _data.length; i++) {
                _string += "<div data-role='collapsible'><h3>" + _data[i].CLASS + " " + _data[i].ID + "</h3>";
                _string += "<div class='accdEntry'><b>ID:</b> " + _data[i].ID + "</div>";
                _string += "<div class='accdEntry'><b>Status:</b> " + _data[i].STATUS + "</div>";
                _string += "<div class='accdEntry'><b>Start Time:</b> " + _data[i].TIME + "</div>";
                _string += "</div>";
            }
        }

        if (data[0].scadaFaults.length > 0) {
            var _data = data[0].scadaFaults;
            for (i = 0; i < _data.length; i++) {
                _string += "<div data-role='collapsible'><h3>" + _data[i].CLASS + " " + _data[i].ID + "</h3>";
                _string += "<div class='accdEntry'><b>ID:</b> " + _data[i].ID + "</div>";
                _string += "<div class='accdEntry'><b>Status:</b> " + _data[i].STATUS + "</div>";
                _string += "<div class='accdEntry'><b>Start Time:</b> " + _data[i].TIME + "</div>";
                _string += "</div>";
            }
        }

        if (data[0].scadaSubs.length > 0) {
            var _data = data[0].scadaSubs;
            for (i = 0; i < _data.length; i++) {
                _string += "<div data-role='collapsible'><h3>" + _data[i].CLASS + " " + _data[i].ID + "</h3>";
                _string += "<div class='accdEntry'><b>ID:</b> " + _data[i].ID + "</div>";
                _string += "<div class='accdEntry'><b>Status:</b> " + _data[i].STATUS + "</div>";
                _string += "<div class='accdEntry'><b>Start Time:</b> " + _data[i].TIME + "</div>";
                _string += "</div>";
            }
        }
        
        _string += "</div>";

        $("#scadaoutage").html("");
        $("#scadaoutage").html(_string.toString());
        $('#scadaoutage [data-role=collapsible-set]').collapsibleset();

        navigator.notification.beep(1);
        navigator.notification.vibrate(1000);
    }
    else {
        $("#scadaoutage").html("");
    }

    $("#spinCont").hide();
}

function getSpinner() {
    var opts = {
        lines: 12             // The number of lines to draw
        , length: 7             // The length of each line
        , width: 5              // The line thickness
        , radius: 10            // The radius of the inner circle
        , scale: 1.0            // Scales overall size of the spinner
        , corners: 1            // Roundness (0..1)
        , color: '#000'         // #rgb or #rrggbb
        , opacity: 1 / 4          // Opacity of the lines
        , rotate: 0             // Rotation offset
        , direction: 1          // 1: clockwise, -1: counterclockwise
        , speed: 1              // Rounds per second
        , trail: 100            // Afterglow percentage
        , fps: 20               // Frames per second when using setTimeout()
        , zIndex: 2e9           // Use a high z-index by default
        , className: 'spinner'  // CSS class to assign to the element
        , top: '50%'            // center vertically
        , left: '50%'           // center horizontally
        , shadow: false         // Whether to render a shadow
        , hwaccel: false        // Whether to use hardware acceleration (might be buggy)
        , position: 'absolute'  // Element positioning
    }
    var target = document.getElementById('spinwheel');
    spinner = new Spinner(opts).spin(target);
}

function AVLResults(data) {
    if (data.length > 0) {
        $("#avl").html("");

        var _string = "";
        for (i = 0; i < data.length; i++) {
            _string += "<div class='accdEntry'>VID: " + data[i].VID + " - " + data[i].LOG_DATETIME + "</div>";
        }

        $("#avl").html(_string.toString());
        $('#outageList [data-role=collapsible-set]').collapsibleset();
    }
    
    $("#spinCont").hide();
}

function confirmOtage(outageNum) {    
    if (confirm("Are you sure you want to Confirm outage?")) {
        //send data to confirm outage
    }
    else {
        //do nothing
    }
}

function processOutage(outageNum) {
    $("#page2").on("pagebeforeshow", function (event) {
        $("#outLbl").text(outageNum);
        $("#select-native-1").val("0").change();
        $("#select-native-2").val("0").change();
    });
    $.mobile.pageContainer.pagecontainer("change", "#page2");
}

function closeOtage() {
    var outageNum = $("#outLbl").text();
    var cause = $("#select-native-1 option:selected").text();
    var weateher = $("#select-native-2 option:selected").text();
    var timeStamp =  new Date();
    //timeStamp.getDate();

    if (cause != "" && weateher != "") {
        initLoad();
        $.mobile.pageContainer.pagecontainer("change", "#page1");
        $("#outLbl").text("");
    }
    else {
        alert("Make sure a Cause and Wheater option are selected!");
    }
}

function cancelOtage() {  
    $.mobile.pageContainer.pagecontainer("change", "#page1");
}