// Test: vult het adviesbrief-sjabloon met voorbeelddata (zelfde logica als de API-route).
import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const data = {
  bedrijf_naam: "MB Adviesgroep",
  bedrijf_plaats: "Amsterdam",
  datum_vandaag: new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
  klant_naam: "J. de Vries",
  handelsnaam: "De Vries Installatietechniek",
  adres: "Dorpsstraat 12",
  plaats: "Den Burg",
  kvk_nummer: "68750110",
  behandelaar: "A. van der Vis",
  uitgangssituatie: "Eenmanszaak",
  structuur: "Holding + werkmaatschappij",
  inbrengvariant: "Geruisloze inbreng",
  ingangsdatum_opgemaakt: "1 januari 2027",
  vastgoed_aanwezig_tekst: "Ja",
  personeel_aanwezig_tekst: "Nee",
  toelichting: "Vastgoed blijft vooralsnog privé; nader te beoordelen.",
  signaleringen: [
    { tekst: "Intentieverklaring tijdig registreren i.v.m. terugwerkende kracht." },
    { tekst: "Vastgoed aanwezig: bestemming bepalen en overdrachtsbelasting beoordelen." },
    { tekst: "Holdingstructuur: managementovereenkomst en rekening-courant benodigd." },
  ],
};

const zip = new PizZip(fs.readFileSync("templates/mb-adviesgroep/adviesbrief.docx"));
const docx = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => "" });
docx.render(data);
fs.writeFileSync("test-output-adviesbrief.docx", docx.getZip().generate({ type: "nodebuffer" }));
console.log("OK: test-output-adviesbrief.docx gegenereerd");
