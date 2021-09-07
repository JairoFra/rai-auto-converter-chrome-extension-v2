let storedData;

const minDecimals = -1; // TODO change to 0
const maxDecimals = 18;
const minInterval = 3;
const maxInterval = 3600;

const decimalsInput = document.getElementById('decimals');
const intervalInput = document.getElementById('interval');
const enabledInput = document.getElementById('enabled');
const priceTypeInput = document.getElementById('priceType');
const raiPriceEl = document.getElementById('raiPrice');


/**
 * Gets stored data
 */
chrome.storage.sync.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  storedData = res.data;

  // TODO allow set prefered currency in configuration?
  const dollar = storedData.currencies.find(currency => currency.id == 'usd');
  raiPriceEl.textContent = Number(dollar.conversion).toFixed(2);
  decimalsInput.value = storedData.decimals;
  intervalInput.value = storedData.refreshConversionTime;
  enabledInput.checked = storedData.enabled;
});


/**
 * Listens to conversion updates sent from the backend    
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Update price in the front end
  raiPriceEl.textContent = Number(message.conversion).toFixed(2);
});


/**
 * Manages changes in decimals input
 */
decimalsInput.addEventListener('change', e => {
  let value = e.target.value;

  if (value < minDecimals) {
    value = minDecimals;
    decimalsInput.value = value;
  } else if (value > maxDecimals) {
    value = maxDecimals;
    decimalsInput.value = value;
  }

  storedData.decimals = value;
  updatePreferences();
});


/**
 * Manages changes in interval input
 */
intervalInput.addEventListener('change', e => {
  let value = e.target.value;

  if (value < minInterval) {
    value = minInterval;
    intervalInput.value = value;
  } else if (value > maxInterval) {
    value = maxInterval;
    intervalInput.value = value;
  }

  storedData.refreshConversionTime = value;
  updatePreferences();
});


/**
 * Manages changes in enabled switch
 */
enabledInput.addEventListener('change', e => {
  storedData.enabled = e.target.checked;
  updatePreferences();
});


/**
 * Stores updated preferences
 */
function updatePreferences() {
  chrome.storage.sync.set({ data: storedData });
  
  // Sends message to the background
  chrome.runtime.sendMessage(storedData);
}