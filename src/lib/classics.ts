import type { Classic } from './toppings';

// Researched topping recipes, checked against the sources listed with each one. Amounts are per pizza:
// one 30–33 cm pizza from a 250–280 g ball. `era` decides the list: Italian classics or contemporary.
export const CLASSICS: Classic[] = [
  {
    "id": "margherita",
    "name": "Margherita",
    "italian": "Pizza Napoletana Margherita STG",
    "base": "red",
    "era": "classic",
    "origin": "Naples, 1889 (traditional account)",
    "blurb": "Tomato, fior di latte, basil and olive oil, the colours of the Italian flag. Tradition credits Raffaele Esposito, who is said to have made it for Queen Margherita in 1889. Protected as an EU STG, it is the benchmark every pizzaiolo is judged by.",
    "tags": [
      "vegetarian",
      "neapolitan",
      "stg"
    ],
    "items": [
      {
        "name": "Peeled San Marzano (or Italian plum) tomatoes, hand-crushed raw with a pinch of sea salt",
        "qty": 75,
        "unit": "g",
        "when": "base",
        "note": "STG range 60–80 g; never cooked"
      },
      {
        "name": "Fior di latte (or Mozzarella STG), cut into strips and drained",
        "qty": 90,
        "unit": "g",
        "when": "top",
        "note": "STG range 80–100 g"
      },
      {
        "name": "Fresh basil",
        "qty": 4,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": "STG 4–5 g, poured in a spiral from the centre"
      },
      {
        "name": "Pecorino Romano or Parmigiano Reggiano, finely grated (optional)",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": "Da Michele-style; not part of the STG"
      }
    ],
    "steps": [
      "Cut the fior di latte into 1 cm strips and leave them to drain in a colander in the fridge for 2–12 hours.",
      "Crush the tomatoes by hand or pass them through a food mill, then season with salt (about 10 g per kg). Do not cook the sauce.",
      "Open the dough ball by hand to 30–33 cm, keeping a 1–2 cm cornicione and a centre about 3 mm thick.",
      "Spoon the tomato onto the centre and spread it outward in a spiral with the back of the spoon, stopping 1.5–2 cm from the rim.",
      "Scatter the mozzarella evenly and lay the basil leaves on top, then pour the oil in a spiral from the centre outward.",
      "Bake at 430–480 °C for 60–90 s, turning for an even, leopard-spotted rim. In a home oven, bake on a preheated steel or stone at maximum heat for 5–7 min and finish under the grill."
    ],
    "tip": "Wet mozzarella is the main cause of a soupy centre, so drain it well and keep the tomato layer thin. Lay the basil under or against the cheese, or brush it with a little oil, so it wilts instead of scorching.",
    "sources": [
      "https://www.certifico.com/component/attachments/download/1127",
      "https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ITA.pdf",
      "https://www.agraria.org/prodottitipici/pizza.htm",
      "https://www.scattidigusto.it/2023/10/17/il-giusto-peso-della-pizza"
    ]
  },
  {
    "id": "marinara",
    "name": "Marinara",
    "italian": "Pizza Napoletana Marinara STG",
    "base": "red",
    "era": "classic",
    "origin": "Naples, 18th century",
    "blurb": "Tomato, garlic, oregano and olive oil, with no cheese. It is the older of the two STG pizzas and is linked to Neapolitan fishermen. Many pizzaioli consider it the real test of a pizzeria, because there is nothing to hide the dough or the tomato.",
    "tags": [
      "vegan",
      "neapolitan",
      "stg"
    ],
    "items": [
      {
        "name": "Peeled San Marzano (or Italian plum) tomatoes, hand-crushed raw with a pinch of sea salt",
        "qty": 90,
        "unit": "g",
        "when": "base",
        "note": "STG range 70–100 g; use more than on a margherita"
      },
      {
        "name": "Garlic, peeled and thinly sliced",
        "qty": 1,
        "unit": "clove",
        "when": "top",
        "note": ""
      },
      {
        "name": "Dried oregano (Sicilian or Mediterranean)",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 6,
        "unit": "g",
        "when": "top",
        "note": "STG 4–5 g; a little extra is common on marinara"
      },
      {
        "name": "Fresh basil (optional)",
        "qty": 2,
        "unit": "leaf",
        "when": "top",
        "note": "not in the STG, but many Naples pizzerias add it"
      }
    ],
    "steps": [
      "Crush the tomatoes by hand and season lightly with salt.",
      "Open the dough to 30–33 cm, leaving a 1–2 cm cornicione.",
      "Spread the tomato in a spiral from the centre, a little more generously than for a margherita.",
      "Scatter the garlic slices so they sit in the sauce, then rub the oregano between your fingers over the top.",
      "Drizzle the oil in a spiral from the centre.",
      "Bake at 430–480 °C for 60–90 s (home oven: steel or stone at maximum heat for 5–7 min)."
    ],
    "tip": "Slice the garlic paper-thin and press it into the tomato so it poaches rather than burns. With no cheese, the tomato is the star, so use your best tinned tomatoes and season them just right.",
    "sources": [
      "https://www.certifico.com/component/attachments/download/1127",
      "https://www.agraria.org/prodottitipici/pizza.htm",
      "https://www.scattidigusto.it/migliori-pizze-marinara-napoli",
      "https://www.gamberorossointernational.com/?p=398165",
      "https://www.dissapore.com/grande-notizia/pizza-marinara-con-mozzarella-non-esiste/"
    ]
  },
  {
    "id": "margherita-di-bufala",
    "name": "Margherita di Bufala",
    "italian": "Pizza Napoletana Margherita Extra (Bufalina)",
    "base": "red",
    "era": "classic",
    "origin": "Campania",
    "blurb": "A margherita made with Mozzarella di Bufala Campana DOP instead of fior di latte, a version the STG allows. It is richer and tangier than the standard margherita. Pizzaioli disagree about it, because buffalo mozzarella releases a lot of whey in the oven.",
    "tags": [
      "vegetarian",
      "neapolitan",
      "stg"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": "or crushed cherry tomatoes, e.g. Piennolo del Vesuvio"
      },
      {
        "name": "Mozzarella di Bufala Campana DOP, torn into chunks and drained",
        "qty": 90,
        "unit": "g",
        "when": "top",
        "note": "STG 80–100 g"
      },
      {
        "name": "Fresh basil",
        "qty": 4,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "An hour or two ahead, tear the buffalo mozzarella into 2–3 cm chunks, drain them in a colander in the fridge and pat dry before use.",
      "Spread the tomato over the opened disc in a spiral, leaving a 1–2 cm rim.",
      "Scatter the bufala in larger pieces than you would use for fior di latte, then add the basil and drizzle with the oil.",
      "Bake at 430–480 °C for 60–90 s.",
      "In a home oven (6–8 min), bake with tomato only for the first 3–4 min, then add the bufala so it melts without flooding the pizza."
    ],
    "tip": "Large chunks leak less whey than thin strips. Many pizzaioli also add some of the bufala raw, straight after the bake, so it stays milky. Franco Pepe's 'Margherita Sbagliata' goes further: it is baked with bufala only, and the raw tomato and a basil reduction go on afterwards.",
    "sources": [
      "https://www.scattidigusto.it/perche-la-mozzarella-di-bufala-non-centra-con-la-pizza",
      "https://www.scattidigusto.it/bufala-vieni-a-vedere-se-sulla-pizza-ci-va-mozzarella-o-fiordilatte",
      "https://www.agraria.org/prodottitipici/pizza.htm",
      "https://www.dissapore.com/pizzerie/pepe-in-grani-a-caiazzo-recensione/"
    ]
  },
  {
    "id": "diavola",
    "name": "Diavola",
    "italian": "Pizza alla Diavola",
    "base": "red",
    "era": "classic",
    "origin": "Southern Italy (Campania/Calabria)",
    "blurb": "Tomato, fior di latte and thin slices of spicy salami. The name means 'devil' and refers to the heat of southern salame piccante such as Napoli, Calabrese or spianata. It is Italy's answer to pepperoni and one of the country's most popular pizzas.",
    "tags": [
      "pork",
      "spicy"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 75,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Salame piccante (Napoli, Calabrese or spianata), sliced 1–2 mm",
        "qty": 45,
        "unit": "g",
        "when": "top",
        "note": "about 10–12 slices"
      },
      {
        "name": "Gaeta black olives, pitted (optional)",
        "qty": 6,
        "unit": "olive",
        "when": "top",
        "note": "how Da Attilio in Naples makes it"
      },
      {
        "name": "Fresh basil",
        "qty": 3,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Chilli oil (olio santo) or thinly sliced fresh red chilli (optional)",
        "qty": 3,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Slice the salami thinly so the edges cup and crisp in the heat.",
      "Spread the tomato over the opened disc in a spiral and scatter the fior di latte.",
      "Lay the salami over the cheese, not under it, so its fat renders and runs across the pizza. Add the olives if using, then the basil and oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min at maximum heat).",
      "For more heat, finish with a few drops of chilli oil or some fresh chilli."
    ],
    "tip": "Slice the salami thin and put it on top of the cheese. Thick slices stay flabby and leak grease without crisping. Use enough sweet fior di latte to balance the heat; Attilio Bachetti adds Gaeta olives because their bitterness offsets the sweet, spicy salami.",
    "sources": [
      "https://www.scattidigusto.it/pizza-alla-diavola-la-classifica-delle-migliori-in-campania",
      "https://eu.ooni.com/blogs/ooni-insights/why-italians-dont-eat-pepperoni",
      "https://ooni.com/blogs/recipes/attilio-bachettis-pizza-diavola-devils-pizza"
    ]
  },
  {
    "id": "capricciosa",
    "name": "Capricciosa",
    "italian": "Pizza Capricciosa",
    "base": "red",
    "era": "classic",
    "origin": "Rome, 1937 (La Capricciosa); also claimed by Naples",
    "blurb": "Cooked ham, mushrooms, artichokes and olives scattered 'capriciously' over a margherita base. It is usually credited to the Roman restaurant La Capricciosa in 1937, and some versions add hard-boiled egg. It is one of the few pizzas on menus in both Naples and Rome.",
    "tags": [
      "pork",
      "roman",
      "neapolitan"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Prosciutto cotto (cooked ham), torn",
        "qty": 45,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Champignon or cremini mushrooms, sliced and sautéed",
        "qty": 50,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Artichoke hearts in oil, drained and quartered",
        "qty": 40,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Gaeta black olives, pitted",
        "qty": 8,
        "unit": "olive",
        "when": "top",
        "note": ""
      },
      {
        "name": "Parmigiano Reggiano or Pecorino Romano, grated (optional)",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 3,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Sauté the sliced mushrooms over high heat in a little oil with garlic and parsley until their liquid evaporates (4–5 min), then season and cool.",
      "Drain the artichokes well and pat them dry. Pit and halve the olives.",
      "Spread the tomato in a spiral and scatter the fior di latte, then distribute the ham, mushrooms, artichokes and olives at random across the pizza.",
      "Add the grated cheese, basil and a spiral of oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min)."
    ],
    "tip": "Keep the total topping weight around 150 g or the centre will still be wet after 90 seconds, and always pre-cook the mushrooms. Attilio Bachetti of Da Attilio in Naples leaves out the artichokes for a lighter version.",
    "sources": [
      "https://en.wikipedia.org/wiki/Pizza_capricciosa",
      "https://www.gamberorossointernational.com/?p=398165",
      "https://ooni.com/blogs/recipes/attilio-bachettis-pizza-capricciosa-capricious-pizza",
      "https://giallozafferano.com/recipes/Pizza-capricciosa.html"
    ]
  },
  {
    "id": "quattro-stagioni",
    "name": "Quattro Stagioni",
    "italian": "Pizza Quattro Stagioni",
    "base": "red",
    "era": "classic",
    "origin": "Campania",
    "blurb": "Four toppings in four quarters, one per season: artichokes for spring, olives for summer, mushrooms for autumn and ham for winter. It uses the same ingredients as the capricciosa, but here each topping stays in its own quarter.",
    "tags": [
      "pork",
      "neapolitan"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Artichoke hearts in oil, drained and sliced (spring)",
        "qty": 30,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Gaeta black olives, pitted (summer)",
        "qty": 6,
        "unit": "olive",
        "when": "top",
        "note": ""
      },
      {
        "name": "Mushrooms, sliced and sautéed (autumn)",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Prosciutto cotto, torn (winter)",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 3,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Sauté the mushrooms until dry, and drain the artichokes and olives well.",
      "Spread the tomato in a spiral and scatter the fior di latte over the whole disc.",
      "Divide the pizza into quarters by eye, or lay two thin ropes of dough across it in a cross as some Neapolitan pizzerias do, and arrange each topping in its own quarter.",
      "Add the basil and a spiral of oil, then bake at 430–480 °C for 60–90 s (home oven: 6–8 min)."
    ],
    "tip": "Turn the pizza a quarter at a time in the oven so no single quarter faces the flame for the whole bake. The olives and ham char fastest.",
    "sources": [
      "https://en.wikipedia.org/wiki/Pizza_quattro_stagioni",
      "https://www.gamberorossointernational.com/?p=398165",
      "https://breville.com/inspiration/en-us/recipes/ovens-air-fryers-microwaves/quattro-stagioni-neapolitanstyle-pizza"
    ]
  },
  {
    "id": "napoletana",
    "name": "Napoletana (Pizza Napoli)",
    "italian": "Pizza Napoli / Pizza Romana (in Naples)",
    "base": "red",
    "era": "classic",
    "origin": "Rome and central Italy (called 'Romana' in Naples)",
    "blurb": "Tomato, mozzarella, anchovies, capers and oregano. In a well-known naming quirk, Rome and most of Italy call this pizza 'Napoli', while in Naples the anchovy pizza is called 'Romana'. Anchovies are among the oldest Neapolitan pizza toppings.",
    "tags": [
      "seafood",
      "roman"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed (no added salt)",
        "qty": 75,
        "unit": "g",
        "when": "base",
        "note": "the anchovies and capers bring plenty of salt"
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Anchovy fillets in olive oil (ideally from Cetara)",
        "qty": 6,
        "unit": "fillet",
        "when": "top",
        "note": ""
      },
      {
        "name": "Salted capers, soaked and rinsed",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Dried oregano",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Soak the salted capers in cold water for 15 min, then rinse and pat dry. Drain the anchovies on kitchen paper.",
      "Spread the unsalted tomato in a spiral and scatter the fior di latte.",
      "Add the capers and oregano, then lay the anchovy fillets like the spokes of a wheel.",
      "Drizzle with the oil and bake at 430–480 °C for 60–90 s (home oven: 6–8 min)."
    ],
    "tip": "Choose how you want the anchovies to taste. Baked on top, they melt into the tomato and season it. Laid on as soon as the pizza leaves the oven, they stay plump, meaty and milder. Either way, do not salt the tomato.",
    "sources": [
      "https://www.giallozafferano.com/recipes/roman-pizza.html",
      "https://giadzy.com/blogs/recipes/pizza-napoli-anchovy-caper-pizza",
      "https://doeatbetterexperience.com/it/blog/pizza-romana-vs-pizza-napoletana/"
    ]
  },
  {
    "id": "prosciutto-e-funghi",
    "name": "Prosciutto e Funghi",
    "italian": "Pizza Prosciutto e Funghi",
    "base": "red",
    "era": "classic",
    "origin": "Italy-wide pizzeria classic",
    "blurb": "Cooked ham and sautéed mushrooms on tomato and mozzarella. It is a mild, crowd-pleasing staple of Italian pizzerias: the heart of the capricciosa without the olives and artichokes.",
    "tags": [
      "pork"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Champignon mushrooms, sliced 3 mm and sautéed",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Prosciutto cotto (cooked ham), torn",
        "qty": 50,
        "unit": "g",
        "when": "top",
        "note": "home oven: add in the last minute"
      },
      {
        "name": "Fresh basil",
        "qty": 3,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Sauté the mushrooms in a hot pan with oil, a little garlic and parsley until all their liquid has evaporated, then season and cool.",
      "Spread the tomato in a spiral and scatter the fior di latte and the mushrooms.",
      "In a wood-fired oven, tear the ham over the pizza before baking. In a home oven, add it for the last minute so it does not dry out.",
      "Add the basil and oil, then bake at 430–480 °C for 60–90 s (home oven: 6–8 min)."
    ],
    "tip": "Use good prosciutto cotto cut off the bone and tear it rather than dicing it. Some pizzaioli drape it on 'in uscita', as the pizza comes out of the oven, so it stays moist and sweet.",
    "sources": [
      "https://blog.giallozafferano.it/cucinoperpassione/pizza-prosciutto-e-funghi/",
      "https://www.italianstylecooking.net/en/?p=17318",
      "https://ooni.com/blogs/recipes/attilio-bachettis-pizza-capricciosa-capricious-pizza"
    ]
  },
  {
    "id": "ortolana",
    "name": "Ortolana",
    "italian": "Pizza Ortolana",
    "base": "red",
    "era": "classic",
    "origin": "Italy-wide",
    "blurb": "The 'market gardener's' pizza: grilled aubergine and courgette with sweet roasted peppers over tomato and fior di latte. It is the classic vegetable pizza of Italian pizzerias and changes with the season.",
    "tags": [
      "vegetarian"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": "omit for a vegan version"
      },
      {
        "name": "Aubergine, sliced 5 mm and grilled",
        "qty": 40,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Courgette, sliced 5 mm and grilled",
        "qty": 40,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Red or yellow pepper, roasted, peeled and cut in strips",
        "qty": 40,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil (for marinating the vegetables and drizzling)",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 4,
        "unit": "leaf",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Raw extra-virgin olive oil",
        "qty": 3,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Slice the aubergine and courgette 5 mm thick, salt them lightly and grill on a very hot griddle until marked and tender.",
      "Char the pepper under the grill or over a flame, leave it covered for 10 min, then peel and cut it into strips.",
      "Toss the vegetables with a little oil, salt and a sliced garlic clove, and leave them to marinate while you shape the dough.",
      "Spread the tomato, scatter the fior di latte and arrange the vegetables in a single layer.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min), then finish with fresh basil and a thread of raw oil."
    ],
    "tip": "Pre-cook every vegetable, because 90 seconds will not soften raw aubergine. Lay them in a single layer so the cheese can bubble up between them.",
    "sources": [
      "https://www.breville.com/inspiration/en-au/recipes/ovens-air-fryers-microwaves/ortolana-neapolitanstyle-pizza",
      "https://blog.giallozafferano.it/piovonoricette/pizza-con-verdure/"
    ]
  },
  {
    "id": "tonno-e-cipolla",
    "name": "Tonno e Cipolla",
    "italian": "Pizza Tonno e Cipolla",
    "base": "red",
    "era": "classic",
    "origin": "Italy-wide (Calabrian tuna and Tropea onion)",
    "blurb": "Tuna in olive oil and sweet red onion over tomato and mozzarella. It is a much-loved pizzeria pairing across Italy, best made with Calabrian tuna and Tropea onions.",
    "tags": [
      "seafood"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Red onion (ideally Tropea), sliced 1–2 mm",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Tuna in olive oil (ideally ventresca), drained and flaked",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": "home oven: add for the last 2 min"
      },
      {
        "name": "Dried oregano",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Slice the onion very thinly. For a milder taste, soak it in cold water for 10 min, then dry it well.",
      "Spread the tomato in a spiral and scatter the fior di latte and onion.",
      "In a wood-fired oven, add the flaked tuna before baking. In a home oven, add it for the last 2 minutes so it does not dry out.",
      "Sprinkle with oregano, drizzle with oil and bake at 430–480 °C for 60–90 s (home oven: 6–8 min)."
    ],
    "tip": "Drain the tuna, but leave a little of its oil on the flakes to keep them moist. Tuna left in the heat too long turns dry and stringy, so keep its time in the oven short.",
    "sources": [
      "https://www.dissapore.com/ricette/pizza-tonno-e-cipolla-ricetta/",
      "https://blog.giallozafferano.it/ricettechepassione/ricetta-pizza-tonno-e-cipolla/"
    ]
  },
  {
    "id": "siciliana",
    "name": "Siciliana",
    "italian": "Pizza alla Siciliana",
    "base": "red",
    "era": "classic",
    "origin": "Southern Italy (Sicilian-inspired)",
    "blurb": "On Neapolitan and many other Italian menus, 'Siciliana' means fried aubergine with tomato, mozzarella, basil and a salty grating cheese: pasta alla Norma on a pizza. In Rome and the north, the same name often means a Napoli with olives and capers instead.",
    "tags": [
      "vegetarian"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Aubergine, cut into 1.5 cm cubes and fried",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 4,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Ricotta salata (or Parmigiano Reggiano), grated",
        "qty": 15,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Cube the aubergine, salt it for 30 min, pat it dry and shallow-fry in oil at 170 °C until golden and creamy, then drain on kitchen paper.",
      "Spread the tomato in a spiral and scatter the fior di latte and fried aubergine.",
      "Add the basil and a little oil, then bake at 430–480 °C for 60–90 s (home oven: 6–8 min).",
      "Finish with a snowfall of grated ricotta salata."
    ],
    "tip": "Fry the aubergine rather than roasting it. Fried cubes stay creamy inside, while roasted ones turn leathery in a fast bake. Frying hours ahead and draining thoroughly keeps the pizza from getting greasy.",
    "sources": [
      "https://blog.giallozafferano.it/letortedigessica/pizza-alla-norma/",
      "https://glovoapp.com/it/it/napoli/stores/impastovivo-nap",
      "https://www.dissapore.com/cucina/pizza-italiana-guida-agli-stili/"
    ]
  },
  {
    "id": "cosacca",
    "name": "Cosacca",
    "italian": "Pizza Cosacca",
    "base": "red",
    "era": "classic",
    "origin": "Naples, 1844 (traditional account)",
    "blurb": "Tomato, grated pecorino, basil and oil, a cross between a marinara and a margherita with cheese dusted over instead of mozzarella. Legend links it to Tsar Nicholas I's visit to Naples in 1844. It is still on the short menu at L'Antica Pizzeria da Michele.",
    "tags": [
      "vegetarian",
      "neapolitan"
    ],
    "items": [
      {
        "name": "Peeled San Marzano tomatoes, hand-crushed with a pinch of salt",
        "qty": 90,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Pecorino Romano DOP, finely grated",
        "qty": 15,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 4,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil (Da Michele uses seed oil)",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Spread the tomato generously over the opened disc in a spiral.",
      "Dust the pecorino evenly over the tomato, right to the edge of the sauce.",
      "Add the basil and drizzle with the oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 5–7 min)."
    ],
    "tip": "Grate the pecorino very finely so it melts into the tomato as a savoury glaze instead of browning in clumps. Use a little more tomato than on a margherita, since there is no mozzarella to add moisture.",
    "sources": [
      "https://www.scattidigusto.it/2014/10/03/pizzeria-da-michele-pizza-napoletana/",
      "https://www.pmq.com/da-michele-new-york/",
      "https://www.scattidigusto.it/pizza-cosacca-milano-pizzeria-via-orseolo"
    ]
  },
  {
    "id": "montanara",
    "name": "Montanara",
    "italian": "Pizza Montanara (fritta e ripassata)",
    "base": "red",
    "era": "classic",
    "origin": "Naples (Starita, Materdei)",
    "blurb": "A Neapolitan fried pizza. The disc is fried until puffed, topped with tomato sauce, smoked provola, pecorino and basil, then flashed in the oven. Antonio Starita's double-cooked version in Materdei is famous across Naples.",
    "tags": [
      "vegetarian",
      "neapolitan",
      "fried"
    ],
    "items": [
      {
        "name": "Sunflower or peanut oil, about 4 cm deep in a wide pan",
        "qty": 0,
        "unit": "for frying",
        "when": "base",
        "note": ""
      },
      {
        "name": "Tomato sauce, cooked (passata simmered 15 min with oil, garlic and basil)",
        "qty": 80,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Smoked provola (provola affumicata), diced",
        "qty": 50,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano or Parmigiano Reggiano, grated",
        "qty": 10,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 3,
        "unit": "leaf",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 3,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Heat about 4 cm of sunflower or peanut oil in a wide pan to 175–180 °C.",
      "Stretch the dough ball to 22–24 cm, or divide it into three small 'montanarine' of about 85 g each.",
      "Fry for 30–40 s per side, spooning oil over the top so it puffs, until pale gold, then drain on kitchen paper.",
      "Spread the hot tomato sauce over the fried disc and add the provola and grated cheese.",
      "Flash in a 430–480 °C oven for 30–60 s, or under a home grill for 2–3 min, until the provola melts. Finish with basil and a drop of oil."
    ],
    "tip": "Keep the oil at 175–180 °C. Cooler oil makes the dough greasy, and hotter oil browns it before it has time to puff. Well-fermented biga or poolish doughs fry especially light and hollow.",
    "sources": [
      "https://www.scattidigusto.it/ricetta-pizza-a-casa-montanara-fritta",
      "https://www.scattidigusto.it/pizza-firenze-buoneria-antonio-starita",
      "https://flawless.life/it/italia/napoli/starita"
    ]
  },
  {
    "id": "patate-e-rosmarino-romana",
    "name": "Patate e Rosmarino (Roman)",
    "italian": "Pizza Bianca con Patate e Rosmarino",
    "base": "white",
    "era": "classic",
    "origin": "Rome",
    "blurb": "Rome's pizza bianca covered in paper-thin potatoes, rosemary, coarse salt and plenty of olive oil, with no cheese. It is a staple of Roman forni such as Forno Campo de' Fiori and Bonci's Pizzarium. The top slices crisp like chips over a creamy lower layer.",
    "tags": [
      "vegan",
      "roman"
    ],
    "items": [
      {
        "name": "Waxy yellow potatoes, peeled and sliced 1 mm on a mandoline",
        "qty": 150,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fine sea salt, for salting the potato slices",
        "qty": 3,
        "unit": "g",
        "when": "top",
        "note": "or soak in brine: 10 g salt per 500 ml water"
      },
      {
        "name": "Fresh rosemary needles",
        "qty": 1,
        "unit": "sprig",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil (tossed with the potatoes and drizzled)",
        "qty": 12,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fior di latte, diced (optional, for Roman 'patate e mozzarella')",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Flaky or coarse sea salt",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Slice the potatoes 1 mm thick on a mandoline. Toss them with the salt, or soak them in salted water, for 20–30 min until floppy.",
      "Squeeze or blot the slices dry, then toss them with most of the oil, the rosemary and some pepper.",
      "Open the dough. For the Roman style, shingle the potatoes in overlapping layers right to the edge; on a Neapolitan disc, leave a 1–2 cm cornicione bare.",
      "Drizzle with the remaining oil.",
      "Bake at 430–480 °C for 75–90 s, or in a home oven at maximum heat for 8–10 min, until the top slices are browned and crisp.",
      "Finish with flaky salt and a thread of raw oil."
    ],
    "tip": "Salting draws water out of the slices so they turn pliable and cook through. For a 90-second wood-fired bake, keep them no thicker than 1 mm or blanch them in boiling salted water for 1–2 min first. Overlapping layers give soft potato underneath and crisp chips on top.",
    "sources": [
      "https://smittenkitchen.com/2016/04/potato-pizza-even-better/",
      "https://www.williams-sonoma.com/recipe/roman-style-potato-pizza.html",
      "https://www.scattidigusto.it/pizza-bianca-bonci-21-condimenti-per-tutti-i-gusti",
      "https://au.gozney.com/blogs/recipes/potato-pizza-recipe"
    ]
  },
  {
    "id": "patate-e-provola",
    "name": "Patate e Provola (Neapolitan)",
    "italian": "Pizza Patate e Provola",
    "base": "white",
    "era": "classic",
    "origin": "Naples",
    "blurb": "The Neapolitan take on potato pizza: cooked potato slices on smoky provola with rosemary, black pepper and a grating of pecorino. It puts the comfort of pasta patate e provola on a pizza.",
    "tags": [
      "vegetarian",
      "neapolitan"
    ],
    "items": [
      {
        "name": "Smoked provola (provola affumicata), diced and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Potatoes, sliced 3 mm and roasted or par-boiled",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh rosemary needles",
        "qty": 1,
        "unit": "sprig",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano or Parmigiano Reggiano, grated",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 6,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil (optional)",
        "qty": 3,
        "unit": "leaf",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Slice the potatoes 3 mm thick and roast them at 220 °C with oil, salt and rosemary for 15–20 min until just tender and golden at the edges (or boil them for 3–4 min), then cool.",
      "Dice the provola and leave it uncovered in the fridge for an hour to dry slightly.",
      "Open the dough and scatter the provola, then lay the potatoes on top in a single layer.",
      "Add the grated cheese, pepper and rosemary, and drizzle with the oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min)."
    ],
    "tip": "Use cooked potatoes. A 60–90 second bake cannot cook raw slices thicker than about 1 mm. Roasting also gives the potatoes caramelised edges that go well with the smoky provola.",
    "sources": [
      "https://blog.giallozafferano.it/valeriaciccotti/pizza-alle-patate/",
      "https://au.gozney.com/blogs/recipes/potato-pizza-recipe"
    ]
  },
  {
    "id": "patate-e-salsiccia",
    "name": "Patate e Salsiccia",
    "italian": "Pizza Patate e Salsiccia",
    "base": "white",
    "era": "classic",
    "origin": "Naples / Italy-wide",
    "blurb": "Pork sausage and golden potatoes on a white base of fior di latte or provola, scented with rosemary. A hearty pizzeria favourite; as it bakes, the sausage fat bastes the potatoes.",
    "tags": [
      "pork",
      "neapolitan"
    ],
    "items": [
      {
        "name": "Fior di latte or smoked provola, diced and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Potatoes, sliced 3 mm and roasted or pan-fried",
        "qty": 90,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh pork sausage, casing removed",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh rosemary needles",
        "qty": 1,
        "unit": "sprig",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano or Parmigiano Reggiano, grated",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Roast or pan-fry the potato slices in oil with salt and rosemary until just tender and golden (15–20 min at 220 °C), then cool.",
      "Open the dough and scatter the cheese, then the potatoes in a single layer.",
      "Pinch the raw sausage into small pieces and dot them between the potatoes. Add the grated cheese, rosemary, pepper and a thread of oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 7–8 min), making sure the sausage is cooked through."
    ],
    "tip": "Put the sausage pieces beside the potatoes rather than underneath, so the rendered fat runs onto the potatoes and crisps their edges. In Naples, fried potato slices (or even chips) are a popular, indulgent alternative.",
    "sources": [
      "https://www.dissapore.com/ricette/ricetta-pizza-patate-e-salsiccia/",
      "https://blog.giallozafferano.it/ricettedilibellula/ricetta-pizza-con-patate-e-salsiccia/"
    ]
  },
  {
    "id": "prosciutto-e-rucola",
    "name": "Prosciutto e Rucola",
    "italian": "Pizza Crudo, Rucola e Grana",
    "base": "white",
    "era": "classic",
    "origin": "Italy-wide",
    "blurb": "A white pizza baked with fior di latte, then topped after baking with raw prosciutto crudo, peppery rocket and Parmigiano shavings or a spoonful of stracciatella. All the fresh toppings go on at the end, so the ham stays silky.",
    "tags": [
      "pork"
    ],
    "items": [
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Rocket (rucola)",
        "qty": 15,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Prosciutto crudo (Parma or San Daniele), sliced paper-thin",
        "qty": 50,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Parmigiano Reggiano shavings",
        "qty": 10,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Stracciatella (optional, instead of or with the Parmigiano)",
        "qty": 60,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Raw extra-virgin olive oil",
        "qty": 3,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Open the dough, scatter the fior di latte and drizzle with oil. Add a few halved cherry tomatoes if you like.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min).",
      "Let the pizza rest for 30 s, then scatter the rocket, dressed with a little oil and salt.",
      "Drape the prosciutto in loose folds, add Parmigiano shavings or spoon over the stracciatella, and finish with raw oil."
    ],
    "tip": "Never bake prosciutto crudo, because it turns tough and salty. On the hot pizza its fat turns translucent and silky. Put the rocket down before the ham so the leaves do not wilt into a mat.",
    "sources": [
      "https://blog.giallozafferano.it/lericettediminu/pizza-rucola-pomodorini-e-prosciutto-crudo/",
      "https://blog.giallozafferano.it/ilcaldosaporedelsud/ricetta-pizza-bianca-stracciatella-e-salame/"
    ]
  },
  {
    "id": "quattro-formaggi",
    "name": "Quattro Formaggi",
    "italian": "Pizza Quattro Formaggi",
    "base": "white",
    "era": "classic",
    "origin": "Italy-wide",
    "blurb": "A white pizza with four cheeses chosen for contrast: milky fior di latte, creamy gorgonzola, stretchy fontina and savoury Parmigiano. Every Italian pizzeria serves one, and each picks its own four.",
    "tags": [
      "vegetarian"
    ],
    "items": [
      {
        "name": "Fior di latte, diced and drained",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Gorgonzola dolce DOP, in small pieces",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fontina Val d'Aosta DOP (or smoked provola), diced",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Parmigiano Reggiano, grated",
        "qty": 15,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 3,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Dice the fior di latte and fontina into 1 cm cubes, break the gorgonzola into small knobs and keep everything cold.",
      "Open the dough and scatter the cheeses evenly, spacing out the gorgonzola so no single spot gets too rich.",
      "Sprinkle the Parmigiano over the top and add a thin thread of oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min), then finish with black pepper."
    ],
    "tip": "Keep the total cheese to about 145 g and add no salt, because too much cheese pools into fat in a fast bake. A northern twist is a few walnuts or a drizzle of honey after baking.",
    "sources": [
      "https://www.dissapore.com/ricette/pizza-ai-4-formaggi/",
      "https://en.wikipedia.org/wiki/Pizza_quattro_formaggi"
    ]
  },
  {
    "id": "salsiccia-e-friarielli",
    "name": "Salsiccia e Friarielli",
    "italian": "Pizza Salsiccia e Friarielli",
    "base": "white",
    "era": "classic",
    "origin": "Naples",
    "blurb": "Naples' favourite bianca and a winter classic. Bitter friarielli (broccoli rabe shoots) are sautéed with garlic and chilli, then paired with fatty pork sausage and smoked provola or fior di latte.",
    "tags": [
      "pork",
      "neapolitan",
      "spicy"
    ],
    "items": [
      {
        "name": "Smoked provola (or fior di latte), diced and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Friarielli (or cime di rapa/broccoli rabe), sautéed in oil with garlic and chilli",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": "cooked, squeezed weight"
      },
      {
        "name": "Garlic, for sautéing the friarielli",
        "qty": 1,
        "unit": "clove",
        "when": "top",
        "note": ""
      },
      {
        "name": "Dried chilli, for the friarielli",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh pork sausage (fennel optional), casing removed",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano, grated (optional)",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Wash the friarielli, keeping the tender leaves and florets. Sauté them covered in oil with a crushed garlic clove and chilli for 8–10 min until tender, then uncover and cook off the liquid.",
      "Let them cool, squeeze out any excess liquid and chop roughly.",
      "Open the dough and scatter the provola, then the friarielli.",
      "Pinch the raw sausage into hazelnut-sized pieces and dot them over the top (or use pre-browned crumbles). Add the pecorino and a spiral of oil.",
      "Bake at 430–480 °C for 60–90 s, checking that the sausage is cooked through (home oven: 7–8 min)."
    ],
    "tip": "Keep the sausage pieces small so they cook through in 90 seconds and baste the greens with their fat. Squeeze the friarielli well, because their liquid is the usual cause of a soggy centre.",
    "sources": [
      "https://gozney.com/blogs/recipes/salsiccia-e-friarielli-pizza",
      "https://www.scattidigusto.it/migliori-pizze-salsiccia-e-friarielli",
      "https://www.napolike.it/ricetta-pizza-salsiccia-e-friarielli",
      "https://www.scattidigusto.it/2017/11/04/pizza-settimana-salsiccia-friarielli-3-indirizzi/"
    ]
  },
  {
    "id": "boscaiola-bianca",
    "name": "Boscaiola Bianca",
    "italian": "Pizza Boscaiola Bianca",
    "base": "white",
    "era": "classic",
    "origin": "Central and northern Italy",
    "blurb": "The 'woodsman's' pizza: sautéed mushrooms and crumbled sausage over fior di latte, with no tomato. It is an autumn favourite in pizzerias and is best made with porcini or mixed wild mushrooms.",
    "tags": [
      "pork"
    ],
    "items": [
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Mixed mushrooms (champignon, porcini or chiodini), sliced and sautéed with garlic and parsley",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh pork sausage, casing removed",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Parmigiano Reggiano, grated",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Flat-leaf parsley, chopped",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Sauté the mushrooms in oil with garlic over high heat until all their water has evaporated and they begin to colour. Season, add parsley and cool.",
      "Open the dough and scatter the fior di latte and the mushrooms.",
      "Dot with small pieces of raw sausage, sprinkle with Parmigiano and drizzle with the oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 7–8 min).",
      "Finish with chopped parsley and black pepper."
    ],
    "tip": "Cook the mushrooms until completely dry, or they will steam the pizza. Mixing a few rehydrated dried porcini into cheap champignons gives a deep woodland flavour.",
    "sources": [
      "https://blog.giallozafferano.it/cucinaconmiasorella/pizza-alla-boscaiola-bianca/",
      "https://www.scattidigusto.it/pizza-24-nuovi-condimenti-sfiziosi-gourmet"
    ]
  },
  {
    "id": "fiori-di-zucca-e-alici",
    "name": "Fiori di Zucca e Alici",
    "italian": "Pizza Fiori di Zucca e Alici",
    "base": "white",
    "era": "classic",
    "origin": "Rome",
    "blurb": "A Roman summer pizza bianca with fior di latte, delicate courgette flowers and anchovies. It is the pizza version of the fried stuffed fiori di zucca that Roman pizzerias serve as a starter.",
    "tags": [
      "seafood",
      "roman"
    ],
    "items": [
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 90,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Courgette (zucchini) flowers, pistils removed, opened flat",
        "qty": 6,
        "unit": "flower",
        "when": "top",
        "note": ""
      },
      {
        "name": "Anchovy fillets in olive oil",
        "qty": 5,
        "unit": "fillet",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano, grated (optional)",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Remove the pistil and the spiky green sepals from each flower. Wipe the flowers clean without soaking them, then tear each one open along one side.",
      "Open the dough and scatter the fior di latte.",
      "Lay the flowers flat over the cheese and nestle the anchovy fillets between them. Add the pecorino, pepper and a light drizzle of oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min)."
    ],
    "tip": "The petals scorch quickly at 450 °C or more, so brush them lightly with oil and let them rest on the mozzarella, which protects them. For a milder anchovy taste, add the fillets as soon as the pizza leaves the oven.",
    "sources": [
      "https://www.wantedinrome.com/yellowpage/pizzeria-da-remo.html",
      "https://www.ricettedalmondo.it/pizza-con-fiori-di-zucca-e-alici.html",
      "https://blog.giallozafferano.it/valeriaciccotti/pizza-con-fiori-di-zucca/"
    ]
  },
  {
    "id": "bianca-lardo-di-colonnata",
    "name": "Pizza Bianca with Lardo di Colonnata",
    "italian": "Pizza Bianca con Lardo di Colonnata",
    "base": "white",
    "era": "classic",
    "origin": "Rome / Tuscany",
    "blurb": "A golden pizza bianca with oil, rosemary and coarse salt, draped straight out of the oven with Lardo di Colonnata IGP. The lardo, cured back fat aged with herbs in Carrara marble basins, melts into translucent ribbons on the hot pizza.",
    "tags": [
      "pork",
      "roman"
    ],
    "items": [
      {
        "name": "Extra-virgin olive oil",
        "qty": 10,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh rosemary needles",
        "qty": 1,
        "unit": "sprig",
        "when": "top",
        "note": ""
      },
      {
        "name": "Coarse sea salt",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Potatoes, sliced 1 mm, salted and blotted (optional, as Bonci does)",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Lardo di Colonnata IGP, sliced paper-thin",
        "qty": 35,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Chill the lardo well and slice it paper-thin; a slicer works best.",
      "Open the dough and dimple the centre firmly with your fingertips so it does not balloon. Brush with the oil and scatter the rosemary and coarse salt, adding the potato slices if using.",
      "Bake at 430–480 °C for 60–90 s, or in a home oven for 6–8 min, until deep golden.",
      "Drape the lardo over the pizza as soon as it comes out so it turns translucent, then add black pepper."
    ],
    "tip": "Never bake the lardo, because it renders away to grease; the heat of the pizza alone melts it into silky ribbons. A bianca with no toppings can puff up like a balloon, so dimple it well or burst large bubbles with the peel during the bake.",
    "sources": [
      "https://ristorazioneitalianamagazine.it/?p=73215",
      "https://www.fondazioneslowfood.com/it/arca-del-gusto-slow-food/lardo-di-colonnata/",
      "https://guide.michelin.com/it/it/notizia/features/il-lardo-di-colonnata"
    ]
  },
  {
    "id": "zucchine-e-provola",
    "name": "Zucchine e Provola",
    "italian": "Pizza Zucchine e Provola",
    "base": "white",
    "era": "classic",
    "origin": "Campania (summer)",
    "blurb": "A summer bianca of thin courgette rounds on smoked provola, finished with pecorino, basil or mint and lemon zest. It is a simpler cousin of Ciro Salvo's celebrated 'Nerano' pizza at 50 Kalò.",
    "tags": [
      "vegetarian"
    ],
    "items": [
      {
        "name": "Smoked provola (provola affumicata), diced and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Courgettes, sliced into 2 mm rounds",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano or Provolone del Monaco, grated",
        "qty": 10,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 6,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil or mint",
        "qty": 5,
        "unit": "leaf",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Lemon zest (optional)",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Toss the courgette rounds with a pinch of salt, leave for 15 min, then blot dry. For a richer version, shallow-fry them until golden.",
      "Toss the courgettes with half the oil.",
      "Open the dough, scatter the provola and arrange the courgettes on top, overlapping slightly.",
      "Add the grated cheese and the rest of the oil, then bake at 430–480 °C for 60–90 s (home oven: 6–8 min).",
      "Finish with torn basil or mint and a little lemon zest."
    ],
    "tip": "Salt and blot the courgettes before baking so they roast rather than stew on the pizza. Once you have this version right, try Ciro Salvo's Nerano style: fried courgettes, courgette cream, fior di latte and flakes of Provolone del Monaco.",
    "sources": [
      "https://www.scattidigusto.it/2021/07/17/le-migliori-pizze-in-estate-nerano-e-melanzane-di-ciro-salvo-da-50-kalo/",
      "https://www.scattidigusto.it/50-kalo-pizzeria-roma-ciro-salvo-recensione",
      "https://blog.giallozafferano.it/ricettechepassione/pizza-con-zucchine-speck-e-provola-affumicata/"
    ]
  },
  {
    "id": "gorgonzola-pere-e-noci",
    "name": "Gorgonzola, Pere e Noci",
    "italian": "Pizza Gorgonzola, Pere e Noci",
    "base": "white",
    "era": "classic",
    "origin": "Northern Italy (Lombardy)",
    "blurb": "Sweet pear, creamy gorgonzola and walnuts on a white base. It puts on a pizza the northern Italian pairing behind the proverb 'al contadino non far sapere quanto è buono il formaggio con le pere' ('don't let the farmer know how good cheese is with pears').",
    "tags": [
      "vegetarian"
    ],
    "items": [
      {
        "name": "Fior di latte, diced and drained",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Gorgonzola dolce DOP, in small pieces",
        "qty": 50,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Ripe pear (Williams or Abate), cored and sliced 2–3 mm",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Walnuts, roughly chopped",
        "qty": 12,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Honey (optional)",
        "qty": 5,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Core the pear and slice it 2–3 mm thick just before assembling.",
      "Open the dough, scatter the fior di latte and small knobs of gorgonzola, and fan the pear slices over the top.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min).",
      "Scatter the walnuts (toasted in a dry pan if you like), then finish with black pepper and a thin drizzle of honey."
    ],
    "tip": "Add the walnuts after the bake, because at 450 °C or more they burn and turn bitter within seconds. For a fresher contrast, lay half the pear slices on raw as the pizza comes out.",
    "sources": [
      "https://blog.giallozafferano.it/vickyart/ricetta-pizzette-gorgonzola-e-pere/",
      "https://www.igorgorgonzola.com/en/?p=3226",
      "https://www.scattidigusto.it/pizza-gourmet-fatta-in-casa-16-ricette-bonci"
    ]
  },
  {
    "id": "pepperoni-cup-and-char",
    "name": "Pepperoni",
    "base": "red",
    "era": "contemporary",
    "origin": "New York slice shops and neo-Neapolitan pizzerias",
    "blurb": "The pepperoni pie as today's best slice shops and neo-Neapolitan pizzerias make it: small-diameter, natural-casing pepperoni that curls into crisp-edged cups holding pools of paprika-red fat. Kenji López-Alt's Serious Eats testing showed that casing type and slice thickness (about 2.5–5.6 mm) decide whether it cups.",
    "tags": [
      "pork",
      "new-york"
    ],
    "items": [
      {
        "name": "Tomato sauce (hand-crushed whole peeled tomatoes, salted)",
        "qty": 80,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Parmigiano-Reggiano or Pecorino Romano, finely grated",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Low-moisture whole-milk mozzarella, shredded",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": "or 90 g well-drained fior di latte for a 90-second wood-fired bake"
      },
      {
        "name": "Pepperoni (natural or collagen casing, small diameter), sliced 2.5–3 mm",
        "qty": 45,
        "unit": "g",
        "when": "top",
        "note": "about 25–30 slices"
      },
      {
        "name": "Dried oregano",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Make the sauce: crush 400 g whole peeled tomatoes by hand or with 2–3 quick pulses and season with 6 g salt (optionally 1 small grated garlic clove). Leave it uncooked for a hot, fast bake. Makes enough for about 5 pizzas.",
      "Slice the pepperoni 2.5–3 mm thick: thinner slices lie flat and burn, thicker ones stay greasy and flat.",
      "Spread 80 g sauce to within 2 cm of the rim, dust with the hard cheese, then scatter the mozzarella.",
      "Lay the pepperoni on top of the cheese (not under it), slightly overlapping towards the centre, so the edges get direct heat and curl.",
      "Bake until the cups char at the rims: 90–120 s at 430–450 °C, or 6–8 min on a preheated steel/stone at the home oven's maximum.",
      "Finish with a pinch of oregano and a thin thread of olive oil."
    ],
    "tip": "In a very fast wood-fired bake the pepperoni may not have time to cup; lift the pizza towards the dome for the last 5–10 seconds to crisp the edges.",
    "sources": [
      "https://www.tastingtable.com/825828/why-does-some-pepperoni-curl-when-cooked/",
      "https://www.foodrepublic.com/1298004/how-buy-slice-pepperoni-perfect-crispy-cups/",
      "https://www.inquirer.com/food/craig-laban/philly-chefs-recipes-pizza-cookbooks-home-cooking-family-kitchen-laban-20200320.html"
    ]
  },
  {
    "id": "bee-sting",
    "name": "Bee Sting",
    "base": "red",
    "era": "contemporary",
    "origin": "Roberta's, Bushwick, Brooklyn (opened 2008)",
    "blurb": "Roberta's signature pie: tomato, fresh mozzarella, soppressata, chili flakes and chili oil, finished with a drizzle of plain honey. It is one of the pies that made the sweet-heat combination mainstream in American pizza.",
    "tags": [
      "pork",
      "spicy",
      "sweet-heat",
      "new-york"
    ],
    "items": [
      {
        "name": "Tomato sauce (hand-crushed whole peeled tomatoes, salted)",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Crushed red chili flakes",
        "qty": 1,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Chili oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh basil, torn",
        "qty": 4,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh mozzarella (fior di latte), torn into grape-sized pieces",
        "qty": 75,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Hot soppressata, thinly sliced",
        "qty": 6,
        "unit": "slice",
        "when": "top",
        "note": "about 25 g"
      },
      {
        "name": "Honey (wildflower)",
        "qty": 15,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Chili oil: put chili flakes in cold oil (e.g. 10 g flakes to 100 ml olive or blended oil), then heat gently over medium-low until the oil turns a vivid orange, 8–10 min. Cool. It keeps for weeks.",
      "Ladle the sauce into the centre and spread it with the back of the ladle, leaving a 2.5 cm rim.",
      "Sprinkle the chili flakes, drizzle the chili oil and tear the basil over the sauce.",
      "Break the mozzarella into grape-sized pieces and distribute evenly.",
      "Place 5 soppressata slices around the outside and 1 in the centre.",
      "Bake until the soppressata edges crisp and the crust is spotted: about 90 s at 450 °C, or 6–8 min on a steel in a home oven.",
      "Drizzle 15 g honey over the whole pie as soon as it comes out of the oven."
    ],
    "tip": "Roberta's uses plain honey. The heat comes from the chili oil and flakes under the cheese, so you taste the sweetness first and the burn after. Warm the honey slightly so it drizzles in thin lines.",
    "sources": [
      "https://robbreport.com/food-drink/dining/robertas-bee-sting-pizza-recipe-1234641914/",
      "https://foodgps.com/robertas-bee-sting-pizza/",
      "https://www.pmq.com/robertas-pizza-miami/"
    ]
  },
  {
    "id": "hellboy",
    "name": "Hellboy",
    "base": "red",
    "era": "contemporary",
    "origin": "Paulie Gee's, Greenpoint, Brooklyn, early 2010s",
    "blurb": "Paulie Gee's best-seller: tomato, fior di latte, spicy soppressata and Parmigiano, finished with Mike's Hot Honey. Pizzaiolo Mike Kurtz first made the chili-infused honey for the restaurant and later turned it into a national brand.",
    "tags": [
      "pork",
      "spicy",
      "sweet-heat",
      "new-york"
    ],
    "items": [
      {
        "name": "Crushed Italian tomatoes, lightly salted",
        "qty": 80,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, torn",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Soppressata piccante, thinly sliced",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Parmigiano-Reggiano, freshly grated",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Hot honey (Mike's Hot Honey or homemade)",
        "qty": 15,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Homemade hot honey: warm 120 g honey with 1–2 tsp chili flakes (or 1 sliced fresh red chilli) and 1 tsp cider vinegar until just steaming, without boiling. Steep 15 min and strain. Makes enough for about 8 pizzas.",
      "Spread the tomatoes, leaving a 2 cm rim, and scatter the torn fior di latte.",
      "Shingle the soppressata over the cheese and shower with Parmigiano.",
      "Bake until the cheese bubbles and the soppressata edges crisp and cup: 90 s at 450 °C, about 7 min on a stone or steel at 260–290 °C.",
      "Drizzle generously with hot honey straight out of the oven."
    ],
    "tip": "Put the soppressata on top of the cheese, not under it. Its rendered fat crisps the edges and mixes with the honey into a spicy glaze.",
    "sources": [
      "https://mikeshothoney.com/blogs/recipes/paulie-gees-hellboy/",
      "https://tastecooking.com/how-to-cook-with-hot-honey/",
      "https://www.restaurantbusinessonline.com/food/how-mikes-hot-honey-sparked-sweet-heat-menu-trend-starting-paulie-gees-brooklyn-pizzeria"
    ]
  },
  {
    "id": "new-haven-white-clam",
    "name": "White Clam Pie",
    "base": "white",
    "era": "contemporary",
    "origin": "Frank Pepe Pizzeria Napoletana, New Haven, 1960s",
    "blurb": "New Haven's most famous pie: freshly shucked littleneck clams, chopped garlic, oregano, grated Pecorino Romano and olive oil on a sauceless crust, with no mozzarella. Frank Pepe served raw Rhode Island littlenecks as an appetizer and in the 1960s began putting them on white pizza.",
    "tags": [
      "seafood",
      "new-haven"
    ],
    "items": [
      {
        "name": "Extra-virgin olive oil",
        "qty": 20,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Pecorino Romano, finely grated",
        "qty": 15,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Dried oregano",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Littleneck clams, freshly shucked, larger ones roughly chopped",
        "qty": 15,
        "unit": "clam",
        "when": "top",
        "note": "about 90 g meat"
      },
      {
        "name": "Garlic, finely chopped",
        "qty": 2,
        "unit": "clove",
        "when": "top",
        "note": ""
      },
      {
        "name": "Lemon wedges",
        "qty": 2,
        "unit": "wedge",
        "when": "finish",
        "note": "optional, for serving"
      }
    ],
    "steps": [
      "Scrub the clams and chill them for 30 min so they relax, then shuck over a bowl to catch the juice. Cut larger clams into 2–3 pieces.",
      "Toss the clams with the garlic, half the oil and 1 tbsp of their strained juice.",
      "Brush the stretched dough with the remaining oil, then dust with the pecorino and oregano.",
      "Spoon the clams and garlic evenly over the dough without letting liquid pool, keeping the rim bare.",
      "Bake until the crust is charred and the clams are only just cooked: about 90 s at 450 °C, or 7–9 min on a steel in a home oven. Clams toughen quickly.",
      "Serve with lemon wedges and an extra thread of oil if you like."
    ],
    "tip": "Use freshly shucked clams only: Pepe's won't serve the pie when fresh clams aren't available. Drain off excess liquor so the centre doesn't go soggy.",
    "sources": [
      "https://newenglandhistoricalsociety.com/birth-new-havens-famous-white-clam-apizza/",
      "https://ooni.com/blogs/recipes/new-haven-style-white-clam-pizza",
      "https://www.sfchronicle.com/food/article/Recipe-Frank-Pepe-style-White-Clam-Pizza-15474995.php"
    ]
  },
  {
    "id": "margherita-sbagliata",
    "name": "Margherita Sbagliata",
    "italian": "Margherita sbagliata",
    "base": "red",
    "era": "contemporary",
    "origin": "Franco Pepe, Pepe in Grani, Caiazzo, 2010s",
    "blurb": "Franco Pepe's 'wrong' Margherita reverses the classic: only buffalo mozzarella goes into the oven, then cold, uncooked tomato purée and a bright basil reduction are piped on afterwards. Pepe created it to showcase the near-lost riccio tomato of Caiazzo, and it has become one of the most imitated pizzas in contemporary Italian pizza.",
    "tags": [
      "vegetarian",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Mozzarella di bufala campana DOP, sliced and drained",
        "qty": 110,
        "unit": "g",
        "when": "top",
        "note": "Identità Golose gives 90 g; home versions use up to 150 g"
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 6,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Tomato passata (riccio or best-quality passata), strained until thick, cold",
        "qty": 70,
        "unit": "g",
        "when": "finish",
        "note": "from about 120 g passata"
      },
      {
        "name": "Basil reduction",
        "qty": 12,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Basil reduction: blanch 50 g basil leaves for a few seconds, shock in iced water and squeeze dry. Blend with 2 tsp extra-virgin olive oil and 2–3 ice cubes to a smooth, bright-green liquid. Put it in a squeeze bottle and refrigerate.",
      "Tomato: let 120 g passata drip through a fine sieve for 30–60 min until thick and creamy. Season with a pinch of salt, put it in a squeeze bottle and chill.",
      "Slice the bufala and drain it on paper towels for 30 min.",
      "Stretch the dough, arrange the bufala slices, drizzle with oil and bake for 90 s–2 min at 420–450 °C. In a home oven, bake the crust for half the time before adding the bufala so it doesn't flood.",
      "Out of the oven, pipe about eight short strips of cold tomato across the pizza and dot it with basil reduction. Serve immediately."
    ],
    "tip": "The contrast is the point: keep the tomato and basil cold and raw, and pipe them on only at the last second so they don't warm through.",
    "sources": [
      "https://appetitomagazine.com/recipes/make-franco-pepes-margherita-sbagliata-pizza",
      "https://www.identitagolose.it/sito/it/12/13553/ricette/margherita-sbagliata.html",
      "https://www.pepeingrani.it/margherita-sbagliata"
    ]
  },
  {
    "id": "mortadella-stracciatella-pistachio",
    "name": "Mortadella e Pistacchio",
    "italian": "Pizza mortadella, stracciatella e pistacchio",
    "base": "white",
    "era": "contemporary",
    "origin": "Italian pizza contemporanea, 2010s",
    "blurb": "A fior di latte bianca topped after baking with silky mortadella, cold stracciatella, pistachio pesto and crushed pistachios. Warm crust, cool cream and Bologna's pistachio–mortadella pairing have made it a fixture on contemporary Italian menus.",
    "tags": [
      "pork",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Fior di latte, diced and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pistachio pesto",
        "qty": 30,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Mortadella di Bologna IGP, sliced paper-thin",
        "qty": 70,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Stracciatella",
        "qty": 70,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Unsalted pistachios, roughly chopped",
        "qty": 8,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Pistachio pesto: blend 100 g unsalted shelled pistachios (ideally Bronte), 15 g Parmigiano, 4 basil leaves and a pinch of salt with 60 ml extra-virgin olive oil, adding 20–40 ml cold water until creamy and spoonable. Makes about 180 g (5–6 pizzas).",
      "Stretch the dough, scatter the fior di latte, drizzle with oil and bake as a plain bianca until the rim is leopard-spotted.",
      "As soon as it comes out, dot the pistachio pesto over the surface.",
      "Drape the mortadella in loose folds rather than laying it flat, then spoon the stracciatella between them.",
      "Finish with the chopped pistachios and a thread of oil."
    ],
    "tip": "Slice the mortadella as thin as possible and fold it loosely so the hot pizza softens the fat without cooking it. (Ken Forkish's version instead tucks about 70 g mortadella under the mozzarella before baking so the exposed edges crisp.)",
    "sources": [
      "https://salumipasini.com/en/pizza-with-mortadella-stracciatella-burrata-and-pistachio-pesto/",
      "https://www.ricettedalmondo.it/pizza-pistacchio-mortadella-e-stracciata.html",
      "https://tastecooking.com/recipes/mortadella-and-pistachio-pizza/",
      "https://www.tavolartegusto.it/ricetta/pesto-di-pistacchio-ricetta/"
    ]
  },
  {
    "id": "nduja-stracciatella-honey",
    "name": "'Nduja, Stracciatella & Honey",
    "italian": "Pizza 'nduja, stracciatella e miele",
    "base": "red",
    "era": "contemporary",
    "origin": "Calabrian 'nduja on contemporary pizza, 2010s (Italy, London, New York)",
    "blurb": "Spreadable, fiery 'nduja from Spilinga melts into the tomato as it bakes, and cold stracciatella and a drizzle of honey added afterwards tame the heat. It is now a standard sweet-heat pie on contemporary menus.",
    "tags": [
      "pork",
      "spicy",
      "sweet-heat",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "San Marzano tomatoes, hand-crushed and salted",
        "qty": 80,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, diced and drained",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "'Nduja di Spilinga, room temperature, in small pinches",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Stracciatella",
        "qty": 60,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Honey (wildflower or chestnut)",
        "qty": 10,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 5,
        "unit": "leaf",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Spread the tomato, leaving a 2 cm rim, and scatter the fior di latte.",
      "Pinch the 'nduja into hazelnut-sized pieces and dot them evenly. They melt and spread as they bake.",
      "Bake until the 'nduja has rendered red oil into the cheese and the rim is charred.",
      "Spoon the stracciatella over, drizzle the honey in thin lines, then add basil and a thread of oil."
    ],
    "tip": "Keep the 'nduja in small pieces and at room temperature. Big cold lumps stay pasty in the middle instead of melting into the sauce.",
    "sources": [
      "https://impasto.pizza/toppings/nduja",
      "https://wandp.com/blogs/fresh-squeeze/nduja-with-stracciatella-wildflower-honey-and-mint",
      "https://www.americastestkitchen.com/articles/5879-what-is-nduja-and-how-do-i-use-it"
    ]
  },
  {
    "id": "carbonara",
    "name": "Carbonara Pizza",
    "italian": "Pizza alla carbonara",
    "base": "white",
    "era": "contemporary",
    "origin": "Rome, late 2010s; Pier Daniele Seu's version at Seu Pizza Illuminati set the template",
    "blurb": "Rome's pasta classic as a pizza. Thin-sliced guanciale crisps on the dough in the oven, then a warm egg-yolk zabaione with pecorino and Parmigiano, shaved pecorino and plenty of black pepper go on afterwards. Cooking the yolk cream gently to about 80 °C keeps it silky and pasteurised without scrambling.",
    "tags": [
      "pork",
      "roman",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Fior di latte, diced and drained",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": "optional; Seu bakes the guanciale alone"
      },
      {
        "name": "Guanciale, rind and pepper crust removed, sliced 1.5 mm",
        "qty": 50,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Carbonara cream (egg-yolk zabaione with pecorino and Parmigiano)",
        "qty": 45,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Pecorino Romano, shaved",
        "qty": 6,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Black pepper, coarsely cracked",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Carbonara cream: whisk 2 egg yolks with a pinch of salt in a bowl over barely simmering water until thick and 75–80 °C, 4–5 min. Off the heat, whisk in 25 g finely grated Pecorino Romano, 10 g Parmigiano and 1 g black pepper. Spoon into a piping bag and let it cool a little. Makes about 90 g (2 pizzas).",
      "Stretch the dough, scatter the fior di latte if using, then lay the guanciale slices over the whole surface.",
      "Bake until the guanciale fat turns translucent and the edges crisp.",
      "Pipe dots or lines of carbonara cream over the hot pizza, then add the shaved pecorino and plenty of cracked pepper."
    ],
    "tip": "Slice the guanciale very thin (about 1.5 mm) so it renders and crisps even in a 90-second bake. Thick lardons stay chewy.",
    "sources": [
      "https://www.pizzatales.it/la-ricetta-della-pizza-carbonara-di-pier-daniele-seu/",
      "https://www.lucianopignataro.it/a/pizza-alla-carbonara-sei-indirizzi-da-non-perdere-a-roma-e-dintorni/192750/",
      "https://eu.ooni.com/en-de/blogs/recipes/la-pizza-carbonara-it-recipe"
    ]
  },
  {
    "id": "cacio-e-pepe",
    "name": "Cacio e Pepe Pizza",
    "italian": "Pizza cacio e pepe",
    "base": "white",
    "era": "contemporary",
    "origin": "Stefano Callegari, Sforno, Rome (opened 2005)",
    "blurb": "Stefano Callegari's Roman icon. Ice placed on the raw dough melts in the oven and leaves the surface wet and starchy like pasta water. A heavy shower of Pecorino Romano and black pepper then melts into a creamy cacio e pepe sauce on the hot crust. There is no mozzarella.",
    "tags": [
      "vegetarian",
      "roman",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Ice cubes (or about 60 g crushed ice)",
        "qty": 3,
        "unit": "cube",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano, very finely grated",
        "qty": 50,
        "unit": "g",
        "when": "finish",
        "note": "Callegari's restaurant batch works out to about 45 g per pizza; his home recipe uses more"
      },
      {
        "name": "Black peppercorns, toasted and coarsely cracked",
        "qty": 3,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Toast the peppercorns in a dry pan until fragrant, crack them coarsely and mix with the pecorino.",
      "Stretch the dough with a pronounced rim so it will hold the meltwater.",
      "Just before loading, put the ice in the centre (or scatter crushed ice evenly).",
      "Bake until the crust is cooked but the centre is still wet and tacky: 90–120 s at about 425 °C, or 10–12 min at 250 °C on a stone in a home oven.",
      "Immediately shower with the pecorino and pepper so the cheese melts into the starchy water. Drizzle with oil and serve at once."
    ],
    "tip": "Grate the pecorino on a microplane. A fine snow melts into a cream; coarse shreds just sweat and clump.",
    "sources": [
      "https://www.cbsnews.com/news/recipe-cacio-e-pepe-pizza-by-stefano-callegari/",
      "https://katieparla.com/stefano-callegari-rome-cacio-e-pepe-pizza/",
      "https://www.agrodolce.it/ricette/pizza-cacio-e-pepe"
    ]
  },
  {
    "id": "pesto-potato-green-bean",
    "name": "Pesto Genovese, Potato & Green Bean",
    "italian": "Pizza alla genovese (pesto, patate e fagiolini)",
    "base": "green",
    "era": "contemporary",
    "origin": "Liguria's trofie al pesto translated to pizza; contemporary Italian pizzerias",
    "blurb": "The Ligurian pasta trio of pesto, potato and green beans on pizza. Potato and beans bake on a fior di latte base; the pesto goes on afterwards so it stays bright and raw, and burrata or stracciatella adds creaminess.",
    "tags": [
      "vegetarian",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Fior di latte, diced and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Waxy potato, boiled and sliced 3 mm",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Green beans, blanched and halved",
        "qty": 35,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Parmigiano or pecorino, grated",
        "qty": 8,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pesto Genovese",
        "qty": 35,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Burrata or stracciatella",
        "qty": 70,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Pine nuts, toasted",
        "qty": 8,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Pesto: pound or pulse 30 g young basil leaves with a pinch of coarse salt and ½ small garlic clove. Add 8 g pine nuts, then 20 g Parmigiano and 8 g Fiore Sardo pecorino, and loosen with 60 ml Ligurian extra-virgin olive oil. Makes about 125 g (3–4 pizzas). Keep cold.",
      "Boil the potato in salted water until just tender, cool and slice 3 mm thick. Blanch the green beans for 3 min and shock them in iced water.",
      "Scatter the fior di latte, overlap the potato slices and beans, dust with grated cheese and add a thread of oil.",
      "Bake until the potato edges colour.",
      "Dot with the pesto, tear the burrata over and scatter the toasted pine nuts."
    ],
    "tip": "Never bake the pesto: heat turns basil dark and bitter. Add it only once the pizza is out of the oven.",
    "sources": [
      "https://www.agrodolce.it/ricette/pizza-genova",
      "https://www.mangiareinliguria.it/pesto-genovese/pesto-genovese-recipe",
      "https://www.ilpestodipra.com/it/news-162/pizza-stracchino-patate-fagiolini-e-pesto"
    ]
  },
  {
    "id": "pumpkin-sausage-provola",
    "name": "Pumpkin Cream, Sausage & Smoked Provola",
    "italian": "Pizza crema di zucca, salsiccia e provola",
    "base": "other",
    "era": "contemporary",
    "origin": "Autumn classic in Italian (especially Campanian) pizzerias",
    "blurb": "An autumn favourite in Italian pizzerias: sweet roasted-pumpkin cream replaces tomato, with pork sausage and smoked provola baked on top. The smoke and salt of the provola stop the pumpkin from tasting cloying.",
    "tags": [
      "pork",
      "autumn",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Pumpkin cream",
        "qty": 90,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Smoked provola, diced or julienned",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Italian pork sausage (fennel), casing removed",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Sage leaves, rubbed with oil",
        "qty": 4,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Parmigiano-Reggiano, grated",
        "qty": 6,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Pumpkin cream: toss 400 g peeled pumpkin cubes (delica or butternut) with 15 g olive oil, salt and a rosemary sprig. Roast at 200 °C for 25–30 min until soft. Blend with 25 g olive oil and a splash of water to a thick, spreadable cream and season. Makes about 350 g (4 pizzas).",
      "Spread the pumpkin cream thinly, leaving a 2 cm rim.",
      "Scatter the provola, pinch the sausage into small nuggets over the top and add the sage leaves.",
      "Bake until the sausage is cooked through and browned at the edges.",
      "Finish with grated Parmigiano and a thread of oil."
    ],
    "tip": "Spread the cream thinly, because a thick layer steams the dough. Sausage nuggets no bigger than a hazelnut cook through even in a 90-second bake.",
    "sources": [
      "https://www.formagginobili.it/en/pizza-provola-zucca-salsiccia-porcini/",
      "https://www.agrodolce.it/ricette/pizza-paesana-con-zucca-e-salsiccia",
      "https://www.galbani.it/ricette/pizza-gourmet-zucca-e-salsiccia"
    ]
  },
  {
    "id": "tie-dye-vodka-pesto",
    "name": "Tie-Dye (Vodka Sauce & Pesto)",
    "base": "other",
    "era": "contemporary",
    "origin": "Rubirosa, Nolita, NYC, 2011; vodka pie from the family's Joe & Pat's, Staten Island",
    "blurb": "Rubirosa's signature thin-crust pie: swirls of tomato sauce and the Pappalardo family's vodka sauce under pools of fresh mozzarella, with basil pesto spiralled on at the table. The vodka pie came from Joe & Pat's on Staten Island; the Tie-Dye made it a New York icon.",
    "tags": [
      "vegetarian",
      "new-york"
    ],
    "items": [
      {
        "name": "Vodka sauce",
        "qty": 50,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Tomato sauce (cooked, lightly seasoned)",
        "qty": 40,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fresh mozzarella, in pieces",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": "or low-moisture mozzarella for a home-oven bake"
      },
      {
        "name": "Pecorino Romano, finely grated",
        "qty": 6,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Basil pesto, loosened with oil, in a squeeze bottle",
        "qty": 15,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Vodka sauce: melt 15 g butter and sweat 1 minced shallot and 1 garlic clove for 3 min. Add 30 g tomato paste and cook until brick-red, about 2 min. Add 40 ml vodka and reduce by half, then add 250 g crushed tomatoes and simmer 15 min. Stir in 60 ml heavy cream and 10 g Parmigiano, season and cool. Makes about 350 g (6–7 pizzas).",
      "Stretch the dough thinner than for a Neapolitan pie, leaving only a slim rim.",
      "Spoon the tomato sauce and vodka sauce in alternating rings or spirals without mixing them.",
      "Scatter the mozzarella in pools and dust with pecorino.",
      "Bake until the crust is crisp and the mozzarella just melted.",
      "Spiral the pesto over the pie from the centre outwards."
    ],
    "tip": "Thin the pesto with a little extra oil so it pipes in a fine line. Thick pesto blobs instead of swirling.",
    "sources": [
      "https://blog.resy.com/2024/10/rubirosa-nyc/",
      "https://appetitomagazine.com/features/how-to-make-rubirosas-famous-tie-dye-pizza",
      "https://pizzaeveryfriday.substack.com/p/how-to-make-rubirosas-tie-dye-pizza",
      "https://tastecooking.com/recipes/vodka-sauce-and-sausage-pizza-2/"
    ]
  },
  {
    "id": "cal-italia",
    "name": "Cal Italia (Fig, Gorgonzola & Prosciutto)",
    "base": "white",
    "era": "contemporary",
    "origin": "Tony Gemignani, Food Network Pizza Champion Challenge, 2006; Tony's Pizza Napoletana, San Francisco",
    "blurb": "Tony Gemignani's award-winning white pie: Asiago and mozzarella baked first, Gorgonzola and fig jam added part-way through, then torn prosciutto and a spiral of balsamic glaze. It is sweet, salty and funky all at once.",
    "tags": [
      "pork",
      "sweet",
      "california"
    ],
    "items": [
      {
        "name": "Aged Asiago, shaved with a peeler",
        "qty": 15,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Whole-milk mozzarella, shredded",
        "qty": 110,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Gorgonzola dolce, in small pieces",
        "qty": 30,
        "unit": "g",
        "when": "top",
        "note": "added part-way through the bake"
      },
      {
        "name": "Fig jam",
        "qty": 25,
        "unit": "g",
        "when": "top",
        "note": "in ¼-tsp dollops, added with the Gorgonzola"
      },
      {
        "name": "Prosciutto di Parma, thinly sliced and torn into strips",
        "qty": 55,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Balsamic glaze",
        "qty": 8,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Shave the Asiago over the dough, leaving a 2 cm border, then spread the mozzarella evenly over it.",
      "Home oven: bake until nearly done (about 6–7 min), slide onto the peel, scatter the Gorgonzola and dot the fig jam in ¼-tsp dollops, then return for 1–2 min. In a 90-second wood-fired oven, add the Gorgonzola and jam before loading.",
      "Tear the prosciutto lengthwise into 2–3 strips and drape it over each slice.",
      "Finish with a thin spiral of balsamic glaze."
    ],
    "tip": "Use the fig jam in tiny dots. Too much turns it into dessert; the Gorgonzola and prosciutto should lead.",
    "sources": [
      "https://www.7x7.com/secret-recipe-tony-gemignanis-cal-italia-pizza-1786950986.html",
      "https://www.joecontent.net/how-to-make-tony-gemignanis-award-winning-cal-italia-pizza/",
      "https://www.americastestkitchen.com/cookscountry/recipes/8095-fig-gorgonzola-and-prosciutto-pizza"
    ]
  },
  {
    "id": "wild-mushroom-truffle-bianca",
    "name": "Wild Mushroom & Truffle Bianca",
    "italian": "Pizza bianca funghi e tartufo",
    "base": "white",
    "era": "contemporary",
    "origin": "Italian autumn bianca; contemporary pizzerias",
    "blurb": "A white pizza of sautéed mixed wild mushrooms over fior di latte and nutty fontina, finished after baking with black truffle and Parmigiano. Cooking the mushrooms first drives off their water and concentrates their flavour, so the crust stays crisp.",
    "tags": [
      "vegetarian",
      "autumn"
    ],
    "items": [
      {
        "name": "Fior di latte, diced and drained",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fontina Val d'Aosta (or taleggio), diced",
        "qty": 40,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Mixed mushrooms (porcini, chanterelle, cremini), sliced and sautéed",
        "qty": 180,
        "unit": "g",
        "when": "top",
        "note": "raw weight; about 90 g after cooking"
      },
      {
        "name": "Garlic, minced (for the sauté)",
        "qty": 1,
        "unit": "clove",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh thyme leaves",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      },
      {
        "name": "Parmigiano-Reggiano, grated",
        "qty": 8,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Fresh black truffle, shaved",
        "qty": 4,
        "unit": "g",
        "when": "finish",
        "note": "or 8 g black-truffle paste, or a few drops of truffle oil"
      },
      {
        "name": "Flat-leaf parsley, chopped",
        "qty": 2,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 5,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Sauté the mushrooms in 10 g olive oil over high heat, in batches, until browned and dry, 6–8 min. Add the garlic and thyme for the last minute and season.",
      "Scatter the fior di latte and fontina over the dough, then the mushrooms.",
      "Bake until the cheese bubbles and the mushroom edges crisp.",
      "Finish with Parmigiano, the truffle, parsley and a thread of oil."
    ],
    "tip": "Oven heat destroys truffle aroma, so add truffle only after baking, and go light: a few drops of truffle oil is plenty.",
    "sources": [
      "https://www.americastestkitchen.com/recipes/1047-wild-mushroom-pizza-with-sage-fontina-and-parmesan",
      "https://www.agrodolce.it/ricette/pizza-al-tartufo-nero-porcini-e-bufala",
      "https://blog.giallozafferano.it/giustopergusto/pizza-porcini-tartufo-e-provola/"
    ]
  },
  {
    "id": "fennel-sausage-panna-scallion",
    "name": "Fennel Sausage, Panna & Scallion",
    "base": "white",
    "era": "contemporary",
    "origin": "Pizzeria Mozza, Los Angeles, 2006 (Nancy Silverton)",
    "blurb": "Nancy Silverton's favourite pie at Pizzeria Mozza: softly whipped cream spread as the sauce, par-roasted fennel sausage, a little mozzarella and bias-cut scallions, finished with fennel pollen. It is a rich, sweet, aromatic white sausage pie.",
    "tags": [
      "pork",
      "california"
    ],
    "items": [
      {
        "name": "Heavy cream, whipped to soft peaks",
        "qty": 60,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil (for the rim)",
        "qty": 10,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fennel sausage, uncooked",
        "qty": 110,
        "unit": "g",
        "when": "top",
        "note": "rolled into two balls and par-roasted"
      },
      {
        "name": "Low-moisture mozzarella, 1 cm cubes",
        "qty": 30,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Scallions, thinly sliced on a sharp bias",
        "qty": 3,
        "unit": "scallion",
        "when": "top",
        "note": "or 60 g very thinly sliced red onion"
      },
      {
        "name": "Fennel pollen",
        "qty": 2,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Flaky salt",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Roll the sausage into two balls and roast at 250 °C for 6 min to render some fat. Cool, then break each ball into 4 pieces.",
      "Brush the rim with olive oil and spread the whipped cream to within 2.5 cm of the edge.",
      "Scatter the sausage pieces, mozzarella cubes and scallions.",
      "Bake until the cream has set with blistered brown spots and the crust is golden: 8–12 min in a home oven, about 2 min at 400–450 °C.",
      "Finish with fennel pollen and a pinch of salt."
    ],
    "tip": "Whip the cream only to soft peaks. It spreads like a sauce and bakes into a creamy, lightly browned layer instead of running off the dough.",
    "sources": [
      "https://www.oprah.com/food/fennel-sausage-panna-and-scallions-pizza-recipe-mozza-cookbook",
      "https://www.recipezazz.com/recipe/fennel-sausage-panna-scallion-pizza-26031"
    ]
  },
  {
    "id": "bianco-rosa",
    "name": "Rosa",
    "base": "white",
    "era": "contemporary",
    "origin": "Pizzeria Bianco, Phoenix (Chris Bianco)",
    "blurb": "Chris Bianco's signature pie: Parmigiano-Reggiano, paper-thin red onion, rosemary and Arizona pistachios, with no tomato or mozzarella. It was inspired by a Ligurian focaccia with cheese and sesame (and the onion of a bialy). The Parmigiano melts into a golden, oily layer that holds everything together.",
    "tags": [
      "vegetarian",
      "arizona"
    ],
    "items": [
      {
        "name": "Parmigiano-Reggiano, coarsely grated",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": "Bianco's cookbook works out to about 70 g per 12-inch pie"
      },
      {
        "name": "Red onion, shaved paper-thin",
        "qty": 50,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fresh rosemary leaves, finely chopped",
        "qty": 1,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Unsalted roasted pistachios, roughly chopped",
        "qty": 25,
        "unit": "g",
        "when": "top",
        "note": "in a 450 °C+ oven add for the last 20–30 s"
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 10,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Dress the shaved onion with a few drops of olive oil and a pinch of salt.",
      "Spread the Parmigiano over the dough to within 1 cm of the rim.",
      "Top with the onion and rosemary, then scatter the pistachios.",
      "Bake until the cheese forms a golden, bubbling crust. In a very hot oven, keep the pistachios back and add them for the last 20–30 s so they toast without burning.",
      "Finish with a generous drizzle of extra-virgin olive oil."
    ],
    "tip": "Grate the Parmigiano coarsely, not to powder. Fine cheese scorches before the crust is done, while coarse gratings melt into a crisp, oily layer.",
    "sources": [
      "https://www.washingtonpost.com/recipes/pizzeria-biancos-rosa-pizza/",
      "https://www.tastingtable.com/1341253/chris-bianco-inspiration-iconic-rosa-pizza/",
      "https://santabarbarabaker.com/chris-biancos-pizza-rosa-in-the-ooni-pizza-oven/"
    ]
  },
  {
    "id": "bianco-wiseguy",
    "name": "Wiseguy",
    "base": "white",
    "era": "contemporary",
    "origin": "Pizzeria Bianco, Phoenix (Chris Bianco)",
    "blurb": "A Pizzeria Bianco best-seller alongside the Rosa: wood-roasted onion, house-smoked mozzarella and fennel sausage, no tomato. The smoke comes three ways (oven, onion and cheese), balanced by the sweet onion and the fennel in the sausage.",
    "tags": [
      "pork",
      "arizona",
      "smoky"
    ],
    "items": [
      {
        "name": "Extra-virgin olive oil",
        "qty": 8,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Smoked mozzarella, sliced or torn",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Whole roasted onion, peeled and cut into strips",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Fennel sausage, casing removed",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Roast a whole unpeeled onion (about 250 g) in the embers of a wood fire, or at 220 °C for 45–60 min, until soft and caramelised. Cool, peel and cut into strips or wedges. One onion covers about 3 pizzas.",
      "Brush the dough lightly with olive oil and lay down the smoked mozzarella.",
      "Scatter the onion and pinch the sausage over in small pieces.",
      "Bake until the sausage is browned and the cheese bubbling."
    ],
    "tip": "Roast the onion whole in its skin. It steams in its own juice and turns soft, sweet and slightly chewy, close to Bianco's wood-roasted onion, without the bitterness of fast-fried onion.",
    "sources": [
      "https://roadfood.com/restaurants/pizzeria-bianco",
      "https://www.goldbelly.com/restaurants/pizzeria-bianco/wiseguy-wood-fired-pizza-4-pack",
      "https://www.eatyourbooks.com/library/recipes/1866962/wiseguy-pizza"
    ]
  },
  {
    "id": "burrata-red-yellow-cherry-tomato",
    "name": "Burrata & Red and Yellow Cherry Tomatoes",
    "italian": "Pizza pomodorini gialli e rossi e burrata",
    "base": "red",
    "era": "contemporary",
    "origin": "Contemporary Neapolitan pizzerias, 2010s",
    "blurb": "A contemporary Margherita: sweet yellow piennolo-style tomato as the base, halved red cherry tomatoes and fior di latte baked on top, then a burrata torn over after the bake with basil and raw olive oil. It contrasts hot and cool, sweet and sharp.",
    "tags": [
      "vegetarian",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Yellow cherry tomatoes (pomodorino giallo, tinned or fresh), hand-crushed",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, diced and drained",
        "qty": 60,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Red cherry or datterini tomatoes, halved",
        "qty": 70,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Burrata",
        "qty": 100,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Fresh basil",
        "qty": 6,
        "unit": "leaf",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 8,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Flaky salt",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Crush the yellow tomatoes by hand with a pinch of salt. Season the halved red tomatoes with salt and a little oil and leave them for 15 min.",
      "Spread the yellow tomato thinly, scatter the fior di latte, then add the red tomatoes cut-side up.",
      "Bake until the red tomatoes blister and slump.",
      "Tear the burrata over the hot pizza and finish with basil, raw olive oil and flaky salt."
    ],
    "tip": "Drain the burrata and let it lose its fridge chill for about 20 minutes. Ice-cold burrata cools the whole pizza.",
    "sources": [
      "https://altacucina.co/recipes/pizza-burrata-datterini-e-pesto-di-basilico",
      "https://experience-fresh.panasonic.eu/it/recipe/pizza-napoletana-con-pesto-pomodorini-gialli-e-burrata/",
      "https://www.ricettemiele.it/le-nostre-ricette/pizza-napoletana-con-provola-pomodorino-giallo-rosso-e-olive-di-gaeta"
    ]
  },
  {
    "id": "provola-e-pepe",
    "name": "Provola e Pepe",
    "italian": "Pizza provola e pepe",
    "base": "red",
    "era": "contemporary",
    "origin": "Naples; Salvatore Salvo's version is a benchmark, and Vincenzo Capuano won the Caputo Trophy with his",
    "blurb": "A modern Neapolitan favourite: hand-crushed tomato, smoked provola, basil and a bold amount of freshly ground pepper. Simple, smoky and pungent, it shows off a good dough as well as a Margherita does.",
    "tags": [
      "vegetarian",
      "neapolitan",
      "smoky"
    ],
    "items": [
      {
        "name": "Whole peeled tomatoes (Gragnano or San Marzano), hand-crushed and salted",
        "qty": 100,
        "unit": "g",
        "when": "base",
        "note": "Salvo uses 110 g"
      },
      {
        "name": "Basil leaves, torn",
        "qty": 5,
        "unit": "leaf",
        "when": "top",
        "note": ""
      },
      {
        "name": "Smoked provola, cut in wide julienne",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": "Salvo uses 110 g"
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 6,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground (Salvo blends Sarawak black, Sarawak gold and Timut)",
        "qty": 2,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Crush the tomatoes by hand with salt and spread to within 2 cm of the rim, then tear the basil over.",
      "Lay the provola in wide strips, concentrating it towards the outer ring, and drizzle with oil.",
      "Bake: 60–90 s at 430–480 °C, or 6–8 min on a steel in a home oven.",
      "Grind the pepper generously over the pizza as soon as it comes out."
    ],
    "tip": "Put most of the provola towards the outside of the pizza. It melts inwards and keeps the centre from going soupy (Salvo spreads it around the circumference).",
    "sources": [
      "https://www.finedininglovers.it/esplora/ricette/pizza-provola-e-pepe-salvatore-salvo",
      "https://www.scattidigusto.it/pizzeria-vincenzo-capuano-a-roma",
      "https://www.zafferano.org/arguments/provola-e-pepe/"
    ]
  },
  {
    "id": "ciro-salvo-pizza-e-patate",
    "name": "Pizza e Patate",
    "italian": "Pizza e patate",
    "base": "other",
    "era": "contemporary",
    "origin": "Ciro Salvo, 50 Kalò, Naples",
    "blurb": "Ciro Salvo's tribute to Neapolitan pasta e patate. The base is a potato cream cooked with celery, carrot and Parmigiano rinds; on top go smoked provola from Agerola and cubes of 24-month Parmigiano, finished with black pepper and raw olive oil.",
    "tags": [
      "neapolitan",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Potato cream",
        "qty": 100,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Smoked provola (ideally Agerola), diced",
        "qty": 90,
        "unit": "g",
        "when": "top",
        "note": "Salvo lists 100 g"
      },
      {
        "name": "Parmigiano-Reggiano 24 months, small cubes",
        "qty": 15,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Black pepper, freshly ground",
        "qty": 0,
        "unit": "pinch",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil (raw)",
        "qty": 8,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Potato cream: simmer 400 g peeled floury potatoes in chunks with 1 celery stalk, 1 carrot and a Parmigiano rind (Salvo also adds pork rind, as in pasta e patate) in lightly salted water just to cover, until falling apart, 25–30 min. Remove the rinds and blend the vegetables with a little cooking water and 20 g olive oil to a thick, spreadable cream. Makes enough for about 4 pizzas.",
      "Spread the potato cream thinly to within 2 cm of the rim.",
      "Scatter the provola and Parmigiano cubes.",
      "Bake until the provola is molten and the rim is spotted.",
      "Finish with black pepper and a thread of raw extra-virgin olive oil."
    ],
    "tip": "Keep the cream thick and the layer thin, like a spread. A loose purée soaks the dough.",
    "sources": [
      "https://www.finedininglovers.it/esplora/ricette/pizza-e-patate",
      "https://www.lucianopignataro.it/a/napoli-ciro-salvo-presenta-la-sua-pizza-patate/136766/"
    ]
  },
  {
    "id": "ciro-salvo-nerano",
    "name": "Nerano",
    "italian": "Pizza Nerano",
    "base": "other",
    "era": "contemporary",
    "origin": "Ciro Salvo, 50 Kalò, Naples",
    "blurb": "Ciro Salvo's pizza version of spaghetti alla Nerano from the Amalfi Coast: zucchini cream and fior di latte, topped with crisp fried zucchini, shaved Provolone del Monaco and fresh mint.",
    "tags": [
      "vegetarian",
      "italian-contemporary"
    ],
    "items": [
      {
        "name": "Zucchini cream",
        "qty": 70,
        "unit": "g",
        "when": "base",
        "note": ""
      },
      {
        "name": "Fior di latte, diced and drained",
        "qty": 80,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Zucchini, diced 1 cm and fried",
        "qty": 60,
        "unit": "g",
        "when": "finish",
        "note": "from about 120 g raw"
      },
      {
        "name": "Provolone del Monaco DOP, shaved",
        "qty": 15,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Fresh mint",
        "qty": 5,
        "unit": "leaf",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 6,
        "unit": "g",
        "when": "finish",
        "note": ""
      }
    ],
    "steps": [
      "Zucchini cream: sweat 300 g sliced zucchini with ½ small onion in 20 g olive oil, covered, until very soft (10–12 min). Blend with a few mint or basil leaves and season. Makes about 4 pizzas.",
      "Fry 120 g diced zucchini in olive or sunflower oil at 170 °C until golden, 3–4 min. Drain, then salt.",
      "Spread the zucchini cream, scatter the fior di latte and bake.",
      "Top with the fried zucchini, shaved provolone, torn mint and a thread of oil."
    ],
    "tip": "Salt the diced zucchini only after frying. Salting first draws out water, and they steam instead of crisping.",
    "sources": [
      "https://www.50toppizza.it/en/referenza/50-kalo-5/",
      "https://www.scattidigusto.it/50-kalo-pizzeria-roma-ciro-salvo-recensione",
      "https://www.scattidigusto.it/le-migliori-pizze-in-estate-nerano-e-melanzane-di-ciro-salvo-da-50-kalo"
    ]
  },
  {
    "id": "motorino-brussels-sprout-pancetta",
    "name": "Brussels Sprout & Pancetta",
    "base": "white",
    "era": "contemporary",
    "origin": "Motorino, Brooklyn, 2008 (Mathieu Palombino)",
    "blurb": "Motorino's cult white pie: loose Brussels sprout leaves, smoked pancetta, garlic and pecorino over fior di latte. The leaves char and crisp at the tips in the hot oven while the pancetta renders over them.",
    "tags": [
      "pork",
      "new-york"
    ],
    "items": [
      {
        "name": "Fior di latte, torn",
        "qty": 100,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Brussels sprouts, cored and separated into leaves",
        "qty": 50,
        "unit": "g",
        "when": "top",
        "note": "about 5–6 sprouts"
      },
      {
        "name": "Smoked pancetta, finely diced",
        "qty": 45,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Garlic, thinly sliced",
        "qty": 1,
        "unit": "clove",
        "when": "top",
        "note": ""
      },
      {
        "name": "Pecorino Romano, grated",
        "qty": 10,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Extra-virgin olive oil",
        "qty": 10,
        "unit": "g",
        "when": "top",
        "note": ""
      },
      {
        "name": "Sea salt",
        "qty": 0,
        "unit": "pinch",
        "when": "top",
        "note": ""
      }
    ],
    "steps": [
      "Trim the stem end of each sprout, cut out the core and separate the leaves, discarding any damaged outer ones. Toss the leaves with 1 tsp of the oil.",
      "Tear the fior di latte over the dough and scatter the leaves on top.",
      "Scatter the garlic and pancetta, dust with pecorino and a pinch of salt, and drizzle with the remaining oil.",
      "Bake until the leaf tips are charred and the pancetta crisp: about 90 s at 450 °C, or 8–10 min on a stone at maximum heat."
    ],
    "tip": "Oil the leaves before they go on. Oiled leaves blister and crisp; dry ones just burn.",
    "sources": [
      "https://www.villagevoice.com/making-motorinos-brussels-sprout-and-pancetta-pizza/",
      "https://www.food.com/recipe/brussels-sprout-and-pancetta-pizza-425626",
      "https://www.goldbelly.com/restaurants/motorino-pizzeria/neapolitan-pizza-best-seller-6-pack"
    ]
  }
];

export const CLASSIC_BY_ID = new Map(CLASSICS.map((c) => [c.id, c]));
