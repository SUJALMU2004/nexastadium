import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: "en",
    fallbackLng: "en",
    backend: {
      loadPath: "/locales/{{lng}}/translation.json"
    },
    interpolation: {
      escapeValue: false
    }
  });

i18n.on("languageChanged", (languageCode) => {
  document.documentElement.lang = languageCode;
  document.documentElement.dir = languageCode === "ar" ? "rtl" : "ltr";
});

document.documentElement.lang = i18n.language || "en";
document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";

export default i18n;

