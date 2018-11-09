//TODO gradually display graph as data is pulled from twitch
//TODO add button to reset zoom instead of double click
//TODO seek video when point is clicked
//TODO annotate popular points for quick reference
//TODO do in depth analysis for emotes - in the background
//TODO add button to trigger graph load
//TODO V2 - sync chat log with remote server to improve initial pull speed

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
    }

    insertLoadGraphButton();
}

function insertLoadGraphButton(){
    if (graphDiv == null){
        var graphDiv = document.createElement('div');
        graphDiv.id = 'frequencyChart';
        graphDiv.style.width = "100%";
        var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
        scrollArea.insertBefore(graphDiv, scrollArea.childNodes[2]);
    }

    if (loadButton == null){
        var loadButton = document.createElement('input');
        loadButton.type = 'button';
        loadButton.value = "Load Chat Graph!";
        var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
        scrollArea.insertBefore(loadButton, scrollArea.childNodes[3]);
        loadButton.addEventListener ("click", loadGraph);
    }
    else{
        //TODO: unhide load button
    }
}


function loadGraph(evt){
    //TODO: hide load graph button
    video = (document.URL).split("/")[4];
    videoId = video.split("?")[0];
    console.log("Video Id: " + videoId);

    chrome.storage.local.get(['chatlogs'], function(result) {
        console.log('Value currently is ' + result.chatlogs[videoId]);
        chatlogs = result.chatlogs;
        if(result.chatlogs[videoId] != undefined){
            parseSavedChatLog(result.chatlogs[videoId]);
        }
        else{
            pullChatLog([], null);
        }
    });
}

// input time in seconds, returns string with hh:mm:ss
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    // var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    // var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    // var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? ":" : ":") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? ":" : ":") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "" : "") : "";

    return hDisplay + mDisplay + sDisplay; 
}

function parseSavedChatLog(chatlog){
    var time = 5;
    var frequencyValue = 0;
    //var frequencyData = []; //list of comment count every time interval
    //var timeData = []   //timestamps for frequencyData array

    var graphData = [];

    for (i = 0; i < chatlog.length; i++){
        if (chatlog[i].time > time){
            //frequencyData.push(frequencyValue);
            //timeData.push(secondsToHms(time));
            graphData.push([time,frequencyValue]);

            frequencyValue = 0;

            time += 5;
        }

        frequencyValue++;
    }
    displayDyGraph(graphData);
}

