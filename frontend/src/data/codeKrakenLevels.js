// Code Kraken Levels - Lettergreep puzzels
// Als je nieuwe levels toevoegt, worden ze automatisch "locked" 
// voor gebruikers die het vorige level niet hebben voltooid

export const codeKrakenLevels = [
  {
    id: 0,
    title: "Level 1: Start de Motoren",
    desc: "2 Lettergrepen (Space)",
    words: [
      { word: 'pla-neet', parts: [{ t: 'pla', s: 'plaa' }, { t: 'neet', s: 'neet' }], image: '🪐' },
      { word: 'ra-ket', parts: [{ t: 'ra', s: 'raa' }, { t: 'ket', s: 'ket' }], image: '🚀' },
      { word: 'ster-ren', parts: [{ t: 'ster', s: 'ster' }, { t: 'ren', s: 'run' }], image: '✨' },
      { word: 'cos-mos', parts: [{ t: 'cos', s: 'kos' }, { t: 'mos', s: 'mos' }], image: '🌌' },
      { word: 'ruim-te', parts: [{ t: 'ruim', s: 'ruim' }, { t: 'te', s: 'tuh' }], image: '🌑' }
    ]
  },
  {
    id: 1,
    title: "Level 2: Dieren Vrienden",
    desc: "2 Lettergrepen (Dieren)",
    words: [
      { word: 'tij-ger', parts: [{ t: 'tij', s: 'tij' }, { t: 'ger', s: 'gur' }], image: '🐯' },
      { word: 'pan-da', parts: [{ t: 'pan', s: 'pan' }, { t: 'da', s: 'daa' }], image: '🐼' },
      { word: 'ze-bra', parts: [{ t: 'ze', s: 'zee' }, { t: 'bra', s: 'braa' }], image: '🦓' },
      { word: 'spin-nen', parts: [{ t: 'spin', s: 'spin' }, { t: 'nen', s: 'nun' }], image: '🕷️' },
      { word: 'var-ken', parts: [{ t: 'var', s: 'var' }, { t: 'ken', s: 'kun' }], image: '🐷' }
    ]
  },
  {
    id: 2,
    title: "Level 3: Speelgoed Kist",
    desc: "2 Lettergrepen (Speelgoed)",
    words: [
      { word: 'au-to', parts: [{ t: 'au', s: 'au' }, { t: 'to', s: 'too' }], image: '🚗' },
      { word: 'blok-ken', parts: [{ t: 'blok', s: 'blok' }, { t: 'ken', s: 'kun' }], image: '🧱' },
      { word: 'puz-zel', parts: [{ t: 'puz', s: 'puz' }, { t: 'zel', s: 'zul' }], image: '🧩' },
      { word: 'pop-pen', parts: [{ t: 'pop', s: 'pop' }, { t: 'pen', s: 'pun' }], image: '🎎' },
      { word: 'step-pen', parts: [{ t: 'step', s: 'step' }, { t: 'pen', s: 'pun' }], image: '🛴' }
    ]
  },
  {
    id: 3,
    title: "Level 4: De Bouwplaats",
    desc: "2 Lettergrepen (Bouwen)",
    words: [
      { word: 'ha-mer', parts: [{ t: 'ha', s: 'haa' }, { t: 'mer', s: 'mur' }], image: '🔨' },
      { word: 'za-gen', parts: [{ t: 'za', s: 'zaa' }, { t: 'gen', s: 'gun' }], image: '🪚' },
      { word: 'bou-wen', parts: [{ t: 'bou', s: 'bou' }, { t: 'wen', s: 'wun' }], image: '👷' },
      { word: 'dak-pan', parts: [{ t: 'dak', s: 'dak' }, { t: 'pan', s: 'pan' }], image: '🏠' },
      { word: 'schroe-ven', parts: [{ t: 'schroe', s: 'schroe' }, { t: 'ven', s: 'vun' }], image: '🔩' }
    ]
  },
  {
    id: 4,
    title: "Level 5: De Astronaut",
    desc: "3 Lettergrepen (Space)",
    words: [
      { word: 'as-tro-naut', parts: [{ t: 'as', s: 'as' }, { t: 'tro', s: 'troo' }, { t: 'naut', s: 'nout' }], image: '👨‍🚀' },
      { word: 'me-te-oor', parts: [{ t: 'me', s: 'mee' }, { t: 'te', s: 'tee' }, { t: 'oor', s: 'oor' }], image: '☄️' },
      { word: 'te-le-scoop', parts: [{ t: 'te', s: 'tee' }, { t: 'le', s: 'luh' }, { t: 'scoop', s: 'skoop' }], image: '🔭' },
      { word: 'ruim-te-pak', parts: [{ t: 'ruim', s: 'ruim' }, { t: 'te', s: 'tuh' }, { t: 'pak', s: 'pak' }], image: '👕' },
      { word: 'sa-tel-liet', parts: [{ t: 'sa', s: 'saa' }, { t: 'tel', s: 'tel' }, { t: 'liet', s: 'liet' }], image: '📡' }
    ]
  },
  {
    id: 5,
    title: "Level 6: Robot Fabriek",
    desc: "3 Lettergrepen (Robots)",
    words: [
      { word: 'bat-te-rij', parts: [{ t: 'bat', s: 'bat' }, { t: 'te', s: 'tuh' }, { t: 'rij', s: 'rei' }], image: '🔋' },
      { word: 'com-pu-ter', parts: [{ t: 'com', s: 'kom' }, { t: 'pu', s: 'pju' }, { t: 'ter', s: 'tur' }], image: '💻' },
      { word: 're-ke-nen', parts: [{ t: 're', s: 'ree' }, { t: 'ke', s: 'kuh' }, { t: 'nen', s: 'nun' }], image: '🧮' },
      { word: 'be-die-ning', parts: [{ t: 'be', s: 'buh' }, { t: 'die', s: 'die' }, { t: 'ning', s: 'ning' }], image: '🎮' },
      { word: 'uit-vin-der', parts: [{ t: 'uit', s: 'uit' }, { t: 'vin', s: 'vin' }, { t: 'der', s: 'dur' }], image: '💡' }
    ]
  },
  {
    id: 6,
    title: "Level 7: Wilde Dieren",
    desc: "3 Lettergrepen (Dieren)",
    words: [
      { word: 'go-ril-la', parts: [{ t: 'go', s: 'goo' }, { t: 'ril', s: 'ril' }, { t: 'la', s: 'laa' }], image: '🦍' },
      { word: 'ka-na-rie', parts: [{ t: 'ka', s: 'kaa' }, { t: 'na', s: 'naa' }, { t: 'rie', s: 'rie' }], image: '🐦' },
      { word: 'pa-pa-gaai', parts: [{ t: 'pa', s: 'paa' }, { t: 'pa', s: 'paa' }, { t: 'gaai', s: 'gaai' }], image: '🦜' },
      { word: 'kro-ko-dil', parts: [{ t: 'kro', s: 'kroo' }, { t: 'ko', s: 'koo' }, { t: 'dil', s: 'dil' }], image: '🐊' },
      { word: 'eek-hoorn-tje', parts: [{ t: 'eek', s: 'eek' }, { t: 'hoorn', s: 'hoorn' }, { t: 'tje', s: 'tjuh' }], image: '🐿️' }
    ]
  },
  {
    id: 7,
    title: "Level 8: Het Weer",
    desc: "3 Lettergrepen (Natuur)",
    words: [
      { word: 're-gen-boog', parts: [{ t: 're', s: 'ree' }, { t: 'gen', s: 'gun' }, { t: 'boog', s: 'boog' }], image: '🌈' },
      { word: 'win-ter-jas', parts: [{ t: 'win', s: 'win' }, { t: 'ter', s: 'tur' }, { t: 'jas', s: 'jas' }], image: '🧥' },
      { word: 'pa-ra-plu', parts: [{ t: 'pa', s: 'paa' }, { t: 'ra', s: 'raa' }, { t: 'plu', s: 'pluu' }], image: '☂️' },
      { word: 'zon-ne-bril', parts: [{ t: 'zon', s: 'zon' }, { t: 'ne', s: 'nuh' }, { t: 'bril', s: 'bril' }], image: '🕶️' },
      { word: 'sneeuw-pop-pen', parts: [{ t: 'sneeuw', s: 'sneeuw' }, { t: 'pop', s: 'pop' }, { t: 'pen', s: 'pun' }], image: '⛄' }
    ]
  },
  {
    id: 8,
    title: "Level 9: Natuur Expeditie",
    desc: "3 Lettergrepen (Mix)",
    words: [
      { word: 'o-li-fant', parts: [{ t: 'o', s: 'oo' }, { t: 'li', s: 'lie' }, { t: 'fant', s: 'fant' }], image: '🐘' },
      { word: 'wat-er-val', parts: [{ t: 'wat', s: 'wat' }, { t: 'er', s: 'ur' }, { t: 'val', s: 'val' }], image: '🌊' },
      { word: 'vlin-der-tje', parts: [{ t: 'vlin', s: 'vlin' }, { t: 'der', s: 'dur' }, { t: 'tje', s: 'tjuh' }], image: '🦋' },
      { word: 'zon-ne-bloem', parts: [{ t: 'zon', s: 'zon' }, { t: 'ne', s: 'nuh' }, { t: 'bloem', s: 'bloem' }], image: '🌻' }
    ]
  },
  {
    id: 9,
    title: "Level 10: Master Missie",
    desc: "Gemixt (Expert)",
    words: [
      { word: 'lucht', parts: [{ t: 'lucht', s: 'lucht' }], image: '☁️' },
      { word: 'wa-ter', parts: [{ t: 'wa', s: 'waa' }, { t: 'ter', s: 'tur' }], image: '💧' },
      { word: 'as-tro-naut', parts: [{ t: 'as', s: 'as' }, { t: 'tro', s: 'troo' }, { t: 'naut', s: 'nout' }], image: '👨‍🚀' },
      { word: 'ver-re-kij-ker', parts: [{ t: 'ver', s: 'ver' }, { t: 're', s: 'ruh' }, { t: 'kij', s: 'kei' }, { t: 'ker', s: 'kur' }], image: '👀' },
      { word: 'on-der-zoek', parts: [{ t: 'on', s: 'on' }, { t: 'der', s: 'dur' }, { t: 'zoek', s: 'zoek' }], image: '🔍' }
    ]
  },
  {
    id: 10,
    title: "Level 11: De Fop Letter",
    desc: "De E klinkt als U of O",
    words: [
      { word: 'lo-pen', parts: [{ t: 'lo', s: 'loo' }, { t: 'pen', s: 'pun' }], image: '🚶' },
      { word: 'don-ker', parts: [{ t: 'don', s: 'donn' }, { t: 'ker', s: 'kur' }], image: '🌑' },
      { word: 'we-zens', parts: [{ t: 'we', s: 'wee' }, { t: 'zens', s: 'zuns' }], image: '👾' },
      { word: 'vo-gel', parts: [{ t: 'vo', s: 'voo' }, { t: 'gel', s: 'gul' }], image: '🐦' },
      { word: 'sleu-tel', parts: [{ t: 'sleu', s: 'sleu' }, { t: 'tel', s: 'tul' }], image: '🗝️' }
    ]
  },
  {
    id: 11,
    title: "Level 12: Feest!",
    desc: "2-3 Lettergrepen (Feest)",
    words: [
      { word: 'bal-lon', parts: [{ t: 'bal', s: 'bal' }, { t: 'lon', s: 'lon' }], image: '🎈' },
      { word: 'ka-do', parts: [{ t: 'ka', s: 'kaa' }, { t: 'do', s: 'doo' }], image: '🎁' },
      { word: 'taart', parts: [{ t: 'taart', s: 'taart' }], image: '🎂' },
      { word: 'con-fet-ti', parts: [{ t: 'con', s: 'kon' }, { t: 'fet', s: 'fet' }, { t: 'ti', s: 'tie' }], image: '🎊' },
      { word: 'feest-je', parts: [{ t: 'feest', s: 'feest' }, { t: 'je', s: 'juh' }], image: '🥳' }
    ]
  },
  {
    id: 12,
    title: "Level 13: Boem!",
    desc: "2-3 Lettergrepen (Actie)",
    words: [
      { word: 'bom', parts: [{ t: 'bom', s: 'bom' }], image: '💣' },
      { word: 'ra-ket', parts: [{ t: 'ra', s: 'raa' }, { t: 'ket', s: 'ket' }], image: '🚀' },
      { word: 'vuur-werk', parts: [{ t: 'vuur', s: 'vuur' }, { t: 'werk', s: 'werk' }], image: '🎆' },
      { word: 'ex-plo-sie', parts: [{ t: 'ex', s: 'eks' }, { t: 'plo', s: 'ploo' }, { t: 'sie', s: 'zie' }], image: '💥' },
      { word: 'ka-non', parts: [{ t: 'ka', s: 'kaa' }, { t: 'non', s: 'non' }], image: '🔫' }
    ]
  }
]

// Helper: bereken sterren per level
export const STARS_PER_WORD = 5
export const STARS_LEVEL_BONUS = 10
