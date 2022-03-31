import axios from "axios";
import jsdom from "jsdom";
const { JSDOM } = jsdom;


export default class oEmbed {
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

        this.config = {
            preferredFormat: 'json',
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
     * @description Gets oEmbed data for the given url
     * @param url {string} The url to get the oEmbed data for
     * @returns {Promise<object>}
     * */
    async getData(url) {
        const baseUrl = new URL(url).origin;
        const provider = this.providers.find(provider => provider.url === baseUrl);

        console.log('Has Provider', provider);

        if (provider) {
            const { preferredFormat } = this.config;
            let endpoint = null;

            if (provider.endpoints.length > 1 ) {
                const endPointWithPreferredFormat = provider.endpoints.find(endpoint => endpoint.url.toLowerCase().includes(preferredFormat.toLowerCase()));

                if (endPointWithPreferredFormat.schemes.some(scheme => url.match(scheme))) {
                    endpoint = endPointWithPreferredFormat;
                }
            }

            endpoint = provider.endpoints.find(endpoint => endpoint.schemes.some(scheme => url.match(scheme)));

            if (!endpoint) {
                return null;
            }

            const constructedUrl = `${endpoint.url}?url=${encodeURIComponent(url)}&format=${preferredFormat}`;
            const result = await axios.get(constructedUrl);

            return result.data;
        }

        const computedProvider = await this.getProviderUrl(url);

        console.log(computedProvider);

        if (computedProvider.length === 0) {
            return null;
        }

        const result = await axios.get(computedProvider[0]);

        return result.data;
    }



}