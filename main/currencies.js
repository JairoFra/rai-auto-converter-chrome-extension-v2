const currencies = [
  // Fiat
  {
    id: 'usd',
    ticker: 'USD',
    regExps: [
      'USD|U.S.D.|US\\s?\\$|U.S.\\s?\\$|\\$'
    ],
    enabled: true,
    fiat: true,
    directConversion: true
  },
  {
    id: 'eur',
    ticker: 'EUR',
    regExps: [
      'EUR|€UR|€|Euros?|€uros?'
    ],
    enabled: true,
    fiat: true,
    directConversion: true
  },
  {
    id: 'cny',
    ticker: 'CNY',
    regExps: [
      'CNY|CN¥|RMB|Yuan'
    ],
    enabled: true,
    fiat: true,
    directConversion: true
  },
  {
    id: 'jpy',
    ticker: 'JPY',
    regExps: [
      'JPY|¥|JP¥|Yen'
    ],
    enabled: true,
    fiat: true,
    directConversion: true
  },
  {
    id: 'gbp',
    ticker: 'GBP',
    regExps: [
      'GBP|£|Pounds?'
    ],
    enabled: true,
    fiat: true,
    directConversion: true
  },
  {
    id: 'krw',
    ticker: 'KRW',
    regExps: [
      'KRW|₩|Won'
    ],
    enabled: true,
    fiat: true,
    directConversion: true
  },
  {
    id: 'inr',
    ticker: 'INR',
    regExps: [
      'INR|₹|Rupees?'
    ],
    enabled: true,
    fiat: true,
    directConversion: true
  },
  // Crypto
  {
    id: 'bch',
    ticker: 'BCH',
    regExps: [
      'BCH'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'bnb',
    ticker: 'BNB',
    regExps: [
      'BNB'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'btc',
    ticker: 'BTC',
    regExps: [
      'BTC|Bitcoins?|₿'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'dot',
    ticker: 'DOT',
    regExps: [
      'DOT'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'eth',
    ticker: 'ETH',
    regExps: [
      'ETH|Ether'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'link',
    ticker: 'LINK',
    regExps: [
      'LINK'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'ltc',
    ticker: 'LTC',
    regExps: [
      'LTC'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'ripple',
    ticker: 'XRP',
    regExps: [
      'XRP'
    ],
    enabled: true,
    fiat: false,
    directConversion: true
  },
  {
    id: 'binance-usd',
    ticker: 'BUSD',
    regExps: [
      'BUSD'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'cardano',
    ticker: 'ADA',
    regExps: [
      'ADA'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'dai',
    ticker: 'DAI',
    ticker: 'DAI',
    regExps: [
      'DAI'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'dogecoin',
    ticker: 'DOGE',
    regExps: [
      'DOGE'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'float-protocol-float',
    ticker: 'FLOAT',
    regExps: [
      'FLOAT'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'liquity-usd',
    ticker: 'LUSD',
    regExps: [
      'LUSD'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'nusd',
    ticker: 'sUSD',
    regExps: [
      'sUSD'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'solana',
    ticker: 'SOL',
    regExps: [
      'SOL'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'tether',
    ticker: 'USDT',
    regExps: [
      'USDT'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'uniswap',
    ticker: 'UNI',
    regExps: [
      'UNI'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'usd-coin',
    ticker: 'USDC',
    regExps: [
      'USDC'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'usdp',
    ticker: 'USDP/PAX',
    regExps: [
      'PAX|USDP'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  },
  {
    id: 'terrausd',
    ticker: 'UST',
    regExps: [
      'UST'
    ],
    enabled: true,
    fiat: false,
    directConversion: false
  }
];