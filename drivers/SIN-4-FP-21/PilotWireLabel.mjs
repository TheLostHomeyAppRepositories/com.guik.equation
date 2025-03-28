export const PilotWireLabel = {
    "off": {
      short: "🟥 Off",
      long: {
        en: "Off",
        fr: "Arrêt"
      }
    },
    "eco": {
      short: "🟩 Eco",
      long: {
        en: "Eco",
        fr: "Éco"
      }
    },
    "confort": {
      short: "🟠 Conf.",
      long: {
        en: "Comfort",
        fr: "Confort"
      }
    },
    "confort_-1": {
      short: "🟧 Conf. -1",
      long: {
        en: "Comfort -1°C",
        fr: "Confort -1°C"
      }
    },
    "confort_-2": {
      short: "🟧 Conf. -2",
      long: {
        en: "Comfort -2°C",
        fr: "Confort -2°C"
      }
    },
    "frost_protection": {
      short: "🟦 HG",
      long: {
        en: "Frost protection",
        fr: "Hors-gel"
      }
    }
  };
  
  export function getPilotWireLabel(mode, lang = 'en') {
    const label = PilotWireLabel[mode];
    if (!label) return mode;
    return label.long?.[lang] || label.short || mode;
  }
  
  export function getPilotWireShortLabel(mode) {
    return PilotWireLabel[mode]?.short || mode;
  }