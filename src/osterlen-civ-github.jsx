import { useState, useRef, useEffect } from "react";

const MAP_SRC = "/map.jpg";

const MAP_W = 281;
const MAP_H = 612;

// -- Geografiska kategorier --------------------------------------
const COAST_IDS  = new Set(["v1","v5","v10","v13","v14","v15","v16"]);
const RIVER_IDS  = new Set(["v3","v4","v17","v18"]);
const FOREST_IDS = new Set(["v2","v3","v7","v9","v11","v17","v20","v21","v22"]);
const METAL_IDS  = new Set(["v5","v8","v12","v15"]);

// -- Gruvor (neutrala, kan erövras) ---------
const MINE_SLOTS = [
  { id:"mine1", name:"Glathsaks grufva",  x:174, y:330, icon:"⚙" },
  { id:"mine2", name:"Brantavík malm",x:192, y:480, icon:"⚙" },
  { id:"mine3", name:"Kivikvík berg",     x:136, y:410, icon:"⚙" },
];

// -- Resurssymboler ----------------------------------------------
const RES = { stone:"⬡", amber:"💛", hide:"🦌", metal:"⚙" };

// -- Boplatser ---------------------------------------------------
const VILLAGE_SLOTS = [
  { id:"v1",  x:136, y:52,  name:"Kivika"             },
  { id:"v2",  x:90, y:104,  name:"Brösarpa"           },
  { id:"v3",  x:168, y:132,  name:"Verkeådal"          },
  { id:"v4",  x:142, y:200,  name:"Tomatorp"           },
  { id:"v5",  x:196, y:184,  name:"Hamrahøgr"          },
  { id:"v6",  x:164, y:276,  name:"Ingelstathorp"      },
  { id:"v7",  x:118, y:286,  name:"Jarllestatha"          },
  { id:"v8",  x:204, y:320,  name:"Glimminge"          },
  { id:"v9",  x:114, y:340,  name:"Vallaberga"         },
  { id:"v10", x:160, y:400, name:"Kåseberga"          },
  { id:"v11", x:84, y:270,  name:"Sævestad"           },
  { id:"v12", x:172, y:232,  name:"Svimraros"         },
  { id:"v13", x:168, y:424, name:"Skjaldingæ"          },
  { id:"v14", x:148, y:472, name:"Ales Stenar"        },
  { id:"v15", x:224, y:68,  name:"Kivik hamn"         },
  { id:"v16", x:237, y:256,  name:"Havet"              },
  { id:"v17", x:124, y:168,  name:"Tommarpsåns källa"  },
  { id:"v18", x:100, y:232,  name:"Verkeåns mynning"   },
  { id:"v19", x:188, y:328,  name:"Borrby"             },
  { id:"v20", x:64, y:312,  name:"Rørhem"              },
  { id:"v21", x:136, y:256,  name:"Gärsnäs"            },
  { id:"v22", x:80, y:184,  name:"Lunnarp"            },
  // AI-boplatser (nordväst)
  { id:"ai1", x:62, y:46,  name:"Brohult",  aiOnly:true },
  { id:"ai2", x:44, y:108,  name:"Vinninge", aiOnly:true },
  { id:"ai3", x:70, y:156,  name:"Tolånga",  aiOnly:true },
  { id:"ai4", x:46, y:212,  name:"Rörum N",  aiOnly:true },
  { id:"ai5", x:60, y:264,  name:"Gärsnäs N",aiOnly:true },
  { id:"ai6", x:40, y:328,  name:"Borrby N", aiOnly:true },
];

// -- Historiska platser (avslöjas vid utforskning) ---------------
const HISTORIC_SITES = [
  { id:"hs1", x:200, y:32,   icon:"◈", name:"Kiviksgraven",
    lore:"En av Nordens märkligaste bronsåldersgravarna. Stora stenhällar med ristningar omger den döde – kanske en kung begravd med prakt för evigheten." },
  { id:"hs2", x:148, y:476, icon:"◈", name:"Ales Stenar",
    lore:"Östersjökustens mäktigaste monument: 59 stenar formade som ett skepp, 67 meter långt. En kultplats för solen och de döda." },
  { id:"hs3", x:204, y:324,  icon:"⛩", name:"Glimmingehus",
    lore:"Det bäst bevarade medeltidsborgen i Norden. Men platsen har bebotts i tusentals år – dina anfäder kände kanske till denna höjd." },
  { id:"hs4", x:172, y:236,  icon:"🏘", name:"Svimraros",
    lore:"Fiskestadens historia sträcker sig djupt in i förhistorien. Havet har alltid lockat folk hit – fisk, handel och äventyr." },
  { id:"hs5", x:168, y:428, icon:"🏘", name:"Skjaldingæ",
    lore:"Ett av Österlenens äldsta fiskelägen. Generationer av fiskare har dragit sina nät här sedan urminnes tider." },
  // hs6 Järrestad borttagen – spelaren börjar redan här
  { id:"hs7", x:180, y:460, icon:"⚱", name:"Skateholm",
    lore:"Vid Skateholm – nu under vatten – låg en av Nordens viktigaste gravplatser. Hundratals människor begravdes här under tusentals år. Smycken av tänder och snäckor vittnar om handel och kontakter med folk långt bort." },
];

// -- Eror --------------------------------------------------------
const ERAS = [
  { name:"Mesolitikum",  years:"8000–4000 f.Kr.",     pts:0   },
  { name:"Neolitikum",   years:"4000–1800 f.Kr.",     pts:25  },
  { name:"Bronsålder",   years:"1800–500 f.Kr.",      pts:70  },
  { name:"Järnålder",    years:"500 f.Kr.–800 e.Kr.", pts:140 },
];
// -- Årstider ------------------------------------------------
const SEASONS = [
  { id:"spring", name:"Vår",    icon:"🌱", turns:3,
    stonemod:1.0, desc:"Naturen vaknar. Normal inkomst." },
  { id:"summer", name:"Sommar", icon:"☀️", turns:3,
    stonemod:1.3, desc:"Riklig skörd. +30% sten, +1 bärnsten och hud extra." },
  { id:"autumn", name:"Höst",   icon:"🍂", turns:3,
    stonemod:1.0, desc:"Förbered dig för vintern. Normal inkomst." },
  { id:"winter", name:"Vinter", icon:"❄️", turns:3,
    stonemod:0.7, desc:"Hård kyla. -30% sten. Risk för svält." },
];
const YEAR_LENGTH = SEASONS.reduce((s,se) => s + se.turns, 0); // 12 turer/år

function getSeason(turn) {
  const t = ((turn - 1) % YEAR_LENGTH);
  let acc = 0;
  for (const s of SEASONS) { acc += s.turns; if (t < acc) return s; }
  return SEASONS[0];
}

function getEra(pts) { return ERAS.reduce((e,_,i) => pts >= ERAS[i].pts ? i : e, 0); }

// -- Historiska fakta per era -------------------------------------
const WORLD_FACTS = [
  // Mesolitikum (era 0) – visas tidigt
  { era:0, title:"I Mellanöstern", icon:"🌾",
    text:"I Mesopotamien och vid Jordanfloden börjar folk för första gången odla vete och korn istället för att bara samla det. En revolution som ska förändra världen – men den är ännu 3000 år bort från Österlen." },
  { era:0, title:"Världens äldsta stad", icon:"🏛",
    text:"Jericho vid Döda havet är världens äldsta kända bosättning med permanenta hus och murar – byggd just nu, medan du sätter ditt läger i Österlen." },
  { era:0, title:"Doggerland sjunker", icon:"🌊",
    text:"Det landområde som en gång förbinder Skandinavien med Storbritannien – Doggerland – håller på att svämmas över av det stigande havet. Mammutarna är borta. En värld försvinner." },

  // Neolitikum (era 1)
  { era:1, title:"Egypten vaknar", icon:"𓂀",
    text:"Längs Nilen i Egypten samlas folk i allt större byar. Skriften uppfinns inte än – men konsten att odla och bygger kanaler blomstrar. Faraoernas tid är om 500 år." },
  { era:1, title:"Stonehenge påbörjas", icon:"⬡",
    text:"På södra England börjar en grupp människor flytta enorma stenblock i en cirkel. Deras monument – Stonehenge – ska kräva generationer att bygga. Kanske har de lärt sig av folk som dina anfäder." },
  { era:1, title:"Koppar i Europa", icon:"🟤",
    text:"I Alperna och på Balkan börjar folk smälta koppar ur malm. Det är ett nytt material – hårdare än sten, formbart som lera. Kunskapen sprider sig långsamt norrut." },

  // Bronsålder (era 2)
  { era:2, title:"Egyptens pyramider", icon:"△",
    text:"Kheops pyramid byggs vid Giza – 146 meter hög, med 2,3 miljoner stenblock. Det är världens största byggnadsverk och kommer att förbli så i 3800 år. Dina anfäder hugger sina egna stenar i Kivik." },
  { era:2, title:"Trojanska kriget", icon:"⚔",
    text:"Vid Egeiska havet utkämpas ett krig om staden Troja – eller så berättar legenden. Grekiska krigare, träkrigare, och det berömda träehästen. Medan Europa slåss om söder, expanderar du mot norr." },
  { era:2, title:"Kiviksgraven byggs", icon:"◈",
    text:"Inte långt från din boplats begravs en mäktig man med en prakt utan like i Norden. Stora hällar med ristningar av skepp, yxor och figurer omger honom. Vem han var vet ingen – men hans grav överlever årtusenden." },

  // Järnålder (era 3)
  { era:3, title:"Rom grundas", icon:"🏛",
    text:"Vid floden Tibern i Italien grundas en liten stad av herdarna Romulus och Remus – enligt legenden. Staden kommer att växa till ett imperium som når ända upp till Skånes kuster om 800 år." },
  { era:3, title:"Kelterna i Europa", icon:"🗡",
    text:"Keltiska stammar dominerar nu stora delar av Europa – från Irland till Anatolien. De är skickliga smeder, krigare och berättare. Deras järnvapen förändrar maktbalansen överallt." },
  { era:3, title:"Persiska riket", icon:"👑",
    text:"Kyros den store grundar det Persiska riket – det största i världshistorien hittills. Det sträcker sig från Egypten till Indien. I jämförelse är Österlen en avlägsen periferi – men frihet har sitt eget värde." },
];

function eraPct(pts) {
  const e = getEra(pts);
  if (e === ERAS.length - 1) return 100;
  return Math.round(((pts - ERAS[e].pts) / (ERAS[e+1].pts - ERAS[e].pts)) * 100);
}

// -- Karaktärer --------------------------------------------------
// Möjliga startbyar (inland, ej kust – ger hud från skog)
const START_VILLAGES = ["v2","v4","v6","v7","v9","v11","v21","v22"];

