// var stats = document.createElement("div");
// stats.innerText = "Hello there!";
// document.body.appendChild(stats);

//TODO: implement first pass filter that filters for spikes in comment frequency, then do in depth analysis on those moments

var clientId = 'oe92qc609eaxxhoh4h5s06pvz7gd9l';

var videoId = (document.URL).split("/")[4];

var twitchChatUrlPrefix = 'https://api.twitch.tv/kraken/videos/';
var twitchChatUrlSuffix = '/comments';
var twitchChatUrlInitial = '?content_offset_seconds=0';
var twitchChatUrlCursor = '?cursor=';

var url = this.twitchChatUrlPrefix + videoId + this.twitchChatUrlSuffix + this.twitchChatUrlInitial;

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

var xhr = new XMLHttpRequest();
var chatMessageArray = [];
var obj = null;
var wordsMap = {};   // hash map that will find most popular text string every 10 seconds
var highlightList = [];
var frequencyList = [];
var time = 5;
var frequencyValue = 0;

alert("loading");

do {
    if (obj == null){
        url = this.twitchChatUrlPrefix + videoId + this.twitchChatUrlSuffix + this.twitchChatUrlInitial;
    }
    else{
        url = this.twitchChatUrlPrefix + videoId + this.twitchChatUrlSuffix + this.twitchChatUrlCursor + obj._next;
    }

    xhr.open("GET", url, false);
    xhr.setRequestHeader("Client-ID", clientId);
    xhr.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json");

    xhr.send();
    var result = xhr.responseText;

    var obj = JSON.parse(result);

    for (var i in obj.comments){
        if (obj.comments[i].content_offset_seconds > time){
            frequencyList.push(new Frequency(time,frequencyValue));
            frequencyValue = 0;

            time += 5;

            //find most popular words in wordmap and add to highlights map
            //empty out wordsMap
            var max = 0;
            var maxIndex = null;
            for (var word in wordsMap){
                if (wordsMap[word] > max){
                    max = wordsMap[word];
                    maxIndex = word;
                }
            }
            
            highlightList.push(new Highlight(time-10,maxIndex,max));

            wordsMap = {};

        }

        frequencyValue++;

        var wordsArray = (obj.comments[i].message.body).split(" ");
        wordsArray.forEach(function (key) {
            if (wordsMap.hasOwnProperty(key)) {
                wordsMap[key]++;
            } else {
                wordsMap[key] = 1;
            }
        });

        // chatMessageArray.push(new ChatMessage(obj.comments[i].content_offset_seconds, obj.comments[i].message.body));

    }

} while (obj._next != null);

highlightList.sort(function(a,b){
    return a.popularity - b.popularity;
})

for (var i in highlightList){
    console.log(highlightList[i].text + ", " + highlightList[i].time + ", " + highlightList[i].popularity );
}

// alert("video id is " + videoId + ", response is " + obj);

