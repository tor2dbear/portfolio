/**
 * Intent data for the terminal `ai` assistant (see terminal-ai.js).
 *
 * This file is DATA only — no logic. It is deliberately separate from the
 * engine so a new question is a data edit, never a code change, and so the
 * whole thing stays translatable (every string is keyed sv/en). The engine
 * scores an input against each intent's `keywords`, prints the matching
 * `reply`, and — where useful — hands control to a real terminal action
 * (a contact/subscribe flow) rather than re-implementing anything.
 *
 * Design stance: the assistant is honest. It is NOT an LLM and never pretends
 * to be one (see the `real-ai` intent). It mostly *describes and points* — the
 * site's own pages stay the source of truth — so answers can't drift out of
 * sync with the content, and hidden/draft pages keep their own visibility.
 *
 * Keyword matching is diacritic-insensitive and case-insensitive: write
 * keywords WITHOUT Swedish diacritics ("varumarke", not "varumärke") because
 * the engine folds å/ä/ö → a/a/o before comparing. Replies keep real spelling.
 *
 * Shape:
 *   persona   { name, version, tagline{sv,en} }
 *   boot      { sv:[..], en:[..] }   lines printed while the assistant "loads"
 *   greeting  { sv, en }             first line after boot
 *   farewell  { sv, en }             printed on exit
 *   exitWords [..]                   words that leave the assistant
 *   fallback  { sv:[..], en:[..] }   when nothing matches
 *   intents   [{ id, keywords{sv,en}, reply{sv,en}, action?, entity? }]
 *   entities  { category:[..], title:[..], topic:[..] }  slot vocabularies
 */
