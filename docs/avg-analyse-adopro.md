# AVG & AI bij verzuim — analyse ADO Pro + stappenplan voor de PvA-invuller

_Onderzoeksdatum: 15 juni 2026. Bronnen onderaan._

## 1. Wat doet ADO Pro en hoe regelen zij AVG + AI?

**ADO Pro** (`adopro.nl` = informatiesite, `app.adopro.nl` = de webapplicatie) levert
**AI-ondersteunde software voor arbeidsdeskundigen**: documenten worden geüpload, een
AI-model analyseert en extraheert de gegevens, de arbeidsdeskundige controleert en past
aan, en daarna wordt met sjablonen een rapport gegenereerd. Dat is functioneel bijna
hetzelfde patroon als de Plan van Aanpak-invuller (upload → AI-extractie → menselijke
controle → gegenereerd document).

### 1.1 Verwerkt ADO Pro medische gegevens?
In de privacyverklaring staan de gegevenscategorieën expliciet opgesomd:
- **Gewone persoonsgegevens**: NAW, geslacht, vaardigheden, vrijetijdsbesteding, geboortedatum, telefoon, e-mail.
- **Educatiegegevens**: opleiding, niveau, periode, status.
- **Arbeidsgegevens**: functie, type dienstverband, datum indiensttreding, **einde wachttijd WIA**, salaris, werkuren, werkervaring, cao.
- **Transactiegegevens, datalogs, cookies.**

> Er staat **geen categorie "gezondheidsgegevens"** in de lijst. ADO Pro houdt zich net
> als jouw tool bij **functionele en arbeidsgegevens** en laat de medische diagnose buiten
> beschouwing. Dit is exact de lijn van de Autoriteit Persoonsgegevens: functionele
> beperkingen mogen ("u kunt nu niet tillen"), aard/oorzaak van de ziekte niet.

### 1.2 Op welke grondslag (en wie is verantwoordelijk)?
Voor de webapplicatie kiezen zij **gerechtvaardigd belang** (AVG art. 6 lid 1 sub f), met
drie onderbouwende voorwaarden, letterlijk:
> "Voorwaarde 1: De functionaliteit van de applicatie heeft een preventieve of
> (arbeids)geneeskundige aard … Voorwaarde 2: De modellen … vereisen invoergegevens.
> … Alleen de benodigde gegevens … worden verzameld. Voorwaarde 3: De applicatie is
> ontwikkeld in het belang van de betrokkenen."

En de rolverdeling, letterlijk:
> "Wanneer een arbeidsdeskundige persoonsgegevens van werknemers invoert in de
> applicatie, ligt de verantwoordelijkheid bij de arbeidsdeskundige om de betrokken
> werknemers en werkgevers te informeren over de verwerking van hun gegevens."

→ **De arbeidsdeskundige (klant) is verwerkingsverantwoordelijke; ADO Pro is verwerker.**
Dit is het model dat ook voor jou geldt (zie §3).

### 1.3 Wat hebben zij aantoonbaar geregeld?
- **DPIA uitgevoerd** ("hebben wij een DPIA … uitgevoerd … bevindingen … gedocumenteerd en geïmplementeerd").
- **ISO 27001-gecertificeerd**, jaarlijkse externe **penetratietests**.
- **Data in beveiligde Europese datacenters** (EER).
- **AI Act als uitgangspunt**: "privacy, transparantie en verantwoord AI-gebruik".
- **Verwerkersovereenkomsten** met derden "indien nodig".
- **Menselijke controle ingebouwd** (stap 3: review door de expert) — relevant voor het
  verbod op uitsluitend geautomatiseerde besluitvorming (art. 22).
- Subverwerkers die zij noemen: **AWS** (hosting EU), **Azure** (document­analyse/-export
  — vrijwel zeker Azure OpenAI), **Encodian** (documentgeneratie), **LangSmith** (tracen
  van LLM-verzoeken), **LangChain** (chat-hosting), Moneybird, Payt, HubSpot, CookieYes,
  Flowlined, MailJet, Sentry, Hotjar.

### 1.4 Waar ADO Pro zwakker/onduidelijk is (leerpunten voor jou)
- **Geen expliciete "wij trainen geen AI-modellen op klantdata"-belofte.** Dat ontbreekt
  in hun verklaring — terwijl dat juist een sterk vertrouwenspunt is. **Maak dit bij jou
  wél expliciet** (Anthropic traint standaard niet op API-data).
