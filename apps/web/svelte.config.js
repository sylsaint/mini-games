import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default {preprocess:vitePreprocess(),kit:{prerender:{crawl:false,entries:['*']},adapter:adapter({pages:'../../dist',assets:'../../dist',strict:true})}};
