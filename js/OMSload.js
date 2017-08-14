var tryingToReconnect = false, user, badgeCount = 0, outageEventID, outagePhase, outageDevice,outageBeingRestored = false;

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

        $.connection.hub.url = "https://gis.fourcty.org/FCEMCrest/signalr/hubs";

        $.connection.hub.logging = true;

        var mainChat = $.connection.mainHub;
        mainChat.client.broadcastMessage = function (data, option) {

            if (tryingToReconnect)  //catch in case reconnected doesn't get called
            {
                tryingToReconnect = false;
            }

            switch (option) {
                //case "AVL":
                //    AVLResults(data);
                //    break;
                case "OMS":
                    if (outageBeingRestored === false) {
                        listOutages(data);
                    }
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
        if (navigator.notification.confirm("No network connection detected, check settings and try again!", networkIssue, "Please Confirm:", "Cancel, Ok")) {
            window.location.reload();
        }
        else {
            $.mobile.pageContainer.pagecontainer("change", "#pageLogin");
        }
    }


    $("#noteNotes").textinput({
        autogrow: false,
        corners: false
    });
    $("#lettersLeft").text("Max characters: " + $("#noteNotes")[0].maxLength);
    
});

//region Login&Cookies
function checkLogin() {
    user = $("#un").val().trim();
    var _pw = $("#pw").val().trim();
    var paramItems = user + "|" + _pw;
    $.ajax({
        async: true,
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/authenticateYouSir/" + paramItems,        
        contentType: "application/json; charset=utf-8",        
        success: function (results) {
            if (results.authenticateYouSirResult) {
                $("#loginError").text("");
                $.mobile.pageContainer.pagecontainer("change", "#page1");
                $("#spinCont").show();
                if (localStorage.fcemcOMS_uname == undefined || localStorage.fcemcOMS_uname == "") {
                    setCookie(user, _pw, 1); //expires 1 day from inital login
                }
                register();
                initLoad();
            }
            else {
                localStorage.setItem("fcemcOMS_uname", "");
                localStorage.setItem("fcemcOMS_pass", "");
                $("#loginError").text("Login Unsuccessful");
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
            if (!(navigator.onLine)) {
                $("#loginError").text("No network connection - cannot login!");
            }
            else {
                $("#loginError").text("Login Unsuccessful - textStatus: " + textStatus.toString() + " errorThrown: " + errorThrown.toString()) + " jqXHR: " + jqXHR;
            }
        }
    });
}

function setCookie(u, p, t) {
    //window.localStorage.clear();
    localStorage.setItem("fcemcOMS_uname", u);
    localStorage.setItem("fcemcOMS_pass", p);
    var d = new Date();
    d.setDate(d.getDate() + t);
    d.setHours(6);
    d.setMinutes(00);
    d.setSeconds(00);
    localStorage.setItem("fcemcOMS_timeout", d);
    registierDevice();
}

function registierDevice() {
    if (localStorage.fcemcOMS_did != undefined) {
        var _did = localStorage.fcemcOMS_did;
        var _uuid = localStorage.fcemcOMS_uuid;
        var _ct = localStorage.fcemcOMS_clientType;

        var paramItems = encodeURIComponent(_did) + "/" + _uuid + "/" + _ct + "/" + localStorage.fcemcOMS_uname + "/OMS";
        $.ajax({
            type: "GET",
            url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/REGSTAFFDEVICE/" + paramItems,
            //contentType: "application/json; charset=utf-8",
            cache: false,
            success: function (results) {
                var r = results;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var e = errorThrown;
            }
        });

    }
}

function getCookie() {
    var isCookies = false;
    if (localStorage.fcemcOMS_uname != null && localStorage.fcemcOMS_pass != null && localStorage.fcemcOMS_uname != "" && localStorage.fcemcOMS_pass != "") {
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
            getOutages();
        }
        else {
            //localStorage.clear();
            localStorage.setItem("fcemcOMS_uname", "");
            localStorage.setItem("fcemcOMS_pass", "");
        }
    }
}
//endregionphon

function register() {
    $.ajax({
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/initalizeLink",
        //contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            var r = results;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var t = textStatus;
            var e = errorThrown;
        }
    });
}

function initLoad() {
    $("#spinCont").show();
    getOutages();
    getSCADAOutages();
    getOutageCodes();
}

