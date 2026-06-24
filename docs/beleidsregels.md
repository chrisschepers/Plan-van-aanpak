# Beleidsregels van de PvA-invuller

**Versie:** juni 2026 · **Status:** functionele weergave van de regels zoals de
applicatie ze daadwerkelijk toepast.

Dit document beschrijft welke wettelijke en procedurele regels de tool gebruikt
bij het verwerken van een terugkoppeling van de bedrijfsarts en het opstellen van
het Plan van Aanpak (PvA). Alle regels zijn deterministisch in de applicatie
vastgelegd; de AI haalt alleen de feiten uit de terugkoppeling, de regels en
berekeningen draaien in de software.

> **Kader:** Wet verbetering poortwachter (Wvp). Paragraafverwijzingen verwijzen
> naar de **Werkwijzer Poortwachter** (UWV). Datums die afhangen van wet- en
> regelgeving (AOW-leeftijd, vereenvoudigde WIA-beoordeling) zijn **indicatief** —
> de tool meldt dit en verwijst naar SVB/UWV voor de exacte gegevens.

---

## 1. Privacy / AVG — wat nooit wordt overgenomen

De tool hanteert een hard medisch filter. Deze gegevens worden **niet**
overgenomen, niet geparafraseerd en niet samengevat:

- diagnoses, ziektebeelden, klachten, symptomen;
- behandelingen, medicatie;
- de medische of privé-oorzaak van het verzuim;
- het **burgerservicenummer (BSN)** — wordt genegeerd als het in de input staat.

Bij twijfel geldt: **niet overnemen**. Een PvA hoort uitsluitend functionele
informatie te bevatten (AVG; een werkgever mag geen medische gegevens verwerken).

### Wat wél wordt overgenomen (functioneel)

- belastbaarheid en functionele mogelijkheden in **werktermen**;
- inzetbare uren en opbouwritme;
- prognose, uitsluitend in **werkhervattingstermen**;
- het advies van de bedrijfsarts over werk(aanpassingen);
- naam werknemer en naam bedrijfsarts (een naam is geen medisch gegeven).

Feiten (namen, datums, uren) worden letterlijk overgenomen; bij elk veld bewaart
de tool een kort broncitaat voor menselijke controle.

---

## 2. Belastbaarheidstoestanden (sluiten elkaar uit)

De tool bepaalt één hoofdtoestand. Deze drie zijn onderling exclusief; bij een
gewone (gedeeltelijke) opbouw staan ze alle op `false`:

| Toestand | Betekenis |
|---|---|
| **Geen benutbare mogelijkheden (GBM)** | op dit moment geen benutbare arbeidsmogelijkheden |
| **Duurzaam geen mogelijkheden** | GBM én geen herstelverwachting |
| **Marginale mogelijkheden** | max. ± 2 uur per dag inzetbaar, zonder opbouwperspectief op korte termijn |
| **Volledig inzetbaar** | weer volledig inzetbaar voor het eigen werk (bv. arbeidsconflict zónder ziekte) |

Drie deterministische lagen borgen dat deze toestand stabiel en consistent is:
**self-consistency** (meerdere onafhankelijke extracties + meerderheidsstem),
een **reviewer** (leidt gemiste signalen af uit ondubbelzinnige domeintaal) en
een **normalisatie** (strijkt tegenstrijdigheden glad).

---

## 3. Opbouwschema (rekenmotor)

Het opbouwschema wordt **deterministisch** berekend — zelfde input, zelfde
uitkomst, geen verzonnen cijfers.

**a) De bedrijfsarts noemt een concreet ritme.**
Vanaf de startdatum wordt elke week `weeklyIncrease` uur opgeteld, van de
start-uren tot (en met) de contracturen.

**b) De bedrijfsarts noemt géén ritme.**
De tool stelt zelf een schema op volgens een vaste regel: **tweewekelijks één
uur per werkdag erbij**, oplopend tot de contracturen. Dit wordt in het
begeleidend bericht expliciet gemeld als zelf opgesteld. Het aantal werkdagen
volgt uit de contracturen:

