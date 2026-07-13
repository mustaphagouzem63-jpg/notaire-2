import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import translationFR from './fr.json'
import translationAR from './ar.json'

const resources = {
  fr: {
    translation: translationFR
  },
  ar: {
    translation: translationAR
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // Default language
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  })

export default i18n