function pickStartVillage(exclude) {
  const options = START_VILLAGES.filter(id => id !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

const CHARACTERS = [
  { id:"dansaren",
    name:"Dansaren",          title:"Kultens Väktare",   icon:"🌙",
    color:"#7a3a8a",          colorLight:"#c090d0",
    buildDiscount:["hallristning","skeppssattning"],
    extraStonePerTurn:0,
    desc:"Mästare på ritualer och dans. Hällristning & Skeppssättning kostar –1 sten.",
    bonus:"Hällristning & Skeppssättning: –1 sten" },
  { id:"skateholmsjägaren",
    name:"Skateholmsjägaren", title:"Havets Son",         icon:"🐟",
    color:"#1a5a7a",          colorLight:"#60a8c8",
    buildDiscount:["pilbage","stockkanot"],
    extraStonePerTurn:2,
    desc:"Expert på fiske och jakt. +2 sten/tur. Pilbåge & Stockkanot billigare.",
    bonus:"+2 sten/tur · Pilbåge & Stockkanot –1 sten" },
  { id:"kungen",
    name:"Kungen",            title:"Kiviksgravarnas Herre", icon:"👑",
    color:"#8a6010",          colorLight:"#e8c040",
    buildDiscount:["stendos","skeppssattning"],
    extraStonePerTurn:0,
    startRegion:"coast",
    desc:"Begravd med prakt vid Kivik. Maktens och dödsrikets tolk. Stendös & Skeppssättning –1 sten. Bättre försvar.",
    bonus:"Stendös & Skeppssättning –1 sten · Försvar +2" },
  { id:"jarlen",
    name:"Jarlen",            title:"Järrestads Väktare",  icon:"⚔",
    color:"#6a2010",          colorLight:"#d06040",
    buildDiscount:["palissad","krigare"],
    extraStonePerTurn:1,
    startRegion:"inland",
    desc:"Hövding vid Järrestad – hem till Österlenens rikaste hällristningar. Palissad & Krigare –1 sten. +1 sten/tur.",
    bonus:"Palissad & Krigare –1 sten · +1 sten/tur" },
];

// -- Teknikträd ---------------------------------------------------
// knowledge:true  = global uppfinning, ingen boplats krävs
// coastal:true    = kräver kustboplats
// requiresRiverOrCoast = kust eller åboplats
// requiresPalissad = boplats måste ha palissad
// max = max antal per boplats
const TECH_TREE = [
  // Tier 0 – Mesolitikum
  { id:"korgflatning",   label:"Korgflätning",   icon:"🧺", tier:0,
    cost:{stone:2},  pts:3,  pop:0, knowledge:true, requires:[],
    desc:"Global. +1 sten/tur. Låser upp Lagerhus och Hällristning." },
  { id:"pilbage",        label:"Pilbåge",         icon:"🏹", tier:0,
    cost:{stone:3},  pts:4,  pop:0, knowledge:true, requires:[],
    desc:"Global. +2 sten/tur och +1 hud/tur från jakt." },
  { id:"stockkanot",     label:"Stockkanot",      icon:"🛶", tier:0,
    cost:{stone:3},  pts:4,  pop:2, requiresRiverOrCoast:true, requires:["korgflatning"], max:1,
    desc:"Kust/åboplats. +2 sten/tur från fiske." },

  // Tier 1 – Tidig Neolitikum
  { id:"lagerhus",       label:"Lagerhus",        icon:"🌾", tier:1,
    cost:{stone:4},  pts:2,  pop:3, requires:["korgflatning"], max:2,
    desc:"Minskar svält. Krävs för Långhus." },
  { id:"hallristning",   label:"Hällristning",    icon:"☀", tier:1,
    cost:{stone:4},  pts:5,  pop:6, requires:["korgflatning"], max:2,
    desc:"Lockar folk med konst och myt." },
  { id:"keramik",        label:"Keramik",         icon:"🏺", tier:1,
    cost:{stone:4},  pts:4,  pop:0, knowledge:true, requires:["lagerhus"],
    desc:"Global. Höjer svältgräns till 25." },

  // Tier 2 – Neolitikum
  { id:"schaman",        label:"Schaman",         icon:"🦅", tier:2,
    cost:{stone:6},          pts:6, pop:5, requires:["hallristning"], max:1,
    desc:"Andlig ledare – låser upp Stendös." },
  { id:"langhus",        label:"Långhus",         icon:"🏚", tier:2,
    cost:{stone:5,hide:1},  pts:4, pop:8, requires:["lagerhus"], max:1,
    desc:"Rymmer folk – krävs för Hövdingskap." },
  { id:"krukmakargard",  label:"Krukmakargård",   icon:"🏛", tier:2,
    cost:{stone:5},          pts:3, pop:2, requires:["keramik"], max:1,
    desc:"Grannar inom räckhåll delar handelspoäng." },
  { id:"stendos",        label:"Stendös",         icon:"⬡", tier:2,
    cost:{stone:7},          pts:8, pop:10, requires:["schaman"], max:2,
    desc:"Megalitgrav – hedrar förfäderna." },

  // Tier 3 – Sen Neolitikum
  { id:"hovdingskap",    label:"Hövdingskap",     icon:"👑", tier:3,
    cost:{stone:7},          pts:8, pop:0, knowledge:true, requires:["langhus"],
    desc:"Global. Möjliggör nya boplatser och handel." },
  { id:"scout",          label:"Scout",           icon:"🧭", tier:3,
    cost:{stone:4},  pts:3,  pop:0, requires:["stendos"], max:3,
    desc:"Utforskare – smälter isen och hittar fiendebyar." },
  { id:"byaldste",       label:"Byäldste",        icon:"🧓", tier:3,
    cost:{stone:5},          pts:4, pop:3, requires:["hovdingskap"], max:1,
    desc:"Krävs för att ta emot förflyttade krigare." },
  { id:"handelsgård",    label:"Handelsgård",     icon:"🤝", tier:3,
    cost:{stone:5},          pts:3, pop:2, requires:["hovdingskap"], max:1,
    desc:"Aktiverar handel med grannar." },

  // Tier 4 – Bronsålder
  { id:"palissad",       label:"Palissad",        icon:"🪵", tier:4,
    cost:{stone:5,hide:2},  pts:4, pop:0, requires:["hovdingskap"], max:1,
    desc:"Förstärker försvar kraftigt. Krävs för Krigare." },
  { id:"flintaspets",    label:"Flintaspets",     icon:"🗡", tier:4,
    cost:{stone:4,amber:1}, pts:5, pop:0, knowledge:true, requires:["palissad"],
    desc:"Global. +4 attackstyrka per krigare." },
  { id:"skeppssattning", label:"Skeppssättning",  icon:"⛵", tier:4,
    cost:{stone:7,amber:2}, pts:10, pop:14, requires:["hovdingskap","stendos"], max:2,
    desc:"Stenskepp – hedrar havet och de döda." },

  // Tier 5 – Sen Bronsålder
  { id:"krigare",        label:"Krigare",         icon:"⚔",  tier:5,
    cost:{stone:4,hide:1,amber:1}, pts:4, pop:0,
    requiresPalissad:true, requires:["palissad","flintaspets"], max:5,
    desc:"Kan anfalla fiendebyar och förflyttas. Kräver Palissad." },
  { id:"hamnplats",      label:"Hamnplats",       icon:"⚓", tier:5,
    cost:{stone:6,amber:2}, pts:6, pop:4, coastal:true,
    requires:["skeppssattning","stockkanot"], max:1,
    desc:"Kustboplats. Öppnar sjöhandel och metallimport." },
  { id:"bronsvapen",     label:"Bronsvapen",      icon:"🏅", tier:5,
    cost:{stone:3,metal:2}, pts:6, pop:0, knowledge:true, requires:["hamnplats"],
    desc:"Global. +6 attackstyrka per krigare." },

  // Tier 6 – Järnålder
  { id:"trabat",         label:"Träbåt",          icon:"🚣", tier:6,
    cost:{stone:5,metal:1}, pts:5, pop:0, knowledge:true, requires:["hamnplats"],
    desc:"Global. Möjliggör scouting längs kusten." },
  { id:"drakskepp",      label:"Drakskepp",       icon:"🐉", tier:6,
    cost:{stone:8,metal:2,amber:3}, pts:15, pop:0, coastal:true,
    requires:["sjohandel","hamnplats"], max:3,
    desc:"Bygg vid kustboplats. Tre drakskepp = vikingafärd västerväg!" },

  { id:"sjohandel",      label:"Sjöhandel",       icon:"🌊", tier:6,
    cost:{stone:5,metal:1,amber:1}, pts:7, pop:0, knowledge:true,
    requires:["trabat","handelsgård"],
    desc:"Global. +5 sten per tur." },
];

const TIER_LABELS = [
  "Mesolitikum – Grundläggande (8000–4000 f.Kr.)",
  "Tidig Neolitikum – Mat & Skydd (4000–3500 f.Kr.)",
  "Neolitikum – Kunskap & Gemenskap (3500–2500 f.Kr.)",
  "Sen Neolitikum – Ledarskap (2500–1800 f.Kr.)",
  "Bronsålder – Krig & Monument (1800–1000 f.Kr.)",
  "Sen Bronsålder – Makt & Hav (1000–500 f.Kr.)",
  "Järnålder – Handel & Expansion (500 f.Kr.–800 e.Kr.)",
];

function getTech(id) { return TECH_TREE.find(t => t.id === id); }

// Alla byggnader + kunskaper som finns – för prereq-kontroll
function getBuiltSet(villages, techs) {
  const s = new Set(techs || []);
  Object.values(villages).forEach(v => (v.buildings || []).forEach(b => s.add(b.id)));
  return s;
}

function countInVillage(techId, village) {
  return (village?.buildings || []).filter(b => b.id === techId).length;
}

// Är techId tillgänglig givet nuvarande tillstånd?
function isAvailable(techId, villages, techs, villageId) {
  const t = getTech(techId);
  if (!t) return false;
  const built = getBuiltSet(villages, techs);
  if (!t.requires.every(r => built.has(r))) return false;
  if (t.knowledge) return !techs.includes(techId);
  if (villageId) {
    const v = villages[villageId];
    if (t.coastal            && !COAST_IDS.has(villageId))                              return false;
    if (t.requiresRiverOrCoast && !COAST_IDS.has(villageId) && !RIVER_IDS.has(villageId)) return false;
    if (t.requiresPalissad   && !(v?.buildings || []).some(b => b.id === "palissad"))    return false;
    if (t.max && countInVillage(techId, v) >= t.max)                                    return false;
  }
  return true;
}

// -- Resursfunktioner --------------------------------------------
function canAffordTech(tech, stone, amber, hide, metal, discount) {
  const c = tech.cost || { stone: tech.baseCost || 2 };
  const stoneCost = Math.max(0, (c.stone || 0) - (discount ? 1 : 0));
  return stone >= stoneCost && (amber || 0) >= (c.amber || 0)
      && (hide  || 0) >= (c.hide  || 0) && (metal || 0) >= (c.metal || 0);
}

function payCost(tech, discount, setSt, setAm, setHi, setMe) {
  const c = tech.cost || { stone: tech.baseCost || 2 };
  const stoneCost = Math.max(0, (c.stone || 0) - (discount ? 1 : 0));
  if (stoneCost   > 0) setSt(s => s - stoneCost);
  if ((c.amber || 0) > 0) setAm(a => a - c.amber);
  if ((c.hide  || 0) > 0) setHi(h => h - c.hide);
  if ((c.metal || 0) > 0) setMe(m => m - c.metal);
}

function costLabel(tech, showUnknown, hasAmber, hasHide, hasMetal) {
  const c = tech.cost || { stone: tech.baseCost || 2 };
  const parts = [];
  if (c.stone) parts.push(`${RES.stone}${c.stone}`);
  if (c.amber) parts.push((!showUnknown || hasAmber) ? `${RES.amber}${c.amber}` : "💛?");
  if (c.hide)  parts.push((!showUnknown || hasHide)  ? `${RES.hide}${c.hide}`  : "🦌?");
  if (c.metal) parts.push((!showUnknown || hasMetal)  ? `${RES.metal}${c.metal}` : "⚙?");
  return parts.join(" ");
}

// -- Resursinkomst -----------------------------------------------
function resourceIncome(villages, techs, charStoneBonus) {
  const vl = Object.values(villages);
  let stone  = vl.length + 1 + (charStoneBonus || 0);
  let amber  = 0, hide = 0, metal = 0;
  if (techs.includes("korgflatning")) stone += 1;
  if (techs.includes("pilbage"))    { stone += 2; hide += 1; } // extra hud från jakt
  if (techs.includes("sjohandel"))    stone += 5;
  vl.forEach(v => {
    const b = v.buildings || [];
    if (b.some(x => x.id === "stockkanot"))  stone += 2;
    if (b.some(x => x.id === "handelsgård")) stone += 2;
    if (COAST_IDS.has(v.id))  amber += 1;
    if (FOREST_IDS.has(v.id)) hide  += 1; // skogsbyar ger alltid hud
    // Metal now comes from mines (see endTurn)
  });
  // Mine income handled separately in endTurn (needs mines state)
  return { stone, amber, hide, metal };
}

// -- Handelslänkar -----------------------------------------------
const TRADE_RANGE = 260;

function getTradeLinks(villages) {
  const vl = Object.values(villages);
  const links = [];
  for (let i = 0; i < vl.length; i++) {
    for (let j = i + 1; j < vl.length; j++) {
      const a = vl[i], b = vl[j];
      if (dist(a.x, a.y, b.x, b.y) > TRADE_RANGE) continue;
      const aT = (a.buildings || []).some(x => ["krukmakargard","handelsgård"].includes(x.id));
      const bT = (b.buildings || []).some(x => ["krukmakargard","handelsgård"].includes(x.id));
      if (aT || bT) links.push({ ax:a.x, ay:a.y, bx:b.x, by:b.y, both:aT&&bT });
    }
  }
  return links;
}

function tradePointsBonus(villages) {
  let bonus = 0;
  const vl = Object.values(villages);
  vl.forEach(v => {
    if (!(v.buildings || []).some(b => b.id === "krukmakargard")) return;
    vl.forEach(other => {
      if (other.id === v.id) return;
      if (dist(v.x, v.y, other.x, other.y) > TRADE_RANGE) return;
      if ((other.buildings || []).some(b => ["handelsgård","krukmakargard"].includes(b.id))) bonus += 2;
    });
  });
  return bonus;
}

// -- Försvar -----------------------------------------------------
function defenseScore(v, globalTechs, charId) {
  if (!v) return 0;
  const pal    = (v.buildings || []).filter(b => b.id === "palissad").length;
  const war    = (v.buildings || []).filter(b => b.id === "krigare").length;
  const flinta = (globalTechs || []).includes("flintaspets")
              || (globalTechs || []).includes("bronsvapen");
  const wBonus = (globalTechs || []).includes("bronsvapen") ? 6 : flinta ? 4 : 3;
  const charBonus = charId === "kungen" ? 2 : 0;
  return Math.floor((v.pop || 0) / 4) + pal * 4 + war * wBonus + charBonus;
}

// -- Händelser ---------------------------------------------------
const EVENTS = {
  cat: [
    { id:"torka",   title:"Torka",            icon:"☀",  desc:"Skörden slår fel. Alla byar –2 befolkning.",        effect:"pop-2-all"    },
    { id:"flood",   title:"Översvämning",     icon:"🌊", desc:"Ån flödar över. En by –3 befolkning.",              effect:"pop-3-rnd"    },
    { id:"pest",    title:"Pestilens",        icon:"💀", desc:"Sjukdom sprider sig. Största by –4 befolkning.",    effect:"pop-4-big"    },
    { id:"vinter",  title:"Hård vinter",      icon:"❄",  desc:"Lång vinter. Stenstinsamlingen halveras.",          effect:"stone-half"   },
    { id:"brand",   title:"Skogsbrand",       icon:"🔥", desc:"En by brinner. En slumpmässig by förlorar ett monument.", effect:"destroy-bld" },
  ],
  enemy: [
    { id:"stam1",   title:"Främmande Stam",   icon:"⚔",  desc:"En okänd stam angriper!",                          power:6  },
    { id:"varg",    title:"Vargflock",        icon:"🐺", desc:"En vargflock hotar boskapen.",                     power:3  },
    { id:"stam2",   title:"Nordliga Krigare", icon:"🏹", desc:"Krigare från norr pressar söderut!",                power:10 },
    { id:"bjorn",   title:"Björnangrepp",     icon:"🐻", desc:"En stor björn härjar bland boplatserna.",           power:4  },
  ],
  good: [
    { id:"fisk",    title:"Rik Fångst",       icon:"🐟", desc:"Havet ger rikligt. +5 sten.",                      effect:"stone+5"      },
    { id:"handl",   title:"Handelsmän",       icon:"🤝", desc:"Resande köpmän. +4 sten, +6 poäng.",               effect:"stone+4pts+6" },
    { id:"skepp",   title:"Strandfynd",       icon:"🚢", desc:"Strandat skepp. +6 sten.",                         effect:"stone+6"      },
    { id:"frid",    title:"Fredad Säsong",    icon:"🌿", desc:"Lugn period. Alla byar +2 befolkning.",            effect:"pop+2-all"    },
    { id:"amber",   title:"Bärnsten",         icon:"💛", desc:"Rik fyndighet vid kusten! +3 bärnsten.",           effect:"amber+3"      },
    { id:"jakt",    title:"Stor Jakt",        icon:"🦌", desc:"Framgångsrik jakt! +3 hudar.",                     effect:"hide+3"       },
  ],
};

function rollEvent(turn) {
  if (turn < 4) return null;
  const r = Math.random();
  if (r < 0.20) return EVENTS.cat[Math.floor(Math.random() * EVENTS.cat.length)];
  if (r < 0.42) return EVENTS.enemy[Math.floor(Math.random() * EVENTS.enemy.length)];
  if (r < 0.60) return EVENTS.good[Math.floor(Math.random() * EVENTS.good.length)];
  return null;
}

function applyEvent(ev, villages, globalTechs) {
  const vl = Object.values(villages);
  let stoneDelta=0, ptsDelta=0, amberDelta=0, hideDelta=0;
  let villageUpdates={}, halfStone=false, msg="";

  if (ev.type === "good") {
    const e = ev.effect;
    if (e === "stone+5")       { stoneDelta=5;              msg="Havet gav rikligt. +5 sten!"; }
    if (e === "stone+6")       { stoneDelta=6;              msg="Strandfynd! +6 sten!"; }
    if (e === "stone+4pts+6")  { stoneDelta=4; ptsDelta=6;  msg="Handelsmän passerade. +4 sten, +6 poäng!"; }
    if (e === "pop+2-all")     { vl.forEach(v => { villageUpdates[v.id]={...v,pop:Math.min(30,(v.pop||0)+2)}; }); msg="Fredad säsong. Alla byar växer!"; }
    if (e === "amber+3")       { amberDelta=3;              msg="Bärnsten hittad vid kusten! +3 💛"; }
    if (e === "hide+3")        { hideDelta=3;               msg="Framgångsrik jakt! +3 🦌"; }
  }

  if (ev.type === "cat") {
    const e = ev.effect;
    if (e === "pop-2-all")   { vl.forEach(v => { villageUpdates[v.id]={...v,pop:Math.max(0,(v.pop||0)-2)}; }); msg="Torka härjar. Folk lämnar boplatserna."; }
    if (e === "pop-3-rnd")   { const v=vl[Math.floor(Math.random()*vl.length)]; if(v){ villageUpdates[v.id]={...v,pop:Math.max(0,(v.pop||0)-3)}; msg=`Översvämning vid ${v.name}. –3 befolkning.`; } }
    if (e === "pop-4-big")   { const v=[...vl].sort((a,b)=>(b.pop||0)-(a.pop||0))[0]; if(v){ villageUpdates[v.id]={...v,pop:Math.max(0,(v.pop||0)-4)}; msg=`Pestilens slår mot ${v.name}. –4 befolkning.`; } }
    if (e === "stone-half")  { halfStone=true; msg="Hård vinter. Stenstinsamlingen halveras."; }
    if (e === "destroy-bld") {
      const wb = vl.filter(v => (v.buildings||[]).length > 0);
      if (wb.length) {
        const v = wb[Math.floor(Math.random() * wb.length)];
        const nb = [...v.buildings]; nb.splice(Math.floor(Math.random()*nb.length), 1);
        villageUpdates[v.id] = {...v, buildings:nb};
        msg = `Brand i ${v.name}! Ett monument förstörs.`;
      } else msg = "Skogsbrand – inga byar drabbades.";
    }
  }

  if (ev.type === "enemy") {
    const totalDef = vl.reduce((s, v) => s + defenseScore(v, globalTechs), 0);
    if (totalDef >= ev.power) {
      msg = `${ev.title} – Du höll stånd! Försvaret räckte.`;
    } else {
      const diff = ev.power - totalDef;
      const worst = [...vl].sort((a,b) => (b.pop||0)-(a.pop||0))[0];
      if (worst) { villageUpdates[worst.id] = {...worst, pop:Math.max(0,(worst.pop||0)-diff)}; }
      msg = `${ev.title} – Anfallet slog igenom! ${worst?.name||"En by"} –${diff} befolkning.`;
    }
  }

  return { stoneDelta, ptsDelta, amberDelta, hideDelta, villageUpdates, halfStone, msg };
}

// -- AI ----------------------------------------------------------
const AI_PRIOS = {
  passive:    ["korgflatning","pilbage","lagerhus","hallristning","keramik","langhus","schaman","stendos","hovdingskap","handelsgård","scout","palissad","skeppssattning"],
  balanced:   ["korgflatning","pilbage","lagerhus","langhus","hovdingskap","hallristning","palissad","stendos","flintaspets","krigare","handelsgård","scout"],
  aggressive: ["korgflatning","pilbage","lagerhus","langhus","hovdingskap","palissad","flintaspets","krigare","hallristning","schaman","stendos","scout"],
};

function aiTakeTurn({ villages, stone, pts, techs }, personality) {
  techs    = [...(techs || [])];
  villages = { ...villages };
  const log = [];

  // Inkomst
  const inc = resourceIncome(villages, techs, 0);
  stone += inc.stone;

  // Befolkningstillväxt
  const limit = techs.includes("keramik") ? 25 : 20;
  Object.keys(villages).forEach(id => {
    const v = villages[id];
    const growth = (v.buildings || []).filter(b => ["hallristning","stendos","skeppssattning"].includes(b.id)).length;
    const hasLager = (v.buildings || []).some(b => b.id === "lagerhus");
    let np = (v.pop || 0) + growth;
    if (np > limit && !hasLager) np -= 2;
    if (np > 28) np -= 4;
    villages[id] = { ...v, pop: Math.max(0, np) };
  });

  // Bygg (upp till 4 åtgärder per tur)
  const prios = AI_PRIOS[personality] || AI_PRIOS.passive;
  for (let attempt = 0; attempt < 4; attempt++) {
    let acted = false;
    for (const tid of prios) {
      const tech = getTech(tid); if (!tech) continue;
      const built = getBuiltSet(villages, techs);
      if (!tech.requires.every(r => built.has(r))) continue;
      if (stone < (tech.cost?.stone || tech.baseCost || 2)) continue;

      // Grunda ny boplats när Hövdingskap finns
      if (tid === "hovdingskap" && built.has("hovdingskap")) {
        const free = VILLAGE_SLOTS.filter(s => s.aiOnly && !villages[s.id]);
        if (free.length > 0 && stone >= 2) {
          const t = personality === "aggressive" ? free.sort((a,b)=>a.x-b.x)[0] : free[Math.floor(Math.random()*free.length)];
          villages[t.id] = { ...t, buildings:[], pop:3 };
          stone -= 2; pts += 2;
          log.push(`grundar ${t.name}`);
          acted = true; break;
        }
      }

      if (tech.knowledge) {
        if (techs.includes(tid)) continue;
        techs.push(tid);
        stone -= (tech.cost?.stone || tech.baseCost || 2);
        pts   += tech.pts;
        log.push(`uppfinner ${tech.label}`);
        acted = true; break;
      } else {
        const eligible = Object.values(villages).filter(v => {
          if ((v.buildings||[]).filter(b=>b.id===tid).length >= (tech.max||99)) return false;
          if (tech.requiresPalissad && !(v.buildings||[]).some(b=>b.id==="palissad")) return false;
          if (tech.coastal && !COAST_IDS.has(v.id)) return false;
          if (tech.requiresRiverOrCoast && !COAST_IDS.has(v.id) && !RIVER_IDS.has(v.id)) return false;
          return true;
        });
        if (!eligible.length) continue;
        const target = ["palissad","krigare"].includes(tid)
          ? eligible.sort((a,b) => (b.pop||0)-(a.pop||0))[0]
          : eligible[Math.floor(Math.random() * eligible.length)];
        villages[target.id] = {
          ...target,
          buildings: [...(target.buildings||[]), {id:tid, label:tech.label, icon:tech.icon}],
          pop: Math.min(30, (target.pop||0) + (tech.pop||0)),
        };
        stone -= (tech.cost?.stone || tech.baseCost || 2);
        pts   += tech.pts;
        log.push(`bygger ${tech.label} i ${target.name}`);
        acted = true; break;
      }
    }
    if (!acted) break;
  }
  return { villages, stone, pts, techs, log };
}

// -- Hjälpfunktioner ---------------------------------------------
function dist(x1, y1, x2, y2) { return Math.sqrt((x1-x2)**2 + (y1-y2)**2); }
function popColor(p)           { return p >= 22 ? "#c02020" : p >= 14 ? "#d07020" : "#3a7a3a"; }


// ----------------------------------------------------------------
// UI-KOMPONENTER
// ----------------------------------------------------------------

// -- Designkonstanter --------------------------------------------
const FONT  = "'Palatino Linotype',Palatino,Georgia,serif";
const PARCH = "#f5edcf";
const INK   = "#3a1f06";
const INK2  = "#6b3d10";
const GOLD  = "#c8861a";
const GOLD2 = "#e8a830";
const BDR   = "#b8922a";
const SHDW  = "rgba(80,40,0,0.18)";

const btnPrimary = {
  background:GOLD, border:`1.5px solid ${INK}`, color:INK,
  borderRadius:6, cursor:"pointer", fontFamily:"inherit",
  fontWeight:"bold", touchAction:"manipulation",
};
const btnSecondary = {
  background:"rgba(255,248,225,0.04)", border:"1px solid rgba(180,140,40,0.3)",
  color:"#8a7040", borderRadius:6, cursor:"pointer", fontFamily:"inherit",
};

// -- Is-overlay (canvas) -----------------------------------------
function IceOverlay({ revealed, mapW, mapH, scale }) {
  const canvasRef = useRef(null);
  const W = Math.round(mapW * scale);
  const H = Math.round(mapH * scale);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Isfyll
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   "rgba(210,235,255,0.93)");
    bg.addColorStop(0.4, "rgba(190,220,248,0.92)");
    bg.addColorStop(1,   "rgba(160,200,235,0.95)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Sprickor
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.lineWidth   = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(((i*137+23)*7)%W, ((i*89+41)*11)%H);
      ctx.lineTo(((i*211+67)*5)%W, ((i*163+19)*9)%H);
      ctx.stroke();
    }

    // Mjuka hål för avslöjade områden
    ctx.globalCompositeOperation = "destination-out";
    revealed.forEach(c => {
      const cx = c.x * scale, cy = c.y * scale;
      const r  = c.r * scale, f  = r * 0.42;
      const g  = ctx.createRadialGradient(cx, cy, Math.max(0, r-f), cx, cy, r);
      g.addColorStop(0,    "rgba(0,0,0,1)");
      g.addColorStop(0.55, "rgba(0,0,0,0.95)");
      g.addColorStop(0.82, "rgba(0,0,0,0.55)");
      g.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
  }, [revealed, W, H, scale]);

  return (
    <canvas ref={canvasRef} width={W} height={H}
      style={{ position:"absolute", top:0, left:0, pointerEvents:"none", zIndex:5 }}/>
  );
}

// -- Startskärm --------------------------------------------------
// -- SVG-ikoner hällristningsstil ------------------------------------
// -- Karaktärs-SVG silhuetter (hällristningsstil) -------------------

function SolkorsIcon({ size=48, color="#c8a030" }) {
  // color prop används för opacity/tint via CSS filter
  return (
    <img src="/solkors.png" width={size} height={size}
      style={{ objectFit:"contain", opacity: color==="#c8a030" ? 1 : 0.5 }}
      alt="solkors"/>
  );
}

function HallristningGubbe({ x=0, flip=false, size=1, color="#c8a030" }) {
  const s = size;
  return (
    <g transform={`translate(${x},0) scale(${flip?-s:s},${s}) ${flip?"translate(-20,0)":""}`}>
      {/* Huvud – liten rund */}
      <ellipse cx="10" cy="3" rx="2.5" ry="2.8" fill={color}/>
      {/* Kropp – asymetrisk rektangel, smalare upptill */}
      <path d="M 7.5 6 C 7 6.5, 6.5 8, 6.8 11 C 7 13.5, 7.5 15.5, 8 17
               L 12.5 17 C 13 15.5, 13.5 13.5, 13.3 11
               C 13 8, 12.5 6.5, 12 6 Z"
        fill={color}/>
      {/* Vänster arm – tunn, sträcker ut med spjut */}
      <path d="M 7.5 8.5 L 0.5 7 L 0 8 L 7 10 Z" fill={color}/>
      {/* Spjut/yxa vänster */}
      <path d="M 0 7 L -1.5 7.5 L 0.5 8.5 Z" fill={color}/>
      {/* Höger arm – tunn, ned/bakåt */}
      <path d="M 12.5 9 L 18 11.5 L 17.5 12.5 L 12 10 Z" fill={color}/>
      {/* Vänster lår – grovt */}
      <path d="M 8 17 C 7.5 18, 6.5 19.5, 6 21.5 C 5.5 23, 5.8 24, 6.5 24
               L 8.5 24 C 8.8 23, 9 21.5, 9 20 C 9 18.5, 8.8 17.5, 8.5 17 Z"
        fill={color}/>
      {/* Vänster vad */}
      <path d="M 6.5 24 C 6 25, 5.5 26.5, 5.8 28 L 7.5 28
               C 7.5 27, 7.8 25.5, 8.2 24 Z"
        fill={color}/>
      {/* Höger lår – grovt */}
      <path d="M 12 17 C 12.5 17.5, 13 18.5, 13.5 20 C 14 21.5, 14.2 23, 13.8 24
               L 11.5 24 C 11.2 23, 11 21.5, 11 20 C 11 18.5, 11.2 17.5, 11.5 17 Z"
        fill={color}/>
      {/* Höger vad – böjt bakåt */}
      <path d="M 13.8 24 C 14.5 25, 15.5 26, 15.8 27.5 L 14 28
               C 13.8 27, 13 25.5, 12 24.5 Z"
        fill={color}/>
    </g>
  );
}

function TvaGubbarIcon({ size=48 }) {
  return <img src="/passplay.png" width={size} height={size} style={{ objectFit:"contain" }} alt="pass and play"/>;
}

function TreGruppenIcon({ size=48 }) {
  return <img src="/twoai.png" width={size} height={size} style={{ objectFit:"contain" }} alt="2p+AI"/>;
}


function StoneButton({ onClick, selected, children, style={} }) {
  return (
    <button onClick={onClick} style={{
      background: selected
        ? "linear-gradient(145deg,#5a4a28,#3a2a10)"
        : "linear-gradient(145deg,#3a3020,#2a2010)",
      border: `2px solid ${selected?"#c8a030":"#6a5a30"}`,
      borderRadius:4,
      boxShadow: selected
        ? "inset 0 2px 6px rgba(0,0,0,0.6), 0 0 20px rgba(200,160,48,0.3)"
        : "inset 0 2px 4px rgba(0,0,0,0.5), 2px 2px 8px rgba(0,0,0,0.4)",
      cursor:"pointer", fontFamily:FONT, color:"#e8d5a0",
      position:"relative", overflow:"hidden",
      ...style
    }}>
      <div style={{ position:"absolute", inset:0, opacity:0.06,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px)",
        pointerEvents:"none" }}/>
      {children}
    </button>
  );
}