| Contracturen/week | Werkdagen |
|---|---|
| ≥ 36 | 5 |
| 28–35 | 4 |
| 22–27 | 3 |
| 15–21 | 2 |
| ≤ 14 | 1 |

Elke regel toont datum, uren en het percentage van de contracturen. De datum van
volledige werkhervatting is de laatste regel van het schema.

Bij GBM/duurzaam GBM wordt **bewust géén** opbouwschema gemaakt.

---

## 4. Poortwachter-tijdlijn (gerekend vanaf de eerste ziektedag)

| Week | Mijlpaal |
|---|---|
| 1 | Ziekmelding; eerste ziektedag vastleggen |
| 6 | Probleemanalyse door de bedrijfsarts |
| 8 | Plan van Aanpak (binnen 2 weken na de probleemanalyse) |
| 42 | 42e-weeksmelding bij UWV (verplicht) |
| 45+ | Inzetbaarheidsprofiel (IZP/LAB) t.b.v. arbeidsdeskundig onderzoek |
| 46–52 | Arbeidsdeskundig onderzoek & eerstejaarsevaluatie (opschudmoment) |
| 52 | Eerstejaarsevaluatie; beoordeel of spoor 2 moet starten |
| 58 | Spoor 2 uiterlijk gestart — **6 weken na de eerstejaarsevaluatie**, tenzij binnen 3 maanden concreet perspectief op structurele terugkeer (Werkwijzer 4.3.1) |
| 87 | Actueel oordeel + re-integratieverslag (RIV) compleet; WIA-aanvraag mogelijk |
| 93 | WIA uiterlijk aanvragen; volledig RIV meeleveren |
| 104 | Einde wachttijd (2 jaar loondoorbetaling) |

De tool toont automatisch de adviezen die **nu of binnen 8 weken** spelen, met de
bijbehorende kalenderdatums (jaar erbij, want 104 weken beslaat twee jaren).

---

## 5. Leeftijdsregels (uit de geboortedatum)

- **AOW binnen 1 jaar na de WIA-poort (Werkwijzer 5.14):** bereikt de werknemer
  de AOW-leeftijd binnen één jaar ná het einde van de wachttijd, dan hoeft een
  tweede-spoortraject **niet** te worden ingezet — mits werkgever én werknemer
  beiden instemmen en dit schriftelijk vastleggen. (AOW-leeftijd indicatief op 67
  jaar; controleer bij de SVB.)
- **60-plusser — vereenvoudigde WIA-beoordeling:** is de werknemer bij einde
  wachttijd 60 jaar of ouder, dan wordt bij het WIA-venster (week 87–93) gewezen
  op de vereenvoudigde WIA-beoordeling zonder verzekeringsarts (beide partijen
  moeten instemmen). Geldig voor einde wachttijd t/m 01-09-2027.

---

## 6. Ziek uit dienst (tijdelijk contract eindigt tijdens ziekte)

Eindigt het dienstverband vóór het einde van de wachttijd, dan bepaalt de
**ziekteduur op de einddatum** welk re-integratieverslag (RIV) nodig is
(Werkwijzer 5.5–5.7):

| Ziekteduur op einddatum | Re-integratieverslag |
|---|---|
| < 6 weken | Geen RIV; alleen ziek-uit-dienstmelding bij UWV, uiterlijk laatste werkdag |
| 6–10 weken | Verkort RIV, uiterlijk de laatste dag van het dienstverband |
| > 10 weken, herstel < 3 mnd verwacht | Verkort RIV volstaat |
| > 10 weken, anders | Volledig RIV (probleemanalyse, PvA + bijstellingen, evaluaties, actueel oordeel) |