- **Bewaartermijn alleen procesmatig** ("zolang de arbeidsdeskundige het dossier heeft").
  Geen harde maximale termijn. Jij kunt scherper zijn.
- **Veel subverwerkers** (HubSpot, Hotjar, Sentry, LangSmith…). Elke extra partij is
  AVG-oppervlak. Houd jouw keten zo kort mogelijk.
- **Grondslag gerechtvaardigd belang** werkt bij hen omdat de gebruiker een
  arbeidsdeskundige met (arbeids)geneeskundige taak is. **Voor jou ligt dit anders** (§3).

---

## 2. Het juridische kader in het kort

| Onderwerp | Regel |
|---|---|
| Gezondheidsgegevens | Bijzondere persoonsgegevens (AVG art. 9). Verwerking in beginsel **verboden**. |
| Uitzondering arbo | Alleen **bedrijfsarts/arbodienst** mag medische gegevens verwerken (UAVG art. 30, beroepsgeheim). |
| Werkgever | Mag **géén** aard/oorzaak/diagnose verwerken — alleen functionele beperkingen, inzetbare uren, afspraken (AP "Mijn zieke werknemer"). |
| Plan van aanpak | Valt onder dezelfde beperking: enkel werk- en re-integratiegegevens, geen medische details. |
| Geautomatiseerde besluiten | Art. 22: geen besluit uitsluitend op AI — menselijke controle verplicht. |
| AI Act | Transparantie over AI-gebruik; risicobeoordeling; menselijk toezicht. |

---

## 3. Wat betekent dit voor de Plan van Aanpak-invuller?

**Het cruciale verschil met ADO Pro:** hun gebruiker is een arbeidsdeskundige; jóuw
gebruiker is de **werkgever/casemanager**. En een werkgever mag — anders dan een
bedrijfsarts — **helemaal geen gezondheidsgegevens** verwerken.

Gevolgen:

1. **Jouw medisch filter is geen "nice to have" maar de juridische kern.** Omdat de
   werkgever verwerkingsverantwoordelijke is, mag er nooit diagnose/aard/oorzaak in. Dat
   jij dat in code afdwingt (en op de server hard leegmaakt) is precies wat het product
   AVG-proof maakt. Dit is jouw sterkste verkoopargument.
2. **Grondslag is bij jou niet "gerechtvaardigd belang" maar de wettelijke
   verplichting** van de werkgever uit de **Wet verbetering poortwachter** +
   Arbeidsomstandighedenwet (art. 6 lid 1 sub c), aangevuld met gerechtvaardigd belang
   voor de verwerking via de tool. Geen toestemming van de werknemer nodig (en
   toestemming zou in de werkgever-werknemerrelatie sowieso wankel zijn).
3. **Rolverdeling vastleggen**: werkgever = verwerkingsverantwoordelijke, jij
   (planvanaanpakinvuller.nl) = **verwerker**, Anthropic = **subverwerker**. Hiervoor zijn
   verwerkersovereenkomsten nodig (jij↔werkgever én jij↔Anthropic).
4. **Mens in de loop is verplicht, niet optioneel** (art. 22) — jouw verplichte
   controlestap dekt dit al af; benoem het expliciet als waarborg.
5. **Geen BSN** in de verwerking (BSN mag alleen met wettelijke grondslag; in het PvA hoort
   het thuis, maar laat de werkgever het zelf invullen, niet door de AI laten extraheren).
6. **EER-hosting + geen training**: verwerk binnen de EER en leg vast dat Anthropic niet
   op de data traint. Dit is precies het punt waar ADO Pro vaag blijft en jij kunt
   excelleren.

---

## 4. Stappenplan: zo word je AVG-proof

### Fase A — Fundament (vóór één echte casus)
1. **Bepaal de rollen schriftelijk**: werkgever = verwerkingsverantwoordelijke, jij =
   verwerker, Anthropic = subverwerker. Leg dit vast in je documentatie.
2. **Sluit een verwerkersovereenkomst (DPA) met Anthropic** en bevestig: EER-verwerking,
   geen modeltraining op klantdata, beveiliging, subverwerkerslijst.
