# Privacy/compliance-checklist — planvanaanpakinvuller.nl

Overzicht van wat geregeld is en wat nog actie van jou (Chris) vraagt.
Stand: `[INVULLEN: datum]`.

## ✅ Technisch geregeld (in de code/dienst)
- **Geen opslag van inhoud:** geüpload document en AI-uitkomst worden alleen in
  werkgeheugen verwerkt, niet bewaard. Alleen account/credits in Supabase. *(geverifieerd)*
- **Geen persoonsgegevens in logs:** alleen foutmeldingen (`err.message`). *(geverifieerd)*
- **Geen tracking/analytics:** alleen functionele login-opslag (Supabase) + Google Fonts.
  Geen cookie-consent-banner nodig.
- **Dataminimalisatie:** medisch + BSN-filter (prompt + deterministische BSN-redactie).
- **Beveiliging:** TLS, sleutels server-side, CORS dicht (fail-closed), geen foutdetails
  naar de client, webhook met geheim padsegment + rate-limit.
- **Account verwijderen** (recht op wissing): self-service knop → cascade wist alles.
- **Anthropic-DPA:** automatisch via de Commercial Terms (incl. SCC's/DPF).
- **EER-claim eerlijk:** alleen "hosting/opslag binnen de EER"; AI-verwerking (VS) staat
  eerlijk in de privacyverklaring.
- **Concept-documenten aanwezig:** privacyverklaring, verwerkersovereenkomst (klant),
  verwerkingsregister, datalek-procedure, betrokkenenrechten-proces, DPIA-doorloop.

## ⏳ Actie van Chris (organisatorisch / config)
0. **Twee snelle config-acties (audit 2 juli):**
   - `supabase/bonusdedup.sql` draaien in de Supabase SQL-editor — dicht de
     "account verwijderen → opnieuw inloggen → nieuw gratis credit"-lus.
     Neem de e-mailhash-tabel op in het verwerkingsregister (grondslag:
     gerechtvaardigd belang, misbruikpreventie; privacyverklaring is al aangepast).
   - `PVA_REQUIRE_AUTH=1` zetten op Railway — dan weigert de API (503) wanneer de
     Supabase-config ooit wegvalt, i.p.v. stilletjes gratis/anoniem door te draaien.
1. **ZDR (Zero Data Retention) aanvragen bij Anthropic** — dan bewaart ook de AI-stap
   niets ná verwerking; maakt de "vluchtig"-belofte end-to-end waar.
2. **Supabase-verwerkersovereenkomst** accepteren/downloaden (bewaren voor dossier).
3. **Mollie-DPA** — pas nodig als je "Kopen" aanzet.
4. **DPIA + privacyverklaring** van *concept* naar *definitief* (juridische toets).
5. **Verwerkersovereenkomst (klant)** juridisch laten toetsen (`docs/verwerkersovereenkomst.md`).
6. **KvK-inschrijving** → daarna gegevens invullen op alle plekken met "volgt"/[INVULLEN]:
   verwerkersovereenkomst, landing-footer, privacyverklaring, briefpapier (telefoon).
7. **Register & procedures onderhouden:** verwerkingsregister + datalek- en
   verzoekregister actueel houden (templates staan in `docs/`).
8. *(Optioneel)* Google Fonts self-hosten om externe IP-requests te vermijden — lage prioriteit.
9. **Jaarlijkse wetgevings-APK (elke januari):** controleer de stil-verouderende
   ankers — de UWV-formulierversie van het AG140 (de invulling werkt op positie!),
   bedragen (boete € 515, maximum dagloon), het 60-plus-venster (aanname: einde
   wachttijd t/m 01-09-2027) en de datums/indexeringen in `docs/beleidsregels.md`
   §9. Bron: de nieuwste editie van het naslagwerk arbeid & verzuim; pas code en
   documentatie aan waar nodig.

## Tot bovenstaande rond is
Gebruik de tool met **fictieve** terugkoppelingen (geen echte persoonsgegevens),
conform de concept-markering in de privacyverklaring.
