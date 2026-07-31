// ============================================================
// Centrale configuratie: bedrijven, documenttypes en intakevelden.
// Nieuw bedrijf of document toevoegen = alleen dit bestand aanpassen
// en een sjabloon (.docx met {mergetags}) in /templates plaatsen.
// ============================================================

export const BRANDS = [
  {
    id: "mb-adviesgroep",
    naam: "MB Adviesgroep",
    kleur: "#1d4ed8",
    plaats: "Amsterdam",
  },
  {
    id: "credion-mb",
    naam: "Credion MB Amsterdam & Texel",
    kleur: "#0f766e",
    plaats: "Amsterdam / Texel",
  },
];

// Veldtypes: text, date, number, currency, select, boolean, textarea, persons
export const DOCUMENTS = [
  {
    id: "adviesbrief",
    naam: "Adviesbrief structuurwijziging",
    omschrijving:
      "Adviesbrief aan de klant over omzetting naar een BV-structuur.",
    brands: ["mb-adviesgroep", "credion-mb"],
    template: "adviesbrief.docx",
    velden: [
      { id: "uitgangssituatie", label: "Type uitgangssituatie", type: "select", verplicht: true, opties: ["Eenmanszaak", "VOF", "Maatschap"] },
      { id: "structuur", label: "Gewenste structuur", type: "select", verplicht: true, opties: ["Één BV", "Holding + werkmaatschappij", "Holding + werk-BV + onroerendgoed-BV"] },
      { id: "inbrengvariant", label: "Inbrengvariant", type: "select", verplicht: true, opties: ["Geruisloze inbreng", "Ruisende inbreng", "Activa-passivatransactie"] },
      { id: "ingangsdatum", label: "Gewenste ingangsdatum", type: "date", verplicht: true },
      { id: "naam_holding", label: "Naam holding", type: "text", verplicht: false, toonAls: { veld: "structuur", nietGelijkAan: "Één BV" } },
      { id: "naam_werkmij", label: "Naam werkmaatschappij", type: "text", verplicht: false, toonAls: { veld: "structuur", nietGelijkAan: "Één BV" } },
      { id: "vastgoed_aanwezig", label: "Onroerend goed aanwezig?", type: "boolean", verplicht: true },
      { id: "personeel_aanwezig", label: "Personeel aanwezig?", type: "boolean", verplicht: true },
      { id: "stille_reserves", label: "Stille reserves (indicatie, €)", type: "currency", verplicht: false, toonAls: { veld: "inbrengvariant", gelijkAan: "Ruisende inbreng" } },
      { id: "lijfrente", label: "Lijfrente toepassen?", type: "boolean", verplicht: false, toonAls: { veld: "inbrengvariant", gelijkAan: "Ruisende inbreng" } },
      { id: "toelichting", label: "Aanvullende toelichting (optioneel)", type: "textarea", verplicht: false },
    ],
  },
  {
    id: "instructie-notaris",
    naam: "Instructiebrief notaris",
    omschrijving:
      "Instructie aan de notaris met op te richten vennootschappen, aandeelhouders en bestuurders.",
    brands: ["mb-adviesgroep"],
    template: "instructie-notaris.docx",
    velden: [
      { id: "notaris_naam", label: "Naam notariskantoor", type: "text", verplicht: true },
      { id: "structuur", label: "Gewenste structuur", type: "select", verplicht: true, opties: ["Één BV", "Holding + werkmaatschappij", "Holding + werk-BV + onroerendgoed-BV"] },
      { id: "naam_holding", label: "Naam holding", type: "text", verplicht: false, toonAls: { veld: "structuur", nietGelijkAan: "Één BV" } },
      { id: "naam_werkmij", label: "Naam werkmaatschappij", type: "text", verplicht: true },
      { id: "oprichtingsdatum", label: "Gewenste oprichtingsdatum", type: "date", verplicht: true },
      { id: "bijzondere_bepalingen", label: "Bijzondere bepalingen (optioneel)", type: "textarea", verplicht: false },
    ],
  },
  {
    id: "financieringsmemo",
    naam: "Financieringsmemorandum",
    omschrijving:
      "Memo t.b.v. financieringsaanvraag met bedrijfs- en structuurgegevens.",
    brands: ["credion-mb"],
    template: "financieringsmemo.docx",
    velden: [
      { id: "financieringsdoel", label: "Financieringsdoel", type: "select", verplicht: true, opties: ["Werkkapitaal", "Bedrijfspand", "Overname", "Herstructurering", "Anders"] },
      { id: "gevraagd_bedrag", label: "Gevraagd bedrag (€)", type: "currency", verplicht: true },
      { id: "looptijd", label: "Gewenste looptijd (jaren)", type: "number", verplicht: true },
      { id: "zekerheden", label: "Beschikbare zekerheden", type: "textarea", verplicht: false },
      { id: "toelichting", label: "Toelichting aanvraag", type: "textarea", verplicht: false },
    ],
  },
];

// Vaste velden die vóór de documentspecifieke intake worden gevraagd
export const BASIS_VELDEN = [
  { id: "kvk_nummer", label: "KvK-nummer", type: "text", verplicht: true },
  { id: "handelsnaam", label: "Handelsnaam", type: "text", verplicht: true },
  { id: "adres", label: "Vestigingsadres", type: "text", verplicht: true },
  { id: "plaats", label: "Vestigingsplaats", type: "text", verplicht: true },
  { id: "sbi_omschrijving", label: "Bedrijfsactiviteit", type: "text", verplicht: false },
  { id: "klant_naam", label: "Naam ondernemer / contactpersoon", type: "text", verplicht: true },
  { id: "behandelaar", label: "Behandelaar (intern)", type: "text", verplicht: true },
];

export function documentenVoorBrand(brandId) {
  return DOCUMENTS.filter((d) => d.brands.includes(brandId));
}

export function veldZichtbaar(veld, waarden) {
  if (!veld.toonAls) return true;
  const w = waarden[veld.toonAls.veld];
  if ("gelijkAan" in veld.toonAls) return w === veld.toonAls.gelijkAan;
  if ("nietGelijkAan" in veld.toonAls) return w && w !== veld.toonAls.nietGelijkAan;
  return true;
}

// Eenvoudige beslislogica (uitbreidbaar): signaleringen op basis van invoer
export function signaleringen(waarden) {
  const s = [];
  if (waarden.inbrengvariant === "Geruisloze inbreng")
    s.push("Let op: intentieverklaring tijdig registreren i.v.m. terugwerkende kracht (vóór 1 oktober bij ingangsdatum 1 januari).");
  if (waarden.inbrengvariant === "Ruisende inbreng")
    s.push("Let op: stakingswinst, stille reserves en eventuele lijfrente verwerken in de fiscale beoordeling.");
  if (waarden.vastgoed_aanwezig === true || waarden.vastgoed_aanwezig === "true")
    s.push("Vastgoed aanwezig: bepaal bestemming (privé, werk-BV of onroerendgoed-BV) en beoordeel overdrachtsbelasting.");
  if (waarden.personeel_aanwezig === true || waarden.personeel_aanwezig === "true")
    s.push("Personeel aanwezig: overgang van werkgeverschap, loonadministratie en pensioen beoordelen.");
  if (waarden.structuur && waarden.structuur !== "Één BV")
    s.push("Holdingstructuur: managementovereenkomst en rekening-courantovereenkomst(en) benodigd.");
  return s;
}