function displayDyGraph(graphData){
    if (resetButton == null){
        var resetButton = document.createElement('input');
        resetButton.type = 'button';
        resetButton.value = "Reset Zoom";
        var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
        scrollArea.insertBefore(resetButton, scrollArea.childNodes[3]);
        resetButton.addEventListener ("click", unzoomGraph);
    }

    dyGraph = new Dygraph(

        // containing div
        document.getElementById("frequencyChart"),
        graphData, //data
        {   //options
            clickCallback: graphClickCallback,
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
    var date = new Date(null);
    date.setSeconds(seconds); 
    var result = date.toISOString().substr(11, 8);
    return result;
}

function unzoomGraph() {
    dyGraph.updateOptions({
      dateWindow: null,
      valueRange: null
    });
  }

function pullChatLog( messageArray, obj){
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

    xhr.onload = function(){
        console.log("Pulled chat log from Twitch");
        var result = xhr.responseText;

        obj = JSON.parse(result);

        for (var i in obj.comments){
            messageArray.push(new ChatMessage(obj.comments[i].content_offset_seconds, obj.comments[i].message.body));
        }

        if (obj._next != null){
            pullChatLog(messageArray, obj);
        }
        else{
            chatlogs[videoId] = messageArray;
            //save storage
            chrome.storage.local.set({'chatlogs': chatlogs}, function() {
                console.log('Value is set to ' + chatlogs);
            });

            parseSavedChatLog(messageArray);
        }
    };
    xhr.send();

}

function myMain (evt) {
    //var canvasContainer = document.createElement("canvasContainer");
    // canvasContainer.style.width = '100%';
    //canvasContainer.innerHTML = '<canvas id="frequencyChart"></canvas>'
    var canvas = document.createElement('canvas');
    canvas.id = 'frequencyChart';
    var scrollArea = document.getElementsByClassName('tw-pd-t-2 tw-pd-x-3')[0]; //.appendChild(canvas);
    scrollArea.insertBefore(canvas, scrollArea.childNodes[2]);
    //document.getElementById('root').appendChild(canvasContainer);


    //TODO: implement first pass filter that filters for spikes in comment frequency, then do in depth analysis on those moments

    // import Chart from './Chart.bundle';

    var clientId = 'oe92qc609eaxxhoh4h5s06pvz7gd9l';

    var videoId = (document.URL).split("/")[4];

    var twitchChatUrlPrefix = 'https://api.twitch.tv/kraken/videos/';
    var twitchChatUrlSuffix = '/comments';
    var twitchChatUrlInitial = '?content_offset_seconds=0';
    var twitchChatUrlCursor = '?cursor=';

    class ChatMessage {
        constructor(time, text) {
            this.time = time;
            this.text = text;
        }
    }

    class Highlight {
        constructor(time, text, popularity){
            this.time = time;
            this.text = text;
            this.popularity = popularity;
        }
    }

    class Frequency{
        constructor(time, value){
            this.time = time;
            this.value = value;
        }
    }

    var frequencyData = [];
    var timeData = []

    var xhr = new XMLHttpRequest();
    var chatMessageArray = [];
    var obj = null;
    var wordsMap = {};   // hash map that will find most popular text string every 10 seconds
    var highlightList = [];
    var frequencyList = [];
    var time = 5;
    var frequencyValue = 0;

    do {
        if (obj == null){
            url = twitchChatUrlPrefix + videoId + twitchChatUrlSuffix + twitchChatUrlInitial;
        }
        else{
            url = twitchChatUrlPrefix + videoId + twitchChatUrlSuffix + twitchChatUrlCursor + obj._next;
        }

        xhr.open("GET", url, false);
        xhr.setRequestHeader("Client-ID", clientId);
        xhr.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json");

        xhr.send();
        console.log("Pulled data from Twitch");
        var result = xhr.responseText;

        var obj = JSON.parse(result);

        for (var i in obj.comments){
            // if (time > 300){
            //     break;
            // }
            if (obj.comments[i].content_offset_seconds > time){
                // frequencyList.push(new Frequency(time,frequencyValue));
                frequencyData.push(frequencyValue);

                frequencyValue = 0;

                timeData.push(secondsToHms(time));

                time += 5;

                //find most popular words in wordmap and add to highlights map
                //empty out wordsMap
                //TODO background processing
                // var max = 0;
                // var maxIndex = null;
                // for (var word in wordsMap){
                //     if (wordsMap[word] > max){
                //         max = wordsMap[word];
                //         maxIndex = word;
                //     }
                // }
                
                // highlightList.push(new Highlight(time-10,maxIndex,max));

                // wordsMap = {};

            }

            frequencyValue++;

            //TODO background processing
            // var wordsArray = (obj.comments[i].message.body).split(" ");
            // wordsArray.forEach(function (key) {
            //     if (wordsMap.hasOwnProperty(key)) {
            //         wordsMap[key]++;
            //     } else {
            //         wordsMap[key] = 1;
            //     }
            // });

            chatMessageArray.push(new ChatMessage(obj.comments[i].content_offset_seconds, obj.comments[i].message.body));

        }

    } while (obj._next != null);

    chatlogs[videoId] = chatMessageArray;
    //save storage
    chrome.storage.local.set({'chatlogs': chatlogs}, function() {
        console.log('Value is set to ' + chatlogs);
    });

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
                mode: 'xy',
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
                drag: true,
        
                // Zooming directions. Remove the appropriate direction to disable 
                // Eg. 'y' would only allow zooming in the y direction
                mode: 'x',
                // rangeMin: {
                //     // Format of min zoom range depends on scale type
                //     x: null,
                //     y: null
                // },
                // rangeMax: {
                //     // Format of max zoom range depends on scale type
                //     x: null,
                //     y: null
                // },
                // Function called once zooming is completed
                // Useful for dynamic data loading
                //onZoom: function() { console.log('I was zoomed!!!'); }
            }
        }
    });


    // TODO background processing
    // highlightList.sort(function(a,b){
    //     return a.popularity - b.popularity;
    // })

    // for (var i in highlightList){
    //     console.log(highlightList[i].text + ", " + highlightList[i].time + ", " + highlightList[i].popularity );
    // }

    // alert("video id is " + videoId + ", response is " + obj);

}