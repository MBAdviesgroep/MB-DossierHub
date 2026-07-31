// KvK Basisprofiel-proxy. De API-key blijft server-side (env var KVK_API_KEY).
// Zonder key wordt de officiële KvK-testomgeving gebruikt (fictieve testdata).
// Testnummers o.a.: 68750110, 69599084, 90004760 (zie developers.kvk.nl).

const KVK_PROD = "https://api.kvk.nl/api/v1/basisprofielen";
const KVK_TEST = "https://api.kvk.nl/test/api/v1/basisprofielen";
// Publieke testkey van KvK developer-portal (alleen voor de testomgeving):
const KVK_TEST_KEY = "l7xx1f2691f2520d487b902f4e0b57a0b197";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nummer = (searchParams.get("nummer") || "").replace(/\D/g, "");
  if (nummer.length !== 8) {
    return Response.json({ error: "Voer een geldig KvK-nummer in (8 cijfers)." }, { status: 400 });
  }

  const key = process.env.KVK_API_KEY;
  const base = key ? KVK_PROD : KVK_TEST;
  const apikey = key || KVK_TEST_KEY;

  try {
    const r = await fetch(`${base}/${nummer}`, {
      headers: { apikey },
      cache: "no-store",
    });
    if (r.status === 404) {
      return Response.json({ error: "KvK-nummer niet gevonden." }, { status: 404 });
    }
    if (!r.ok) {
      return Response.json({ error: `KvK-API gaf status ${r.status}.` }, { status: 502 });
    }
    const d = await r.json();

    const hoofd = d._embedded?.hoofdvestiging;
    const adresObj =
      hoofd?.adressen?.find((a) => a.type === "bezoekadres") || hoofd?.adressen?.[0];
    const adres = adresObj
      ? [adresObj.straatnaam, adresObj.huisnummer, adresObj.huisnummerToevoeging].filter(Boolean).join(" ")
      : null;

    return Response.json({
      kvk_nummer: d.kvkNummer,
      handelsnaam: d.naam || hoofd?.eersteHandelsnaam || null,
      statutaire_naam: d.statutaireNaam || null,
      adres,
      plaats: adresObj?.plaats || null,
      sbi_omschrijving: d.sbiActiviteiten?.[0]?.sbiOmschrijving || null,
      bron: key ? "KvK (productie)" : "KvK (testomgeving)",
    });
  } catch (e) {
    return Response.json({ error: "Kon KvK-API niet bereiken: " + e.message }, { status: 502 });
  }
}
