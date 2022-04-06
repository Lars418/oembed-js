const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

class oEmbed {
    /**
     * @description Creates oEmbed class using the given list of providers
     * @param providers {object[]} Configuration file
     * @param config {object}
     * */
    constructor(providers, config = {}) {
        // Replace asterisk with regex expression and adjust naming
        this.providers = providers.map(provider => ({
            url: provider.provider_url,
            endpoints: provider.endpoints.map(endpoint => ({
                url: endpoint.url.replace(/\*/g, '.*'),
                schemes: !endpoint.schemes
                    ? [ provider.provider_url.endsWith('/') ? `${provider.provider_url}.*` :  `${provider.provider_url}/.*` ]
                    : endpoint.schemes.map(scheme => scheme.replace(/\*/g, '.*'))
            }))
        }));

        if (config.format && !['json', 'xml'].includes(config.format.toLowerCase())) {
            throw new Error('Invalid format: ' + config.format);
        }

        if (config.maxWidth && Number.isNaN(+config.maxWidth)) {
            throw new Error('Invalid maxWidth: ' + config.maxWidth);
        }

        if (config.maxHeight && Number.isNaN(+config.maxHeight)) {
            throw new Error('Invalid maxWidth: ' + config.maxHeight);
        }

        this.config = {
            format: 'json',
            maxWidth: undefined,
            maxHeight: undefined,
            oembedParameters: {},
            debug: false,
            ...config
        };
    }

    /**
     * @description Gets oEmbed url for the given url
     * @param url {string} The url to get the oEmbed url for
     * @returns {Promise<string[]>} oEmbed urls
     * */
    async getProviderUrl(url) {
        const result = await axios.get(url);

        if (result.headers.link) {
            return [ result.headers.link ];
        }

        const { window: { document } } = new JSDOM(result.data);
        const oEmbedUrls = document.querySelectorAll('link[rel="alternate"][type="application/json+oembed"], link[rel="alternate"][type="xml+oembed"]');

        if (oEmbedUrls.length > 0 ) {
            return Array.from(oEmbedUrls).map(_url => _url.href);
        }

        return [];
    }

    /**
     * @private
     * @description Constructs the oembed endpoint url
     * @param oembedUrl {string} Oembed URL
     * @param url {string} URL to get Oembed data from
     * @param parameters {object} Optional URL parameters
     * */
    _constructOembedUrl(oembedUrl, url, parameters) {
        const { format, maxWidth, maxHeight } = this.config;
        const preparedParameters = Object.entries(parameters).map(parameter => `${parameter[0]}=${encodeURIComponent(parameter[1])}`).join('&');

        if (Object.keys(parameters).length === 0 && maxWidth === undefined && maxHeight === undefined) {
            return `${oembedUrl}?url=${encodeURIComponent(url)}&format=${format}`;
        }

        let preparedUrl = `${oembedUrl}?url=${encodeURIComponent(url)}&format=${format}&${preparedParameters}`;

        if (maxWidth) {
            preparedUrl += `&maxwidth=${maxWidth}`;
        }

        if (maxHeight) {
            preparedUrl += `&maxheight=${maxHeight}`;
        }

        return preparedUrl;
    }

    /**
     * @description Gets oEmbed data for the given url
     * @param url {string} The url to get the oEmbed data for
     * @param useProviderLookup {boolean} Fetch url for oEmbed information
     * @returns {Promise<object>}
     * */
    async getData(url, useProviderLookup=true) {
        const baseUrl = new URL(url).origin.replace('://www.', '://');
        const provider = this.providers.find(provider => provider.url.replace(/\/$/, '').replace('://www.', '://') === baseUrl);
        const { oembedParameters } = this.config;

        if (provider) {
            const { format } = this.config;
            let endpoint = null;

            if (provider.endpoints.length > 1 ) {
                const endPointWithPreferredFormat = provider.endpoints.find(endpoint => endpoint.url.toLowerCase().includes(format.toLowerCase()));

                if (endPointWithPreferredFormat && endPointWithPreferredFormat.schemes.some(scheme => url.match(scheme))) {
                    endpoint = endPointWithPreferredFormat;
                }
            }

            endpoint = provider.endpoints.find(endpoint => endpoint.schemes.some(scheme => url.match(scheme)));

            if (!endpoint) {
                return null;
            }

            const foundParameters = Object.entries(oembedParameters)
                .map(entry => [entry[0].replace(/\/$/, ''), entry[1]]) // Replace trailing slash on origin
                .find(entry => entry[0] === new URL(endpoint.url).origin.replace(/\/$/, ''));
            const parameters = (Array.isArray(foundParameters) && foundParameters.length === 2)
                                    ? foundParameters[1]
                                    : {};

            const constructedUrl = this._constructOembedUrl(endpoint.url, url, parameters);

            const result = await axios.get(constructedUrl);

            return result.data;
        }

        if (!useProviderLookup) {
            return null;
        }

        const computedProvider = await this.getProviderUrl(url);

        if (computedProvider.length === 0) {
            return null;
        }

        const result = await axios.get(computedProvider[0]);

        return result.data;
    }
}

module.exports = oEmbed;