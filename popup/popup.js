var storedData;
var hostname;
var blacklisted;

const raiPriceEl = document.getElementById('raiPrice');
const enabledInput = document.getElementById('enabledPop');
const optionsBtn = document.getElementById('optionsBtn');
const blacklistBtn = document.getElementById('blacklistBtn');
const blacklistIcon = document.getElementById('blacklistIcon');
const blacklistText = document.getElementById('blacklistText');

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

  initBlacklistButton();
});


/**
 * Listens to updates sent from the backend and options  
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'conversion':
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


function initBlacklistButton() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0] || !tabs[0].url) {
      return;
    }

    hostname = new URL(tabs[0].url).hostname;

    if (storedData.blacklist.includes(hostname)) {
      blacklistText.innerText = 'Remove from blacklist';
      blacklistIcon.src = '../assets/images/ok.png'
      blacklisted = true;
    } else {
      blacklistText.innerText = 'Blacklist this website';
      blacklistIcon.src = '../assets/images/stop.png'
      blacklisted = false;
    }

    blacklistBtn.classList = 'button';
  });
}

/**
 * Adds domain to backlist when button is clicked
 */
blacklistBtn.addEventListener('click', e => {
  
  if (blacklisted) {
    const index = storedData.blacklist.indexOf(hostname);
    if (index > -1) {
      storedData.blacklist.splice(index, 1);
    } else {
      return;
    }
  } else {
    storedData.blacklist.push(hostname);
  }

  // Stores updated data
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background
  chrome.runtime.sendMessage({ type: 'blacklist', value: storedData.blacklist });

  initBlacklistButton();
});