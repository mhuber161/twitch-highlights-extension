//TODO annotate popular points for quick reference
//TODO do in depth analysis for emotes - in the background
//TODO V2 - sync chat log with remote server to improve initial pull speed
//TODO Load embedded player for faster seek, give option to switch between native and embedded?
//TODO add help button/mouseover to show controls and other info

var videoId;
var dyGraph = null;
var chatlogs = {};
var graphDiv = null;
var loadButton = null;
var resetButton = null;

class ChatMessage {
    constructor(time, text) {
        this.time = time;
        this.text = text;
    }
}

window.addEventListener ("load", insertLoadGraphButton, false);

//if browser history changed and url matches twitch VOD, reset graph display
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.historyChanged == "true"){
            if (/https:\/\/www\.twitch\.tv\/videos\/[0-9]*.*/.test(document.URL)){
                resetGraph();    //reset state to before graph loaded
            }
        }
    }
);

function resetGraph(){
    video = (document.URL).split("/")[4];
    videoId = video.split("?")[0];
    chatlogs = {};
    if (dyGraph != null){
        dyGraph.destroy();
        document.getElementById("frequencyChart").style.visibility = "collapse";
        document.getElementById("reset-chat-button").style.visibility = "collapse";
    }

    insertLoadGraphButton();
}

function insertLoadGraphButton(){
    if (graphDiv == null){
        graphDiv = document.createElement('div');
        graphDiv.id = 'frequencyChart';
        graphDiv.style.width = "100%";
        var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
        scrollArea.insertBefore(graphDiv, scrollArea.childNodes[2]);
    }

    if (loadButton == null){
        loadButton = document.createElement('input');
        loadButton.type = 'button';
        loadButton.value = "Load Chat Graph!";
        loadButton.id = "load-chat-button";
        var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
        scrollArea.insertBefore(loadButton, scrollArea.childNodes[3]);
        loadButton.addEventListener ("click", loadGraph);
    }
    else{
        document.getElementById("load-chat-button").style.visibility = "visible";
    }
}


function loadGraph(evt){
    document.getElementById("load-chat-button").style.visibility = "collapse";
    document.getElementById("frequencyChart").style.visibility = "visible";
    video = (document.URL).split("/")[4];
    videoId = video.split("?")[0];
    console.log("Video Id: " + videoId);

    displayDyGraph([[1,0]]);

    chrome.storage.local.get(['chatlogs'], function(result) {
        console.log('Value currently is ' + result.chatlogs[videoId]);
        chatlogs = result.chatlogs;
        if(result.chatlogs[videoId] != undefined){
            parseSavedChatLog(result.chatlogs[videoId]);
        }
        else{
            pullChatLog([], null, null, null, null);
        }
    });
}

// input time in seconds, returns string with format hh:mm:ss
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? ":" : ":") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? ":" : ":") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "" : "") : "";

    return hDisplay + mDisplay + sDisplay; 
}

function parseSavedChatLog(chatlog){
    var time = 5;
    var frequencyValue = 0;

    var graphData = [];

    for (i = 0; i < chatlog.length; i++){
        if (chatlog[i].time > time){
            graphData.push([time,frequencyValue]);
            // dyGraph.updateOptions({'file': graphData});
            frequencyValue = 0;
            time += 5;
        }

        frequencyValue++;
    }
    // displayDyGraph(graphData);
    dyGraph.updateOptions({'file': graphData});
}

function displayDyGraph(data){
    if (resetButton == null){
        resetButton = document.createElement('input');
        resetButton.type = 'button';
        resetButton.value = "Reset Zoom";
        resetButton.id = "reset-chat-button";
        var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
        scrollArea.insertBefore(resetButton, scrollArea.childNodes[3]);
        resetButton.addEventListener ("click", unzoomGraph);
    }
    else{
        document.getElementById("reset-chat-button").style.visibility = "visible";
    }

    dyGraph = new Dygraph(        
        document.getElementById("frequencyChart"),
        data, 
        {   
            clickCallback: graphClickCallback,
            highlightCircleSize: 5,
            valueFormatter: formatMouseoverDisplay,
            legend: "follow",
            labels: ['Time', 'Count'],
            axes: {
                x: {
                    axisLabelFormatter: formatTimeDisplay,
                },
                y: {}
            }
        }  
      );
}

