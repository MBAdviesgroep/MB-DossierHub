import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { BRANDS, DOCUMENTS, signaleringen } from "../../../lib/config";

export const runtime = "nodejs";

function fmtDatum(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

function fmtBedrag(v) {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return "€ " + n.toLocaleString("nl-NL");
}

export async function POST(request) {
  const { brandId, docId, waarden } = await request.json();

  const brand = BRANDS.find((b) => b.id === brandId);
  const doc = DOCUMENTS.find((d) => d.id === docId && d.brands.includes(brandId));
  if (!brand || !doc) {
    return Response.json({ error: "Onbekend bedrijf of documenttype." }, { status: 400 });
  }

  const templatePath = path.join(process.cwd(), "templates", brandId, doc.template);
  if (!fs.existsSync(templatePath)) {
    return Response.json(
      { error: `Sjabloon ontbreekt: templates/${brandId}/${doc.template}` },
      { status: 500 }
    );
  }

  // Data voor de merge: alle intake-waarden + afgeleide/opgemaakte velden
  const data = {
    ...waarden,
    bedrijf_naam: brand.naam,
    bedrijf_plaats: brand.plaats,
    datum_vandaag: new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
    ingangsdatum_opgemaakt: fmtDatum(waarden.ingangsdatum),
    oprichtingsdatum_opgemaakt: fmtDatum(waarden.oprichtingsdatum),
    stille_reserves_opgemaakt: fmtBedrag(waarden.stille_reserves),
    gevraagd_bedrag_opgemaakt: fmtBedrag(waarden.gevraagd_bedrag),
    vastgoed_aanwezig_tekst: waarden.vastgoed_aanwezig === true ? "Ja" : "Nee",
    personeel_aanwezig_tekst: waarden.personeel_aanwezig === true ? "Ja" : "Nee",
    lijfrente_tekst: waarden.lijfrente === true ? "Ja" : "Nee",
    signaleringen: signaleringen(waarden).map((tekst) => ({ tekst })),
  };

  try {
    const zip = new PizZip(fs.readFileSync(templatePath));
    const docx = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "", // lege velden -> lege string i.p.v. 'undefined'
    });
    docx.render(data);
    const buf = docx.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    const datum = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const veiligeNaam = (waarden.handelsnaam || "dossier").replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_");
    const bestandsnaam = `${datum}_${doc.id}_${veiligeNaam}_CONCEPT.docx`;

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${bestandsnaam}"`,
        "X-Bestandsnaam": bestandsnaam,
      },
    });
  } catch (e) {
    const details = e.properties?.errors?.map((er) => er.properties?.explanation).join("; ");
    return Response.json({ error: "Sjabloonfout: " + (details || e.message) }, { status: 500 });
  }
}
