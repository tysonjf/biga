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
    "id": "mortadella-e-pistacchio",
    "name": "Mortadella e Pistacchio",
    "italian": "Pizza Mortadella e Pistacchio",
    "base": "white",
    "era": "classic",
    "origin": "Italy, 21st century (contemporary classic)",
    "blurb": "A white pizza finished out of the oven with paper-thin Mortadella Bologna IGP, creamy stracciatella and crushed pistachios. It is a contemporary classic, now on pizzeria menus from Rome to Naples and beyond.",
    "tags": [
      "pork"
    ],
    "items": [
      {
        "name": "Fior di latte, cut into strips and drained",
        "qty": 70,
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
        "name": "Mortadella Bologna IGP, sliced paper-thin",
        "qty": 60,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Stracciatella (or burrata)",
        "qty": 60,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Pistachio pesto or cream (optional)",
        "qty": 15,
        "unit": "g",
        "when": "finish",
        "note": ""
      },
      {
        "name": "Pistachios (ideally from Bronte), roughly chopped",
        "qty": 10,
        "unit": "g",
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
      "Open the dough, scatter the fior di latte and drizzle with the oil.",
      "Bake at 430–480 °C for 60–90 s (home oven: 6–8 min).",
      "Let the pizza rest for 30 s, then drape the mortadella in loose ruffles and spoon the stracciatella in between.",
      "Add small dots of pistachio pesto and scatter over the chopped pistachios. Finish with a little lemon zest and raw oil if you like."
    ],
    "tip": "The mortadella always goes on after the bake. Baking makes it sweat fat and lose its aroma, while the heat of the finished pizza just warms it until silky. Paper-thin slices drape best.",
    "sources": [
      "https://blog.giallozafferano.it/rossellainpadella/pizza-bianca-con-mortadella-stracciatella-e-pistacchi/",
      "https://au.gozney.com/blogs/recipes/mortadella-panuozzo-recipe",
      "https://pizzatoday.com/recipes/pizzas/mortadella-and-pistachio-pizza"
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
  }
];

export const CLASSIC_BY_ID = new Map(CLASSICS.map((c) => [c.id, c]));
