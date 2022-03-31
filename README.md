# oembed.js
oEmbed.js is a JavaScript implementation of the [oEmbed format](https://oembed.com/).

## Features
- Fetch oEmbed data for websites

## Installing
```
npm install oEmbed.js
```

## API

The OEmbed.js class needs to be initialized with a list of providers. It is
recommended to use the provider list from oEmbed itself: `https://oembed.com/providers.json`.
You can also supply your own list or, if you don't want to use the provider lookup,
use an empty array (`new oEmbed([])`).

### Constructor
The constructor takes two arguments: `providers` and an optional `config`.

| Parameter         | Type | Description |
| -----------       | ----------- | ----------- |
| `providers`       | `object[]`       | An array with the provider syntax (see below)
| `config`          | `object`        | A config object with the config syntax (see below)


#### Provider syntax
Asterisks represent a wildcard.
```json
{
    "provider_name": "lars.koelker.dev",
    "provider_url": "https://lars.koelker.dev",
    "endpoints": [
      {
        "schemes": [
          "https:/lars.koelker.dev/*"
        ],
        "url": "https:/lars.koelker.dev/oembed"
      }
    ]
}
```

#### Config syntax
The selected format will be appended to the oEmbed requests, there is no
guarantee that a page will respect the format. `format` defaults to `json`.
```js
{
  format: "json" // "json" or "xml"
}
```

### Method `async getProviderUrl(url): Promise<string[]>`
This method fetch the given `url` and check whether it has a `<link rel="alternate">` tag
or `link` header for oEmbed data. If a tag or header is found, the method will
return a `Promise<string[]>`, otherwise an empty `Promise<string[]>`.

> This method does not check the providers list.

### Method `async getData(url): Promise<object | null>`
This method will check the given providers list for the `url` host. If the
host is not inside the providers list, the host given `url` will be fetched
and checked for an oEmbed url.

If no oEmbed url was found, `Promise<null>` will be returned, otherwise an `Promise<object>`
with the fetched data.

## Example
The following code will get the oembed data for `lars.koelker.dev`.

```js
const oEmbed = require("oEmbed.js");
const axios = require("axios");

(async () => {
    const providers = await axios.get('https://oembed.com/providers.json');
    const oe = new oEmbed(providers.data);
    const response = await oe.getData('https://lars.koelker.dev/');
    
    console.log(response);
})()

```
