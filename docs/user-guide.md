# Popup
![popup](/assets/screenshots/popup.png)

### Access to Settings
You can access the Settings window by clicking the cog icon at the top left side.

### On/Off switch
To start and stop automatic conversion to RAI. It works in real time. 

### Add/remove a website to/from blacklist
You can add and remove individual websites to the blacklist. For all websites included in the blacklist the extension will not automatically convert other currencies to RAI.


# Settings
The settings can be accessed by clicking the cog icon in the popup or with right click over the extension icon and choosing "Options".

## Preferences
![preferences](/assets/screenshots/preferences.png)

### Dark mode
Toggle between light mode and dark mode interface.

### Show price badge
If selected, shows the current conversion for RAI to USD in the extension icon.
<table>
  <tr>
    <td><img src="/assets/screenshots/badge-on.png"></td>
    <td>Price badge enabled</td>
  </tr>
  <tr>
    <td><img src="/assets/screenshots/badge-off.png"></td>
    <td>Price badge disabled</td>
  </tr>
</table>


### Use custom number of decimals
By default, the amount in RAI will be shown with the same number of decimals found in the original currency. However, the value of decimals to be shown can be adjusted by the user to a specific value.

### Number of decimals
The number of decimals in RAI amount to be displayed in the HTML. This field only applies if it has been selected to use custom number of decimals.
* Minimum: 0
* Maximum: 18
* Default: 2

### Conversion rate interval
The conversion rate is continuously updated in order to offer an accurate conversion without delays. The update interval time can be adjusted in seconds.
* Minimum: 5
* Maximum: 3600 (1 hour)
* Default: 300 (5 minutes)


## Currencies
![currencies](/assets/screenshots/currencies.png)

Select the currencies that will be converted to RAI.

## Blacklist
![blacklist](/assets/screenshots/blacklist.png)

You can add and remove individual websites to the blacklist. For all websites included in the blacklist the extension will not automatically convert other currencies to RAI.

# Extension icon

The icon for the extension will appear different depending on the current status of the conversion functionality.

<table>
  <tr>
    <th><img src="/assets/icons/icon_32.png"></th>
    <td>Conversion enabled</td>
  </tr>
  <tr>
    <td><img src="/assets/icons/icon_32_disabled.png"></td>
    <td>Conversion disabled</td>
  </tr>
  <tr>
    <td><img src="/assets/icons/icon_32_blocked.png"></td>
    <td>Conversion disabled for the website of the active tab (blacklisted)</td>
  </tr>
</table>