function CarvedText({ children, size=14, color="#d4a030", style={} }) {
  return (
    <span style={{
      fontSize:size, color, fontFamily:FONT, fontWeight:"bold",
      textShadow:`0 1px 0 rgba(0,0,0,0.8), 0 -1px 0 rgba(255,220,100,0.15)`,
      letterSpacing:1, ...style
    }}>{children}</span>
  );
}

function StartScreen({ onStart }) {
  const [step,   setStep]   = useState(0);
  const [mode,   setMode]   = useState(null);
  const [aiP,    setAiP]    = useState(null);
  const [pchar,  setPchar]  = useState(null);
  const [pname,  setPname]  = useState("");
  const [p2char, setP2char] = useState(null);
  const [p2name, setP2name] = useState("");
  const [step2,  setStep2]  = useState(false);

  const begin = () => {
    const pls = [{ char:pchar, name:pname||pchar.name, isHuman:true }];
    if (mode === "2p" || mode === "2pai") pls.push({ char:p2char, name:p2name||p2char?.name, isHuman:true });
    const aiMode = (mode === "ai" || mode === "2pai") ? (aiP || "passive") : null;
    onStart(pls, aiMode);
  };

  const bgStyle = {
    height:"100dvh", display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    background:"linear-gradient(170deg,#0d0a06 0%,#1a1208 40%,#0f0d08 100%)",
    fontFamily:FONT, color:"#e8d5a0",
    padding:"20px 16px", boxSizing:"border-box", overflowY:"auto",
    position:"relative",
  };

  const modeOptions = [
    { id:"ai",   Icon:SolkorsIcon,    label:"Mot datorn",  desc:"En spelare mot AI-stammen" },
    { id:"2p",   Icon:TvaGubbarIcon,  label:"Pass & Play", desc:"Två spelare, en telefon" },
    { id:"2pai", Icon:TreGruppenIcon, label:"2p + AI",     desc:"Två spelare och en AI-stam" },
  ];

  const aiOptions = [
    { id:"passive",    icon:"🌿", name:"Skateholmsfolket",  desc:"Mesolitiska jägare-samlare. Försiktiga." },
    { id:"balanced",   icon:"🏺", name:"Trattbägarfolket",  desc:"Neolitiska bönder. Metodiska." },
    { id:"aggressive", icon:"⚔️", name:"Stridsyxefolket",   desc:"Krigarfolk. Anfaller tidigt." },
  ];

  return (
    <div style={bgStyle}>
      {/* Bakgrundsristningar */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.04, pointerEvents:"none" }}
        viewBox="0 0 300 600" preserveAspectRatio="xMidYMid slice">
        {[...Array(8)].map((_,i) => (
          <g key={i} transform={`translate(${(i%3)*100+20},${Math.floor(i/3)*180+40})`}>
            <HallristningGubbe x={0} color="#fff" size={2}/>
          </g>
        ))}
      </svg>

      {/* Titel */}
      <div style={{ textAlign:"center", marginBottom:28, position:"relative" }}>
        <div style={{ fontSize:8, letterSpacing:8, color:"#5a4a20", marginBottom:6 }}>✦ STENÅLDERENS FOLK ✦</div>
        <div style={{ fontSize:36, fontWeight:"bold", letterSpacing:6, color:"#d4a030",
          textShadow:"0 2px 0 rgba(0,0,0,0.8), 0 0 30px rgba(200,140,30,0.4)" }}>
          ÖSTERLEN
        </div>
        <div style={{ fontSize:9, letterSpacing:4, color:"#4a3a18", marginTop:6 }}>ca 8000 f.Kr.</div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, justifyContent:"center" }}>
          <div style={{ height:1, width:40, background:"linear-gradient(90deg,transparent,#5a4a20)" }}/>
          <div style={{ fontSize:14, color:"#5a4a20" }}>✦</div>
          <div style={{ height:1, width:40, background:"linear-gradient(90deg,#5a4a20,transparent)" }}/>
        </div>
      </div>

      {step === 0 && (
        <div style={{ width:"100%", maxWidth:340 }}>
          <div style={{ fontSize:10, letterSpacing:3, color:"#5a4a20", textAlign:"center", marginBottom:14 }}>VÄLJ SPELLÄGE</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {modeOptions.map(({ id, Icon, label, desc }) => (
              <StoneButton key={id} onClick={() => { setMode(id); setStep(id==="2p"?2:1); }}
                style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 18px", width:"100%", textAlign:"left" }}>
                <div style={{ flexShrink:0 }}><Icon size={42} color="#c8a030"/></div>
                <div>
                  <CarvedText size={14}>{label}</CarvedText>
                  <div style={{ fontSize:10, color:"#7a6a40", marginTop:3, fontStyle:"italic" }}>{desc}</div>
                </div>
              </StoneButton>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ width:"100%", maxWidth:340 }}>
          <div style={{ fontSize:10, letterSpacing:3, color:"#5a4a20", textAlign:"center", marginBottom:14 }}>
            {mode==="2pai" ? "VÄLJ AI-STAM" : "VÄLJ MOTSTÅNDARE"}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
            {aiOptions.map(({ id, icon, name, desc }) => (
              <StoneButton key={id} selected={aiP===id} onClick={() => setAiP(id)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", width:"100%", textAlign:"left" }}>
                <div style={{ fontSize:28, flexShrink:0 }}>{icon}</div>
                <div>
                  <CarvedText size={13}>{name}</CarvedText>
                  <div style={{ fontSize:10, color:"#7a6a40", marginTop:2, fontStyle:"italic" }}>{desc}</div>
                </div>
              </StoneButton>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <StoneButton onClick={() => setStep(0)} style={{ flex:1, padding:"11px" }}>
              <CarvedText size={11} color="#9a8050">← Tillbaka</CarvedText>
            </StoneButton>
            {aiP && (
              <StoneButton onClick={() => setStep(2)} style={{ flex:2, padding:"11px" }}>
                <CarvedText size={12}>{mode==="2pai"?"Välj spelare →":"Välj anfäder →"}</CarvedText>
              </StoneButton>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ fontSize:10, letterSpacing:3, color:"#5a4a20", textAlign:"center", marginBottom:10 }}>
            {step2 ? "SPELARE 2 VÄLJER" : mode==="2pai" ? "SPELARE 1 VÄLJER" : "VÄLJ DIN ANFADER"}
          </div>
          <input value={step2?p2name:pname}
            onChange={e => step2?setP2name(e.target.value):setPname(e.target.value)}
            placeholder={step2?"Spelare 2:s namn":"Ditt namn (valfritt)"}
            style={{ background:"rgba(255,248,225,0.06)", border:"1px solid #4a3a18",
              color:"#e8d5a0", padding:"8px 12px", borderRadius:3, fontFamily:FONT,
              fontSize:12, marginBottom:10, width:"100%", textAlign:"center",
              boxSizing:"border-box", boxShadow:"inset 0 2px 4px rgba(0,0,0,0.4)" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {CHARACTERS.filter(ch => !step2 || ch.id !== pchar?.id).map(ch => {
              const chosen = step2 ? p2char?.id===ch.id : pchar?.id===ch.id;
              return (
                <button key={ch.id} onClick={() => step2?setP2char(ch):setPchar(ch)}
                  style={{
                    background: chosen
                      ? `linear-gradient(160deg,#4a3a18,#2a1e08,#3a2e12)`
                      : `linear-gradient(160deg,#1e1a0a,#141008,#1a160a)`,
                    border: `2px solid ${chosen ? ch.color : "#3a2e10"}`,
                    borderRadius:3,
                    boxShadow: chosen
                      ? `inset 0 2px 6px rgba(0,0,0,0.7), 0 0 18px ${ch.color}44`
                      : `inset 0 2px 4px rgba(0,0,0,0.6), 2px 2px 6px rgba(0,0,0,0.5)`,
                    cursor:"pointer", fontFamily:FONT,
                    padding:"14px 10px", textAlign:"center",
                    position:"relative", overflow:"hidden",
                  }}>
                  {/* Subtil strimma uppe */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:"35%",
                    background:"linear-gradient(180deg,rgba(255,255,255,0.03),transparent)",
                    pointerEvents:"none" }}/>
                  {/* Karaktärens färgton i hörnet */}
                  <div style={{ position:"absolute", top:0, right:0, width:30, height:30,
                    background:`radial-gradient(circle at top right, ${ch.color}22, transparent)`,
                    pointerEvents:"none" }}/>
                  <div style={{ position:"relative" }}>
                    {/* Karaktärsikon */}
                    <div style={{ marginBottom:8, display:"flex", justifyContent:"center",
                      opacity: chosen ? 1 : 0.6,
                      filter: chosen ? `drop-shadow(0 0 8px ${ch.color}88)` : "none",
                      transition:"all 0.2s" }}>
                      <img src={
                        ch.id==="dansaren" ? "/dansaren.png" :
                        ch.id==="skateholmsjagaren" ? "/jagaren.png" :
                        ch.id==="kungen" ? "/dansaren2.png" :
                        ch.id==="jarlen" ? "/jarlen.png" : ""
                      } width={80} height={80} style={{ objectFit:"contain" }} alt={ch.name}/>
                    </div>
                    {/* Namn */}
                    <div style={{
                      fontSize:13, fontWeight:"bold",
                      color: chosen ? ch.colorLight : "#c8a030",
                      textShadow:`0 1px 0 rgba(0,0,0,0.9), 0 -1px 0 rgba(255,220,100,0.1)`,
                      letterSpacing:1, marginBottom:3
                    }}>{ch.name}</div>
                    {/* Titel */}
                    <div style={{ fontSize:8, color:"#5a4a20", letterSpacing:2,
                      marginBottom:8, fontStyle:"italic" }}>
                      {ch.title}
                    </div>
                    {/* Separator */}
                    <div style={{ height:1, background:`linear-gradient(90deg,transparent,${ch.color}44,transparent)`,
                      marginBottom:8 }}/>
                    {/* Beskrivning */}
                    <div style={{ fontSize:9, color:"#9a8860", lineHeight:1.6,
                      marginBottom:10, fontStyle:"italic", textAlign:"left" }}>
                      {ch.desc}
                    </div>
                    {/* Bonusruta */}
                    <div style={{
                      background:`${ch.color}18`,
                      border:`1px solid ${ch.color}44`,
                      borderRadius:2, padding:"5px 7px",
                      fontSize:8, color: chosen ? ch.colorLight : "#8a7840",
                      lineHeight:1.5, textAlign:"left",
                      boxShadow:`inset 0 1px 3px rgba(0,0,0,0.4)`
                    }}>
                      ✦ {ch.bonus}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <StoneButton onClick={() => { if(step2){setStep2(false);setP2char(null);} else setStep(mode==="ai"?1:0); }}
              style={{ flex:1, padding:"11px" }}>
              <CarvedText size={11} color="#9a8050">← Tillbaka</CarvedText>
            </StoneButton>
            {!step2 && pchar && mode==="2pai" && (
              <StoneButton onClick={() => setStep2(true)} style={{ flex:2, padding:"11px" }}>
                <CarvedText size={12}>Spelare 2 →</CarvedText>
              </StoneButton>
            )}
            {!step2 && pchar && mode==="ai" && (
              <StoneButton onClick={begin} style={{ flex:2, padding:"11px" }}>
                <CarvedText size={12}>✦ BÖRJA SPELA</CarvedText>
              </StoneButton>
            )}
            {!step2 && pchar && mode==="2p" && (
              <StoneButton onClick={() => setStep2(true)} style={{ flex:2, padding:"11px" }}>
                <CarvedText size={12}>Spelare 2 →</CarvedText>
              </StoneButton>
            )}
            {step2 && p2char && (
              <StoneButton onClick={begin} style={{ flex:2, padding:"11px" }}>
                <CarvedText size={12}>✦ BÖRJA SPELA</CarvedText>
              </StoneButton>
            )}
          </div>
        </div>
      )}

      <div style={{ position:"absolute", bottom:14, fontSize:8, color:"#3a2a10", letterSpacing:3 }}>
        ✦ ÖSTERLEN · SKÅNE · SVERIGE ✦
      </div>
    </div>
  );
}


const LORE_PAGES = [
  { icon:"🌊", title:"Österlen vaknar",
    text:"Det är tidigt mesolitikum – kanske 7000 år före Kristus. Inlandsisen har dragit sig tillbaka norrut och lämnat ett landskap av lera, morän och unga skogar. Havet stiger fortfarande. Det som idag är Hanöbukten är grundare och smalare, och längs kusten löper strandvallar av flinta och kalksten." },
  { icon:"🌲", title:"Naturen",
    text:"Klimatet är milt och fuktigt – varmare än idag. Täta lövskogar av ek, alm och lind klär sluttningarna. Längs åarna – Verkeån, Tommarpsån, Nybroån – växer al och pil i snåriga strandkanter. Rådjur, vildsvin, bäver och björn rör sig i skogarna. Havet är rikt på torsk, sill och lax." },
  { icon:"🐟", title:"Folket",
    text:"Människorna som lever här är mesolitiska jägare och samlare. De rör sig med årstiderna – fiskar vid kusten om somrarna, jagar i de inre skogarna om vintern. De känner varje å, varje vik och varje flintaförekomst. De begraver sina döda med omsorg och målar sina verktyg med röd ockra." },
  { icon:"🗡", title:"Flinta & Verktyg",
    text:"Österlen är rikt på flinta – en hård sten som kan slås till vassa verktyg och vapen. Dina förfäder har i generationer lärt sig att forma knivar, skrapor och spjutspetsar. Flintaknölar sticker upp ur den kalkrika marken längs kusten, och vid åarnas stränder hittar man de bästa stenarna." },
  { icon:"🌙", title:"Din uppgift",
    text:"Du är en av dem. Ditt folk har slagit läger vid en plats de känner väl – där en bäck rinner nära och flintaknölar ligger lösa i marken. Isen som täcker de okända delarna av landet smälter sakta undan. Det är dags att bygga något som varar." },
  { icon:"👑", title:"Kungen & Jarlen",
    text:"Långt fram i tiden – under bronsåldern – begravdes en mäktig man vid Kivik med en prakt utan like i Norden. Stora hällar täckta med mystiska ristningar. Vem var han? I Järrestad huggs bilder i berget som skall tolkas av dem som kan läsa tidens tecken. En jarl håller vakt." },
];

function LoreScreen({ character, onDone }) {
  const [page, setPage] = useState(0);
  const lore   = LORE_PAGES[page];
  const isLast = page === LORE_PAGES.length - 1;
  return (
    <div style={{ height:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(170deg,#0a0d04,#141a08 50%,#0a0804)",
      fontFamily:FONT, color:"#e8d5a0",
      padding:"28px 22px", boxSizing:"border-box",
      position:"relative", overflow:"hidden" }}>

      {[...Array(24)].map((_,i) => (
        <div key={i} style={{ position:"absolute",
          left:`${(i*43+11)%95}%`, top:`${(i*67+7)%90}%`,
          width:i%3===0?2:1, height:i%3===0?2:1, borderRadius:"50%",
          background:`rgba(200,180,120,${0.1+((i*17)%10)*0.03})`,
          pointerEvents:"none" }}/>
      ))}

      <div style={{ background:"rgba(255,248,225,0.06)", border:"1px solid rgba(180,140,40,0.25)",
        borderRadius:8, padding:"6px 14px", fontSize:10, color:"#a09060",
        letterSpacing:2, marginBottom:20, fontStyle:"italic" }}>
        {character.icon} {character.name} -- {character.title}
      </div>

      <div style={{ display:"flex", gap:5, marginBottom:20 }}>
        {LORE_PAGES.map((_,i) => (
          <div key={i} style={{ width:i===page?20:6, height:4, borderRadius:2, transition:"all 0.3s",
            background:i===page?GOLD:i<page?"rgba(200,140,30,0.4)":"rgba(200,140,30,0.15)" }}/>
        ))}
      </div>

      <div style={{ maxWidth:340, textAlign:"center" }}>
        <div style={{ fontSize:44, marginBottom:16 }}>{lore.icon}</div>
        <div style={{ fontSize:18, fontWeight:"bold", color:"#d4a030", letterSpacing:1, marginBottom:16, lineHeight:1.2 }}>
          {lore.title}
        </div>
        <div style={{ fontSize:13, color:"#c8b890", lineHeight:1.85, fontStyle:"italic", marginBottom:32 }}>
          {lore.text}
        </div>
      </div>

      <div style={{ display:"flex", gap:10, width:"100%", maxWidth:300 }}>
        {page > 0 && (
          <button onClick={() => setPage(p => p-1)} style={{ ...btnSecondary, flex:1, padding:"12px" }}>
            Tillbaka
          </button>
        )}
        <button onClick={() => isLast ? onDone() : setPage(p => p+1)}
          style={{ flex:2, padding:"12px", borderRadius:6, cursor:"pointer",
            fontFamily:"inherit", fontSize:13, fontWeight:"bold",
            background:isLast?GOLD:"rgba(200,140,30,0.15)",
            border:`1.5px solid ${isLast?INK:"rgba(180,140,40,0.4)"}`,
            color:isLast?INK:"#c8a030", transition:"all 0.2s" }}>
          {isLast ? "BÖRJA SPELA" : "Fortsätt"}
        </button>
      </div>

      <div style={{ position:"absolute", bottom:14, fontSize:8,
        color:"rgba(180,140,40,0.3)", letterSpacing:3 }}>
        ÖSTERLEN - SKÅNE - SVERIGE
      </div>
    </div>
  );
}


function EventModal({ event, villages, globalTechs, onResolve }) {
  const [phase,  setPhase]  = useState("prompt");
  const [result, setResult] = useState(null);
  const isEnemy  = event.type === "enemy";
  const totalDef = Object.values(villages).reduce((s,v) => s + defenseScore(v, globalTechs), 0);
  const wins     = isEnemy && totalDef >= event.power;
  function resolve() { const r = applyEvent(event, villages, globalTechs); setResult(r); setPhase("resolved"); }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:150, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:PARCH, borderRadius:12, padding:"26px 20px", maxWidth:360, width:"100%", fontFamily:FONT, textAlign:"center", border:`2px solid ${BDR}`, boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize:40, marginBottom:8 }}>{event.icon}</div>
        <div style={{ fontSize:18, fontWeight:"bold", color:INK, marginBottom:6 }}>{event.title}</div>
        <div style={{ fontSize:12, color:INK2, fontStyle:"italic", lineHeight:1.7, marginBottom:16 }}>{event.desc}</div>
        {isEnemy && phase==="prompt" && (
          <div style={{ background:"#fff8e8", border:`1px solid ${BDR}`, borderRadius:6, padding:"10px 14px", marginBottom:16, fontSize:11, color:INK2, textAlign:"left" }}>
            <div>Fiendens styrka: <b>{event.power}</b></div>
            <div>Ditt försvar: <b>{totalDef}</b></div>
            <div style={{ marginTop:6, fontStyle:"italic", color:wins?"#2a6a2a":"#8a2a2a" }}>
              {wins ? "Du ar stark nog att halla stand." : "Du ar i underlage!"}
            </div>
          </div>
        )}
        {phase === "resolved" ? (
          <><div style={{ fontSize:13, color:INK, fontStyle:"italic", padding:"10px 0 18px", lineHeight:1.7 }}>{result.msg}</div>
          <button onClick={() => onResolve(result)} style={{ ...btnPrimary, padding:"12px 32px", fontSize:13 }}>Fortsätt</button></>
        ) : (
          <button onClick={resolve} style={{ ...btnPrimary, padding:"12px 28px", fontSize:13 }}>
            {isEnemy ? (wins ? "Försvar! ⚔" : "Mot anfallet ⚔") : "Se vad som händer"}
          </button>
        )}
      </div>
    </div>
  );
}

function AiTurnModal({ aiPersonality, log, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:150, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1a0e04", borderRadius:12, padding:"26px 20px", maxWidth:340, width:"100%", fontFamily:FONT, textAlign:"center", border:"2px solid #5a3a10", boxShadow:"0 8px 40px rgba(0,0,0,0.7)" }}>
        <div style={{ fontSize:34, marginBottom:8 }}>{aiPersonality==="aggressive" ? "⚔" : aiPersonality==="balanced" ? "🏺" : "🌿"}</div>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#d4a030", marginBottom:14 }}>
          {aiPersonality==="aggressive" ? "Stridsyxefolket" : aiPersonality==="balanced" ? "Trattbägarfolket" : "Skateholmsfolket"} agerar...
        </div>
        {log.length > 0 && (
          <div style={{ background:"rgba(255,248,225,0.05)", borderRadius:6, padding:"10px 12px", marginBottom:16, textAlign:"left" }}>
            {log.map((l,i) => <div key={i} style={{ fontSize:11, color:"#c8a050", marginBottom:3, fontStyle:"italic" }}>{l}</div>)}
          </div>
        )}
        <button onClick={onClose} style={{ ...btnPrimary, padding:"12px 32px", fontSize:13 }}>Fortsätt</button>
      </div>
    </div>
  );
}

function AttackModal({ targetVillage, playerVillages, globalTechs, onAttack, onClose }) {
  const totalW   = Object.values(playerVillages).reduce((s,v) => s+(v.buildings||[]).filter(b=>b.id==="krigare").length, 0);
  const [w, setW] = useState(1);
  const flinta   = globalTechs.includes("flintaspets") || globalTechs.includes("bronsvapen");
  const bonus    = globalTechs.includes("bronsvapen") ? 6 : 4;
  const atk      = w * (flinta ? bonus : 3);
  const def      = defenseScore(targetVillage, null);
  if (!totalW) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:160, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:PARCH, borderRadius:12, padding:"26px 20px", maxWidth:320, width:"100%", fontFamily:FONT, textAlign:"center", border:`2px solid ${BDR}` }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚔</div>
        <div style={{ fontSize:15, fontWeight:"bold", color:INK, marginBottom:10 }}>Inga krigare!</div>
        <div style={{ fontSize:12, color:INK2, fontStyle:"italic", marginBottom:20 }}>Bygg Palissad och uppfinn Flintaspets för att trana krigare.</div>
        <button onClick={onClose} style={{ ...btnPrimary, padding:"12px 24px", fontSize:13 }}>Tillbaka</button>
      </div>
    </div>
  );
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:160, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:PARCH, borderRadius:12, padding:"26px 20px", maxWidth:340, width:"100%", fontFamily:FONT, textAlign:"center", border:`2px solid ${BDR}`, boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize:10, letterSpacing:3, color:"#8a7040", marginBottom:8 }}>-- ANFALL --</div>
        <div style={{ fontSize:18, fontWeight:"bold", color:INK, marginBottom:4 }}>⚔ {targetVillage.name}</div>
        <div style={{ fontSize:11, color:INK2, fontStyle:"italic", marginBottom:16 }}>Fiendens försvar: <b>{def}</b></div>
        <div style={{ background:"#fff8e8", border:`1px solid ${BDR}`, borderRadius:6, padding:"12px", marginBottom:16 }}>
          <div style={{ fontSize:11, color:INK2, marginBottom:8 }}>Skicka krigare: <b>{w}</b> av {totalW}</div>
          <input type="range" min={1} max={totalW} value={w} onChange={e => setW(+e.target.value)} style={{ width:"100%", marginBottom:8 }}/>
          <div style={{ fontSize:11, color:INK2 }}>Attackstyrka: <b>{atk}</b></div>
          <div style={{ marginTop:8, fontSize:12, fontWeight:"bold", fontStyle:"italic", color:atk>def?"#2a6a2a":"#8a2a2a" }}>
            {atk > def ? "Du borde vinna!" : "Du riskerar att forlora!"}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:"#f0e8d4", border:`1px solid #d8c8a0`, color:"#9a7040", padding:"12px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Avbryt</button>
          <button onClick={() => onAttack(w)} style={{ flex:2, background:"#8a2010", border:"1.5px solid #3a0a04", color:"#fff8e0", padding:"12px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" }}>ANFALLA! ⚔</button>
        </div>
      </div>
    </div>
  );
}

function MoveWarriorsModal({ sourceVillage, playerVillages, onMove, onClose }) {
  const totalW  = (sourceVillage?.buildings||[]).filter(b => b.id==="krigare").length;
  const [w, setW] = useState(1);
  const ownerId = sourceVillage?.ownerId;
  const targets = Object.values(playerVillages).filter(v =>
    v.id !== sourceVillage?.id && v.ownerId === ownerId &&
    (v.buildings||[]).some(b => b.id==="langhus") &&
    (v.buildings||[]).some(b => b.id==="byaldste")
  );
  const [targetId, setTargetId] = useState(targets[0]?.id || null);
  if (!totalW) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:160, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:PARCH, borderRadius:12, padding:"24px 20px", maxWidth:340, width:"100%", fontFamily:FONT, textAlign:"center", border:`2px solid ${BDR}`, boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize:10, letterSpacing:3, color:"#8a7040", marginBottom:8 }}>-- FLYTTA KRIGARE --</div>
        <div style={{ fontSize:16, fontWeight:"bold", color:INK, marginBottom:16 }}>⚔ Från {sourceVillage?.name}</div>
        {targets.length === 0 ? (
          <><div style={{ fontSize:12, color:INK2, fontStyle:"italic", marginBottom:20, lineHeight:1.7 }}>Ingen boplats har Langhus + Byaldste.</div>
          <button onClick={onClose} style={{ ...btnPrimary, padding:"11px 24px", fontSize:13 }}>OK</button></>
        ) : (
          <>
            <div style={{ background:"#fff8e8", border:`1px solid ${BDR}`, borderRadius:6, padding:"12px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:INK2, marginBottom:8 }}>Antal: <b>{w}</b> av {totalW}</div>
              <input type="range" min={1} max={totalW} value={w} onChange={e => setW(+e.target.value)} style={{ width:"100%", marginBottom:12 }}/>
              {targets.map(t => (
                <button key={t.id} onClick={() => setTargetId(t.id)}
                  style={{ display:"block", width:"100%", marginBottom:6, background:targetId===t.id?"#e8f0d0":"#fff8e8", border:`1.5px solid ${targetId===t.id?"#5a8a20":BDR}`, borderRadius:5, padding:"8px 12px", textAlign:"left", cursor:"pointer", fontFamily:"inherit", fontSize:12, color:INK2 }}>
                  🏠 {t.name} - 👥 {t.pop||0} folk
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"#f0e8d4", border:`1px solid #d8c8a0`, color:"#9a7040", padding:"11px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Avbryt</button>
              <button onClick={() => targetId && onMove(w, targetId)} style={{ flex:2, background:"#3a6a20", border:"1.5px solid #1a3a08", color:"#e8f0d0", padding:"11px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" }}>FLYTTA ⚔</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WorldFactModal({ fact, eraName, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:195, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1a1408", borderRadius:12, padding:"28px 22px", maxWidth:340, width:"100%", border:"2px solid #6a5020", boxShadow:"0 8px 40px rgba(0,0,0,0.7)", fontFamily:FONT, textAlign:"center" }}>
        <div style={{ fontSize:9, letterSpacing:4, color:"#6a5a30", marginBottom:6 }}>-- OMVÄRLDEN --</div>
        <div style={{ fontSize:8, color:"#8a7040", letterSpacing:2, marginBottom:14 }}>{eraName?.toUpperCase()}</div>
        <div style={{ fontSize:32, marginBottom:10 }}>{fact.icon}</div>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#d4a030", marginBottom:14 }}>{fact.title}</div>
        <div style={{ fontSize:12, color:"#c8b890", lineHeight:1.8, fontStyle:"italic", marginBottom:22 }}>{fact.text}</div>
        <button onClick={onClose} style={{ background:"#6a5020", border:"1.5px solid #3a2a08", color:"#e8d5a0", padding:"12px 32px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" }}>Fortsätt</button>
      </div>
    </div>
  );
}

function DiscoveryModal({ site, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:PARCH, borderRadius:12, padding:"28px 22px", maxWidth:340, width:"100%", fontFamily:FONT, textAlign:"center", border:`2px solid ${BDR}`, boxShadow:"0 8px 40px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize:10, letterSpacing:4, color:"#8a7040", marginBottom:8 }}>-- UPPTÄCKT --</div>
        <div style={{ fontSize:36, marginBottom:10 }}>{site.icon}</div>
        <div style={{ fontSize:18, fontWeight:"bold", color:INK, marginBottom:14 }}>{site.name}</div>
        <div style={{ fontSize:12, color:INK2, fontStyle:"italic", lineHeight:1.8, marginBottom:22 }}>{site.lore}</div>
        <button onClick={onClose} style={{ ...btnPrimary, padding:"12px 32px", fontSize:13 }}>Fortsätt</button>
      </div>
    </div>
  );
}


function TechTreePanel({ selectedVillageId, villages, globalTechs, stone, amber, hide, metal, charBuildDiscount, onBuild, onClose }) {
  const selV     = selectedVillageId ? villages[selectedVillageId] : null;
  const tiers    = [0,1,2,3,4,5,6].map(t => TECH_TREE.filter(x => x.tier === t));
  const hasAmber = Object.keys(villages).some(id => COAST_IDS.has(id));
  const hasHide  = Object.keys(villages).some(id => FOREST_IDS.has(id));
  const hasMetal = (metal||0) > 0 || Object.values(villages).some(v => (v.buildings||[]).some(b => b.id==="hamnplats"));

  function isDone(tech) {
    if (tech.knowledge) return globalTechs.includes(tech.id);
    if (!selV) return false;
    return !!(tech.max && countInVillage(tech.id, selV) >= tech.max);
  }

  const TIER_LABELS = [
    "Mesolitikum (8000-4000 f.Kr.)",
    "Tidig Neolitikum (4000-3500 f.Kr.)",
    "Neolitikum (3500-2500 f.Kr.)",
    "Sen Neolitikum (2500-1800 f.Kr.)",
    "Bronsalder (1800-1000 f.Kr.)",
    "Sen Bronsalder (1000-500 f.Kr.)",
    "Jarnaldern (500 f.Kr.-800 e.Kr.)",
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:180, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:PARCH, borderRadius:"16px 16px 0 0", width:"100%", maxWidth:480, maxHeight:"88dvh", display:"flex", flexDirection:"column", border:`2px solid ${BDR}`, boxShadow:"0 -8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 10px", borderBottom:`1px solid ${BDR}`, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:"bold", color:INK, fontFamily:FONT }}>Utvecklingsträdet</div>
            <div style={{ fontSize:9, fontStyle:"italic", marginTop:1, color:selV?"#9a7040":"#c05020" }}>
              {selV ? `Bygger i: ${selV.name}` : "Välj en boplats på kartan för att bygga"}
            </div>
            <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
              {[[RES.stone,stone,"#8a7040"],[RES.amber,amber,"#a07010"],[RES.hide,hide,"#6a4a20"],[RES.metal,metal,"#4a6a8a"]].map(([icon,val,col])=>val>0?(
                <span key={icon} style={{ fontSize:11, color:col, fontWeight:"bold" }}>{icon}{val}</span>
              ):null)}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:INK2 }}>x</button>
        </div>
        <div style={{ overflowY:"auto", padding:"12px 16px 28px", fontFamily:FONT }}>
          {tiers.map((techs, ti) => {
            if (!techs.length) return null;
            return (
              <div key={ti} style={{ marginBottom:18 }}>
                <div style={{ fontSize:9, letterSpacing:2, color:"#9a7040", marginBottom:8, borderBottom:"1px solid #e8d5a0", paddingBottom:4 }}>
                  {TIER_LABELS[ti].toUpperCase()}
                </div>
                {techs.map(tech => {
                  const isBlt   = isDone(tech);
                  const avail   = isAvailable(tech.id, villages, globalTechs, selectedVillageId);
                  const isDisc  = charBuildDiscount.includes(tech.id);
                  const canAffd = canAffordTech(tech, stone, amber||0, hide||0, metal||0, isDisc);
                  const needVil = !tech.knowledge && !selectedVillageId;
                  const disabled = isBlt || !avail || !canAffd || needVil;
                  const fg  = isBlt ? "#2a5a2a" : !disabled ? INK2 : "#b0986a";
                  const bg  = isBlt ? "#e8f4e8" : !disabled ? "#fffbee" : "#f0e8d4";
                  const bdr = isBlt ? "#5a8a5a" : avail ? BDR : "#d8c8a0";
                  let hint = "";
                  if      (isBlt)    hint = "Byggt/uppfunnet";
                  else if (!avail)   hint = `Kräver: ${tech.requires.join(", ")||"-"}`;
                  else if (!canAffd) hint = `Råvaror saknas: ${costLabel(tech, true, hasAmber, hasHide, hasMetal)}`;
                  else if (needVil)  hint = tech.knowledge ? "Ingen boplats krävs" : "Välj en boplats";
                  const loc = tech.coastal ? " - Kustboplats"
                    : tech.requiresRiverOrCoast ? " - Kust/åboplats"
                    : tech.requiresPalissad ? " - Kräver Palissad" : "";
                  return (
                    <button key={tech.id} onClick={() => !disabled && onBuild(tech.id)}
                      style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", marginBottom:7, background:bg, border:`1.5px solid ${bdr}`, color:fg, padding:"10px 12px", textAlign:"left", cursor:disabled?"default":"pointer", borderRadius:6, touchAction:"manipulation" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13 }}>{tech.icon} {tech.label}{tech.knowledge?" (Kunskap)":""}{isBlt?" v":""}</div>
                        <div style={{ fontSize:10, fontStyle:"italic", lineHeight:1.4, marginTop:2, color:isBlt?"#4a8a4a":avail?"#9a7840":"#b0986a" }}>
                          {hint || tech.desc}{loc}{tech.pop > 0 && !isBlt ? ` - +${tech.pop} folk` : ""}
                        </div>
                      </div>
                      {!isBlt && (
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:10, minWidth:50 }}>
                          <div style={{ fontSize:11, color:fg, lineHeight:1.4 }}>{costLabel(tech, true, hasAmber, hasHide, hasMetal)}</div>
                          <div style={{ fontSize:10, color:"#9a7840" }}>+{tech.pts}p</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function VictoryScreen({ type, playerName, turn, pts, onRestart }) {
  const fleet = type === "fleet";
  const icon  = fleet ? "🐉" : "⚔";
  const title = fleet ? "Vikingafärden börjar!" : "Österlen enat!";
  const year  = `ca ${8000 - turn * 20} f.Kr.`;

  const fleetEpilogue = [
    `Under din ledning byggde ${playerName}s stam tre majestätiska drakskepp vid Österlenens kust. När den sista plankan spikades och draghuvudena restes på stävarna visste alla att en ny era börjat.`,
    "Flottan gav sig av en tidig morgon när dimman låg tät över Hanöbukten. Kursen sattes västerut – mot Danmark, mot Frankerriket, mot det okända.",
    "Österlenens folk skulle inte glömmas. Deras ättlingar – vikingarna – kom att skriva historia i hela den kända världen. Men det började här, i de steniga vikarna och lövskogarnas skugga.",
  ];

  const conquestEpilogue = [
    `Under din ledning enade ${playerName}s stam hela Österlen under ett enda välde. De sista motståndarnas eldar slocknade, och fred rådde från Kiviksgravarnas stränder till de djupå skogarna i norr.`,
    "Folket samlade sig vid den stora hällristningsplatsen i Järrestad för att fira. Skalder berättade om striderna, om diplomatins konst, om de hårda vintrarna som övervunnits.",
    "Österlen var ett land nu – med ett folk, en tradition, ett minne som skulle leva vidare i tusen generationer.",
  ];

  const paras = fleet ? fleetEpilogue : conquestEpilogue;

  return (
    <div style={{ position:"fixed", inset:0, background:"linear-gradient(170deg,#0a0804,#1a1004)", zIndex:300, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:FONT, color:"#e8d5a0", padding:"28px 22px", boxSizing:"border-box", overflowY:"auto" }}>
      <div style={{ maxWidth:360, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:9, letterSpacing:5, color:"#6a5030", marginBottom:12 }}>-- SEGER --</div>
        <div style={{ fontSize:52, marginBottom:12 }}>{icon}</div>
        <div style={{ fontSize:22, fontWeight:"bold", color:"#d4a030", letterSpacing:2, marginBottom:6 }}>{title}</div>
        <div style={{ fontSize:10, color:"#8a7040", marginBottom:24 }}>{year} · Tur {turn} · {pts} poäng</div>
        <div style={{ background:"rgba(255,248,225,0.06)", border:"1px solid rgba(180,140,40,0.2)", borderRadius:8, padding:"18px 16px", marginBottom:28, textAlign:"left" }}>
          <div style={{ fontSize:9, letterSpacing:3, color:"#8a7040", marginBottom:12, textAlign:"center" }}>-- VAD HÄNDE SEN --</div>
          {paras.map((para, i) => (
            <div key={i} style={{ fontSize:12, color:"#c8b890", lineHeight:1.85, fontStyle:"italic", marginBottom:i < paras.length-1 ? 14 : 0 }}>
              {para}
            </div>
          ))}
        </div>
        <button onClick={onRestart} style={{ ...btnPrimary, padding:"14px 32px", fontSize:14, letterSpacing:1 }}>
          Spela igen
        </button>
      </div>
    </div>
  );
}


function TradeModal({ offer, players, currentPI, resources, onAccept, onDecline, onClose }) {
  const RES_LIST = [
    { key:"stone", icon:"⬡", label:"Sten" },
    { key:"amber", icon:"💛", label:"Barnsten" },
    { key:"hide",  icon:"🦌", label:"Hudar" },
    { key:"metal", icon:"⚙",  label:"Metall" },
  ];
  const [give, setGive] = useState({ stone:0, amber:0, hide:0, metal:0 });
  const [want, setWant] = useState({ stone:0, amber:0, hide:0, metal:0 });

  const isResponse = !!offer; // responding to incoming offer
  const hasHandelsgård = Object.values(resources.villages||{}).some(v =>
    (v.buildings||[]).some(b => b.id==="handelsgård")
  );

  if (!hasHandelsgård && !isResponse) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:180,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:PARCH, borderRadius:12, padding:"24px 20px", maxWidth:320,
        width:"100%", fontFamily:FONT, textAlign:"center", border:`2px solid ${BDR}` }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🤝</div>
        <div style={{ fontSize:15, fontWeight:"bold", color:INK, marginBottom:8 }}>Handel</div>
        <div style={{ fontSize:12, color:INK2, fontStyle:"italic", lineHeight:1.7, marginBottom:20 }}>
          Du behover en Handelsgård för att handla med andra stammar.
        </div>
        <button onClick={onClose} style={{ ...btnPrimary, padding:"11px 24px" }}>OK</button>
      </div>
    </div>
  );

  const activeGive = isResponse ? offer.want : give;
  const activeWant = isResponse ? offer.give : want;
  const fromName   = isResponse ? (players[offer.from]?.name || "Motståndaren") : (players[currentPI]?.name || "Du");
  const toName     = isResponse ? (players[currentPI]?.name || "Du") : (players[currentPI===0?1:0]?.name || "Motståndaren");

  function adj(obj, setObj, key, delta) {
    if (isResponse) return;
    setObj(prev => ({ ...prev, [key]: Math.max(0, Math.min(resources[key]||0, (prev[key]||0)+delta)) }));
  }

  const totalGive = Object.values(activeGive).reduce((s,v)=>s+v,0);
  const totalWant = Object.values(activeWant).reduce((s,v)=>s+v,0);
  const valid = totalGive > 0 || totalWant > 0;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:180,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:PARCH, borderRadius:"16px 16px 0 0", width:"100%", maxWidth:420,
        maxHeight:"85dvh", display:"flex", flexDirection:"column",
        border:`2px solid ${BDR}`, boxShadow:"0 -8px 40px rgba(0,0,0,0.5)", fontFamily:FONT }}>
        <div style={{ padding:"14px 18px 10px", borderBottom:`1px solid ${BDR}`, flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:"bold", color:INK }}>
            {isResponse ? "Handelserbjudande!" : "Handelsförslag"}
          </div>
          <div style={{ fontSize:10, color:INK2, marginTop:2, fontStyle:"italic" }}>
            {isResponse
              ? `${fromName} erbjuder ett byte`
              : `Skicka förslag till ${toName}`}
          </div>
        </div>
        <div style={{ overflowY:"auto", padding:"14px 18px 24px", flex:1 }}>
          {["give","want"].map(side => {
            const isGive = side==="give";
            const obj    = isGive ? activeGive : activeWant;
            const setObj = isGive ? setGive : setWant;
            const label  = isResponse
              ? (isGive ? `${fromName} ger dig:` : `${fromName} vill ha:`)
              : (isGive ? "Du erbjuder:" : "Du vill ha:");
            return (
              <div key={side} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, letterSpacing:2, color:"#8a7040", marginBottom:8 }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {RES_LIST.map(r => (
                    <div key={r.key} style={{ display:"flex", alignItems:"center", gap:10,
                      background:"#fff8e8", borderRadius:6, padding:"7px 10px",
                      border:`1px solid ${BDR}` }}>
                      <span style={{ fontSize:16, width:24 }}>{r.icon}</span>
                      <span style={{ flex:1, fontSize:12, color:INK2 }}>{r.label}</span>
                      {!isResponse && (
                        <button onClick={() => adj(obj,setObj,r.key,-1)}
                          style={{ width:26, height:26, background:"#e8d5a0", border:`1px solid ${BDR}`,
                            borderRadius:4, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>-</button>
                      )}
                      <span style={{ fontSize:14, fontWeight:"bold", color:INK, minWidth:20, textAlign:"center" }}>
                        {obj[r.key]||0}
                      </span>
                      {!isResponse && (
                        <button onClick={() => adj(obj,setObj,r.key,1)}
                          style={{ width:26, height:26, background:"#e8d5a0", border:`1px solid ${BDR}`,
                            borderRadius:4, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>+</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {isResponse ? (
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onDecline} style={{ flex:1, background:"#e8d5a0",
                border:`1px solid ${BDR}`, color:INK2, padding:"12px", borderRadius:6,
                cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Avvisa</button>
              <button onClick={() => onAccept(offer)} style={{ flex:2, ...btnPrimary, padding:"12px" }}>
                Acceptera 🤝
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"#e8d5a0",
                border:`1px solid ${BDR}`, color:INK2, padding:"12px", borderRadius:6,
                cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Avbryt</button>
              <button onClick={() => valid && onAccept({ from:currentPI, give, want })}
                style={{ flex:2, ...btnPrimary, padding:"12px", opacity:valid?1:0.5 }}>
                Skicka förslag 📨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function HandoverScreen({ player, turn, onContinue }) {
  return (
    <div style={{ height:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0a0704", fontFamily:FONT, color:"#e8d5a0", padding:"32px 24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>{player?.char?.icon}</div>
      <div style={{ fontSize:10, letterSpacing:4, color:"#6a5a30", marginBottom:8 }}>TUR {turn} -- LÄMNA ÖVER</div>
      <div style={{ fontSize:24, fontWeight:"bold", color:"#d4a030", marginBottom:4 }}>{player?.name}</div>
      <div style={{ fontSize:13, color:"#8a7040", fontStyle:"italic", marginBottom:32 }}>{player?.char?.title}</div>
      <div style={{ fontSize:12, color:"#6a5a30", marginBottom:40, lineHeight:1.8 }}>
        Ge telefonen till <b>{player?.name}</b>. Tryck när du är redo.
      </div>
      <button onClick={onContinue} style={{ ...btnPrimary, padding:"14px 32px", fontSize:14, letterSpacing:1 }}>
        JAG ÄR REDO
      </button>
    </div>
  );
}


export default function ÖsterlenCiv() {

  // -- Skärm ----------------------------------------------------
  const [screen,        setScreen]        = useState("start");
  const [players,       setPlayers]       = useState([]);
  const [aiPersonality, setAiPersonality] = useState(null);
  const [currentPI,     setCurrentPI]     = useState(0);  // aktiv spelare (0 eller 1)
  const [showHandover,  setShowHandover]  = useState(false);
  const [victory,       setVictory]       = useState(null); // 'fleet'|'conquest'

  // -- Kartstyrning ---------------------------------------------
  const [viewX,    setViewX]    = useState(0);
  const [viewY,    setViewY]    = useState(0);
  const [mapScale, setMapScale] = useState(2.8);
  const dragRef  = useRef(null);
  const pinchRef = useRef(null);
  const contRef  = useRef(null);
  const [contSize, setContSize] = useState({ w:400, h:600 });
  const [startPos,  setStartPos]  = useState({ x:118, y:286 }); // startby-koordinater

  // -- DELAD KARTA (bägge spelare ser samma byar) ----------------
  // villages: { slotId: { ...slot, ownerId:"p0"|"p1"|"ai", buildings, pop } }
  const [villages,    setVillages]    = useState({});

  // -- PER SPELARE (index 0 = p0, index 1 = p1) -----------------
  const [stones,      setStones]      = useState([20, 20]);
  const [ambers,      setAmbers]      = useState([0,  0 ]);
  const [hides,       setHides]       = useState([2,  2 ]);
  const [metals,      setMetals]      = useState([0,  0 ]);
  const [ptss,        setPtss]        = useState([0,  0 ]);
  const [turns,       setTurns]       = useState([1,  1 ]);
  const [logs,        setLogs]        = useState([[], []]);
  const [techss,      setTechss]      = useState([[], []]);
  const [revealeds,   setRevealeds]   = useState([[], []]);
  const [discovereds, setDiscovereds] = useState([[], []]);
  const [halfStone,   setHalfStone]   = useState(false);
  const [worldFact,   setWorldFact]   = useState(null);
  const [mines,       setMines]       = useState({});
  const [tradeOffer,  setTradeOffer]  = useState(null); // { from:pi, give:{}, want:{} }
  const [tradePending,setTradePending]= useState(null); // waiting for opponent response
  const [showTrade,   setShowTrade]   = useState(false);
  const [fimbulwinter,setFimbulwinter] = useState(0);
  const [p1AiAlliance,setP1AiAlliance] = useState(false); // p0 alliert med AI
  const [p2AiAlliance,setP2AiAlliance] = useState(false); // p1 alliert med AI    // 0=none, 1-3=year of fimbulwinter
  const [showSeason,  setShowSeason]   = useState(null); // season change notification // { mineId: "p0"|"p1"|"ai"|null }  // pending world fact modal
  const [shownFacts,  setShownFacts]  = useState([]);    // already shown fact ids

  // Shortcuts för aktiv spelare
  const pi  = currentPI;
  const pVillages   = Object.fromEntries(Object.entries(villages).filter(([,v])=>v.ownerId===`p${pi}`));
  const pStone      = stones[pi]      ?? 20;
  const pAmber      = ambers[pi]      ?? 0;
  const pHide       = hides[pi]       ?? 0;
  const pMetal      = metals[pi]      ?? 0;
  const pPts        = ptss[pi]        ?? 0;
  const pTurn       = turns[pi]       ?? 1;
  const pLog        = logs[pi]        ?? [];
  const pTechs      = techss[pi]      ?? [];
  const pRevealed   = revealeds[pi]   ?? [];
  const pDiscovered = discovereds[pi] ?? [];

  // Setters for active player
  const setPVillages   = fn => setVillages(prev => {
    const updated = typeof fn==="function" ? fn(prev) : fn;
    // Merge: keep opponent villages, replace own
    const merged = {...prev};
    // Remove old own villages
    Object.keys(merged).forEach(k => { if(merged[k].ownerId===`p${pi}`) delete merged[k]; });
    // Add new own villages
    Object.assign(merged, updated);
    return merged;
  });
  const mk = (setter, i, def) => valOrFn => setter(a => {
    const n=[...a]; n[i] = typeof valOrFn==="function" ? valOrFn(n[i]??def) : valOrFn; return n;
  });
  const setPStone      = mk(setStones,      pi, 20);
  const setPAmber      = mk(setAmbers,      pi, 0);
  const setPHide       = mk(setHides,       pi, 0);
  const setPMetal      = mk(setMetals,      pi, 0);
  const setPPts        = mk(setPtss,        pi, 0);
  const setPTurn       = mk(setTurns,       pi, 1);
  const setPLog        = mk(setLogs,        pi, []);
  const setPTechs      = mk(setTechss,      pi, []);
  const setPRevealed   = mk(setRevealeds,   pi, []);
  const setPDiscovered = mk(setDiscovereds, pi, []);

  // -- AI-tillstånd ---------------------------------------------
  const [aiStone,    setAiStone]    = useState(10);
  const [aiPts,      setAiPts]      = useState(0);
  const [aiTechs,    setAiTechs]    = useState([]);
  const [aiKnown,    setAiKnown]    = useState(false);

  // -- UI-modaler -----------------------------------------------
  const [selected,       setSelected]       = useState(null);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [showTechTree,   setShowTechTree]   = useState(false);
  const [pendingEvent,   setPendingEvent]   = useState(null);
  const [discoveryQueue, setDiscoveryQueue] = useState([]);
  const [attackTarget,   setAttackTarget]   = useState(null);
  const [moveSource,     setMoveSource]     = useState(null);
  const [showAiTurn,     setShowAiTurn]     = useState(null);
  const [toast,          setToast]          = useState(null);
  const toastRef = useRef(null);

  // -- Beräknade värden -----------------------------------------
  const curP     = players[currentPI] || players[0];
  const eraIdx   = getEra(pPts);
  const eraInfo  = ERAS[eraIdx];
  const pct      = eraPct(pPts);
  const isAiGame = !!aiPersonality;
  const totalW   = Object.values(pVillages).reduce((s,v) => s+(v.buildings||[]).filter(b=>b.id==="krigare").length, 0);
  const maxPop   = Math.max(0, ...Object.values(pVillages).map(v => v.pop||0));
  const hasCoastVillage  = Object.keys(pVillages).some(id => COAST_IDS.has(id));
  const hasForestVillage = Object.keys(pVillages).some(id => FOREST_IDS.has(id));
  const hasHarborBuilt   = Object.values(pVillages).some(v => (v.buildings||[]).some(b => b.id==="hamnplats"));
  const controlsMine     = MINE_SLOTS.some(m => mines[m.id] === `p${pi}`);

  // -- Kartinitiering -------------------------------------------
  useEffect(() => {
    if (screen !== "game") return;
    const measure = () => {
      if (!contRef.current) return;
      const r = contRef.current.getBoundingClientRect();
      setContSize({ w:r.width, h:r.height });
      // Centrera på spelarens startby
      const s = mapScale || 2.8;
      const cx = startPos.x * s;
      const cy = startPos.y * s;
      setViewX(clampVal(r.width/2-cx,  Math.min(0, r.width-MAP_W*s),  0));
      setViewY(clampVal(r.height/2-cy, Math.min(0, r.height-MAP_H*s), 0));
    };
    setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [screen, startPos]);

  // Recenter camera when startPos changes (player swap)
  useEffect(() => {
    if (screen !== "game") return;
    if (!contRef.current) return;
    const r = contRef.current.getBoundingClientRect();
    const s = mapScale || 2.8;
    const cx = startPos.x * s;
    const cy = startPos.y * s;
    setViewX(clampVal(r.width/2-cx,  Math.min(0, r.width-MAP_W*s),  0));
    setViewY(clampVal(r.height/2-cy, Math.min(0, r.height-MAP_H*s), 0));
  }, [startPos]);

  // -- Hjälpfunktioner ------------------------------------------
  function clampVal(v, min, max) { return Math.max(min, Math.min(max, v)); }

  const showToast = msg => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  };
  const addLog = msg => { setPLog(p => [msg, ...p].slice(0, 14)); showToast(msg); };

  function isRev(x, y) { return pRevealed.some(c => dist(x, y, c.x, c.y) <= c.r); }

  function buildCostDisc(techId) {
    // Bara för AI-kompatibilitet
    const t = getTech(techId);
    return (curP?.char?.buildDiscount||[]).includes(techId)
      ? Math.max(1, (t?.cost?.stone||t?.baseCost||2) - 1)
      : (t?.cost?.stone || t?.baseCost || 2);
  }

  // -- Dimma/avslöjande -----------------------------------------
  function revealAround(cx, cy, r) {
    setPRevealed(prev => {
      const all = [...prev, { x:cx, y:cy, r }];

      // Historiska platser
      const found = HISTORIC_SITES.filter(hs => {
        if (pDiscovered.includes(hs.id))             return false;
        if (discoveryQueue.some(q => q.id===hs.id))  return false;
        return all.some(c => dist(hs.x, hs.y, c.x, c.y) <= c.r);
      });
      if (found.length) {
        setDiscoveryQueue(q => [...q, ...found]);
        setPDiscovered(pd => [...pd, ...found.map(s => s.id)]);
      }

      // Fiendeboplatser i närheten?
      if (!aiKnown && isAiGame) {
        const aiFound = Object.values(villages).some(v =>
          v.ownerId==="ai" && all.some(c => dist(v.x,v.y,c.x,c.y)<=c.r+80)
        );
        if (aiFound) { setAiKnown(true); addLog("🔍 Din scout har hittat fiendens boplats!"); }
      }
      // 2p – opponent village discovery (always known in 2p)
      return all;
    });
  }

  // -- Spelstart ------------------------------------------------
  function startGame(pls, aiP) {
    setPlayers(pls); setAiPersonality(aiP || null); setCurrentPI(0);

    // Välj startbyar baserat på karaktär
    function pickForChar(ch, exclude) {
      const coastIds  = ["v1","v5","v10","v13","v14","v15"];
      const inlandIds = START_VILLAGES;
      const pool = ch?.startRegion==="coast"  ? coastIds.filter(id=>id!==exclude)
                 : ch?.startRegion==="inland" ? inlandIds.filter(id=>id!==exclude)
                 : START_VILLAGES.filter(id=>id!==exclude);
      return pool[Math.floor(Math.random()*pool.length)] || pickStartVillage(exclude);
    }
    const sv0   = pickForChar(pls[0]?.char, null);
    const sv1   = pls[1] ? pickForChar(pls[1].char, sv0) : pickStartVillage(sv0);
    const slot0 = VILLAGE_SLOTS.find(s => s.id===sv0);
    const slot1 = VILLAGE_SLOTS.find(s => s.id===sv1);

    // Bygg delad karta med ownerId
    const initVillages = {};
    if (slot0) initVillages[sv0] = { ...slot0, ownerId:"p0", buildings:[], pop:5 };
    if (slot1 && pls[1]) initVillages[sv1] = { ...slot1, ownerId:"p1", buildings:[], pop:5 };
    if (aiP) {
      const aiSlot = VILLAGE_SLOTS.find(s => s.id==="ai1");
      if (aiSlot) initVillages["ai1"] = { ...aiSlot, ownerId:"ai", buildings:[], pop:5 };
    }
    setVillages(initVillages);

    // Per-spelare startvärden
    setStones([20, 20]);
    setAmbers([0,  0]);
    setHides( [2,  2]);
    setMetals([0,  0]);
    setPtss(  [2,  2]);
    setTurns( [1,  1]);
    setLogs([
      [slot0 ? `${pls[0].name} börjar vid ${slot0.name}. Vinter råder.` : "Vinter råder."],
      [slot1 && pls[1] ? `${pls[1].name} börjar vid ${slot1.name}. Vinter råder.` : ""],
    ]);
    setTechss([[], []]);
    setRevealeds([
      slot0 ? [{x:slot0.x, y:slot0.y, r:40}] : [],
      slot1 ? [{x:slot1.x, y:slot1.y, r:40}] : [],
    ]);
    setDiscovereds([[], []]);

    if (aiP) { setAiStone(10); setAiPts(0); setAiTechs([]); }
    // Spara startposition för kameracentrering
    if (slot0) setStartPos({ x:slot0.x, y:slot0.y });
    // Init mines
    const initMines = {};
    MINE_SLOTS.forEach(m => { initMines[m.id] = null; });
    setMines(initMines);
    setScreen("game");
  }

  // -- Bygga ----------------------------------------------------
  function buildInVillage(techId) {
    const tech    = getTech(techId); if (!tech) return;
    const isDisc  = (curP?.char?.buildDiscount||[]).includes(techId);
    if (!canAffordTech(tech, pStone, pAmber, pHide, pMetal, isDisc)) {
      addLog(`Råvaror saknas – behöver: ${costLabel(tech)}`); return;
    }
    if (!isAvailable(techId, pVillages, pTechs, selected)) {
      addLog("Krav ej uppfyllda eller fel typ av boplats."); return;
    }

    // Kunskap – global, ingen boplats krävs
    if (tech.knowledge) {
      if (pTechs.includes(techId)) { addLog(`${tech.label} är redan känt.`); return; }
      setPTechs(p => [...p, techId]);
      payCost(tech, isDisc, setPStone, setPAmber, setPHide, setPMetal);
      setPPts(p => p + tech.pts);
      addLog(`🔬 ${tech.label} uppfunnet! +${tech.pts}p`);
      return;
    }

    // Scout – utforskar kring boplats
    if (techId === "scout") {
      const v = villages[selected];
      if (!v) { addLog("Välj en boplats."); return; }
      payCost(tech, isDisc, setPStone, setPAmber, setPHide, setPMetal);
      setPPts(p => p + tech.pts);
      addLog(`🧭 Scout skickad från ${v.name}! Dimman lättar...`);
      // Gradual reveal: scout walks in 4 random directions
      const dirs = [
        {dx: 1,  dy: 0}, {dx:-1, dy: 0},
        {dx: 0,  dy: 1}, {dx: 0, dy:-1},
        {dx: 0.7,dy:0.7},{dx:-0.7,dy:0.7},
      ];
      const chosen = dirs.sort(()=>Math.random()-0.5).slice(0,3);
      revealAround(v.x, v.y, 45);
      chosen.forEach((dir, i) => {
        setTimeout(() => {
          const dist = 40 + Math.random()*30;
          const nx = Math.max(10, Math.min(MAP_W-10, v.x + dir.dx * dist));
          const ny = Math.max(10, Math.min(MAP_H-10, v.y + dir.dy * dist));
          revealAround(nx, ny, 35);
          // Second step further out
          setTimeout(() => {
            const nx2 = Math.max(10, Math.min(MAP_W-10, v.x + dir.dx * dist * 1.9));
            const ny2 = Math.max(10, Math.min(MAP_H-10, v.y + dir.dy * dist * 1.9));
            revealAround(nx2, ny2, 30);
          }, 400);
        }, i * 300);
      });
      return;
    }

    // Byggnad – placeras i vald boplats
    const v = villages[selected];
    if (!v) { addLog("Välj en boplats på kartan."); return; }
    const cnt = (v.buildings||[]).filter(b => b.id===techId).length;
    if (cnt >= (tech.max||99)) { addLog(`Max ${tech.max} ${tech.label} per boplats.`); return; }

    const nb = [...(v.buildings||[]), { id:techId, label:tech.label, icon:tech.icon }];
    const np = Math.min(30, (v.pop||0) + (tech.pop||0));
    setVillages(prev => ({ ...prev, [selected]: { ...v, buildings:nb, pop:np } }));
    payCost(tech, isDisc, setPStone, setPAmber, setPHide, setPMetal);
    setPPts(p => p + tech.pts);
    addLog(`${tech.icon} ${tech.label} byggt i ${v.name}!${tech.pop>0?` +${tech.pop} folk`:""}`)
    // Vinstkontroll
    if (techId === "drakskepp") {
      const totalDrak = Object.values(villages).filter(v=>v.ownerId===`p${currentPI}`)
        .reduce((s,v)=>s+(v.buildings||[]).filter(b=>b.id==="drakskepp").length, 0) + 1;
      if (totalDrak >= 3) { setTimeout(()=>setVictory("fleet"), 600); return; }
    };
    if (np >= 10) revealAround(v.x, v.y, 25);
  }

  // -- Tap boplats på karta -------------------------------------
  function tapSlot(slot) {
    const v = villages[slot.id];

    // Motspelares by – anfall
    if (v && v.ownerId !== `p${pi}`) {
      if (v.ownerId === "ai" && !aiKnown) { addLog("Okänd boplats – utforska mer."); return; }
      setAttackTarget(v); return;
    }

    // Ej avslöjad
    if (!isRev(slot.x, slot.y)) { addLog("Fortfarande täckt av is!"); return; }

    // Egen by – välj och öppna sheet
    if (v?.ownerId === `p${pi}`) {
      setSelected(slot.id); setSheetOpen(true); return;
    }

    // Tom slot – grunda ny boplats
    const hasHovding = getBuiltSet(pVillages, pTechs).has("hovdingskap");
    const isFirst    = Object.keys(pVillages).length === 0;
    if (!isFirst && !hasHovding) { addLog("Hövdingskap krävs för att anlägga fler boplatser."); return; }
    if (pStone < 1) { addLog("Behöver 1 sten."); return; }

    setVillages(prev => ({ ...prev, [slot.id]: { ...slot, ownerId:`p${pi}`, buildings:[], pop:3 } }));
    setPStone(s => s - 1); setPPts(p => p + 2);
    addLog(`Boplats grundad vid ${slot.name}!`);
    revealAround(slot.x, slot.y, 40);
    setSelected(slot.id); setSheetOpen(true);
  }

  // -- Strid ----------------------------------------------------
  // ── Handel ──────────────────────────────────────────────────
  function sendTradeOffer(offer) {
    // 2p: save pending offer for opponent
    if (!isAiGame) {
      setTradePending(offer);
      addLog(`📨 Handelserbjudande skickat till ${players[currentPI===0?1:0]?.name}!`);
      setShowTrade(false);
    } else {
      // vs AI: auto-respond based on personality
      const aiWants = offer.want; // what player wants = what AI gives
      const aiGets  = offer.give; // what player gives = what AI gets
      const totalAiGive = Object.values(aiWants).reduce((s,v)=>s+v,0);
      const totalAiGet  = Object.values(aiGets).reduce((s,v)=>s+v,0);
      // AI accepts if it gets at least as much as it gives, or if passive
      const accept = aiPersonality==="passive"
        ? totalAiGet >= totalAiGive - 1
        : totalAiGet >= totalAiGive;
      if (accept) {
        // Execute trade
        setPStone(s => s - (offer.give.stone||0) + (offer.want.stone||0));
        setPAmber(a => a - (offer.give.amber||0) + (offer.want.amber||0));
        setPHide(h  => h - (offer.give.hide||0)  + (offer.want.hide||0));
        setPMetal(m => m - (offer.give.metal||0) + (offer.want.metal||0));
        addLog(`🤝 ${aiPersonality==="passive"?"Skateholmsfolket":"Stridsyxefolket"} accepterade handeln!`);
      } else {
        addLog(`❌ ${aiPersonality==="passive"?"Skateholmsfolket":"Stridsyxefolket"} avvisade handeln.`);
      }
      setShowTrade(false);
    }
  }

  function acceptTradeOffer(offer) {
    // Execute the trade - give what opponent wants, get what opponent gives
    setPStone(s => s - (offer.want.stone||0) + (offer.give.stone||0));
    setPAmber(a => a - (offer.want.amber||0) + (offer.give.amber||0));
    setPHide(h  => h - (offer.want.hide||0)  + (offer.give.hide||0));
    setPMetal(m => m - (offer.want.metal||0) + (offer.give.metal||0));
    setTradePending(null);
    addLog(`🤝 Handel genomförd!`);
    setShowTrade(false);
  }

  function declineTradeOffer() {
    setTradePending(null);
    addLog(`❌ Du avvisade handelserbjudandet.`);
    setShowTrade(false);
  }

  function tapMine(mine) {
    const owner = mines[mine.id];
    // Check if player has warriors in any village
    const hasWarriors = Object.values(pVillages).some(v => (v.buildings||[]).some(b => b.id==="krigare"));
    const hasPalissad = pTechs.includes("flintaspets") || Object.values(pVillages).some(v => (v.buildings||[]).some(b => b.id==="palissad"));

    if (owner === `p${pi}`) {
      addLog(`⚙ ${mine.name} – du kontrollerar denna gruva. +1 metall/tur.`);
      return;
    }
    if (!hasWarriors) {
      addLog(`⚙ ${mine.name} – behöver krigare för att ockupera.`);
      return;
    }
    if (owner === null) {
      // Occupy neutral mine
      setMines(prev => ({ ...prev, [mine.id]: `p${pi}` }));
      setPMetal(m => m + 1);
      addLog(`⚙ ${mine.name} ockuperad! +1 metall/tur så länge du håller den.`);
    } else {
      // Attack opponent's mine
      const won = Math.random() < 0.6; // 60% win chance with warriors
      if (won) {
        setMines(prev => ({ ...prev, [mine.id]: `p${pi}` }));
        addLog(`⚔ ${mine.name} erövrad! +1 metall/tur.`);
      } else {
        addLog(`⚔ Anfall mot ${mine.name} slogs tillbaka!`);
      }
    }
  }

  function doAttack(wCount) {
    const target = attackTarget; setAttackTarget(null);
    const flinta = pTechs.includes("flintaspets") || pTechs.includes("bronsvapen");
    const bonus  = pTechs.includes("bronsvapen") ? 6 : 4;
    const atk    = wCount * (flinta ? bonus : 3);
    const def    = defenseScore(target, target.ownerId==="ai" ? null : techss[target.ownerId==="p0"?0:1]);

    // Remove warriors from attacker
    let rem = wCount;
    setVillages(prev => {
      const next = { ...prev };
      Object.keys(next).filter(id => next[id].ownerId===`p${pi}`).forEach(id => {
        if (!rem) return;
        const v  = next[id];
        const nb = (v.buildings||[]).filter(b => {
          if (b.id==="krigare" && rem>0) { rem--; return false; } return true;
        });
        next[id] = { ...v, buildings:nb };
      });

      if (atk > def) {
        // Victory: remove target village from map
        delete next[target.id];
        if (target.ownerId==="ai") setAiPts(p => Math.max(0, p-12));
        else {
          // P2P: opponent loses village
          const oppPts = ptss[target.ownerId==="p0"?0:1];
          setPtss(ps => { const n=[...ps]; n[target.ownerId==="p0"?0:1]=Math.max(0,n[target.ownerId==="p0"?0:1]-10); return n; });
        }
        addLog(`⚔ SEGER! ${target.name} erövrat!`);
      } else {
        const diff = def - atk;
        const big  = Object.values(next).filter(v=>v.ownerId===`p${pi}`)
                       .sort((a,b)=>(b.pop||0)-(a.pop||0))[0];
        if (big) next[big.id] = { ...big, pop:Math.max(0,(big.pop||0)-diff) };
        addLog(`⚔ FÖRLUST! ${target.name} höll stånd. –${diff} folk.`);
      }
      return next;
    });
  }

  // -- Flytta krigare -------------------------------------------
  function doMove(count, targetId) {
    const src = villages[moveSource]; if (!src) return;
    setMoveSource(null);
    let rem = count;
    setVillages(prev => {
      const next = { ...prev };
      const srcB = (src.buildings||[]).filter(b => {
        if (b.id==="krigare" && rem>0) { rem--; return false; } return true;
      });
      next[moveSource] = { ...src, buildings:srcB };
      const tgt  = next[targetId];
      const tgtB = [...(tgt.buildings||[]), ...Array(count).fill(null).map(()=>({id:"krigare",label:"Krigare",icon:"⚔"}))];
      next[targetId] = { ...tgt, buildings:tgtB };
      return next;
    });
    addLog(`⚔ ${count} krigare förflyttade till ${villages[targetId]?.name||targetId}.`);
  }

  // -- Byt spelare (Pass & Play) ------------------------------
  function swapPlayers(newTurn) {
    // Center camera on incoming player's start village
    const nextPI = currentPI === 0 ? 1 : 0;
    const nextVil = Object.values(villages).find(v => v.ownerId===`p${nextPI}`);
    if (nextVil) setStartPos({ x:nextVil.x, y:nextVil.y });
    if (newTurn) setTurns(t => { const n=[...t]; n[pi]=newTurn; return n; });
    setCurrentPI(currentPI === 0 ? 1 : 0);
    setSelected(null); setSheetOpen(false);
    setShowHandover(true);
  }

  // -- Slut på tur ----------------------------------------------
  function endTurn() {
    const inc    = resourceIncome(pVillages, pTechs, curP?.char?.extraStonePerTurn||0);
    // Mine income
    MINE_SLOTS.forEach(m => { if (mines[m.id] === `p${pi}`) inc.metal += 1; });

    // Season effects
    const season   = getSeason(pTurn);
    const isFimbul = fimbulwinter > 0;
    const isWinter = season.id === "winter" || isFimbul;
    const stonemod = isFimbul ? 0.5 : season.stonemod;
    inc.stone = Math.max(1, Math.round(inc.stone * stonemod));
    if (season.id === "summer" && !isFimbul) { inc.amber += 1; inc.hide += 1; }
    if (isWinter) {
      // Svältrisk om hög befolkning
      Object.values(pVillages).forEach(v => {
        if ((v.pop||0) > 15) {
          const loss = isFimbul ? 3 : 1;
          setVillages(prev => ({
            ...prev,
            [v.id]: { ...prev[v.id], pop: Math.max(1, (prev[v.id]?.pop||0) - loss) }
          }));
        }
      });
    }

    // Fimbulvinter progress
    if (isFimbul) {
      if (fimbulwinter >= 3) setFimbulwinter(0);
      else setFimbulwinter(f => f + 1);
    } else if (pTurn >= 30 && season.id === "winter" && Math.random() < 0.08) {
      setFimbulwinter(1);
      setTimeout(() => setShowSeason({ fimbul: true }), 300);
    }

    // Season change notification
    const nextSeason = getSeason(pTurn + 1);
    if (nextSeason.id !== season.id) {
      setTimeout(() => setShowSeason({ season: nextSeason }), 200);
    }

    const gained = halfStone ? Math.floor(inc.stone/2) : inc.stone;
    setHalfStone(false);
    setPStone(s => s + gained);
    if (inc.amber > 0) setPAmber(a => a + inc.amber);
    if (inc.hide  > 0) setPHide(h  => h + inc.hide);
    if (inc.metal > 0) setPMetal(m => m + inc.metal);
    setPTurn(t => t + 1);

    const tradePts = tradePointsBonus(pVillages);
    if (tradePts > 0) setPPts(p => p + tradePts);

    // Logg
    const parts = [`+${gained}${RES.stone}`];
    if (inc.amber > 0)  parts.push(`+${inc.amber}${RES.amber}`);
    if (inc.hide  > 0)  parts.push(`+${inc.hide}${RES.hide}`);
    if (inc.metal > 0)  parts.push(`+${inc.metal}${RES.metal}`);
    if (tradePts  > 0)  parts.push(`+${tradePts}★`);
    addLog(`Tur ${pTurn+1}: ${parts.join(" ")}.`);

    // Befolkningstillväxt
    const hasCeramics = pTechs.includes("keramik");
    const limit       = hasCeramics ? 25 : 20;
    // Update population for own villages in shared map
    setVillages(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].ownerId !== `p${pi}`) return;
        const v      = next[id];
        const growth = (v.buildings||[]).filter(b => ["hallristning","stendos","skeppssattning"].includes(b.id)).length;
        const hasLager = (v.buildings||[]).some(b => b.id==="lagerhus");
        let np = (v.pop||0) + growth;
        if (np > limit && !hasLager) np -= 3;
        if (np > 28) np -= 5;
        next[id] = { ...v, pop:Math.max(0, np) };
        if (np >= 10) revealAround(v.x, v.y, 25);
      });
      return next;
    });

    // AI-tur
    if (isAiGame) {
      const aiVils = Object.fromEntries(Object.entries(villages).filter(([,v])=>v.ownerId==="ai"));
      const res = aiTakeTurn({ villages:aiVils, stone:aiStone, pts:aiPts, techs:aiTechs, turn:pTurn }, aiPersonality);
      // Merge AI result back into shared map
      setVillages(prev => {
        const next = {...prev};
        // Remove old AI villages, add new
        Object.keys(next).forEach(k=>{ if(next[k].ownerId==="ai") delete next[k]; });
        Object.entries(res.villages).forEach(([k,v])=>{ next[k]={...v,ownerId:"ai"}; });
        return next;
      });
      setAiStone(res.stone); setAiPts(res.pts); setAiTechs(res.techs);
      if (res.log.length) setShowAiTurn({ log:res.log });
      // AI tries to take unoccupied mines occasionally
      if (aiPersonality === "aggressive" && pTurn % 4 === 0) {
        const freeMine = MINE_SLOTS.find(m => !mines[m.id]);
        if (freeMine) {
          setMines(prev => ({ ...prev, [freeMine.id]: "ai" }));
        }
      } else if (aiPersonality === "balanced" && pTurn % 6 === 0) {
        const freeMine = MINE_SLOTS.find(m => !mines[m.id]);
        if (freeMine) setMines(prev => ({ ...prev, [freeMine.id]: "ai" }));
      }

      // Aggressiv AI anfaller periodiskt
      if (aiPersonality==="aggressive" && pTurn%5===0) {
        const myVils = Object.values(villages).filter(v=>v.ownerId===`p${pi}`);
        if (!myVils.length) return;
        const weak  = myVils.sort((a,b) => (a.pop||0)-(b.pop||0))[0];
        const aiStr = Object.values(res.villages).reduce((s,v) => s+defenseScore(v,res.techs), 0);
        if (aiStr > defenseScore(weak, pTechs) + 3) {
          const dmg = Math.min(6, Math.floor((aiStr - defenseScore(weak,pTechs)) / 2));
          setVillages(pv => ({ ...pv, [weak.id]:{ ...weak, pop:Math.max(0,(weak.pop||0)-dmg) } }));
          addLog(`⚔ Fienden anfaller ${weak.name}! –${dmg} befolkning.`);
        }
      }
    }

    // Ny era? Visa historisk faktaruta
    const newEraIdx = getEra(pPts + (tradePts||0));
    if (newEraIdx > getEra(pPts - (tradePts||0))) {
      const eraFacts = WORLD_FACTS.filter(f => f.era === newEraIdx && !shownFacts.includes(f.title));
      if (eraFacts.length) {
        const fact = eraFacts[Math.floor(Math.random()*eraFacts.length)];
        setTimeout(() => setWorldFact(fact), 600);
        setShownFacts(sf => [...sf, fact.title]);
      }
    } else {
      // Visa slumpmässig fakta var 10:e tur
      if (pTurn % 10 === 0) {
        const avail = WORLD_FACTS.filter(f => f.era <= eraIdx && !shownFacts.includes(f.title));
        if (avail.length) {
          const fact = avail[Math.floor(Math.random()*avail.length)];
          setTimeout(() => setWorldFact(fact), 400);
          setShownFacts(sf => [...sf, fact.title]);
        }
      }
    }

    // Erövringsseger: alla fiendebyar borta + 5+ egna byar
    if (isAiGame && Object.values(villages).filter(v=>v.ownerId==="ai").length === 0
        && Object.values(villages).filter(v=>v.ownerId===`p${currentPI}`).length >= 5) {
      setTimeout(()=>setVictory("conquest"), 600);
      return;
    }
    // 2p conquest
    if (!isAiGame && players.length>1) {
      const oppId = `p${currentPI===0?1:0}`;
      if (Object.values(villages).filter(v=>v.ownerId===oppId).length === 0) {
        setTimeout(()=>setVictory("conquest"), 600);
        return;
      }
    }

    const ev = rollEvent(pTurn + 1);
    // Only show event if no season notification pending
    if (ev && !showSeason) { setTimeout(() => setPendingEvent(ev), 400); return; }
    if (ev && showSeason)  { setTimeout(() => setPendingEvent(ev), 1200); return; }

    // Pass & Play – byt spelare
    if (players.length > 1 && !aiPersonality) swapPlayers(pTurn + 1);
  }

  function resolveEvent(r) {
    setPendingEvent(null);
    if (r.stoneDelta > 0)  setPStone(s => s + r.stoneDelta);
    if (r.amberDelta > 0)  setPAmber(a => a + r.amberDelta);
    if (r.hideDelta  > 0)  setPHide(h  => h + r.hideDelta);
    if (r.ptsDelta)        setPPts(p => p + r.ptsDelta);
    if (r.halfStone)       setHalfStone(true);
    if (Object.keys(r.villageUpdates||{}).length) setPVillages(p => ({ ...p, ...r.villageUpdates }));
    addLog(r.msg);
    // Pass & Play – byt spelare efter händelse
    if (players.length > 1 && !aiPersonality) swapPlayers(pTurn);
  }

  // -- Pan & zoom -----------------------------------------------
  const MIN_S=1.0, MAX_S=5.0;
  function clamp(x, y, s, cw, ch) {
    return { x:clampVal(x, Math.min(0,cw-MAP_W*s), 0), y:clampVal(y, Math.min(0,ch-MAP_H*s), 0) };
  }
  function onTouchStart(e) {
    if (e.touches.length===1) { dragRef.current={sx:e.touches[0].clientX-viewX,sy:e.touches[0].clientY-viewY}; pinchRef.current=null; }
    else if (e.touches.length===2) {
      const dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY;
      pinchRef.current={dist:Math.sqrt(dx*dx+dy*dy),scale:mapScale,viewX,viewY,cx:(e.touches[0].clientX+e.touches[1].clientX)/2,cy:(e.touches[0].clientY+e.touches[1].clientY)/2};
      dragRef.current=null;
    }
  }
  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length===1 && dragRef.current) {
      const c=clamp(e.touches[0].clientX-dragRef.current.sx,e.touches[0].clientY-dragRef.current.sy,mapScale,contSize.w,contSize.h);
      setViewX(c.x); setViewY(c.y);
    } else if (e.touches.length===2 && pinchRef.current) {
      const dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY;
      const d=Math.sqrt(dx*dx+dy*dy);
      const ns=clampVal(pinchRef.current.scale*(d/pinchRef.current.dist),MIN_S,MAX_S);
      const {cx,cy}=pinchRef.current;
      const c=clamp(cx-(cx-pinchRef.current.viewX)*(ns/pinchRef.current.scale),cy-(cy-pinchRef.current.viewY)*(ns/pinchRef.current.scale),ns,contSize.w,contSize.h);
      setMapScale(ns); setViewX(c.x); setViewY(c.y);
    }
  }
  function onTouchEnd() { dragRef.current=null; }
  function onMouseDown(e) { dragRef.current={sx:e.clientX-viewX,sy:e.clientY-viewY}; }
  function onMouseMove(e) { if(!dragRef.current)return; const c=clamp(e.clientX-dragRef.current.sx,e.clientY-dragRef.current.sy,mapScale,contSize.w,contSize.h); setViewX(c.x); setViewY(c.y); }
  function onMouseUp()    { dragRef.current=null; }
  function onWheel(e)     { e.preventDefault(); const ns=clampVal(mapScale*(e.deltaY<0?1.12:0.9),MIN_S,MAX_S); const c=clamp(viewX-e.offsetX*(ns-mapScale),viewY-e.offsetY*(ns-mapScale),ns,contSize.w,contSize.h); setMapScale(ns); setViewX(c.x); setViewY(c.y); }
  function zoomBtn(d)     { const ns=clampVal(mapScale*(d>0?1.25:0.8),MIN_S,MAX_S); const c=clamp(viewX+(contSize.w/2)*(mapScale-ns),viewY+(contSize.h/2)*(mapScale-ns),ns,contSize.w,contSize.h); setMapScale(ns); setViewX(c.x); setViewY(c.y); }

  // -- Skärmar --------------------------------------------------
  if (screen==="start") return <StartScreen onStart={(pls,aiP) => { setPlayers(pls); setAiPersonality(aiP||null); setScreen("lore"); }}/>;
  if (screen==="lore")  return <LoreScreen character={players[0]?.char||CHARACTERS[0]} onDone={() => startGame(players, aiPersonality)}/>;
  if (victory) return <VictoryScreen type={victory} playerName={curP?.name||"Din stam"} turn={pTurn} pts={pPts} onRestart={() => { setVictory(null); setScreen("start"); }}/>;
  if (showHandover && players.length>1) return <HandoverScreen player={players[currentPI]} turn={pTurn} onContinue={()=>setShowHandover(false)}/>;

  const selV = selected ? villages[selected] : null;

  // SVG-filter (deklareras en gång)
  const svgFilters = (
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="lbl"><feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#fff8e0" floodOpacity="0.95"/></filter>
      <filter id="mrkr"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#3a200840" floodOpacity="0.35"/></filter>
    </defs>
  );

  return (
    <div style={{ fontFamily:FONT,
      background:"#ede0b8", height:"100dvh", display:"flex", flexDirection:"column",
      color:INK, userSelect:"none", overflow:"hidden", position:"relative" }}>

      {/* -- TOPBAR -- */}
      <div style={{ background:PARCH, borderBottom:`2px solid ${BDR}`, padding:"6px 8px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexShrink:0, zIndex:10, boxShadow:`0 2px 8px ${SHDW}`, gap:4, overflow:"hidden" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:"bold", letterSpacing:2, color:INK, lineHeight:1.1 }}>ÖSTERLEN</div>
          <div style={{ fontSize:8, fontStyle:"italic", color:curP?.char?.color }}>{curP?.char?.icon} {curP?.name}</div>
        </div>
        <div style={{ display:"flex", gap:5, alignItems:"center", overflowX:"auto", maxWidth:"55vw", flexShrink:1 }}>
          {[
            [RES.stone, pStone, "STEN",   INK2,      true],
            [RES.amber, pAmber, "BÄRNST", "#a07010",  hasCoastVillage],
            [RES.hide,  pHide,  "HUDAR",  "#6a4a20",  hasForestVillage],
            [RES.metal, pMetal, "METALL", "#4a6a8a",  hasHarborBuilt || controlsMine || pMetal>0],
            ["★",       pPts,   "POÄNG",  INK2,       true],
            ["⏳",       pTurn,  "TUR",    INK2,       true],
          ].filter(([,,,,show]) => show).map(([icon,val,lbl,col]) => (
            <div key={lbl} style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:col, fontWeight:"bold" }}>{icon}{val}</div>
              <div style={{ fontSize:7, color:"#a08040", letterSpacing:0.5 }}>{lbl}</div>
            </div>
          ))}
          {controlsMine && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#4a8a6a", fontWeight:"bold" }}>⚙{MINE_SLOTS.filter(m=>mines[m.id]===`p${pi}`).length}</div>
              <div style={{ fontSize:7, color:"#a08040" }}>GRUVOR</div>
            </div>
          )}
          {totalW > 0 && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#8a2010", fontWeight:"bold" }}>⚔{totalW}</div>
              <div style={{ fontSize:7, color:"#a08040" }}>KRIGARE</div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <button onClick={() => setShowTechTree(true)} title="Utvecklingsträd"
            style={{ background:"#e8d5a0", border:`1px solid ${BDR}`, color:INK,
              padding:"6px 8px", cursor:"pointer", fontSize:12,
              fontFamily:"inherit", borderRadius:3, touchAction:"manipulation" }}>🌳</button>
          <button onClick={endTurn}
            style={{ ...btnPrimary, padding:"6px 8px", fontSize:10, letterSpacing:1, flexShrink:0 }}>TUR→</button>
        </div>
      </div>

      {/* -- ERA-STAPEL + SASONG -- */}
      <div style={{ height:4, background:"#ddd0a0", flexShrink:0 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,#c87010,${GOLD2})`, transition:"width 0.4s" }}/>
      </div>
      {(() => {
        const season = getSeason(pTurn);
        const isFimbul = fimbulwinter > 0;
        const bg = isFimbul ? "rgba(100,150,220,0.15)"
          : season.id==="winter" ? "rgba(180,210,240,0.12)"
          : season.id==="summer" ? "rgba(220,180,60,0.1)"
          : "transparent";
        return (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"2px 10px", background:bg, flexShrink:0, borderBottom:`1px solid ${BDR}44` }}>
            <div style={{ fontSize:9, color:isFimbul?"#6080c0":season.id==="winter"?"#6080a0":"#8a7040",
              fontStyle:"italic", letterSpacing:1 }}>
              {isFimbul ? `❄️ FIMBULVINTER - År ${fimbulwinter} av 3` : `${season.icon} ${season.name.toUpperCase()}`}
            </div>
            <div style={{ fontSize:8, color:"#9a8050" }}>
              {isFimbul ? "Tre vintrar i rad!" : season.desc}
            </div>
          </div>
        );
      })()}

      {/* -- KARTA -- */}
      <div ref={contRef}
        style={{ flex:1, position:"relative", overflow:"hidden", cursor:"grab", touchAction:"none",
          filter: fimbulwinter>0 ? "saturate(0.5) brightness(0.85)" : getSeason(pTurn).id==="winter" ? "saturate(0.75) brightness(0.9)" : getSeason(pTurn).id==="summer" ? "saturate(1.15) brightness(1.05)" : "none" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onWheel={onWheel}>

        <div style={{ position:"absolute", left:viewX, top:viewY, width:MAP_W*mapScale, height:MAP_H*mapScale }}>
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width={MAP_W*mapScale} height={MAP_H*mapScale}>
            <image href={MAP_SRC} x="0" y="0" width={MAP_W} height={MAP_H}/>
            {svgFilters}

            {/* Handelslänkar */}
            {getTradeLinks(pVillages).map((lnk,i) => (
              <g key={i} opacity="0.55">
                <line x1={lnk.ax} y1={lnk.ay} x2={lnk.bx} y2={lnk.by}
                  stroke={lnk.both?"#c8a020":"#a08030"} strokeWidth="2" strokeDasharray="6 4"/>
                <circle cx={(lnk.ax+lnk.bx)/2} cy={(lnk.ay+lnk.by)/2} r="5"
                  fill="#e8c840" stroke="#8a6020" strokeWidth="1.2"/>
              </g>
            ))}

            {/* Historiska platser */}
            {HISTORIC_SITES.map(h => !isRev(h.x,h.y) ? null : (
              <g key={h.id} opacity="0.82">
                <circle cx={h.x} cy={h.y} r={10} fill="rgba(245,237,210,0.82)" stroke="#9a7030" strokeWidth="1.5" filter="url(#mrkr)"/>
                <text x={h.x} y={h.y+5} textAnchor="middle" fontSize="11">{h.icon}</text>
                <text x={h.x} y={h.y-14} textAnchor="middle" fill="#3a1a04" fontSize="10" fontStyle="italic" filter="url(#lbl)">{h.name}</text>
              </g>
            ))}

            {/* Alla boplatser */}
            {VILLAGE_SLOTS.map(slot => {
              const v      = villages[slot.id];
              const myV    = v?.ownerId === `p${currentPI}`;
              const oppV   = v && !myV && v.ownerId !== "ai";
              const aiV    = v?.ownerId === "ai";
              const visible = isRev(slot.x, slot.y) || myV;
              if (!visible) return null;
              const isSel    = selected===slot.id;
              const isCoast  = COAST_IDS.has(slot.id);
              const isRiver  = RIVER_IDS.has(slot.id);
              const isForest = FOREST_IDS.has(slot.id);
              const ringColor = isCoast?"#3a80c0":isRiver?"#3a90a0":isForest?"#4a7a30":"#9a6820";
              const strokeColor = isSel?"#c87010":myV?(curP?.char?.color||BDR):oppV||aiV?"#c02020":ringColor;
              const fillColor   = oppV||aiV?"rgba(60,10,10,0.88)":"rgba(245,237,210,0.93)";
              return (
                <g key={slot.id} onClick={e=>{e.stopPropagation();tapSlot(slot);}} style={{cursor:"pointer"}}>
                  <circle cx={slot.x} cy={slot.y} r={34} fill="transparent"/>
                  {!v && mapScale >= 1.4 && <circle cx={slot.x} cy={slot.y} r={18} fill="none" stroke={ringColor} strokeWidth="1.4" opacity="0.6" strokeDasharray="5 4"/>}
                  <circle cx={slot.x} cy={slot.y}
                    r={v ? (mapScale >= 2.0 ? 19 : mapScale >= 1.4 ? 15 : 11) : (mapScale >= 1.6 ? 14 : 9)}
                    fill={fillColor} stroke={strokeColor}
                    strokeWidth={isSel?3:oppV||aiV?2:1.8}
                    filter={isSel?"url(#glow)":"url(#mrkr)"}/>
                  {v ? <text x={slot.x} y={slot.y+(mapScale>=1.8?7:5)} textAnchor="middle"
                      fontSize={mapScale>=2.0?17:mapScale>=1.4?13:10}>{myV?"🏠":"🏕"}</text>
                     : mapScale >= 1.6 ? <text x={slot.x} y={slot.y+6} textAnchor="middle" fontSize="14" fill={ringColor} fontWeight="bold">+</text> : null}
                  {v && (v.pop||0)>0 && mapScale >= 1.2 && (
                    <><circle cx={slot.x+(mapScale>=1.8?14:10)} cy={slot.y-(mapScale>=1.8?14:10)}
                      r={mapScale>=1.8?9:6} fill={popColor(v.pop||0)} stroke="#fff8e8" strokeWidth="1.5"/>
                    <text x={slot.x+(mapScale>=1.8?14:10)} y={slot.y-(mapScale>=1.8?10:7)}
                      textAnchor="middle" fill="#fff" fontSize={mapScale>=1.8?9:7} fontWeight="bold">{v.pop}</text></>
                  )}
                  {myV && mapScale >= 2.0 && (v.buildings||[]).map((b,i) => {
                    const a=(i/Math.max(v.buildings.length,1))*Math.PI*2-Math.PI/2;
                    return (<g key={i}>
                      <circle cx={slot.x+Math.cos(a)*32} cy={slot.y+Math.sin(a)*32} r={9} fill="rgba(245,237,210,0.92)" stroke="#9a7030" strokeWidth="1.2" filter="url(#mrkr)"/>
                      <text x={slot.x+Math.cos(a)*32} y={slot.y+Math.sin(a)*32+4} textAnchor="middle" fontSize="10">{b.icon}</text>
                    </g>);
                  })}
                  {myV && mapScale < 2.0 && (v.buildings||[]).length > 0 && (
                    <text x={slot.x+16} y={slot.y-16} textAnchor="middle" fontSize="9"
                      fill="#9a7030" fontWeight="bold">
                      +{v.buildings.length}
                    </text>
                  )}
                  {mapScale >= 1.6 && (
                    <text x={slot.x} y={slot.y+(v?37:30)} textAnchor="middle"
                      fill={myV?INK:oppV||aiV?"#c06060":"#6a4a10"}
                      fontSize="10" fontStyle="italic" filter="url(#lbl)">
                      {slot.name}{oppV||aiV?" ⚔":""}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Gruvor */}
            {MINE_SLOTS.map(mine => {
              const owner = mines[mine.id];
              const isOwn  = owner === `p${pi}`;
              const isOpp  = owner && !isOwn;
              const visible = isRev(mine.x, mine.y);
              if (!visible && !isOwn) return null;
              const col = isOwn ? "#4a8a6a" : isOpp ? "#8a3030" : "#7a6a40";
              return (
                <g key={mine.id} onClick={e=>{e.stopPropagation();tapMine(mine);}} style={{cursor:"pointer"}}>
                  <circle cx={mine.x} cy={mine.y} r={12} fill="rgba(40,30,10,0.85)" stroke={col} strokeWidth={2} filter="url(#mrkr)"/>
                  <text x={mine.x} y={mine.y+5} textAnchor="middle" fontSize="11">{mine.icon}</text>
                  <text x={mine.x} y={mine.y+22} textAnchor="middle" fill={col} fontSize="9" fontStyle="italic" filter="url(#lbl)">
                    {mine.name}{isOwn?" ✓":isOpp?" ⚔":""}
                  </text>
                </g>
              );
            })}

            {/* Kompass */}
            <g transform={`translate(${MAP_W-44},52)`}>
              <circle cx="0" cy="0" r="19" fill="rgba(245,237,210,0.9)" stroke="#9a7030" strokeWidth="1.5"/>
              <text x="0" y="-7" textAnchor="middle" fill="#5a3008" fontSize="10" fontWeight="bold">N</text>
              <text x="0" y="13" textAnchor="middle" fill="#8a6030" fontSize="9">S</text>
              <text x="-11" y="4" textAnchor="middle" fill="#8a6030" fontSize="9">V</text>
              <text x="11" y="4" textAnchor="middle" fill="#8a6030" fontSize="9">Ö</text>
              <polygon points="0,-16 3,-5 -3,-5" fill="#c87010"/>
            </g>
          </svg>
          <IceOverlay revealed={pRevealed} mapW={MAP_W} mapH={MAP_H} scale={mapScale}/>
        </div>

        {/* Kartöverlägg */}
        {isAiGame && (
          <div style={{ position:"absolute", left:8, top:8, zIndex:15,
            background:aiKnown?"rgba(60,10,10,0.88)":"rgba(10,8,20,0.82)",
            border:`1px solid ${aiKnown?"#c02020":"#4a4060"}`,
            borderRadius:4, padding:"3px 9px", fontSize:9,
            color:aiKnown?"#e06060":"#8080c0" }}>
            {aiKnown
              ? `${aiPersonality==="aggressive"?"⚔":"🌿"} ${Object.values(villages).filter(v=>v.ownerId==="ai").length} byar · ${aiPts}p`
              : "❄ Fiendens territorium okänt"}
          </div>
        )}
        {!isAiGame && players.length>1 && (
          <div style={{ position:"absolute", left:8, top:8, zIndex:15,
            background:"rgba(80,10,10,0.82)", border:"1px solid #c02020",
            borderRadius:4, padding:"3px 9px", fontSize:9, color:"#e06060" }}>
            🏕 {players[currentPI===0?1:0]?.name}: {Object.values(villages).filter(v=>v.ownerId===`p${currentPI===0?1:0}`).length} byar
          </div>
        )}
        <div style={{ position:"absolute", left:8, bottom:62, zIndex:15,
          background:"rgba(245,237,210,0.92)", border:`1px solid ${BDR}`,
          borderRadius:4, padding:"3px 9px" }}>
          <div style={{ fontSize:9, letterSpacing:2, color:INK2, fontStyle:"italic" }}>{eraInfo.name.toUpperCase()}</div>
          <div style={{ fontSize:8, color:"#9a7040" }}>{eraInfo.years}</div>
        </div>
        {maxPop>0 && maxPop<10 && (
          <div style={{ position:"absolute", right:48, bottom:62, zIndex:15,
            background:"rgba(180,220,255,0.92)", border:"1px solid #6090b8",
            borderRadius:4, padding:"3px 8px", fontSize:9, color:"#1a3a5a" }}>
            ❄ {10-maxPop} folk→utforskning
          </div>
        )}
        <div style={{ position:"absolute", right:8, top:8, zIndex:20, display:"flex", flexDirection:"column", gap:4 }}>
          {[["+",1],["−",-1]].map(([l,d]) => (
            <button key={l} onClick={() => zoomBtn(d)}
              style={{ width:32, height:32, background:"rgba(245,237,210,0.93)",
                border:`1.5px solid ${BDR}`, borderRadius:5, fontSize:18,
                cursor:"pointer", color:INK, display:"flex", alignItems:"center",
                justifyContent:"center", boxShadow:`0 1px 5px ${SHDW}`,
                fontFamily:"inherit", touchAction:"manipulation" }}>{l}</button>
          ))}
        </div>
        {toast && (
          <div style={{ position:"absolute", bottom:56, left:"50%", transform:"translateX(-50%)",
            background:"rgba(245,237,210,0.97)", border:`1px solid ${BDR}`, color:INK2,
            padding:"8px 16px", fontSize:12, borderRadius:6, whiteSpace:"nowrap",
            pointerEvents:"none", zIndex:20, boxShadow:`0 2px 12px ${SHDW}`,
            fontStyle:"italic", maxWidth:"88vw", textAlign:"center" }}>
            {toast}
          </div>
        )}
      </div>

      {/* -- BOTTOM SHEET -- */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:PARCH,
        borderTop:`2px solid ${BDR}`, borderRadius:"16px 16px 0 0",
        transition:"transform 0.28s ease",
        transform:sheetOpen?"translateY(0)":"translateY(calc(100% - 48px))",
        zIndex:30, maxHeight:"62dvh", display:"flex", flexDirection:"column",
        boxShadow:`0 -4px 20px ${SHDW}` }}>

        <div onClick={() => setSheetOpen(o => !o)}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"11px 16px 9px", cursor:"pointer", flexShrink:0,
            borderBottom:sheetOpen?`1px solid ${BDR}`:"none", touchAction:"manipulation" }}>
          <div style={{ fontSize:12, color:INK, fontStyle:"italic" }}>
            {selV ? `📍 ${selV.name} · 👥 ${selV.pop||0} folk`
              : selected ? `+ ${VILLAGE_SLOTS.find(s=>s.id===selected)?.name} – grunda boplats?`
              : "▲  Tryck på kartan · 🌳 för att bygga"}
          </div>
          <div style={{ fontSize:13, color:INK2 }}>{sheetOpen ? "▼" : "▲"}</div>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"10px 14px 24px" }}>
          {!selected ? (
            <div style={{ fontSize:12, color:"#9a7040", lineHeight:1.9, fontStyle:"italic" }}>
              Tryck 🌳 för att öppna utvecklingsträdet.
              Bla ring = kust, Cyan = a, Gron = skog.
            </div>
          ) : selV && selV.ownerId===`p${currentPI}` ? (
            <>
              <div style={{ marginBottom:12, background:"#fff8e8", border:`1px solid ${BDR}`, borderRadius:6, padding:"9px 11px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:INK2 }}>Folk: <b>{selV.pop||0}</b></span>
                  <span style={{ fontSize:10, color:INK2 }}>Försvar: <b>{defenseScore(selV,pTechs)}</b></span>
                </div>
                <div style={{ height:5, background:"#ddd0a0", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.min(100,((selV.pop||0)/30)*100)}%`, background:popColor(selV.pop||0), transition:"width 0.3s" }}/>
                </div>
                {(selV.pop||0)>=20 && <div style={{ fontSize:10, color:"#c02020", marginTop:4, fontStyle:"italic" }}>Risk for svält!</div>}
                {COAST_IDS.has(selected)  && <div style={{ fontSize:10, color:"#3a70b0", marginTop:3 }}>Kustboplats +1 barnsten/tur</div>}
                {RIVER_IDS.has(selected)  && <div style={{ fontSize:10, color:"#3a90a0", marginTop:3 }}>Åboplats</div>}
                {FOREST_IDS.has(selected) && <div style={{ fontSize:10, color:"#4a7a30", marginTop:3 }}>Skogsboplats +1 hud/tur</div>}
              </div>
              {(selV.buildings||[]).length>0 && (
                <div style={{ marginBottom:10, display:"flex", gap:5, flexWrap:"wrap" }}>
                  {selV.buildings.map((b,i) => (
                    <div key={i} style={{ background:"#fff8e8", border:`1px solid ${BDR}`, borderRadius:5, padding:"3px 9px", fontSize:12, color:INK2 }}>{b.icon} {b.label}</div>
                  ))}
                </div>
              )}
              {(selV.buildings||[]).some(b=>b.id==="krigare") && (
                <button onClick={() => setMoveSource(selected)} style={{ width:"100%", background:"#e8f0d0", border:"1.5px solid #5a8a20", color:"#2a5a08", padding:"9px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:"bold", marginBottom:8, touchAction:"manipulation" }}>
                  Flytta krigare
                </button>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <button onClick={() => setShowTechTree(true)} style={{ ...btnPrimary, flex:2, padding:"11px", fontSize:13 }}>
                  🌳 Utvecklingsträd
                </button>
                {players.length>1 && isAiGame && (
                  <button onClick={() => {
                    const myAlliance = pi===0 ? p1AiAlliance : p2AiAlliance;
                    const setAlliance = pi===0 ? setP1AiAlliance : setP2AiAlliance;
                    setAlliance(!myAlliance);
                    addLog(myAlliance
                      ? `Du har brutit alliansen med AI-stammen.`
                      : `Du har alliererat dig med AI-stammen!`);
                  }}
                  style={{ flex:1, background: (pi===0?p1AiAlliance:p2AiAlliance) ? "rgba(60,120,60,0.2)" : "#e8d5a0",
                    border:`1.5px solid ${(pi===0?p1AiAlliance:p2AiAlliance)?"#3a8a3a":BDR}`,
                    color:(pi===0?p1AiAlliance:p2AiAlliance)?"#2a6a2a":INK2,
                    padding:"11px", borderRadius:6, cursor:"pointer",
                    fontFamily:"inherit", fontSize:11, touchAction:"manipulation" }}>
                    {(pi===0?p1AiAlliance:p2AiAlliance) ? "🤝 AI-allians" : "🤝 Alliera AI"}
                  </button>
                )}
                {(players.length>1 || isAiGame) && (
                  <button onClick={() => setShowTrade(true)}
                    style={{ flex:1, background:tradePending?"#e8f4d0":"#e8d5a0",
                      border:`1.5px solid ${tradePending?"#5a8a20":BDR}`,
                      color:tradePending?"#2a5a08":INK2, padding:"11px", borderRadius:6,
                      cursor:"pointer", fontFamily:"inherit", fontSize:13,
                      touchAction:"manipulation" }}>
                    {tradePending ? "📨!" : "🤝"}
                  </button>
                )}
              </div>
              <div style={{ borderTop:`1px solid ${BDR}`, paddingTop:10 }}>
                <div style={{ fontSize:9, color:"#9a7040", letterSpacing:2, marginBottom:5 }}>
                  {eraInfo.name.toUpperCase()} - {eraInfo.years}
                </div>
                <div style={{ display:"flex", gap:3 }}>
                  {ERAS.map((e,i) => (
                    <div key={i} style={{ flex:1 }}>
                      <div style={{ height:3, borderRadius:2, marginBottom:3, background:i<eraIdx?GOLD:i===eraIdx?`linear-gradient(90deg,${GOLD} ${pct}%,#d8c8a0 ${pct}%)`:"#d8c8a0" }}/>
                      <div style={{ fontSize:7, color:i<=eraIdx?"#6a5a30":"#c0a880", textAlign:"center" }}>{e.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:10, borderTop:`1px solid ${BDR}`, paddingTop:8 }}>
                <div style={{ fontSize:9, color:"#9a7040", letterSpacing:2, marginBottom:5 }}>LOGG</div>
                {pLog.slice(0,5).map((e,i) => (
                  <div key={i} style={{ fontSize:11, color:i===0?INK2:"#a08040", marginBottom:3, lineHeight:1.4, opacity:1-i*0.18, fontStyle:"italic" }}>{e}</div>
                ))}
              </div>
            </>
          ) : selected && !selV ? (
            <button onClick={() => tapSlot(VILLAGE_SLOTS.find(s=>s.id===selected))} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", background:"#fffbee", border:`1.5px solid ${BDR}`, color:INK2, padding:"12px", textAlign:"left", cursor:"pointer", fontFamily:"inherit", borderRadius:6, touchAction:"manipulation" }}>
              <div>
                <div style={{ fontSize:13 }}>🏠 Grunda boplats har</div>
                <div style={{ fontSize:10, color:"#9a7840", marginTop:2, fontStyle:"italic" }}>1 sten - 3 folk - +2 poang</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12 }}>⬡ 1</div>
                <div style={{ fontSize:10, color:"#9a7840" }}>+2p</div>
              </div>
            </button>
          ) : null}
        </div>
      </div>

            {/* -- MODALER -- */}
      {showTechTree && (
        <TechTreePanel selectedVillageId={selected} villages={pVillages} globalTechs={pTechs}
          stone={pStone||0} amber={pAmber||0} hide={pHide||0} metal={pMetal||0}
          charBuildDiscount={curP?.char?.buildDiscount||[]}
          onBuild={buildInVillage} onClose={() => setShowTechTree(false)}/>
      )}
      {showSeason && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:190,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background: showSeason.fimbul ? "#0a0d18" : PARCH,
            borderRadius:12, padding:"28px 22px", maxWidth:320, width:"100%",
            fontFamily:FONT, textAlign:"center",
            border:`2px solid ${showSeason.fimbul ? "#4060a0" : BDR}`,
            boxShadow:"0 8px 40px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>
              {showSeason.fimbul ? "🌨️" : showSeason.season?.icon}
            </div>
            <div style={{ fontSize:18, fontWeight:"bold", marginBottom:8,
              color: showSeason.fimbul ? "#8090d0" : INK }}>
              {showSeason.fimbul ? "Fimbulvinter!" : showSeason.season?.name}
            </div>
            <div style={{ fontSize:12, color: showSeason.fimbul ? "#6070a0" : INK2,
              fontStyle:"italic", lineHeight:1.8, marginBottom:22 }}>
              {showSeason.fimbul
                ? "Tre vintrar i rad drabbar Österlen. Gudarna har vänt sina ansikten bort. Svält och kyla hotar stammen."
                : showSeason.season?.desc}
            </div>
            <button onClick={() => setShowSeason(null)} style={{ ...btnPrimary, padding:"11px 28px", fontSize:13 }}>
              Fortsätt
            </button>
          </div>
        </div>
      )}
      {worldFact && (
        <WorldFactModal fact={worldFact} eraName={eraInfo.name} onClose={() => setWorldFact(null)}/>
      )}
      {discoveryQueue.length>0 && (
        <DiscoveryModal site={discoveryQueue[0]} onClose={() => setDiscoveryQueue(q => q.length > 1 ? q.slice(1) : [])}/>
      )}
      {pendingEvent && (
        <EventModal event={pendingEvent} villages={pVillages} globalTechs={pTechs} onResolve={resolveEvent}/>
      )}
      {showAiTurn && (
        <AiTurnModal aiPersonality={aiPersonality} log={showAiTurn.log} onClose={() => setShowAiTurn(null)}/>
      )}
      {attackTarget && (
        <AttackModal targetVillage={attackTarget} playerVillages={villages} globalTechs={pTechs} onAttack={doAttack} onClose={() => setAttackTarget(null)}/>
      )}
      {showTrade && (
        <TradeModal
          offer={tradePending && tradePending.from !== currentPI ? tradePending : null}
          players={players}
          currentPI={currentPI}
          resources={{ villages:pVillages, stone:pStone, amber:pAmber, hide:pHide, metal:pMetal }}
          onAccept={tradePending && tradePending.from !== currentPI ? acceptTradeOffer : sendTradeOffer}
          onDecline={declineTradeOffer}
          onClose={() => setShowTrade(false)}
        />
      )}
      {moveSource && (
        <MoveWarriorsModal sourceVillage={villages[moveSource]} playerVillages={villages} onMove={doMove} onClose={() => setMoveSource(null)}/>
      )}
    </div>
  );
}
