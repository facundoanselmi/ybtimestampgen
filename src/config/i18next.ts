import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';
import {LanguageDetector} from 'i18next-http-middleware';

console.log('Loading i18next');
console.log('Current working directory: ' + process.cwd());

i18next
    .use(i18nextFsBackend)
    .use(LanguageDetector)
    .init({
        backend: {
            // locales are in ./locales/{{lng}}.json
            loadPath: process.cwd() + '/src/locales/{{lng}}.json',
            addPath: process.cwd() + '/src/locales/{{lng}}.missing.json',
        },
        fallbackLng: 'en',
        load: 'languageOnly',
        saveMissing: true,
        preload: ['en'],
    });

export {i18next};
