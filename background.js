chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: "index.html",
    type: "popup",
    width: 900,
    height: 800
  });
});