(function () {
  "use strict";

  var DATA = {
    persona: {
      name: "clanker",
      version: "0.1",
      tagline: {
        sv: "en clanker — regelbaserad, självmedveten, helt utan moln.",
        en: "a clanker — rule-based, self-aware, entirely cloud-free.",
      },
    },

    // The "loading" theatre. Self-aware and lightly ironic; the engine staggers
    // these unless reduced motion is on, then prints them at once.
    boot: {
      sv: [
        "startar clanker…",
        "laddar en hel portfolio i en liten hög med if-satser…",
        "redo. ingen LLM, ingen intelligens att tala om — bara en clanker som kan sajten utantill.",
      ],
      en: [
        "starting clanker…",
        "loading a whole portfolio into a small heap of if-statements…",
        "ready. no LLM, no intelligence to speak of — just a clanker that knows this site by heart.",
      ],
    },

    greeting: {
      sv: "Fråga på. Jag kan Torbjörn, projekten, texterna och kontaktvägarna — utanför det är jag rätt värdelös. Skriv 'exit' för att slippa mig.",
      en: "Go on, ask. I know Torbjörn, the projects, the writing and how to reach him — beyond that I'm fairly useless. Type 'exit' to be rid of me.",
    },

    farewell: {
      sv: ["hej då — jag går och rostar 👋"],
      en: ["bye — off to go rust 👋"],
    },

    // Trailing hint on the prompt while the assistant owns it (the `# …` after
    // "you>"). Its own exit word, not a flow's "cancel".
    promptHint: {
      sv: "skriv exit för att lämna",
      en: "type exit to leave",
    },

    exitWords: [
      "exit",
      "quit",
      "bye",
      "goodbye",
      "q",
      "hejda",
      "hej da",
      "adjo",
      "sluta",
      "stang",
      "avsluta",
    ],

    fallback: {
      sv: [
        "Det ligger utanför min lilla värld — jag är trots allt bara en clanker.",
        "Prova t.ex.: projekt · texter · vad gör du · kontakt · nyhetsbrev",
      ],
      en: [
        "That's outside my little world — I'm just a clanker, after all.",
        "Try e.g.: projects · writing · what do you do · contact · newsletter",
      ],
    },

    intents: [
      {
        id: "greeting",
        keywords: {
          sv: [
            "hej",
            "tja",
            "tjena",
            "hallo",
            "halla",
            "god morgon",
            "god kvall",
          ],
          en: ["hello", "hi ", "hey", "yo ", "howdy", "good morning"],
        },
        reply: {
          sv: ["Hej! 👋 Vad vill du veta om Torbjörn eller hans arbete?"],
          en: [
            "Hi! 👋 What would you like to know about Torbjörn or his work?",
          ],
        },
      },
      {
        id: "capabilities",
        keywords: {
          sv: [
            "vad kan du",
            "vad kan jag fraga",
            "vad kan man fraga",
            "hjalp",
            "vad gor du for nagot",
            "kommandon",
            "vad ar du bra pa",
            "help",
          ],
          en: [
            "what can you",
            "what can i ask",
            "help",
            "how do you work",
            "what do you do here",
          ],
        },
        reply: {
          sv: [
            "Jag svarar på frågor om:",
            "  • Torbjörn — vem, var, erfarenhet, utbildning",
            "  • projekt — och kategorier som branding, redaktionellt, tryck",
            "  • texter — essäer om design, process och kod",
            "  • kontakt & nyhetsbrev — jag kan starta dem åt dig",
            "  • sajten själv — hur den är byggd, färgverktygen",
          ],
          en: [
            "I answer questions about:",
            "  • Torbjörn — who, where, experience, education",
            "  • projects — and categories like branding, editorial, print",
            "  • writing — essays on design, process and code",
            "  • contact & newsletter — I can start those for you",
            "  • the site itself — how it's built, the colour tools",
          ],
        },
      },
      {
        id: "who",
        keywords: {
          sv: [
            "vem ar du",
            "vem ar torbjorn",
            "vem ar han",
            "beratta om dig",
            "beratta om torbjorn",
            "vem ligger bakom",
            "om torbjorn",
          ],
          en: [
            "who are you",
            "who is torbjorn",
            "who is he",
            "tell me about",
            "about torbjorn",
            "about you",
          ],
        },
        reply: {
          sv: [
            "Torbjörn Hedberg — designer i Göteborg.",
            "Drygt ett decennium mellan redaktionell design, varumärken och",
            "digitala produkter, ibland närmare strategin, ibland hantverket.",
            "Skriv 'cv' för meritförteckningen.",
          ],
          en: [
            "Torbjörn Hedberg — a designer based in Gothenburg.",
            "Over a decade across editorial design, brand and digital product —",
            "sometimes closer to strategy, sometimes closer to the craft.",
            "Type 'cv' for the résumé.",
          ],
        },
      },
      {
        id: "role",
        keywords: {
          sv: [
            "vad gor du",
            "vad jobbar du med",
            "vad ar du for nagot",
            "vad har du for roll",
            "ar du designer",
            "vad ar ditt yrke",
            "titel",
          ],
          en: [
            "what do you do",
            "what is your job",
            "what's your role",
            "are you a designer",
            "your title",
            "what are you",
          ],
        },
        reply: {
          sv: [
            "Designer i grunden — formellt Product Owner & Art Director.",
            "Numera leder han produkt på Lokalguiden: mest backlog, sprintar",
            "och koordinering, men tänker fortfarande som en designer.",
          ],
          en: [
            "A designer at heart — formally Product Owner & Art Director.",
            "These days he leads product at Lokalguiden: mostly backlogs,",
            "sprints and coordination, but still thinking like a designer.",
          ],
        },
      },
      {
        id: "location",
        keywords: {
          sv: [
            "var bor du",
            "var finns du",
            "var ar du",
            "goteborg",
            "vart bor",
            "stad",
            "var bor han",
          ],
          en: [
            "where are you",
            "where do you live",
            "where based",
            "gothenburg",
            "location",
            "which city",
          ],
        },
        reply: {
          sv: ["Göteborg, Sverige."],
          en: ["Gothenburg, Sweden."],
        },
      },
      {
        id: "experience",
        keywords: {
          sv: [
            "hur lange har du",
            "hur erfaren",
            "hur manga ar",
            "erfarenhet",
            "hur lange jobbat",
          ],
          en: [
            "how long have you",
            "how experienced",
            "how many years",
            "experience",
            "how long working",
          ],
        },
        reply: {
          sv: ["Drygt ett decennium — 10+ år som designer, sedan 2013/2014."],
          en: ["Over a decade — 10+ years as a designer, since 2013/2014."],
        },
      },
      {
        id: "current-job",
        keywords: {
          sv: [
            "var jobbar du nu",
            "var jobbar du",
            "product owner",
            "lokalguiden",
            "vad gor du pa jobbet",
            "nuvarande jobb",
          ],
          en: [
            "where do you work now",
            "where do you work",
            "product owner",
            "lokalguiden",
            "current job",
          ],
        },
        reply: {
          sv: [
            "Sedan 2025 Product Owner & Art Director på Lokalguiden —",
            "äger backloggen för lokalguiden.se, leder utvecklingen i sprintar,",
            "och vårdar designsystem och visuell identitet. Art Director där 2016–2024.",
          ],
          en: [
            "Since 2025, Product Owner & Art Director at Lokalguiden —",
            "owns the backlog for lokalguiden.se, leads dev in sprints,",
            "and maintains the design system and visual identity. Art Director there 2016–2024.",
          ],
        },
      },
      {
        id: "career",
        keywords: {
          sv: [
            "din bakgrund",
            "karriar",
            "meritforteckning",
            "arbetslivserfarenhet",
            "cv",
            "resume",
            "arbetat tidigare",
          ],
          en: [
            "your background",
            "career",
            "work history",
            "employment",
            "cv",
            "resume",
            "worked before",
          ],
        },
        reply: {
          sv: [
            "Kort: Lokalguiden 2016→ (Art Director, sen Product Owner),",
            "frilans 2014–2016, praktik på Mecka i Borås 2013.",
            "Skriv 'cv' så öppnar jag hela meritförteckningen.",
          ],
          en: [
            "In short: Lokalguiden 2016→ (Art Director, then Product Owner),",
            "freelance 2014–2016, an internship at Mecka in Borås in 2013.",
            "Type 'cv' and I'll open the full résumé.",
          ],
        },
      },
      {
        id: "education",
        keywords: {
          sv: [
            "utbildning",
            "var har du pluggat",
            "hdk",
            "examen",
            "studerat",
            "skola",
            "master",
            "kandidat",
          ],
          en: [
            "education",
            "where did you study",
            "hdk",
            "degree",
            "studied",
            "school",
            "master",
            "bachelor",
          ],
        },
        reply: {
          sv: [
            "Master- och kandidatexamen i design från HDK",
            "(Högskolan för Design och Konsthantverk) i Göteborg.",
          ],
          en: [
            "MFA and BFA in Design from HDK",
            "(Academy of Design and Crafts) in Gothenburg.",
          ],
        },
      },
      {
        id: "skills",
        keywords: {
          sv: [
            "vad ar du bra pa",
            "dina kompetenser",
            "vad kan du",
            "fardigheter",
            "styrkor",
            "kompetens",
          ],
          en: [
            "what are you good at",
            "your skills",
            "skills",
            "strengths",
            "competencies",
          ],
        },
        reply: {
          sv: [
            "Design: UI/UX, designsystem, varumärkesidentitet, prototyping.",
            "Produkt: backlog, user stories, sprintplanering, Scrum, analytics.",
          ],
          en: [
            "Design: UI/UX, design systems, brand identity, prototyping.",
            "Product: backlog, user stories, sprint planning, Scrum, analytics.",
          ],
        },
      },
      {
        id: "tools",
        keywords: {
          sv: [
            "vilka program",
            "vilka verktyg",
            "figma",
            "adobe",
            "photoshop",
            "indesign",
            "illustrator",
            "vilka appar",
          ],
          en: [
            "which tools",
            "what software",
            "what programs",
            "figma",
            "adobe",
            "photoshop",
            "indesign",
            "illustrator",
          ],
        },
        reply: {
          sv: [
            "Expert i Figma och Adobe (Photoshop, InDesign, Illustrator,",
            "Lightroom, Premiere). Dessutom GA4, Looker Studio och After Effects.",
          ],
          en: [
            "Expert in Figma and Adobe (Photoshop, InDesign, Illustrator,",
            "Lightroom, Premiere). Also GA4, Looker Studio and After Effects.",
          ],
        },
      },
      {
        id: "code",
        keywords: {
          sv: [
            "kan du koda",
            "kodar du",
            "programmera",
            "html",
            "css",
            "javascript",
            "utvecklare",
          ],
          en: [
            "can you code",
            "do you code",
            "programming",
            "html",
            "css",
            "javascript",
            "developer",
          ],
        },
        reply: {
          sv: [
            "Ja — HTML och CSS på god nivå, JavaScript på grundnivå.",
            "Den här sajten är handbyggd i Hugo med vanilla JS (skriv 'cat colophon').",
          ],
          en: [
            "Yes — HTML and CSS proficiently, JavaScript at a basic level.",
            "This site is hand-built in Hugo with vanilla JS (type 'cat colophon').",
          ],
        },
      },
      {
        id: "clients",
        keywords: {
          sv: [
            "vilka kunder",
            "vem har du jobbat at",
            "vem har du jobbat for",
            "uppdragsgivare",
            "kunder",
          ],
          en: [
            "which clients",
            "who have you worked for",
            "who have you worked with",
            "clients",
          ],
        },
        reply: {
          sv: [
            "Urval: Lokalguiden, Zentropa Sweden, Göteborgs Stad, Mecka,",
            "Forsify, Vårdporten, I-Racket, Hydroware — plus tidningen Utblick.",
          ],
          en: [
            "A selection: Lokalguiden, Zentropa Sweden, City of Gothenburg, Mecka,",
            "Forsify, Vårdporten, I-Racket, Hydroware — plus Utblick magazine.",
          ],
        },
      },
      {
        id: "projects",
        entity: "category",
        keywords: {
          sv: [
            "projekt",
            "portfolio",
            "case",
            "arbeten",
            "vad har du gjort",
            "visa jobb",
            "vad finns det for projekt",
          ],
          en: [
            "projects",
            "portfolio",
            "case",
            "work",
            "what have you made",
            "show work",
          ],
        },
        reply: {
          sv: [
            "11 projekt i fem spår: varumärke & identitet, redaktionellt,",
            "tryck, experimentellt och digitala produkter.",
            "Skriv 'cd works' för att bläddra, eller fråga om en kategori.",
          ],
          en: [
            "11 projects across five threads: brand & identity, editorial,",
            "print, experimental and digital product.",
            "Type 'cd works' to browse, or ask about a category.",
          ],
        },
      },
      {
        id: "writing",
        entity: "topic",
        keywords: {
          sv: [
            "texter",
            "text",
            "lasa",
            "essa",
            "essaer",
            "blogg",
            "artiklar",
            "skrivit",
            "finns det nagot att lasa",
          ],
          en: [
            "writing",
            "texts",
            "read",
            "essay",
            "essays",
            "blog",
            "articles",
            "written",
            "anything to read",
          ],
        },
        reply: {
          sv: [
            "Ja — essäer om design och process, om CSS och tryck på webben,",
            "och några om att bygga just den här sajten.",
            "Skriv 'cd writing' för att läsa, eller fråga om ett ämne.",
          ],
          en: [
            "Yes — essays on design and process, on CSS and print on the web,",
            "and a few about building this very site.",
            "Type 'cd writing' to read, or ask about a topic.",
          ],
        },
      },
      {
        id: "contact",
        action: { type: "flow", flow: "contact" },
        keywords: {
          sv: [
            "kontakt",
            "kontakta",
            "hur nar jag",
            "hur far jag tag",
            "skicka meddelande",
            "hor av",
            "hur kom jag i kontakt",
            "maila dig",
          ],
          en: [
            "contact",
            "reach you",
            "get in touch",
            "send a message",
            "how do i contact",
            "message you",
          ],
        },
        reply: {
          sv: [
            "Absolut — jag startar kontaktformuläret. (skriv 'cancel' för att avbryta)",
          ],
          en: ["Sure — I'll start the contact form. (type 'cancel' to abort)"],
        },
      },
      {
        id: "hire",
        action: { type: "flow", flow: "contact" },
        keywords: {
          sv: [
            "anlita",
            "uppdrag",
            "tillganglig",
            "frilans",
            "frilansar du",
            "kan du hjalpa oss",
            "jobba ihop",
            "samarbete",
          ],
          en: [
            "hire",
            "available",
            "freelance",
            "work together",
            "can you help us",
            "collaborate",
            "for hire",
          ],
        },
        reply: {
          sv: [
            "Han tar sig an frilansuppdrag vid sidan av Lokalguiden.",
            "Berätta vad du har på gång — jag startar formuläret.",
          ],
          en: [
            "He takes on freelance work alongside Lokalguiden.",
            "Tell him what you've got going — I'll start the form.",
          ],
        },
      },
      {
        id: "channels",
        keywords: {
          sv: [
            "mejl",
            "mail",
            "epost",
            "e post",
            "telefon",
            "ringa",
            "linkedin",
            "sociala medier",
            "lankar",
            "adress",
          ],
          en: [
            "email",
            "e-mail",
            "phone",
            "call",
            "linkedin",
            "social media",
            "links",
            "address",
          ],
        },
        reply: {
          sv: [
            "E-post: hej@tor-bjorn.com · LinkedIn: /in/tbhedberg",
            "Skriv 'social' för klickbara länkar, eller 'contact' för formuläret.",
          ],
          en: [
            "Email: hi@tor-bjorn.com · LinkedIn: /in/tbhedberg",
            "Type 'social' for clickable links, or 'contact' for the form.",
          ],
        },
      },
      {
        id: "newsletter",
        action: { type: "flow", flow: "subscribe" },
        keywords: {
          sv: [
            "nyhetsbrev",
            "prenumerera",
            "prenumeration",
            "newsletter",
            "anmala mig",
            "mejllista",
          ],
          en: [
            "newsletter",
            "subscribe",
            "subscription",
            "mailing list",
            "sign me up",
          ],
        },
        reply: {
          sv: [
            "Gärna — sällan skickat, aldrig spam. Jag startar prenumerationen.",
          ],
          en: [
            "Happy to — sent rarely, never spam. I'll start the subscription.",
          ],
        },
      },
      {
        id: "newsletter-about",
        keywords: {
          sv: [
            "vad handlar nyhetsbrevet",
            "hur ofta nyhetsbrev",
            "vad far jag i nyhetsbrevet",
          ],
          en: [
            "what is the newsletter about",
            "how often newsletter",
            "what's in the newsletter",
          ],
        },
        reply: {
          sv: [
            "Enstaka anteckningar från skrivbordet — designarbete, sådant han",
            "läser, och vad han bygger. Sällan. Skriv 'prenumerera' för att haka på.",
          ],
          en: [
            "Occasional notes from the desk — design work, things he's reading,",
            "what he's building. Rarely. Type 'subscribe' to join.",
          ],
        },
      },
      {
        id: "site",
        keywords: {
          sv: [
            "vad ar det har",
            "vad ar detta",
            "vad ar den har terminalen",
            "vad ar sajten",
            "vad ar det for sida",
          ],
          en: [
            "what is this",
            "what's this",
            "what is this terminal",
            "what is this site",
            "what kind of site",
          ],
        },
        reply: {
          sv: [
            "Det här är Torbjörns portfolio i en terminal-layout — en av flera",
            "utseenden du kan byta mellan. Skriv 'help' för alla kommandon,",
            "eller 'layout column' för en vanligare vy.",
          ],
          en: [
            "This is Torbjörn's portfolio in a terminal layout — one of several",
            "looks you can switch between. Type 'help' for every command,",
            "or 'layout column' for a more conventional view.",
          ],
        },
      },
      {
        id: "colophon",
        keywords: {
          sv: [
            "hur ar sajten byggd",
            "vilken teknik",
            "hugo",
            "hur byggde du",
            "kolofon",
            "vad ar den byggd i",
          ],
          en: [
            "how is the site built",
            "what tech",
            "hugo",
            "how did you build",
            "colophon",
            "what's it built with",
          ],
        },
        reply: {
          sv: [
            "Statiskt byggd i Hugo, handskriven CSS och vanilla JavaScript,",
            "ingen ramverksmagi. Skriv 'cat colophon' för detaljerna.",
          ],
          en: [
            "Statically built in Hugo, hand-written CSS and vanilla JavaScript,",
            "no framework magic. Type 'cat colophon' for the details.",
          ],
        },
      },
      {
        id: "colour-tools",
        keywords: {
          sv: [
            "palett",
            "palettgenerator",
            "pantone",
            "arets farg",
            "farger",
            "color of the year",
            "fargverktyg",
          ],
          en: [
            "palette",
            "palette generator",
            "pantone",
            "color of the year",
            "colour of the year",
            "colours",
            "colour tool",
          ],
        },
        reply: {
          sv: [
            "Sajten har ett Pantone-årets-färg-tema (skriv 'pantone on') och en",
            "live palettgenerator (skriv 'open palette-generator').",
          ],
          en: [
            "The site has a Pantone Colour-of-the-Year theme (type 'pantone on')",
            "and a live palette generator (type 'open palette-generator').",
          ],
        },
      },
      {
        id: "languages",
        keywords: {
          sv: [
            "vilka sprak",
            "talar du engelska",
            "pratar du tyska",
            "sprakkunskaper",
          ],
          en: [
            "what languages",
            "do you speak english",
            "do you speak german",
            "languages you speak",
          ],
        },
        reply: {
          sv: ["Svenska och engelska flytande, tyska på mellannivå."],
          en: ["Swedish and English fluently, German at a moderate level."],
        },
      },
      {
        id: "real-ai",
        keywords: {
          sv: [
            "ar du en riktig ai",
            "ar du pa riktigt",
            "ar du chatgpt",
            "anvander du llm",
            "ar du claude",
            "ar du en robot",
            "ar du manniska",
          ],
          en: [
            "are you a real ai",
            "are you real",
            "are you chatgpt",
            "do you use an llm",
            "are you claude",
            "are you a bot",
            "are you human",
          ],
        },
        reply: {
          sv: [
            "Nej. 😄 Ingen LLM, ingen molnmodell, ingen 'intelligens'.",
            "Bara en clanker — regelbaserad JavaScript som låtsas vara smart.",
            "Snabb, privat och helt off-line. Lägre förväntningar, färre besvikelser.",
          ],
          en: [
            "No. 😄 No LLM, no cloud model, no 'intelligence' to speak of.",
            "Just a clanker — rule-based JavaScript pretending to be clever.",
            "Fast, private, entirely offline. Lower expectations, fewer letdowns.",
          ],
        },
      },
      {
        id: "thanks",
        keywords: {
          sv: ["tack", "tackar", "tusen tack", "toppen tack"],
          en: ["thanks", "thank you", "thx", "cheers", "appreciate it"],
        },
        reply: {
          sv: ["Varsågod! Något mer du undrar över?"],
          en: ["You're welcome! Anything else you're curious about?"],
        },
      },
      {
        id: "joke",
        keywords: {
          sv: ["skamt", "sag nagot roligt", "roa mig", "beratta ett skamt"],
          en: [
            "joke",
            "say something funny",
            "tell me a joke",
            "make me laugh",
          ],
        },
        reply: {
          sv: [
            "Skriv 'fortune' för en designaforism — roligare än mina skämt.",
          ],
          en: ["Type 'fortune' for a design aphorism — funnier than my jokes."],
        },
      },
    ],

    entities: {
      // Project categories — matched inside the `projects` intent. Counts and
      // spelling mirror the works section's five `tags` values.
      category: [
        {
          id: "brand",
          match: [
            "varumarke",
            "varumarken",
            "brand",
            "identitet",
            "branding",
            "logo",
            "logotyp",
            "rebrand",
            "profil",
          ],
          reply: {
            sv: [
              "Varumärke & identitet (3): rebranden av Lokalguiden 2020,",
              "samt identiteterna för Fastighetsgalan och Nylokal.",
            ],
            en: [
              "Brand & identity (3): the 2020 Lokalguiden rebrand,",
              "plus the identities for Fastighetsgalan and Nylokal.",
            ],
          },
        },
        {
          id: "editorial",
          match: [
            "redaktionell",
            "redaktionellt",
            "editorial",
            "tidning",
            "magasin",
            "publikation",
            "layout",
          ],
          reply: {
            sv: [
              "Redaktionellt (3): Utblick no.2 och no.4 för Utrikespolitiska",
              "föreningen, plus videoexperimentet Videotest.",
            ],
            en: [
              "Editorial (3): Utblick no.2 and no.4 for the Society of",
              "International Affairs, plus the Videotest experiment.",
            ],
          },
        },
        {
          id: "print",
          match: ["tryck", "print", "affisch", "poster", "tryckt"],
          reply: {
            sv: [
              "Tryck (1): Gothenburg Poster — Göteborgs landmärken och symboler.",
            ],
            en: [
              "Print (1): the Gothenburg Poster — the city's landmarks and symbols.",
            ],
          },
        },
        {
          id: "experimental",
          match: [
            "experiment",
            "experimentell",
            "experimentellt",
            "spekulativ",
            "konst",
          ],
          reply: {
            sv: [
              "Experimentellt (3): A Cut up World, Things in a Conversation",
              "och In the City — självinitierade, akademiska undersökningar.",
            ],
            en: [
              "Experimental (3): A Cut up World, Things in a Conversation",
              "and In the City — self-initiated, academic investigations.",
            ],
          },
        },
        {
          id: "digital",
          match: [
            "digital",
            "digitalt",
            "produkt",
            "app",
            "webb",
            "ui",
            "ux",
            "granssnitt",
            "interface",
          ],
          reply: {
            sv: [
              "Digitala produkter (1): omdesignen av Lokalguidens admin-",
              "gränssnitt — struktur och UX/UI.",
            ],
            en: [
              "Digital product (1): the redesign of Lokalguiden's admin",
              "interface — structure and UX/UI.",
            ],
          },
        },
      ],

      // Named projects — matched inside `projects`; `slug` powers an `open`.
      title: [
        {
          slug: "a-cut-up-world",
          match: ["cut up world", "cut up", "cutup", "a cut up"],
          reply: {
            sv: [
              "A Cut up World (2014) — en experimentell bok om digital kultur, ur examensarbetet. Skriv 'open a-cut-up-world'.",
            ],
            en: [
              "A Cut up World (2014) — an experimental book on digital culture, from the BA thesis. Type 'open a-cut-up-world'.",
            ],
          },
        },
        {
          slug: "utblick-no2",
          match: ["utblick"],
          reply: {
            sv: [
              "Utblick (2015) — tidningsdesign och illustration för Utrikespolitiska föreningen. Skriv 'cd works' för att hitta numren.",
            ],
            en: [
              "Utblick (2015) — magazine design and illustration for the Society of International Affairs. Type 'cd works' to find the issues.",
            ],
          },
        },
        {
          slug: "things-in-a-conversation",
          match: ["things in a conversation", "things in", "conversation"],
          reply: {
            sv: [
              "Things in a Conversation (2016) — spekulativ design om hur vi uppfattar föremål. Skriv 'open things-in-a-conversation'.",
            ],
            en: [
              "Things in a Conversation (2016) — speculative design on how we perceive artifacts. Type 'open things-in-a-conversation'.",
            ],
          },
        },
        {
          slug: "gothenburg-poster",
          match: [
            "gothenburg poster",
            "goteborg poster",
            "affischen",
            "postern",
          ],
          reply: {
            sv: [
              "Gothenburg Poster (2017) — en affisch över Göteborgs landmärken. Skriv 'open gothenburg-poster'.",
            ],
            en: [
              "Gothenburg Poster (2017) — a poster of Gothenburg's landmarks. Type 'open gothenburg-poster'.",
            ],
          },
        },
        {
          slug: "fastighetsgalan",
          match: ["fastighetsgalan", "galan"],
          reply: {
            sv: [
              "Fastighetsgalan (2021) — varumärke och webbplats för en fastighetsgala. Skriv 'cd works'.",
            ],
            en: [
              "Fastighetsgalan (2021) — brand and website for a real-estate awards event. Type 'cd works'.",
            ],
          },
        },
        {
          slug: "nylokal",
          match: ["nylokal"],
          reply: {
            sv: [
              "Nylokal (2022) — delvarumärke för en nystartstjänst hos Lokalguiden. Skriv 'cd works'.",
            ],
            en: [
              "Nylokal (2022) — a sub-brand for a new-business launch service at Lokalguiden. Type 'cd works'.",
            ],
          },
        },
      ],

      // Writing topics — matched inside the `writing` intent.
      topic: [
        {
          id: "css",
          match: [
            "css",
            "tryck",
            "print",
            "grid",
            "subgrid",
            "frontend",
            "front end",
            "webb",
          ],
          reply: {
            sv: [
              "Om CSS & tryck på webben: 'The Grid, Inherited', 'The Page",
              "Unprinted' och 'CSS fails silently'. Skriv 'cd writing'.",
            ],
            en: [
              "On CSS & print on the web: 'The Grid, Inherited', 'The Page",
              "Unprinted' and 'CSS fails silently'. Type 'cd writing'.",
            ],
          },
        },
        {
          id: "process",
          match: [
            "process",
            "design",
            "hantverk",
            "verktyg",
            "ai",
            "prototyp",
            "skeuomorf",
            "skeuomorphism",
          ],
          reply: {
            sv: [
              "Om design & process: 'Designing in the Native Material',",
              "'Prototyping the Prototype', 'The Designer as Coordinator'.",
            ],
            en: [
              "On design & process: 'Designing in the Native Material',",
              "'Prototyping the Prototype', 'The Designer as Coordinator'.",
            ],
          },
        },
        {
          id: "product",
          match: ["produkt", "product", "spec", "kravspec"],
          reply: {
            sv: [
              "Om produktarbete: 'The Other Surface' och 'The Spec Was Never",
              "the Point'. Skriv 'cd writing'.",
            ],
            en: [
              "On product work: 'The Other Surface' and 'The Spec Was Never",
              "the Point'. Type 'cd writing'.",
            ],
          },
        },
        {
          id: "meta",
          match: [
            "portfolio",
            "sajten",
            "den har sajten",
            "footer",
            "pantone",
            "kvalitet",
            "ci",
            "testing",
            "test",
          ],
          reply: {
            sv: [
              "Om att bygga den här sajten: 'Three dots in the footer' och",
              "'Failing your own pull requests'. Skriv 'cd writing'.",
            ],
            en: [
              "On building this site: 'Three dots in the footer' and",
              "'Failing your own pull requests'. Type 'cd writing'.",
            ],
          },
        },
      ],
    },
  };

  window.TerminalAIData = DATA;

  // Exposed for unit tests (jsdom `require`); harmless in the browser.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = DATA;
  }
})();
