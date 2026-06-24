# Verwerkingsregister — planvanaanpakinvuller.nl

> **CONCEPT / template** (AVG art. 30). Vul `[INVULLEN]` aan en houd dit actueel.
> planvanaanpakinvuller treedt op als **verwerker** voor werkgevers; voor de eigen
> account-/creditadministratie is planvanaanpakinvuller **verwerkingsverantwoordelijke**.

## Organisatie
- **Naam:** `[INVULLEN: rechtsvorm + bedrijfsnaam]`, KvK `[INVULLEN]`, `[INVULLEN: plaats]`
- **Contact:** contact@planvanaanpakinvuller.nl
- **Functionaris gegevensbescherming:** niet verplicht (geen grootschalige bijzondere
  verwerking door ons; bijzondere gegevens worden juist uitgefilterd) — `[INVULLEN indien gewenst]`

## Verwerking 1 — Concept Plan van Aanpak genereren (rol: verwerker)
| | |
|---|---|
| **Verwerkingsverantwoordelijke** | De werkgever die de tool gebruikt |
| **Doel** | Concept Plan van Aanpak, opbouwadvies en begeleidend bericht genereren (Wet verbetering poortwachter) |
| **Categorieën betrokkenen** | Verzuimende werknemers van de werkgever |
| **Categorieën gegevens** | Functioneel/arbeidskundig: naam (werknemer en bedrijfsarts), functie, contracturen, eerste ziektedag, evt. geboorte-/einddatum dienstverband, belastbaarheid en mogelijkheden in werktermen, prognose in werkhervattingstermen, werkaanpassingen |
| **Uitgesloten** | Medische gegevens en BSN (filter + AI-instructies) |
| **Ontvangers/subverwerkers** | Anthropic (AI), Railway (hosting) — zie onder |
| **Doorgifte buiten EER** | Ja, AI-verwerking via Anthropic (VS) onder DPF/SCC's |
| **Bewaartermijn** | Vluchtig: document + AI-uitkomst worden niet opgeslagen; alleen in werkgeheugen verwerkt. Geen verzuimdossier. |
| **Beveiliging** | TLS, server-side sleutels, toegangsbeheer, dataminimalisatie (BSN-redactie) |

## Verwerking 2 — Account & credits (rol: verwerkingsverantwoordelijke)
| | |
|---|---|
| **Doel** | Inloggen, creditsaldo, betalingen, misbruikbeheer |
| **Categorieën betrokkenen** | Gebruikers (casemanagers/werkgevercontacten) |
| **Categorieën gegevens** | E-mailadres (via OAuth), creditsaldo, transactiehistorie, blokkade-vlag, ingewisselde actiecodes |
| **Ontvangers/subverwerkers** | Supabase (opslag), Mollie (betalingen, alleen bij aankoop) |
| **Doorgifte buiten EER** | Nee (Supabase Frankfurt, Mollie NL) |
| **Bewaartermijn** | Zolang het account bestaat; bij verwijdering worden alle gekoppelde gegevens gewist (cascade). Facturatiegegevens conform wettelijke termijn. |
| **Beveiliging** | OAuth-login, RLS in de database, service_role alleen server-side |

## Subverwerkers
| Subverwerker | Doel | Locatie | Waarborg |
|---|---|---|---|
| Anthropic, PBC (Claude) | AI-extractie | VS | DPA + SCC's + DPF; geen training |
| Supabase | Account-/creditopslag | EER (Frankfurt) | DPA |
| Railway | Hosting/verwerking in transit | EER (Amsterdam) | DPA |
| Mollie B.V. | Betalingen (alleen bij aankoop) | EER (NL) | DPA |

*Laatst bijgewerkt: `[INVULLEN: datum]`*
