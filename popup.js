let storedData;

const raiPriceEl = document.getElementById('raiPrice');
const enabledInput = document.getElementById('enabledPop');
const optionsBtn = document.getElementById('optionsBtn');


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
});


/**
 * Listens to conversion updates sent from the backend and options  
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type && message.type == 'conversion') {
    // Update price in the front end
    // TODO localize
    console.log("price updated: ", message.value);
    raiPriceEl.textContent = Number(message.value).toFixed(2);
  } else if (message.type && message.type == 'enabled') {
    enabledInput.checked = message.value;
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