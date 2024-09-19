const setChromeAttr = (key, val) => {
  chrome.storage.sync.set({[key]: JSON.stringify(val)});
};

const getChromeAttr = async(key, defaultVal=null) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([key], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key] != undefined ? JSON.parse(result[key]) : defaultVal);
      }
    });
  });
};

// export default { setChromeAttr, getChromeAttr };