let storedData;

const minDecimals = 0;
const maxDecimals = 18;
const minInterval = 5;
const maxInterval = 3600;

const darkModeInput = document.getElementById('darkMode');
const showBadgeInput = document.getElementById('showBadgeOpt');
const customDecimalsInput = document.getElementById('customDecimalsOpt');
const decimalsInput = document.getElementById('decimals');
const intervalInput = document.getElementById('interval');
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

  renderCurrencyOptions();
  renderBlacklist();

  intervalInput.value = storedData.refreshInterval;
  darkModeInput.checked = storedData.darkMode;
  showBadgeInput.checked = storedData.showBadge;
  customDecimalsInput.checked = storedData.customDecimals;
  decimalsInput.value = storedData.decimals;

  decimalsInput.parentNode.classList = storedData.customDecimals ? 'input-group' : 'input-group display-none';

  if (storedData.darkMode) {
    document.body.classList.add('dark');
  }
});


/**
 * Manages changes custom decimals switch
 */
customDecimalsInput.addEventListener('change', e => {
  storedData.customDecimals = e.target.checked;

  decimalsInput.parentNode.classList = storedData.customDecimals ? 'input-group' : 'input-group display-none';

  // Updates preferences
  chrome.storage.local.set({ data: storedData });
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
};

decimalsInput.addEventListener('change', decimalsChanges);
decimalsInput.addEventListener('keyup', decimalsChanges);


/**
 * Manages changes in interval input
 */
let intervalChanges = e => {
  let value = e.target.value;

  if (value < minInterval) {
    if (e.type = 'change') {
      value = minInterval;
      intervalInput.value = value;
    } else {
      return;
    }
  } else if (value > maxInterval) {
    if (e.type = 'change') {
      value = maxInterval;
      intervalInput.value = value;
    } else {
      return;
    }
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
 * Manages changes in dark mode switch
 */
darkModeInput.addEventListener('change', e => {
  storedData.darkMode = e.target.checked;

  if (storedData.darkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the popup
  chrome.runtime.sendMessage({ type: 'darkMode', value: storedData.darkMode });
});


/**
 * Manages changes in show badge switch
 */
showBadgeInput.addEventListener('change', e => {
  storedData.showBadge = e.target.checked;

  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background
  chrome.runtime.sendMessage({ type: 'showBadge', value: storedData.showBadge });
});


/**
 * Renders available currencies
 */
function renderCurrencyOptions() {
  let fiatContainer = document.getElementById('fiatCurrencies');
  let cryptoContainer = document.getElementById('cryptoCurrencies');

  storedData.currencies.forEach(currency => {
    let container = document.createElement('label');
    container.classList = 'checkbox-container';
    container.innerText = currency.ticker;

    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = currency.id;
    checkbox.value = currency.id;
    checkbox.id = currency.id;
    checkbox.checked = currency.enabled;  

    let checkmark = document.createElement('span');
    checkmark.classList = 'checkmark';

    container.appendChild(checkbox);
    container.appendChild(checkmark);

    if (currency.fiat) {
      fiatContainer.appendChild(container);
    } else {
      cryptoContainer.appendChild(container);
    }
  });

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


/**
 * Renders available currencies
 */
function renderBlacklist() {
  let blacklistContainer = document.getElementById('blacklist');
  blacklistContainer.innerHTML = '';

  if (storedData.blacklist.length) {
    let button = document.createElement('a');
    button.id = 'emptyBlacklist';
    button.classList = 'button btn-sm';
    button.innerText = 'Empty blacklist';

    blacklistContainer.appendChild(button);
  } else {
    let span = document.createElement('span');
    span.innerText = 'There are no websites blacklisted.';

    blacklistContainer.appendChild(span);
  }
  
  storedData.blacklist.forEach(hostname => {
    let div = document.createElement('div');
    div.classList = 'blacklist-item';

    let span = document.createElement('span');
    span.innerText = hostname;

    let removeImg = document.createElement('img');
    removeImg.src = '../assets/images/delete.png';
    removeImg.classList = 'clickable icon';

    div.appendChild(removeImg);
    div.appendChild(span);

    blacklistContainer.appendChild(div);
  });

  startBlacklistListeners();
}


/**
 * Starts listeners for blacklist items
 * They cannot be started until they have been rendered
 */
function startBlacklistListeners() {
  const blacklistButtons = document.getElementById('blacklist').querySelectorAll('img');
  const emptyBlacklist = document.getElementById('emptyBlacklist');

  blacklistButtons.forEach(element => {
    element.addEventListener('click', e => {
      const index = storedData.blacklist.indexOf(e.target.nextSibling.innerText);
      if (index > -1) {
        storedData.blacklist.splice(index, 1);
  
        // Stores updated data
        chrome.storage.local.set({ data: storedData });
      
        // Sends message to the background
        chrome.runtime.sendMessage({ type: 'blacklist', value: storedData.blacklist });
      }
      
      e.target.parentNode.remove();
    });
  });

  if (!emptyBlacklist) {
    return;
  }

  emptyBlacklist.addEventListener('click', e => {
    storedData.blacklist = [];

    // Stores updated data
    chrome.storage.local.set({ data: storedData });
    
    // Sends message to the background
    chrome.runtime.sendMessage({ type: 'blacklist', value: storedData.blacklist });
    
    blacklistButtons.forEach(element => {
      element.parentNode.remove();
    })

    emptyBlacklist.remove();

    let blacklistContainer = document.getElementById('blacklist');
    let span = document.createElement('span');
    span.innerText = 'There are no websites blacklisted.';
    blacklistContainer.appendChild(span);
  });
}


/**
 * Listens to blacklist updates sent from the popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'blacklist') {    
    storedData.blacklist = message.value;
    renderBlacklist();
  }
});