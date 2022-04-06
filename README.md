# oembed.js
oembed.js is a JavaScript implementation of the [oEmbed format](https://oembed.com/).

## Features
- Fetch oEmbed data for websites

## Installing
```
npm install oembed.js
```

## API

The oembed.js class needs to be initialized with a list of providers. It is
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

| Config entry      | Type          | Description |
| -----------       | -----------   | ----------- |
| `format`          | string        | Response format. Either `json` (default) or `xml`. |
| `maxWidth`        | number\|undefined        | Maximum width (defaults to `undefined`). |
| `maxHeight`        | number\|undefined        | Maximum height (defaults to `undefined`). |
| `oembedParameters`| object        |Parameters that will be applied to an endpoint (see syntax below).|

##### `oembedParameters` syntax

Some providers (e.g. Facebook) use parameters that are not defined in the official oEmbed specification.
You can supply these by origin here.

```js
{
    '<URL_ORIGIN>': { // e.g. 'https://graph.facebook.com'
        '<PARAMETER_NAME>': '<PARAMETER_VALUE>' // e.g. 'acess_token': '12|34'
    }
}
```
The `<URL_ORIGIN>` should match with the origin of an endpoint url.
For example one of Facebooks endpoints has the url `https://graph.facebook.com/v10.0/oembed_post`.
The origin would be `https://graph.facebook.com`.

### Method `async getProviderUrl(url): Promise<string[]>`
This method fetches the given `url` and checks whether it has a `<link rel="alternate">` tag
or `link` header for oEmbed data. If a tag or header is found, the method will
return a `Promise<string[]>`, otherwise an empty `Promise<string[]>`.

> This method does not check the providers list.

### Method `async getData(url, useProviderLookup=true): Promise<object | null>`
This method will check the given providers list for the `url` host. If the
host is not inside the providers list, the given host of `url` will be fetched
and checked for an oEmbed url, if `useProviderLookup` is enabled. `metaAppId` can
either be specified in the initial config or using the parameter as a fallback.

If no oEmbed url was found, `Promise<null>` will be returned, otherwise an `Promise<object>`
with the fetched data.

## Example
The following code will get the oembed data for `https://lars.koelker.dev`.
We also supply a `maxWidth` and `maxHeight` which should be respected by the oEmbed endpoints (`https://lars.koelker.dev` doesn't though).

```js
const oEmbed = require("oEmbed.js");
const axios = require("axios");

(async () => {
    const providers = await axios.get('https://oembed.com/providers.json');
    const oe = new oEmbed(providers.data, {
        maxWidth: 420,
        maxHeight: 69
    });
    const response = await oe.getData('https://lars.koelker.dev');
    
    console.log(response);
})()

```
