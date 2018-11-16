
//need to monitor when history changed since twitch doesn't trigger DOM loaded event when changing pages
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {historyChanged: "true"}, function(response) {});
      });
    // console.log('Page uses History API and we heard a pushSate/replaceState.');
    });