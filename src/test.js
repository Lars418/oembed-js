import oEmbed from "./index.js";
import axios from "axios";



(async () => {
    const providers = await axios.get('https://oembed.com/providers.json');
    const o = new oEmbed(providers.data);
    // const test = await o.getData('https://www.flickr.com/photos/52320199@N07/');
    const test = await o.getData('https://lars.koelker.dev/');

    console.log(test);
})()