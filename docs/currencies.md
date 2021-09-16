# Currencies

The available currencies supported can be found in [/main/currencies.js](/main.currencies.js).

The conversion rates are obtained using the [Coin Gecko API](https://www.coingecko.com/api/documentations/v3). To add a new currency, it is necessary to [check](https://www.coingecko.com/api/documentations/v3#/coins/get_coins_list) that it is supported by the API.


The structure of a currency object is describe as follows:

|Parameter|Type|Example|Comments|
|---------|----|-------|--------|
|id       |String| 'btc' | ID in the Coin Gecko API. Used to query for a conversion rate. |
|ticker   |String| 'BTC' | Ticker of the currency. Used to be displayed in the options window. |
|regExps  |String[] | ['BTC\|₿','Bitcoins?'] | Array of regular expressions for the currency. The first position (required) represents the short form of the currency denomination, that can be used before or after the amount, with or without a space. The second position (optional) represents the long form of the currency denomination, that can only be used after the amount and with a space.|
|enabled  |boolean | true | If true, the extension will convert the currency to RAI. This value can be changed by the user. |
|fiat     |boolean | false | Indicates whether it is a Fiat currency (true) or a crypto currency (false). |
|directConversion |boolean | true | Indicates whether the currency can or cannot be converted to RAI directly. The list of currencies that can be converted directly to any other currency in the Coin Gecko API is [limited](https://www.coingecko.com/api/documentations/v3#/simple/get_simple_supported_vs_currencies). For currencies without direct conversion supported, it is queried its conversion to the USD in order to calculate its relative value for RAI. E.g.: Given ADA/USD=2.46 and RAI/USD=3.03. Then ADA/RAI=(ADA/USD)/(RAI/USD)=0.8119 |