In alle gevallen: dezelfde re-integratie-inspanningen tot de laatste dag,
ziek-uit-dienst doorgeven aan UWV (Ziektewet), werknemer een kopie geven. Wordt
herstel vóór de einddatum niet verwacht, richt je dan op spoor 2 en overweeg een
participatieverzoek bij UWV. Uitzondering: eigenrisicodrager Ziektewet.

---

## 7. Adviezen op gedetecteerde signalen

Detecteert de tool een van deze situaties, dan voegt het het bijbehorende advies
toe aan het begeleidend bericht:

| Signaal | Kern van het advies | Werkwijzer |
|---|---|---|
| Geen benutbare mogelijkheden | Forceer geen re-integratie; vinger aan de pols, vastleggen; beperkt RIV bij volle 2 jaar | 5.9, 3.1 |
| Duurzaam geen mogelijkheden | Overweeg vervroegde IVA (tot week 68) | — |
| Marginale mogelijkheden | Benut juist de geringe mogelijkheden bij eigen werkgever; spoor 2 niet snel aan de orde | 5.8 |
| Arbeidstherapeutisch werken | Begrenzen in tijd; doorbouwen naar uren mét loonwaarde | 3.2.4 |
| Stagnatie / instabiele hervatting | PvA bijstellen; eventueel deskundigenoordeel UWV | 3.2.4, 5.4 |
| Arbeidsconflict | Mediation / begeleid gesprek; ziekmelding lost geen conflict op | 5.3 |
| Belastbaarheid pas na eerstejaarsevaluatie | Max. 8 weken tussen vaststellen en starten (2 + 6) | 4.3.2 |
| Gewijzigde belastbaarheid tijdens spoor 2 | Re-integratiebureau direct informeren | 4.3.4 |

**Altijd-advies (elk PvA):** leg de terugkoppeling vast in het verzuimdossier,
geef daadwerkelijk invulling aan de afgegeven arbeidsmogelijkheden, en stel het
PvA bij zodra de belastbaarheid wijzigt.

---

## 7b. Zwangerschap / WAZO-verlof

Zwangerschap is **handmatige** invoer (komt niet uit de terugkoppeling): de
gebruiker vinkt "is uw medewerker zwanger?" aan en geeft de uitgerekende datum
(en evt. meerling / werkelijke bevallingsdatum). De tool rekent dan:

- **WAZO-verlof** uit de (vermoedelijke) bevallingsdatum: terugtellen vanaf de
  dag ná de uitgerekende datum; flexibiliseringsperiode 6–4 wk vóór (meerling
  10–8 wk); bevallingsverlof min. 10 wk; niet-opgenomen dagen schuiven door →
  totaal min. 16 wk (meerling 20 wk).
- Het WAZO-verlof **pauzeert de 104-wekentermijn** (art. 23 lid 5 Wet WIA) → de
  einde-wachttijd schuift op met de verlofduur. Dit is zichtbaar op de tijdlijn.

In het begeleidend bericht komt dan een advies: meld bij UWV als het verzuim
**zwangerschaps-/bevallingsgerelateerd** is — dan valt het onder de **Ziektewet
(vangnet, art. 29a ZW)** en vergoedt UWV (een deel van) de loonkosten via
ziekengeld. Leg alleen vast *dát* het gerelateerd is, niet de medische details.

*Let op (mens-in-de-loop):* "dezelfde oorzaak" vóór én ná het verlof betekent
dezelfde aandoening; verschilt de klacht (bv. fysiek vóór, psychisch ná), dan
worden de periodes niet samengeteld en kan de wachttijd opnieuw beginnen.

---

## 8. Grenzen en voorbehoud

- De tool **rekent niet** met medische informatie en geeft geen medisch oordeel —
  dat blijft bij de bedrijfsarts.
- Wettelijke datums (AOW, vereenvoudigde WIA) zijn **indicatief**; controleer bij
  SVB/UWV.
- De adviezen zijn een hulpmiddel; werkgever en werknemer blijven samen
  verantwoordelijk voor het Plan van Aanpak en de re-integratie.
