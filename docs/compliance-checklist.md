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

## Tot bovenstaande rond is
Gebruik de tool met **fictieve** terugkoppelingen (geen echte persoonsgegevens),
conform de concept-markering in de privacyverklaring.
