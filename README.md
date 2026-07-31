# Dossiergenerator — MB Adviesgroep & Credion MB Amsterdam & Texel

Proof-of-concept van de dossierwizard uit het script "Opzet AI-agent voor
rechtsvormwijzigingen naar BV-structuren": bedrijf kiezen → document kiezen →
intake (met KvK-ophaal) → controle met signaleringen → concept-.docx genereren.

## Lokaal draaien

```bash
npm install
npm run dev
```

Open daarna http://localhost:3000.

## Deployen op Vercel

1. Zet dit project in een (privé) GitHub-repository.
2. Ga naar vercel.com → Add New Project → importeer de repository. Vercel
   herkent Next.js automatisch; geen extra instellingen nodig.
3. Kies bij Settings → Functions als regio een EU-regio (bijv. Frankfurt,
   `fra1`) i.v.m. cliëntgegevens.
4. Optioneel: voeg bij Settings → Environment Variables `KVK_API_KEY` toe
   (zie hieronder).

## KvK-koppeling

- Zonder `KVK_API_KEY` gebruikt de app de officiële KvK-testomgeving met
  fictieve data. Testnummers: 68750110, 69599084, 90004760.
- Een echte key vraag je aan via developers.kvk.nl (Basisprofiel API).
  Zet hem als environment variable `KVK_API_KEY`; hij blijft server-side en
  komt nooit in de browser terecht.
- Let op: de KvK-API is alleen bereikbaar vanaf internet (lokaal of Vercel);
  controleer bij problemen of het test-endpoint van KvK niet is gewijzigd
  (developers.kvk.nl).

## AI-schrijfhulp (OpenAI)

Bij het "Inhoud"-veld van de brieven staat een knop "Concept laten schrijven
(AI)". De behandelaar typt steekwoorden of een ruwe tekst, de AI (via de
OpenAI API) maakt er een nette conceptalinea van — de rest van het sjabloon
(adressering, aanhef, ondertekening) blijft door de gewone merge gevuld,
niet door AI. Altijd nalezen vóór accorderen.

- Vraag een API-key aan op platform.openai.com (Settings → API keys).
- Zet hem in Vercel bij Settings → Environment Variables als
  `OPENAI_API_KEY`. Nooit in de code of in GitHub zetten.
- Optioneel: `OPENAI_MODEL` (standaard `gpt-4o-mini`; kies dit ook lokaal
  eerst, dat is het goedkoopste bruikbare model — pas pas op als de
  kwaliteit onvoldoende blijkt).
- Zonder `OPENAI_API_KEY` geeft de knop een duidelijke foutmelding; de rest
  van de app (KvK, documentgeneratie) blijft gewoon werken.
- Kosten: alleen betalen per gebruik (geen abonnement zoals bij KvK), een
  paar cent per gegenereerde alinea bij `gpt-4o-mini`.

## Eigen sjablonen gebruiken (belangrijk!)

De huidige sjablonen in `templates/<bedrijf>/` zijn dummy's. Vervang ze door
de echte kantoorsjablonen:

1. Open het kantoorsjabloon in Word.
2. Vervang cliëntspecifieke gegevens door mergetags tussen accolades,
   bijv. `{handelsnaam}`, `{kvk_nummer}`, `{adres}`, `{klant_naam}`,
   `{ingangsdatum_opgemaakt}`, `{structuur}`, `{inbrengvariant}`.
3. Voor de lijst met signaleringen: gebruik `{#signaleringen}– {tekst}` op
   één regel en `{/signaleringen}` op de volgende regel.
4. Sla op als .docx in `templates/<bedrijf>/` met de bestandsnaam die in
   `lib/config.js` bij het document staat.

Beschikbare tags = alle veld-id's uit `lib/config.js` plus de afgeleide
velden uit `app/api/generate/route.js` (o.a. `bedrijf_naam`, `datum_vandaag`,
`*_opgemaakt`, `*_tekst`).

## Nieuw bedrijf of documenttype toevoegen

Alles staat in `lib/config.js`:

- Bedrijf: voeg toe aan `BRANDS` en maak de map `templates/<id>/` aan.
- Document: voeg toe aan `DOCUMENTS` met `brands`, `template` en `velden`
  (types: text, date, number, currency, select, boolean, textarea; met
  `toonAls` maak je velden conditioneel).
- Signaleringen/beslisregels: functie `signaleringen()` in hetzelfde bestand.

## Scripts

- `node scripts/build-templates.mjs` — (her)genereert de dummy-sjablonen
  (vereist eenmalig `npm install docx`).
- `npm run test:merge` — test de docx-merge met voorbeelddata.

## Bewuste beperkingen van deze PoC

- Geen login: voeg vóór echt gebruik authenticatie toe (bijv. Entra ID/SSO)
  zodat alleen medewerkers erbij kunnen.
- Geen database: dossiers worden niet opgeslagen; het document wordt direct
  gedownload. Volgende stap: Postgres (Neon/Supabase) voor dossieropslag,
  status (concept/review/akkoord) en audittrail.
- Geen DMS-koppeling: opslag in SharePoint/dossiersysteem kan later via de
  Microsoft Graph API vanuit de generate-route.
- Alle output is en blijft een CONCEPT dat door de behandelaar moet worden
  beoordeeld — dat staat ook in de gegenereerde documenten en bestandsnamen.
