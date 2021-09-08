let storedData;

const minDecimals = -1; // TODO change to 0
const maxDecimals = 18;
const minInterval = 3;
const maxInterval = 3600;

const decimalsInput = document.getElementById('decimals');
const intervalInput = document.getElementById('interval');
const enabledInput = document.getElementById('enabledOpt');
const priceTypeInput = document.getElementById('priceType');
const selectAllFiatBtn = document.getElementById('selectAllFiat');
const unselectAllFiatBtn = document.getElementById('unselectAllFiat');
const selectAllCryptoBtn = document.getElementById('selectAllCrypto');
const unselectAllCryptoBtn = document.getElementById('unselectAllCrypto');


/**
 * Gets stored data
 */
chrome.storage.local.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  storedData = res.data;

  storedData.currencies.forEach(currency => {
    renderCurrencyOptions(currency);
  });
  decimalsInput.value = storedData.decimals;
  intervalInput.value = storedData.refreshInterval;
  enabledInput.checked = storedData.enabled;
});


/**
 * Listens to updates sent from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type && message.type == 'enabled') {
    enabledInput.checked = message.value;
  }
});


/**
 * Manages changes in decimals input
 */
let decimalsChanges = e => {
    let value = e.target.value;
  
    if (value < minDecimals) {
      value = minDecimals;
      decimalsInput.value = value;
    } else if (value > maxDecimals) {
      value = maxDecimals;
      decimalsInput.value = value;
    }
  
    storedData.decimals = value;
  
    // Updates preferences
    chrome.storage.local.set({ data: storedData });
      
    // Sends message to the background and popup
    chrome.runtime.sendMessage({ type: 'decimals', value: storedData.decimals });
};

decimalsInput.addEventListener('change', decimalsChanges);
decimalsInput.addEventListener('keyup', decimalsChanges);


/**
 * Manages changes in interval input
 */
let intervalChanges = e => {
  let value = e.target.value;

  if (value < minInterval) {
    value = minInterval;
    intervalInput.value = value;
  } else if (value > maxInterval) {
    value = maxInterval;
    intervalInput.value = value;
  }

  storedData.refreshInterval = value;

  // Updates preferences
  chrome.storage.local.set({ data: storedData });
  
  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'interval', value: storedData.refreshInterval });
};

intervalInput.addEventListener('change', intervalChanges);
intervalInput.addEventListener('keyup', intervalChanges);


/**
 * Manages changes in enabled switch
 */
enabledInput.addEventListener('change', e => {
  storedData.enabled = e.target.checked;

  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'enabled', value: storedData.enabled });
});


/**
 * Renders available currencies
 */
function renderCurrencyOptions(currency) {
  let fiatContainer = document.getElementById('fiatCurrencies');
  let cryptoContainer = document.getElementById('cryptoCurrencies');

  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = currency.id;
  checkbox.value = currency.id;
  checkbox.id = currency.id;
  checkbox.checked = currency.enabled;  

  let label = document.createElement('label');
  label.htmlFor = 'id';
  label.appendChild(document.createTextNode(currency.ticker));

  if (currency.fiat) {
    fiatContainer.appendChild(checkbox);
    fiatContainer.appendChild(label);
  } else {
    cryptoContainer.appendChild(checkbox);
    cryptoContainer.appendChild(label);
  }

  startCurrencyListeners();
}


/**
 * Starts listeners for currency inputs
 * They cannot be started until they have been rendered
 */
function startCurrencyListeners() {
  const currenciesInputs = document.getElementById('currencies').querySelectorAll('input');
  const fiatCurrenciesInputs = document.getElementById('fiatCurrencies').querySelectorAll('input');
  const cryptoCurrenciesInputs = document.getElementById('cryptoCurrencies').querySelectorAll('input');

  currenciesInputs.forEach(element => {
    element.addEventListener('change', e => {
      let changedCurrency = storedData.currencies.find(currency => currency.id == e.target.id);
      changedCurrency.enabled = e.target.checked;
    
      updateCurrencies();
    });
  });

  selectAllFiatBtn.addEventListener('click', e => {
    fiatCurrenciesInputs.forEach(element => {
      element.checked = true;
    });

    storedData.currencies.filter(currency => currency.fiat).forEach(currency => currency.enabled = true);

    updateCurrencies();
  });

  unselectAllFiatBtn.addEventListener('click', e => {
    fiatCurrenciesInputs.forEach(element => {
      element.checked = false;
    });

    storedData.currencies.filter(currency => currency.fiat).forEach(currency => currency.enabled = false);

    updateCurrencies();
  });

  selectAllCryptoBtn.addEventListener('click', e => {
    cryptoCurrenciesInputs.forEach(element => {
      element.checked = true;
    });

    storedData.currencies.filter(currency => !currency.fiat).forEach(currency => currency.enabled = true);

    updateCurrencies();
  });

  unselectAllCryptoBtn.addEventListener('click', e => {
    cryptoCurrenciesInputs.forEach(element => {
      element.checked = false;
    });

    storedData.currencies.filter(currency => !currency.fiat).forEach(currency => currency.enabled = false);

    updateCurrencies();
  });
}


/**
 * Updates currencies preferences
 */
function updateCurrencies() {
  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'currencies', value: storedData.currencies });
}