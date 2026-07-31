// Genereert dummy-sjablonen (.docx met {mergetags}) per bedrijf.
// Vervang deze door de echte kantoorsjablonen; behoud de {tags}.
import fs from "node:fs";
import path from "node:path";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

const p = (text, opts = {}) =>
  new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", bold: opts.bold, color: opts.color })],
    spacing: { after: opts.after ?? 160 },
    alignment: opts.align,
  });

const kop = (text, color) =>
  new Paragraph({
    children: [new TextRun({ text, size: 30, font: "Calibri", bold: true, color })],
    spacing: { after: 240 },
  });

function adviesbrief(bedrijfKleur) {
  return new Document({
    sections: [
      {
        children: [
          p("{bedrijf_naam}", { bold: true, color: bedrijfKleur }),
          p("{bedrijf_plaats}", { after: 320 }),
          p("Aan: {klant_naam}"),
          p("{handelsnaam}"),
          p("{adres}, {plaats}", { after: 320 }),
          p("Datum: {datum_vandaag}"),
          p("Betreft: Advies structuurwijziging {handelsnaam}", { bold: true, after: 320 }),
          kop("Adviesbrief structuurwijziging", bedrijfKleur),
          p("Geachte {klant_naam},", { after: 240 }),
          p(
            "Naar aanleiding van ons gesprek adviseren wij u over de omzetting van uw {uitgangssituatie} naar de volgende structuur: {structuur}. Als inbrengvariant is gekozen voor: {inbrengvariant}. De gewenste ingangsdatum is {ingangsdatum_opgemaakt}."
          ),
          p(
            "Onroerend goed aanwezig: {vastgoed_aanwezig_tekst}. Personeel aanwezig: {personeel_aanwezig_tekst}."
          ),
          p("Aandachtspunten voor dit dossier:", { bold: true }),
          p("{#signaleringen}– {tekst}", { after: 60 }),
          p("{/signaleringen}", { after: 240 }),
          p("Toelichting: {toelichting}", { after: 320 }),
          p(
            "Dit document is een concept, opgesteld ter voorbereiding, en dient inhoudelijk te worden beoordeeld door de behandelaar ({behandelaar}) voordat het extern wordt gebruikt.",
            { color: "888888" }
          ),
          p("Met vriendelijke groet,", { after: 240 }),
          p("{behandelaar}"),
          p("{bedrijf_naam}", { bold: true, color: bedrijfKleur }),
        ],
      },
    ],
  });
}

function instructieNotaris(bedrijfKleur) {
  return new Document({
    sections: [
      {
        children: [
          p("{bedrijf_naam}", { bold: true, color: bedrijfKleur }),
          p("Datum: {datum_vandaag}", { after: 320 }),
          p("Aan: {notaris_naam}", { bold: true }),
          p("Betreft: Oprichtingsinstructie t.b.v. {handelsnaam} (KvK {kvk_nummer})", { after: 320 }),
          kop("Instructie notaris", bedrijfKleur),
          p("Geachte heer/mevrouw,", { after: 240 }),
          p(
            "Namens onze cliënt {klant_naam} ({handelsnaam}, {adres}, {plaats}) verzoeken wij u de volgende structuur op te richten: {structuur}."
          ),
          p("Naam holding: {naam_holding}"),
          p("Naam werkmaatschappij: {naam_werkmij}"),
          p("Gewenste oprichtingsdatum: {oprichtingsdatum_opgemaakt}", { after: 240 }),
          p("Bijzondere bepalingen: {bijzondere_bepalingen}", { after: 320 }),
          p("CONCEPT — te beoordelen door behandelaar {behandelaar}.", { color: "888888" }),
        ],
      },
    ],
  });
}

function financieringsmemo(bedrijfKleur) {
  return new Document({
    sections: [
      {
        children: [
          p("{bedrijf_naam}", { bold: true, color: bedrijfKleur }),
          p("Datum: {datum_vandaag}", { after: 320 }),
          kop("Financieringsmemorandum", bedrijfKleur),
          p("Onderneming: {handelsnaam} (KvK {kvk_nummer})"),
          p("Vestigingsadres: {adres}, {plaats}"),
          p("Activiteit: {sbi_omschrijving}"),
          p("Contactpersoon: {klant_naam}", { after: 240 }),
          p("Financieringsdoel: {financieringsdoel}", { bold: true }),
          p("Gevraagd bedrag: {gevraagd_bedrag_opgemaakt}"),
          p("Gewenste looptijd: {looptijd} jaar"),
          p("Zekerheden: {zekerheden}", { after: 240 }),
          p("Toelichting: {toelichting}", { after: 320 }),
          p("CONCEPT — te beoordelen door behandelaar {behandelaar}.", { color: "888888" }),
        ],
      },
    ],
  });
}

const uit = [
  ["mb-adviesgroep", "adviesbrief.docx", adviesbrief("1D4ED8")],
  ["mb-adviesgroep", "instructie-notaris.docx", instructieNotaris("1D4ED8")],
  ["credion-mb", "adviesbrief.docx", adviesbrief("0F766E")],
  ["credion-mb", "financieringsmemo.docx", financieringsmemo("0F766E")],
];

for (const [map, naam, docObj] of uit) {
  const dir = path.join("templates", map);
  fs.mkdirSync(dir, { recursive: true });
  const buf = await Packer.toBuffer(docObj);
  fs.writeFileSync(path.join(dir, naam), buf);
  console.log("Geschreven:", path.join(dir, naam));
}
