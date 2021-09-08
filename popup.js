let storedData;

const raiPriceEl = document.getElementById('raiPrice');
const enabledInput = document.getElementById('enabledPop');
const optionsBtn = document.getElementById('optionsBtn');
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

    case 'enabled': 
      enabledInput.checked = message.value;
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
 * Opens reflexer website when icon is clicked
 */
reflexerBtn.addEventListener('click', e => {
  chrome.tabs.create({url: 'https://reflexer.finance/'});
});