function getOutageCodes() {
    $.ajax({
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/getOutageCodes",
        //contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            var res = results.getOutageCodesResult;

            var _cause = res[0].items.sort(function (a, b) { return a.value - b.value });

            //update Cause codes
            $('#select-cause option').remove();
            for (a = 0; a < _cause.length; a++) {
                $('#select-cause').append($('<option/>', {
                    value: _cause[a].value,
                    text: _cause[a].desc
                }));
            }

            var _equip = res[1].items.sort(function (a, b) { return a.value - b.value });
            //update Equipment codes
            $('#select-equipment option').remove();
            $('#select-equipment').append($('<option/>', { value: -1, text: "" }));
            for (b = 0; b < _equip.length; b++) {
                $('#select-equipment').append($('<option/>', {
                    value: _equip[b].value,
                    text: _equip[b].desc
                }));
            }

            var _weather = res[2].items.sort(function (a, b) { return a.value - b.value });
            //update Weather codes
            $('#select-weather option').remove();
            for (c = 0; c < _weather.length; c++) {
                $('#select-weather').append($('<option/>', {
                    value: _weather[c].value,
                    text: _weather[c].desc
                }));
            }

            var _other = res[3].items.sort(function (a, b) { return a.value - b.value });
            //update other codes
            $('#select-other option').remove();
            for (d = 0; d < _other.length; d++) {
                $('#select-other').append($('<option/>', {
                    value: _other[d].value,
                    text: _other[d].desc
                }));
            }

            //var _call = res[4].items.sort(function (a, b) { return a.value - b.value });
            ////update other codes
            //$('#select-other option').remove();
            //for (d = 0; d < _other.length; d++) {
            //    $('#select-other').append($('<option/>', {
            //        value: _call[d].value,
            //        text: _call[d].desc
            //    }));
            //}

        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
        }
    });
}

function getOutages() {
    $.ajax({
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/GETACTIVEOUTAGES",        
        //contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            listOutages(results.GETACTIVEOUTAGESResult);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
        }
    });
}