3. **Stel een modelverwerkersovereenkomst op voor je klanten** (werkgevers), inclusief
   subverwerkerslijst, beveiligingsbijlage en meldplicht datalekken.
4. **Voer een DPIA uit** (verplicht: bijzondere context, kwetsbare betrokkenen, AI). Neem
   mee: doel, grondslag, dataminimalisatie, het medisch filter, risico's, maatregelen.
5. **Zet hosting binnen de EER** en haal de API-sleutel volledig uit frontend/repo
   (alleen server-side). Zet de repo op **privé** zodra je met echte data werkt.

### Fase B — Inrichting van de verwerking (dataminimalisatie)
6. **Borg het medisch filter technisch én aantoonbaar**: AI-instructie + harde
   server-side nabewerking die diagnose/aard/oorzaak/BSN verwijdert. Documenteer dat dit
   getest is (je hebt al een filtertest-casus).
7. **Minimaliseer wat je opslaat**: verwerk bij voorkeur **vluchtig** (in-memory, niet
   persistent opslaan na het genereren). Bewaar je tóch iets, stel een **harde
   bewaartermijn** in en automatiseer verwijdering.
8. **Geen BSN via de AI**: laat de werkgever dat veld zelf invullen in het PvA.
9. **Korte subverwerkersketen**: alleen wat echt nodig is (hosting EER + Anthropic).
   Vermijd trackers zoals Hotjar/analytics op pagina's waar data wordt verwerkt.

### Fase C — Transparantie & rechten
10. **Privacyverklaring** publiceren: wie, wat, waarom, grondslag, subverwerkers,
    bewaartermijn, EER, geen training, rechten van betrokkenen, contact.
11. **AI-transparantie (AI Act)**: vermeld duidelijk dat AI wordt ingezet, dat output een
    **concept** is en dat menselijke controle verplicht is.
12. **Informatieplicht doorgeven**: instrueer de werkgever dat hij de werknemer informeert
    over de verwerking (zoals ADO Pro het bij de arbeidsdeskundige legt).
13. **Faciliteer betrokkenenrechten** (inzage, rectificatie, wissing): contactpunt +
    procedure.

### Fase D — Beveiliging & beheer
14. **Technische maatregelen**: TLS, secrets in een kluis, toegangsbeheer/MFA,
    logging zonder persoonsgegevens, datalek-procedure.
15. **Periodieke toetsing**: (laat) een **pentest** doen en plan jaarlijkse review —
    precies wat ADO Pro doet.
16. **Verwerkingsregister** bijhouden (AVG art. 30).
17. **Overweeg ISO 27001 / NEN 7510** als je opschaalt; het is een sterk keurmerk in deze
    markt (ADO Pro gebruikt ISO 27001 nadrukkelijk als vertrouwenssignaal).

### Fase E — Vóór livegang met échte data (harde checklist)
- [ ] DPA met Anthropic getekend, EER + geen training bevestigd
- [ ] DPIA afgerond en maatregelen geïmplementeerd
- [ ] Modelverwerkersovereenkomst voor werkgevers klaar
- [ ] Repo privé, API-sleutel uitsluitend server-side
- [ ] Medisch filter + BSN-filter getest en gedocumenteerd
- [ ] Bewaartermijn/vluchtige verwerking ingericht
- [ ] Privacyverklaring + AI-transparantie online
- [ ] Pentest uitgevoerd, datalek-procedure gereed

---

## Bronnen
- ADO Pro — Privacyverklaring (10-02-2026): https://adopro.nl/wp-content/uploads/2026/02/Privacyverklaring-ADO-Pro-_-10022026.pdf
- ADO Pro — website: https://adopro.nl
- Autoriteit Persoonsgegevens — *Mijn zieke werknemer*: https://autoriteitpersoonsgegevens.nl/nl/onderwerpen/werk-en-uitkering/mijn-zieke-werknemer
- ArboNed — *Wat mag u wel en niet vastleggen over ziekteverzuim*: https://www.arboned.nl/nieuws/wat-mag-u-wel-en-niet-vastleggen-over-het-ziekteverzuim-van-uw-werknemer
- KNMG-richtlijn *Omgaan met medische gegevens* (2024): https://www.knmg.nl/download/knmg-richtlijn-omgaan-met-medische-gegevens-2