function displayChartJSGraph(frequencyData, timeData){
    var canvas = document.createElement('canvas');
    canvas.id = 'frequencyChart';
    var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
    scrollArea.insertBefore(canvas, scrollArea.childNodes[2]);

    var ctx = document.getElementById('frequencyChart').getContext('2d');

    var frequencyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData,
            datasets: [{
                label: 'Frequency',
                data: frequencyData
            }]
        },
        options: {
            animation: {
                duration: 0, // general animation time
            },
            hover: {
                animationDuration: 0, // duration of animations when hovering an item
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
            elements: {
                line: {
                    tension: 0, // disables bezier curves
                }
            },
            pan: {
                // Boolean to enable panning
                enabled: true,
        
                // Panning directions. Remove the appropriate direction to disable 
                // Eg. 'y' would only allow panning in the y direction
                mode: 'x',
                // rangeMin: {
                //     // Format of min pan range depends on scale type
                //     x: null,
                //     y: null
                // },
                // rangeMax: {
                //     // Format of max pan range depends on scale type
                //     x: null,
                //     y: null
                // },
                // Function called once panning is completed
                // Useful for dynamic data loading
                //onPan: function() { console.log('I was panned!!!'); }
            },
            
            // Container for zoom options
            zoom: {
                // Boolean to enable zooming
                enabled: true,
        
                // Enable drag-to-zoom behavior
                //drag: true,
        
                // Zooming directions. Remove the appropriate direction to disable 
                // Eg. 'y' would only allow zooming in the y direction
                mode: 'x',
                rangeMin: {
                    // Format of min zoom range depends on scale type
                    // x: 0.1,
                    // y: null
                },
                rangeMax: {
                    // Format of max zoom range depends on scale type
                    // x: 0.1,
                    // y: null
                },
                // Function called once zooming is completed
                // Useful for dynamic data loading
                //onZoom: function() { console.log('I was zoomed!!!'); }
            }
        }
    });

}

function graphClickCallback(evt, x, points){
    console.log("Graph clicked " + x);
    var seekTime = x - 10;
    var url = "https://www.twitch.tv/videos/" + videoId + "?t=" + seekTime + "s";
    window.open(url,"_self")
}

function formatTimeDisplay(seconds, granularity, opts, graph){
    return convertSeconds(seconds);
}

function formatMouseoverDisplay(value, opts, seriesName, dygraph, row, col){
    if (seriesName == "Count"){
        return value;
    }    
    return convertSeconds(value);
}

function convertSeconds(sec_num) {
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function unzoomGraph() {
    dyGraph.updateOptions({
      dateWindow: null,
      valueRange: null
    });
  }

function pullChatLog( messageArray, obj, currentTime, currentFreqValue, currentFreqArray){
    var clientId = 'oe92qc609eaxxhoh4h5s06pvz7gd9l';
    var twitchChatUrlPrefix = 'https://api.twitch.tv/kraken/videos/';
    var twitchChatUrlSuffix = '/comments';
    var twitchChatUrlInitial = '?content_offset_seconds=0';
    var twitchChatUrlCursor = '?cursor=';
    var xhr = new XMLHttpRequest();

    if (obj == null){
        url = twitchChatUrlPrefix + videoId + twitchChatUrlSuffix + twitchChatUrlInitial;
    }
    else{
        url = twitchChatUrlPrefix + videoId + twitchChatUrlSuffix + twitchChatUrlCursor + obj._next;
    }

    xhr.open("GET", url, true);
    xhr.setRequestHeader("Client-ID", clientId);
    xhr.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json");

    if (currentTime == null && currentFreqValue == null){
        currentTime = 0;
        currentFreqValue = 0;
        currentFreqArray = [];
    }

    xhr.onload = function(){
        console.log("Pulled chat log from Twitch");
        var result = xhr.responseText;

        obj = JSON.parse(result);

        for (var i in obj.comments){
            messageArray.push(new ChatMessage(obj.comments[i].content_offset_seconds, obj.comments[i].message.body));

            if (obj.comments[i].content_offset_seconds > currentTime + 5){
                currentFreqArray.push([currentTime,currentFreqValue]);
                currentFreqValue = 0;
                currentTime += 5;
            }
    
            currentFreqValue++;
        }
        dyGraph.updateOptions({'file': currentFreqArray});  //dynamically updates graph with frequency data

        if (obj._next != null){
            pullChatLog(messageArray, obj, currentTime, currentFreqValue, currentFreqArray);
        }
        else{
            chatlogs[videoId] = messageArray;
            //save storage
            chrome.storage.local.set({'chatlogs': chatlogs}, function() {
                console.log('Value is set to ' + chatlogs);
            });
        }
    };
    xhr.send();

}