function getSCADAOutages() {
    $.ajax({
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/ALLSTATUS",
        //contentType: "application/json; charset=utf-8",
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
    var canConfirm = ["Assumed"];
    var canRestore = ["Confirmed"];

    if (data.length > 0) {
        var _string = "<div data-role='collapsible-set'>";
        for (i = 0; i < data.length; i++) {
            _string += '<div data-role="collapsible"><h3>' + data[i].CASENUM + '</h3><a onclick="prepNote(\'' + data[i].ELEMENTID.toString() + '\');" href="#" class="ui-btn ui-corner-all notes">Add note to outage</a>';
            //_string += "<div class='accdEntry'><b>Customer Count:</b> " + data[i].CUSTCOUNT + "</div>";
            _string += "<div class='accdEntry'><b>Assigned To:</b> " + data[i].ASSIGNEDTO + "</div>";
            _string += "<div class='accdEntry'><b>Start Time:</b> " + data[i].TIMESTRT + "</div>";
            _string += "<div class='accdEntry'><b>Start Date:</b> " + data[i].DATESTRT + "</div>";
            _string += "<div class='accdEntry'><b>Element:</b> " + data[i].ELEMENT + "</div>";
            _string += "<div class='accdEntry'><b>Element ID:</b> " + data[i].ELEMENTID + "</div>";
            _string += "<div class='accdEntry'><b>Pole Number:</b> " + data[i].POLENUM + "</div>";
            //_string += "<div class='accdEntry'><b>Case Status:</b> " + data[i].CASESTATUS + "</div>";

            if (jQuery.inArray(data[i].CASESTATUS, canRestore) > -1) {
                _string += '<div><button style="background-color:red;" onclick="preRestoreOutage(\'' + data[i].ELEMENTID.toString() + '\');" class="ui-btn ui-corner-all">Close Outage</button></div>';
            }
            else if (jQuery.inArray(data[i].CASESTATUS, canConfirm) > -1) {
                _string += '<div><button style="background-color:orange;" onclick="preConfirmOutage(\'' + data[i].ELEMENTID.toString() + '\');" class="ui-btn ui-corner-all">Confirm Outage</button></div>';
            }

            _string += "</div>";
        }
        _string += "</div>";

        $("#outage").html("");
        $("#outage").html(_string.toString());
        $('#outage [data-role=collapsible-set]').collapsibleset();
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


        if (navigator.notification != undefined) {                 
            //if (device.platform == 'android' || device.platform == 'Android' || device.platform == 'amazon-fireos') {
            //    var my_media = new Media("/android_asset/www/fcemcsound.wav");
            //    my_media.play();
            //} else if (device.platform == "iOS") {                
            //    var my_media = new Media("fcemcsound.wav");
            //    my_media.play();
            //}

            navigator.notification.beep(1);
            navigator.notification.vibrate(1000);
        }
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

function preConfirmOutage(oD) {
    $("#spinCont").show();
    clearOutageRecords();

    $.ajax({
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/getOutageEventInfo/" + oD,
        //contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            var res = results.getOutageEventInfoResult;
            
            setOUtageRecords(res.outageEventID, res.outageEventPhase, oD);
                        
            var upstreamIDs = res.upstreamIDs;
            $("#select-upstream option").remove();
            for (i = 1; i < upstreamIDs.length; i++) {
                $("#select-upstream").append($('<option/>', {
                    value: upstreamIDs[i],
                    text: upstreamIDs[i]
                }));
            }

            $("#page2").on("pagebeforeshow", function (event) {
                $("#confrimLbl").text("");
                $("#confrimLbl").text(outageDevice + " on " + res.outageEventPhase + " Phase");
                $("#select-upstream").val("0").change();
                $("#select-phase").val("0").change();
            });
            $.mobile.pageContainer.pagecontainer("change", "#page2");
            $("#tabs").tabs("option", "active", 0);
            $('#tab-one').addClass("ui-btn-active");
            
        },
        complete: function (jqXHR, textStatus) {
            $("#spinCont").hide();
        }
    });
}

function confirmOutage() {
    $("#spinCont").show();

    if (navigator.notification != undefined) {
        navigator.notification.confirm("Continue confirming outage?", sendConfim, "Verify:", "Cancel, Ok");
    }
    else {
        alert("Continue confirming outage?");
        sendConfim(2);
    }
}

function sendConfim(button) {
    if (button == 2) {
        if ($("#tabs").tabs('option', 'active') == 1) {
            //upstream device
            outagePhase = $("#select-phase").val();
            outageDevice = $("#select-upstream").val();
        }

        var dataString = outageEventID + "/" + outageDevice + "/" + outagePhase + "/" + localStorage.fcemcOMS_uname;

        $.ajax({
            type: "GET",
            url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/confirmOutage/" + dataString,
            //contentType: "application/json; charset=utf-8",
            cache: false,
            success: function (results) {            
                clearOutageRecords();
                if (navigator.notification != undefined) {
                    navigator.notification.alert("Outage has been confirmed!", fakeCallback, "Success!", "Ok");    
                }
                else {
                    alert("Outage has been confirmed!");
                    sendConfim(2);
                }
            },
            complete: function (jqXHR, textStatus) {
                $("#spinCont").hide();
                $.mobile.pageContainer.pagecontainer("change", "#page1");                
                getOutages();

            },
            error: function (jqXHR, textStatus, errorThrown) {
                $("#spinCont").hide();
                var e = textStatus;
                clearOutageRecords();

                //alert("There was an error in confirming outage contact dispatch for assitance with outage.");
                navigator.notification.alert("There was an error in confirming outage contact dispatch for assistance with outage.", fakeCallback, "Error:", "Ok");
                $.mobile.pageContainer.pagecontainer("change", "#page1");
            }
        });
    }
    else if (button == 1) {
        $("#spinCont").hide();
        clearOutageRecords();
        $("#confrimLbl").text("");
        $.mobile.pageContainer.pagecontainer("change", "#page1");
    }
}

function preRestoreOutage(oD) {
    $("#spinCont").show();
    clearOutageRecords();

    $.ajax({
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/getOutageEventInfo/" + oD,
        //contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            var res = results.getOutageEventInfoResult;
            
            setOUtageRecords(res.outageEventID, res.outageEventPhase, oD);

            $("#restoreLbl").text(oD);

            $("#page3").on("pagebeforeshow", function (event) {
                $("#restoreLbl").text("");
                $("#restoreLbl").text(outageDevice);
                $("#select-cause").val("0").change();
                $("#select-equipment").val("-1").change();
                $("#select-weather").val("0").change();
                $("#select-other").val("0").change();
            });
            $.mobile.pageContainer.pagecontainer("change", "#page3");
            $("#spinCont").hide();
        }
    });
}

function restoreOutage() {
    $("#spinCont").show();
    if (navigator.notification != undefined) {
        navigator.notification.confirm("Continue restoring outage?", sendRestore, "Verify:", "Cancel, Ok");
    }
    else {
        sendRestore(2);
    }    
}

function sendRestore(button) {
    if (button == 2) {        
        var cause = $("#select-cause option:selected").val();
        var equip = $("#select-equipment option:selected").val();
        var weather = $("#select-weather option:selected").val();
        var other = $("#select-other option:selected").val();

        var isStorm = $("#select-cause option:selected").text().toLowerCase().indexOf("storm");

        if (cause > 0 && equip > -1 && weather > 0 && other > 0 || isStorm >= 0) {
            var dataString = outageEventID + "/" + outageDevice + "/" + cause + "/" + equip + "/" + weather + "/" + other + "/" + localStorage.fcemcOMS_uname;
            outageBeingRestored = true;
            $.ajax({
                type: "GET",
                url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/restoreOutage/" + dataString,
                //contentType: "application/json; charset=utf-8",
                cache: false,
                success: function (results) {                    
                    clearOutageRecords();

                    if (navigator.notification != undefined) {
                        navigator.notification.alert("Outage has been restored!", fakeCallback, "Success!", "Ok");
                    }
                    else {
                        alert("Outage has been restored!");
                    }
                    
                },
                complete: function ( jqXHR, textStatus) {                    
                    $("#spinCont").hide();
                    $.mobile.pageContainer.pagecontainer("change", "#page1");
                    outageBeingRestored = false;
                    getOutages();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    var e = textStatus;
                }
            });
        }
        else {
            //alert("All selections must be made in order to restore outage!");
            $("#spinCont").hide();

            if (navigator.notification != undefined) {
                navigator.notification.alert("All selections must be made in order to restore outage!", fakeCallback, "Error:", "Ok");
            }
            else {
                alert("All selections must be made in order to restore outage!");
            }            
        }
    }
    else if (button == 1) {
        $("#spinCont").hide();
        outageEventID = "";
        outagePhase = "";
        outageDevice = "";
        $("#restoreLbl").text("");
        $.mobile.pageContainer.pagecontainer("change", "#page1");
    }
}

function closeNote() {
    clearOutageRecords();
    $("#lettersLeft").text("0/" + $("#noteNotes")[0].maxLength);
    $("#noteNotes").val("");
}

function prepNote(notedevice) {
    $("#spinCont").show();
    $.ajax({
        type: "GET",
        url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/getOutageEventInfo/" + notedevice,
        //contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            var res = results.getOutageEventInfoResult;           
            setOUtageRecords(res.outageEventID, res.outageEventPhase, notedevice);
                        
            $("#noteNotes").val("");
            $("#spinCont").hide();
            $("#popup").popup("open");
        },
        error: function (jqXHR, textStatus, errorThrown) {         
            $("#spinCont").hide();
            clearOutageRecords();
            navigator.notification.alert("Error opening form.", fakeCallback, "Error!", "Ok");
        }
    });
}

function addNote() {
    $("#spinCont").show();
    if ($("#noteNotes").val().length > 0) {
        var dataString = outageEventID + "/" + outageDevice + "/[" + $("#noteNotes").val() + "]";
        $.ajax({
            type: "GET",
            url: "https://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/addOutageRemarks/" + dataString,
            //contentType: "application/json; charset=utf-8",
            cache: false,
            success: function (results) {
                if (results.addOutageRemarksResult.errorStringField == null) {
                    clearOutageRecords();
                    if (navigator.notification != undefined) {
                        navigator.notification.alert("Notes have been added.", fakeCallback, "Success!", "Ok");
                    }
                }
            },
            complete: function (jqXHR, textStatus) {
                $("#spinCont").hide();
                $.mobile.pageContainer.pagecontainer("change", "#page1");
                getOutages();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var e = textStatus;
                $("#spinCont").hide();
                clearOutageRecords();


                if (navigator.notification != undefined) {
                    navigator.notification.alert("Note was not added - review notes and make sure no special characters were used.  Or outage may have been updated, please try again.", fakeCallback, "Error!", "Ok");
                }
                else {
                    alert("Note was not added");
                }


                
            }
        });
    }
}

function clearOutageRecords() {
    outageEventID = "";
    outagePhase = "";
    outageDevice = "";
}

function setOUtageRecords(oid, oph, odev) {
    outageEventID = oid;
    outagePhase = oph;
    outageDevice = odev;
}

function quit() {
    $.mobile.pageContainer.pagecontainer("change", "#page1");
}

function networkIssue(button) {
    if (button == 2) {
        window.location.reload();
    }
    else if (button == 1) {
        $.mobile.pageContainer.pagecontainer("change", "#pageLogin");
    }
}

function fakeCallback() { }
