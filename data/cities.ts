export interface CityConfig {
  name: string
  idealistaSlug: string
}

/** All 107 Italian provincial capitals with their Idealista URL slugs. */
export const CITIES: CityConfig[] = [
  // Abruzzo
  { name: 'Chieti',           idealistaSlug: 'chieti-chieti' },
  { name: "L'Aquila",         idealistaSlug: 'l-aquila-l-aquila' },
  { name: 'Pescara',          idealistaSlug: 'pescara-pescara' },
  { name: 'Teramo',           idealistaSlug: 'teramo-teramo' },
  // Basilicata
  { name: 'Matera',           idealistaSlug: 'matera-matera' },
  { name: 'Potenza',          idealistaSlug: 'potenza-potenza' },
  // Calabria
  { name: 'Catanzaro',        idealistaSlug: 'catanzaro-catanzaro' },
  { name: 'Cosenza',          idealistaSlug: 'cosenza-cosenza' },
  { name: 'Crotone',          idealistaSlug: 'crotone-crotone' },
  { name: 'Reggio Calabria',  idealistaSlug: 'reggio-di-calabria-reggio-di-calabria' },
  { name: 'Vibo Valentia',    idealistaSlug: 'vibo-valentia-vibo-valentia' },
  // Campania
  { name: 'Avellino',         idealistaSlug: 'avellino-avellino' },
  { name: 'Benevento',        idealistaSlug: 'benevento-benevento' },
  { name: 'Caserta',          idealistaSlug: 'caserta-caserta' },
  { name: 'Napoli',           idealistaSlug: 'napoli-napoli' },
  { name: 'Salerno',          idealistaSlug: 'salerno-salerno' },
  // Emilia-Romagna
  { name: 'Bologna',          idealistaSlug: 'bologna-bologna' },
  { name: 'Ferrara',          idealistaSlug: 'ferrara-ferrara' },
  { name: 'Forlì',            idealistaSlug: 'forli-forli-cesena' },
  { name: 'Modena',           idealistaSlug: 'modena-modena' },
  { name: 'Parma',            idealistaSlug: 'parma-parma' },
  { name: 'Piacenza',         idealistaSlug: 'piacenza-piacenza' },
  { name: 'Ravenna',          idealistaSlug: 'ravenna-ravenna' },
  { name: 'Reggio Emilia',    idealistaSlug: 'reggio-nell-emilia-reggio-nell-emilia' },
  { name: 'Rimini',           idealistaSlug: 'rimini-rimini' },
  // Friuli-Venezia Giulia
  { name: 'Gorizia',          idealistaSlug: 'gorizia-gorizia' },
  { name: 'Pordenone',        idealistaSlug: 'pordenone-pordenone' },
  { name: 'Trieste',          idealistaSlug: 'trieste-trieste' },
  { name: 'Udine',            idealistaSlug: 'udine-udine' },
  // Lazio
  { name: 'Frosinone',        idealistaSlug: 'frosinone-frosinone' },
  { name: 'Latina',           idealistaSlug: 'latina-latina' },
  { name: 'Rieti',            idealistaSlug: 'rieti-rieti' },
  { name: 'Roma',             idealistaSlug: 'roma-roma' },
  { name: 'Viterbo',          idealistaSlug: 'viterbo-viterbo' },
  // Liguria
  { name: 'Genova',           idealistaSlug: 'genova-genova' },
  { name: 'Imperia',          idealistaSlug: 'imperia-imperia' },
  { name: 'La Spezia',        idealistaSlug: 'la-spezia-la-spezia' },
  { name: 'Savona',           idealistaSlug: 'savona-savona' },
  // Lombardia
  { name: 'Bergamo',          idealistaSlug: 'bergamo-bergamo' },
  { name: 'Brescia',          idealistaSlug: 'brescia-brescia' },
  { name: 'Como',             idealistaSlug: 'como-como' },
  { name: 'Cremona',          idealistaSlug: 'cremona-cremona' },
  { name: 'Lecco',            idealistaSlug: 'lecco-lecco' },
  { name: 'Lodi',             idealistaSlug: 'lodi-lodi' },
  { name: 'Mantova',          idealistaSlug: 'mantova-mantova' },
  { name: 'Milano',           idealistaSlug: 'milano-milano' },
  { name: 'Monza',            idealistaSlug: 'monza-brianza' },
  { name: 'Pavia',            idealistaSlug: 'pavia-pavia' },
  { name: 'Sondrio',          idealistaSlug: 'sondrio-sondrio' },
  { name: 'Varese',           idealistaSlug: 'varese-varese' },
  // Marche
  { name: 'Ancona',           idealistaSlug: 'ancona-ancona' },
  { name: 'Ascoli Piceno',    idealistaSlug: 'ascoli-piceno-ascoli-piceno' },
  { name: 'Fermo',            idealistaSlug: 'fermo-fermo' },
  { name: 'Macerata',         idealistaSlug: 'macerata-macerata' },
  { name: 'Pesaro',           idealistaSlug: 'pesaro-pesaro-e-urbino' },
  // Molise
  { name: 'Campobasso',       idealistaSlug: 'campobasso-campobasso' },
  { name: 'Isernia',          idealistaSlug: 'isernia-isernia' },
  // Piemonte
  { name: 'Alessandria',      idealistaSlug: 'alessandria-alessandria' },
  { name: 'Asti',             idealistaSlug: 'asti-asti' },
  { name: 'Biella',           idealistaSlug: 'biella-biella' },
  { name: 'Cuneo',            idealistaSlug: 'cuneo-cuneo' },
  { name: 'Novara',           idealistaSlug: 'novara-novara' },
  { name: 'Torino',           idealistaSlug: 'torino-torino' },
  { name: 'Verbania',         idealistaSlug: 'verbania-verbano-cusio-ossola' },
  { name: 'Vercelli',         idealistaSlug: 'vercelli-vercelli' },
  // Puglia
  { name: 'Andria',           idealistaSlug: 'andria-barletta-andria-trani' },
  { name: 'Bari',             idealistaSlug: 'bari-bari' },
  { name: 'Brindisi',         idealistaSlug: 'brindisi-brindisi' },
  { name: 'Foggia',           idealistaSlug: 'foggia-foggia' },
  { name: 'Lecce',            idealistaSlug: 'lecce-lecce' },
  { name: 'Taranto',          idealistaSlug: 'taranto-taranto' },
  // Sardegna
  { name: 'Cagliari',         idealistaSlug: 'cagliari-cagliari' },
  { name: 'Carbonia',         idealistaSlug: 'carbonia-sud-sardegna' },
  { name: 'Nuoro',            idealistaSlug: 'nuoro-nuoro' },
  { name: 'Oristano',         idealistaSlug: 'oristano-oristano' },
  { name: 'Sassari',          idealistaSlug: 'sassari-sassari' },
  // Sicilia
  { name: 'Agrigento',        idealistaSlug: 'agrigento-agrigento' },
  { name: 'Caltanissetta',    idealistaSlug: 'caltanissetta-caltanissetta' },
  { name: 'Catania',          idealistaSlug: 'catania-catania' },
  { name: 'Enna',             idealistaSlug: 'enna-enna' },
  { name: 'Messina',          idealistaSlug: 'messina-messina' },
  { name: 'Palermo',          idealistaSlug: 'palermo-palermo' },
  { name: 'Ragusa',           idealistaSlug: 'ragusa-ragusa' },
  { name: 'Siracusa',         idealistaSlug: 'siracusa-siracusa' },
  { name: 'Trapani',          idealistaSlug: 'trapani-trapani' },
  // Toscana
  { name: 'Arezzo',           idealistaSlug: 'arezzo-arezzo' },
  { name: 'Firenze',          idealistaSlug: 'firenze-firenze' },
  { name: 'Grosseto',         idealistaSlug: 'grosseto-grosseto' },
  { name: 'Livorno',          idealistaSlug: 'livorno-livorno' },
  { name: 'Lucca',            idealistaSlug: 'lucca-lucca' },
  { name: 'Massa',            idealistaSlug: 'massa-massa-carrara' },
  { name: 'Pisa',             idealistaSlug: 'pisa-pisa' },
  { name: 'Pistoia',          idealistaSlug: 'pistoia-pistoia' },
  { name: 'Prato',            idealistaSlug: 'prato-prato' },
  { name: 'Siena',            idealistaSlug: 'siena-siena' },
  // Trentino-Alto Adige
  { name: 'Bolzano',          idealistaSlug: 'bolzano-bolzano' },
  { name: 'Trento',           idealistaSlug: 'trento-trento' },
  // Umbria
  { name: 'Perugia',          idealistaSlug: 'perugia-perugia' },
  { name: 'Terni',            idealistaSlug: 'terni-terni' },
  // Valle d'Aosta
  { name: 'Aosta',            idealistaSlug: 'aosta-aosta' },
  // Veneto
  { name: 'Belluno',          idealistaSlug: 'belluno-belluno' },
  { name: 'Padova',           idealistaSlug: 'padova-padova' },
  { name: 'Rovigo',           idealistaSlug: 'rovigo-rovigo' },
  { name: 'Treviso',          idealistaSlug: 'treviso-treviso' },
  { name: 'Venezia',          idealistaSlug: 'venezia-venezia' },
  { name: 'Verona',           idealistaSlug: 'verona-verona' },
  { name: 'Vicenza',          idealistaSlug: 'vicenza-vicenza' },
]

export const BATCH_SIZE = 10
export const NUM_BATCHES = Math.ceil(CITIES.length / BATCH_SIZE)

/** Returns today's batch of cities using day-of-year rotation. */
export function getTodaysBatch(): CityConfig[] {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000)
  const batchIndex = dayOfYear % NUM_BATCHES
  return CITIES.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE)
}
