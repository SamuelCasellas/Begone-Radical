function createContextMenu() {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: "myContextMenu",
    title: "Reset blocked users",
    contexts: ["all"],
  });
  
  chrome.contextMenus.onClicked.addListener(() => {
    chrome.storage.sync.set({["blocked-users"]: JSON.stringify([])});
  });
}

createContextMenu();
