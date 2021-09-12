var storedData;

const raiPriceEl = document.getElementById('raiPrice');
const enabledInput = document.getElementById('enabledPop');
const optionsBtn = document.getElementById('optionsBtn');
const blacklistBtn = document.getElementById('blacklistBtn');
const reflexerBtn = document.getElementById('reflexerPop');


/**
 * Gets stored data
 */
chrome.storage.local.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  storedData = res.data;

  const dollar = storedData.currencies.find(currency => currency.id == 'usd');
  raiPriceEl.textContent = Number(dollar.conversion).toFixed(2);
  enabledInput.checked = storedData.enabled;
  enabledInput.parentElement.classList = storedData.enabled ? 'slide checked' : 'slide';

  if (storedData.darkMode) {
    document.body.classList.add('dark');
  }
});


/**
 * Listens to updates sent from the backend and options  
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'conversion': 
      // TODO localize
      console.log("price updated: ", message.value);
      raiPriceEl.textContent = Number(message.value).toFixed(2);
      break;

    case 'darkMode': 
      if (message.value) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      break;
  }
});


/**
 * Manages changes in enabled switch
 */
enabledInput.addEventListener('change', e => {
  storedData.enabled = e.target.checked;
  enabledInput.parentElement.classList = storedData.enabled ? 'slide checked' : 'slide';

  // Stores updated data
  chrome.storage.local.set({ data: storedData });
  
  // Sends message to the background
  chrome.runtime.sendMessage({ type: 'enabled', value: storedData.enabled });
});


/**
 * Opens options when button is clicked
 */
optionsBtn.addEventListener('click', e => {
  chrome.runtime.openOptionsPage();
});


/**
 * Adds domain to backlist when button is clicked
 */
blacklistBtn.addEventListener('click', e => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0] || !tabs[0].url) {
      return;
    }
    
    const hostname = new URL(tabs[0].url).hostname;
    storedData.blacklist.push(hostname);

    // Stores updated data
    chrome.storage.local.set({ data: storedData });
  
    // Sends message to the background
    chrome.runtime.sendMessage({ type: 'blacklist', value: storedData.blacklist });
  });
});


/**
 * Removes domain from backlist when button is clicked
 */
// blacklistOffBtn.addEventListener('click', e => {
//   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//     if (!tabs[0] || !tabs[0].url) {
//       return;
//     }

//     const hostname = new URL(tabs[0].url).hostname;
//     const index = storedData.blacklist.indexOf(hostname);
//     if (index > -1) {
//       storedData.blacklist.splice(index, 1);

//       // Stores updated data
//       chrome.storage.local.set({ data: storedData });
    
//       // Sends message to the background
//       chrome.runtime.sendMessage({ type: 'blacklist', value: storedData.blacklist });
//     }
//   });
// });


/**
 * Opens reflexer website when icon is clicked
 */
reflexerBtn.addEventListener('click', e => {
  chrome.tabs.create({url: 'https://reflexer.finance/'});
});