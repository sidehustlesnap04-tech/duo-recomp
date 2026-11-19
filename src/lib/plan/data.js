/* Ported verbatim from the prototype: Egyptian meal database, training splits,
   exercise library and cardio ladder. Prices from Egyptian market reports, 14-18 Nov 2026. */
/* eslint-disable */
/* Plan data. Macros per 100 g of the food in the state named in `st`.
   price = EGP per kg as bought; yf = grams to buy per gram listed; src: r = reported Nov 2026, e = estimate */
export const TARGETS = { kcal: 2200, p: 150, pMin: 130, c: 270, f: 60, fiber: 32, water: 3.2, sleep: 7.5 };
export const PROFILE = { startWeight: 85.5, height: 176, age: 23, bf: 20.6, ffm: 67.0 };

export const ING = {
  egg:      { n: 'Eggs (whole)', st: 'raw', k: 143, p: 12.6, c: 0.7, f: 9.5, price: 90, cat: 'Proteins', src: 'r', buy: 'eggs, ~50 g each (tray of 30 ≈ 130 EGP)' },
  chicken:  { n: 'Chicken breast, skinless', st: 'cooked', k: 165, p: 31, c: 0, f: 3.6, price: 250, yf: 1.38, cat: 'Proteins', src: 'r', buy: 'raw breast fillets (pane)' },
  chickenR: { n: 'Chicken breast, skinless', st: 'raw', k: 120, p: 22.5, c: 0, f: 2.6, price: 250, cat: 'Proteins', src: 'r', buy: 'raw breast fillets (pane)', same: 'chicken' },
  liver:    { n: 'Chicken liver', st: 'cooked', k: 167, p: 24.5, c: 0.9, f: 6.5, price: 110, yf: 1.4, cat: 'Proteins', src: 'e', buy: 'raw chicken liver' },
  tuna:     { n: 'Tuna, canned in water, drained', st: 'as sold', k: 116, p: 25.5, c: 0, f: 0.8, price: 540, cat: 'Proteins', src: 'e', buy: 'cans (185 g can ≈ 120 g drained ≈ 65 EGP)' },
  tilapia:  { n: 'Tilapia (bolti), grilled, flesh only', st: 'cooked', k: 128, p: 26, c: 0, f: 2.7, price: 90, yf: 3.1, cat: 'Proteins', src: 'r', buy: 'whole fish (about 3 g whole per 1 g cooked flesh)' },
  turkey:   { n: 'Smoked turkey slices', st: 'as sold', k: 105, p: 17, c: 2, f: 3, price: 350, cat: 'Proteins', src: 'e' },
  whey:     { n: 'Whey protein isolate (optional)', st: 'as sold', k: 367, p: 83, c: 3.3, f: 1.7, price: 2800, cat: 'Other essentials', src: 'e', buy: 'you already have this' },
  lentil:   { n: 'Lentils (yellow or brown)', st: 'raw', k: 352, p: 24.6, c: 63, f: 1.1, price: 70, cat: 'Proteins', src: 'r' },
  lentilC:  { n: 'Lentils, boiled', st: 'cooked', k: 116, p: 9, c: 20, f: 0.4, price: 70, yf: 0.4, cat: 'Proteins', src: 'r', buy: 'dry lentils', same: 'lentil' },
  ful:      { n: 'Ful medames, plain (no oil)', st: 'cooked', k: 110, p: 7.6, c: 19.7, f: 0.4, price: 62, yf: 0.42, cat: 'Proteins', src: 'r', buy: 'dry fava beans (or buy cooked from a cart)' },
  termis:   { n: 'Termis (lupini beans), rinsed', st: 'cooked', k: 119, p: 15.6, c: 9.9, f: 2.9, price: 60, cat: 'Proteins', src: 'e', buy: 'ready-to-eat termis' },
  areesh:   { n: 'Areesh cheese (جبنة قريش)', st: 'as sold', k: 90, p: 14, c: 3.5, f: 2, price: 90, cat: 'Dairy', src: 'e' },
  lightCh:  { n: 'Light white cheese', st: 'as sold', k: 160, p: 13, c: 3, f: 10.5, price: 180, cat: 'Dairy', src: 'e' },
  milk:     { n: 'Milk, half-fat', st: 'as sold', k: 46, p: 3.3, c: 4.8, f: 1.5, price: 42, cat: 'Dairy', src: 'e' },
  zabadi:   { n: 'Zabadi (plain yogurt), light', st: 'as sold', k: 45, p: 4, c: 5.5, f: 1, price: 75, cat: 'Dairy', src: 'e', buy: 'cups of about 105 g' },
  rayeb:    { n: 'Rayeb', st: 'as sold', k: 55, p: 3.2, c: 4.5, f: 2.8, price: 50, cat: 'Dairy', src: 'e' },
  baladi:   { n: 'Baladi bread', st: 'as sold', k: 250, p: 9, c: 50, f: 1.2, price: 22, cat: 'Carbohydrates', src: 'e', buy: 'loaves of about 90 g (≈ 2 EGP unsubsidised)' },
  rice:     { n: 'White rice, plain', st: 'cooked', k: 130, p: 2.7, c: 28, f: 0.3, price: 35, yf: 0.36, cat: 'Carbohydrates', src: 'r', buy: 'dry rice' },
  pasta:    { n: 'Pasta', st: 'raw', k: 371, p: 13, c: 75, f: 1.5, price: 30, cat: 'Carbohydrates', src: 'r' },
  oats:     { n: 'Oats', st: 'raw', k: 379, p: 13.2, c: 67.7, f: 6.5, price: 110, cat: 'Carbohydrates', src: 'e' },
  potato:   { n: 'Potatoes', st: 'raw', k: 77, p: 2, c: 17, f: 0.1, price: 20, cat: 'Carbohydrates', src: 'r' },
  potatoB:  { n: 'Potatoes, boiled', st: 'cooked', k: 87, p: 1.9, c: 20, f: 0.1, price: 20, cat: 'Carbohydrates', src: 'r', buy: 'raw potatoes', same: 'potato' },
  batata:   { n: 'Sweet potato (batata), baked', st: 'cooked', k: 90, p: 2, c: 20.7, f: 0.2, price: 18, yf: 1.2, cat: 'Carbohydrates', src: 'e', buy: 'raw sweet potato' },
  salad:    { n: 'Salad vegetables (tomato, cucumber, greens)', st: 'raw', k: 18, p: 0.9, c: 3.9, f: 0.2, price: 20, cat: 'Vegetables', src: 'r' },
  veg:      { n: 'Cooked vegetables (zucchini, green beans, carrots)', st: 'cooked', k: 35, p: 2, c: 7, f: 0.2, price: 22, yf: 1.1, cat: 'Vegetables', src: 'r', buy: 'raw vegetables' },
  banana:   { n: 'Banana', st: 'peeled', k: 89, p: 1.1, c: 22.8, f: 0.3, price: 30, yf: 1.5, cat: 'Fruits', src: 'e', buy: 'bananas with peel' },
  orange:   { n: 'Orange', st: 'peeled', k: 47, p: 0.9, c: 11.8, f: 0.1, price: 18, yf: 1.4, cat: 'Fruits', src: 'r', buy: 'whole oranges' },
  guava:    { n: 'Guava', st: 'raw', k: 68, p: 2.6, c: 14.3, f: 1, price: 25, cat: 'Fruits', src: 'e' },
  apple:    { n: 'Apple', st: 'raw', k: 52, p: 0.3, c: 13.8, f: 0.2, price: 50, cat: 'Fruits', src: 'e' },
  dates:    { n: 'Dates', st: 'pitted', k: 282, p: 2.5, c: 75, f: 0.4, price: 60, cat: 'Fruits', src: 'e' },
  oil:      { n: 'Oil (sunflower or olive)', st: 'as sold', k: 884, p: 0, c: 0, f: 100, price: 120, cat: 'Other essentials', src: 'r' },
  tahini:   { n: 'Tahini', st: 'as sold', k: 595, p: 17, c: 21, f: 54, price: 200, cat: 'Other essentials', src: 'e' },
  honey:    { n: 'Honey or black molasses', st: 'as sold', k: 304, p: 0.3, c: 82, f: 0, price: 200, cat: 'Other essentials', src: 'e' },
  peanuts:  { n: 'Peanuts, roasted, unsalted', st: 'as sold', k: 567, p: 25.8, c: 16, f: 49, price: 120, cat: 'Other essentials', src: 'e' },
  choc:     { n: 'Chocolate', st: 'as sold', k: 546, p: 5, c: 60, f: 31, price: 500, cat: 'Other essentials', src: 'e' }
};

export const SLOTS = [
  { id: 'breakfast', n: 'Breakfast', kcal: 450, p: 28 },
  { id: 'pre', n: 'Pre-workout', kcal: 200, p: 5 },
  { id: 'post', n: 'Post-workout', kcal: 300, p: 24 },
  { id: 'lunch', n: 'Lunch', kcal: 600, p: 42 },
  { id: 'snack', n: 'Afternoon snack', kcal: 200, p: 11 },
  { id: 'dinner', n: 'Dinner', kcal: 350, p: 27 },
  { id: 'evening', n: 'Evening snack', kcal: 100, p: 5 }
];

/* tier: 1 very cheap, 2 budget, 3 moderate */
export const MEALS = [
  // BREAKFAST (5 of 6 are egg-free)
  { id: 'b1', cat: 'breakfast', n: 'Areesh cheese sandwich', items: [['areesh', 140], ['baladi', 75], ['salad', 100], ['oil', 12]], prep: 'Mash the cheese with chopped tomato, cucumber, a little oil, salt and cumin. Fill most of one baladi loaf.', ahead: true, work: true },
  { id: 'b2', cat: 'breakfast', n: 'Ful with areesh and bread', items: [['ful', 150], ['areesh', 90], ['baladi', 45], ['oil', 10], ['salad', 100]], prep: 'Warm the ful with lemon, cumin and the measured oil. Eat with cheese, salad and half a loaf.', ahead: true, work: false },
  { id: 'b3', cat: 'breakfast', n: 'Oats with milk and banana', items: [['oats', 40], ['milk', 250], ['banana', 80], ['peanuts', 12], ['whey', 12]], prep: 'Cook oats in the milk for 3 minutes, slice in the banana, add the peanuts, and stir in less than half a scoop of isolate once it cools slightly. No isolate: eat 90 g areesh cheese on the side instead.', ahead: true, work: true },
  { id: 'b4', cat: 'breakfast', n: 'Tuna sandwich and an orange', items: [['tuna', 65], ['baladi', 80], ['salad', 100], ['tahini', 18], ['orange', 100]], prep: 'Mix drained tuna with lemon, chopped salad and tahini. Fill one loaf. Orange on the side.', ahead: true, work: true },
  { id: 'b5', cat: 'breakfast', n: 'Smoked turkey and light cheese sandwich', items: [['turkey', 70], ['lightCh', 45], ['baladi', 80], ['salad', 100], ['oil', 5], ['orange', 100]], prep: 'Layer turkey, cheese and salad in one loaf. Fruit on the side.', ahead: true, work: true },
  { id: 'b6', cat: 'breakfast', n: 'Two eggs with ful (for days you want eggs)', items: [['egg', 100], ['ful', 100], ['baladi', 60], ['oil', 5], ['salad', 100]], prep: 'Boil the eggs or scramble them in the measured oil. Serve with ful, salad and bread.', ahead: false, work: false },
  // PRE-WORKOUT
  { id: 'p1', cat: 'pre', n: 'Banana and three dates', items: [['banana', 120], ['dates', 30]], prep: 'Nothing to prepare. Eat 30 to 45 minutes before training.', ahead: true, work: true },
  { id: 'p2', cat: 'pre', n: 'Baladi bread with honey or molasses', items: [['baladi', 60], ['honey', 15]], prep: 'Spread honey or molasses in two thirds of a loaf.', ahead: true, work: true },
  { id: 'p3', cat: 'pre', n: 'Small oats and milk', items: [['oats', 30], ['milk', 120], ['honey', 8]], prep: 'Soak or cook the oats in the milk with the honey. Eat 60 minutes before training, as it digests more slowly.', ahead: true, work: true },
  { id: 'p4', cat: 'pre', n: 'Baked sweet potato', items: [['batata', 220]], prep: 'Bake several at once and keep them in the fridge. Eat cold or warm with cinnamon.', ahead: true, work: true },
  { id: 'p5', cat: 'pre', n: 'Zabadi with banana and honey', items: [['zabadi', 105], ['banana', 110], ['honey', 12]], prep: 'Slice the banana into one cup of zabadi and add the honey.', ahead: false, work: true },
  // POST-WORKOUT
  { id: 'w1', cat: 'post', n: 'Areesh cheese, bread and honey', items: [['areesh', 140], ['baladi', 45], ['tahini', 6], ['honey', 8]], prep: 'Cheese in half a loaf with a little tahini and honey, or with tomato if you prefer savoury.', ahead: true, work: true },
  { id: 'w2', cat: 'post', n: 'Isolate shake with banana and dates (optional isolate)', items: [['whey', 25], ['banana', 120], ['peanuts', 10], ['dates', 10]], prep: 'Shake a level scoop (25 g) in water, eat the fruit and peanuts with it. Counts toward the 150 g cap like any other protein.', ahead: true, work: true },
  { id: 'w3', cat: 'post', n: 'Tuna half-sandwich and an orange', items: [['tuna', 65], ['baladi', 55], ['salad', 80], ['tahini', 8], ['orange', 100]], prep: 'Tuna with lemon, tahini and salad in just over half a loaf.', ahead: true, work: true },
  { id: 'w4', cat: 'post', n: 'Rayeb, areesh and a banana', items: [['rayeb', 250], ['areesh', 100], ['banana', 80]], prep: 'Drink the rayeb, eat the cheese and banana. No cooking.', ahead: true, work: true },
  { id: 'w5', cat: 'post', n: 'Small chicken and rice box', items: [['chicken', 65], ['rice', 100], ['veg', 100], ['oil', 4]], prep: 'Portion from your batch-cooked chicken and rice. Eat cold or reheat.', ahead: true, work: true },
  // LUNCH
  { id: 'l1', cat: 'lunch', n: 'Grilled chicken, rice and vegetables', items: [['chicken', 110], ['rice', 170], ['veg', 150], ['oil', 13], ['salad', 100]], prep: 'Season and grill or pan-cook the chicken in the measured oil. Batch-cook rice and vegetables for 3 days.', ahead: true, work: true },
  { id: 'l2', cat: 'lunch', n: 'Lentils and rice with areesh and zabadi', items: [['lentilC', 200], ['rice', 100], ['areesh', 80], ['zabadi', 105], ['oil', 12], ['salad', 100]], prep: 'Boil lentils with cumin and onion, mix with rice and the measured oil. Cheese and zabadi on the side.', ahead: true, work: true },
  { id: 'l3', cat: 'lunch', n: 'Grilled tilapia, rice and tahini salad', items: [['tilapia', 130], ['rice', 190], ['salad', 150], ['tahini', 15], ['oil', 5]], prep: 'Grill or oven-bake the fish with cumin, garlic and lemon (not fried). Weigh the flesh after removing bones.', ahead: false, work: false },
  { id: 'l4', cat: 'lunch', n: 'Chicken liver sandwich with salad (once a week at most)', items: [['liver', 120], ['baladi', 90], ['salad', 150], ['oil', 8], ['tahini', 8]], prep: 'Sear the liver quickly with garlic, cumin and pepper in the measured oil. Liver is very high in vitamin A, so keep it to one meal a week.', ahead: false, work: false },
  { id: 'l5', cat: 'lunch', n: 'Tuna pasta with tomato sauce', items: [['pasta', 75], ['tuna', 95], ['veg', 150], ['oil', 14], ['salad', 100]], prep: 'Boil the pasta. Cook tomato, onion and vegetables into a sauce with the oil, fold in the tuna.', ahead: true, work: true },
  { id: 'l6', cat: 'lunch', n: 'Chicken and potato tray (seneya)', items: [['chickenR', 150], ['potato', 280], ['veg', 100], ['oil', 14], ['salad', 100]], prep: 'Slice everything into a tray with tomato, onion, spices and the oil. Bake 40 minutes at 200°C. Makes easy boxes for two days.', ahead: true, work: true },
  // AFTERNOON SNACK
  { id: 's1', cat: 'snack', n: 'Zabadi, an apple and a few peanuts', items: [['zabadi', 210], ['apple', 100], ['peanuts', 12]], prep: 'Two cups of zabadi, one small apple, a small handful of peanuts.', ahead: true, work: true },
  { id: 's2', cat: 'snack', n: 'Areesh cheese on bread with cucumber', items: [['areesh', 60], ['baladi', 35], ['salad', 100], ['oil', 4]], prep: 'Cheese with a drizzle of oil on a third of a loaf, cucumber on the side.', ahead: true, work: true },
  { id: 's3', cat: 'snack', n: 'Rayeb and dates', items: [['rayeb', 250], ['dates', 20]], prep: 'One glass of rayeb and two dates.', ahead: true, work: true },
  { id: 's4', cat: 'snack', n: 'Termis and an orange', items: [['termis', 60], ['orange', 180], ['peanuts', 5]], prep: 'Rinse the termis well to remove salt. One orange and a few peanuts.', ahead: true, work: true },
  { id: 's5', cat: 'snack', n: 'Light cheese on bread', items: [['lightCh', 45], ['baladi', 45], ['salad', 80]], prep: 'Cheese in half a loaf with tomato or cucumber.', ahead: true, work: true },
  // DINNER
  { id: 'd1', cat: 'dinner', n: 'Tuna salad with bread', items: [['tuna', 85], ['salad', 200], ['oil', 11], ['baladi', 50]], prep: 'Toss drained tuna with a big chopped salad, lemon and the oil.', ahead: false, work: true },
  { id: 'd2', cat: 'dinner', n: 'Chicken with boiled potatoes and salad', items: [['chicken', 80], ['potatoB', 140], ['salad', 150], ['oil', 9]], prep: 'Use batch-cooked chicken. Boil potatoes, dress with lemon, cumin and the oil.', ahead: true, work: true },
  { id: 'd3', cat: 'dinner', n: 'Lentil soup with areesh', items: [['lentil', 45], ['veg', 100], ['oil', 9], ['areesh', 100]], prep: 'Boil lentils with carrot, onion and tomato, blend, finish with the oil, cumin and lemon. Cheese on the side. Makes four portions at once.', ahead: true, work: false },
  { id: 'd4', cat: 'dinner', n: 'Areesh salad plate with bread', items: [['areesh', 170], ['salad', 200], ['oil', 10], ['baladi', 35]], prep: 'Cheese with tomato, cucumber, mint, the oil and a third of a loaf.', ahead: false, work: true },
  { id: 'd5', cat: 'dinner', n: 'Vegetable omelette with areesh (egg option)', items: [['egg', 100], ['areesh', 70], ['salad', 100], ['oil', 3], ['baladi', 45]], prep: 'Two eggs with chopped vegetables in the measured oil. Cheese and half a loaf on the side.', ahead: false, work: false },
  // EVENING SNACK
  { id: 'e1', cat: 'evening', n: 'Zabadi with cinnamon', items: [['zabadi', 160]], prep: 'One and a half cups.', ahead: true, work: true },
  { id: 'e2', cat: 'evening', n: 'A glass of rayeb', items: [['rayeb', 180]], prep: 'Nothing to prepare.', ahead: true, work: true },
  { id: 'e3', cat: 'evening', n: 'Warm milk', items: [['milk', 200]], prep: 'Warm it, add cinnamon if you like.', ahead: false, work: false },
  { id: 'e4', cat: 'evening', n: 'Guava or other seasonal fruit', items: [['guava', 150]], prep: 'About two small guavas, or the same weight of orange or apple.', ahead: true, work: true },
  { id: 'e5', cat: 'evening', n: 'Chocolate (your planned treat)', items: [['choc', 20]], prep: 'About four small squares. Planned, so it never counts as a slip.', ahead: true, work: true }
];

/* default 7-day rotation, one meal id per slot, used for the daily plan and the shopping list */
export const WEEK_MENU = [
  { breakfast: 'b1', pre: 'p1', post: 'w1', lunch: 'l1', snack: 's1', dinner: 'd1', evening: 'e1' },
  { breakfast: 'b3', pre: 'p2', post: 'w3', lunch: 'l2', snack: 's4', dinner: 'd2', evening: 'e5' },
  { breakfast: 'b2', pre: 'p1', post: 'w4', lunch: 'l1', snack: 's2', dinner: 'd3', evening: 'e4' },
  { breakfast: 'b4', pre: 'p4', post: 'w1', lunch: 'l6', snack: 's3', dinner: 'd4', evening: 'e2' },
  { breakfast: 'b1', pre: 'p5', post: 'w5', lunch: 'l5', snack: 's1', dinner: 'd2', evening: 'e5' },
  { breakfast: 'b3', pre: 'p1', post: 'w3', lunch: 'l3', snack: 's5', dinner: 'd3', evening: 'e1' },
  { breakfast: 'b5', pre: 'p2', post: 'w4', lunch: 'l1', snack: 's4', dinner: 'd4', evening: 'e4' }
];

/* schedules: [time, slot id or label] */
export const MODES = {
  A: { n: 'Morning gym', rows: [
    ['06:45', 'Wake up. 500 ml water.'],
    ['06:55', 'pre'],
    ['07:30', 'GYM'],
    ['08:50', 'Creatine 5 g with 500 ml water'],
    ['09:15', 'breakfast', 'Post-workout breakfast'],
    ['11:45', 'post', 'Mid-morning work meal'],
    ['14:00', 'lunch'],
    ['17:00', 'snack'],
    ['20:30', 'dinner'],
    ['22:00', 'evening'],
    ['23:00', 'Sleep (7.5 to 8 hours)'] ] },
  B: { n: 'Gym between jobs', rows: [
    ['07:30', 'Wake up. 500 ml water.'],
    ['08:00', 'breakfast'],
    ['11:00', 'snack', 'Portable work snack'],
    ['13:30', 'lunch', 'Packed lunch'],
    ['15:30', 'pre'],
    ['16:15', 'GYM'],
    ['17:45', 'post', 'Post-workout, eaten on the way to job two'],
    ['18:00', 'Creatine 5 g with 500 ml water'],
    ['20:30', 'dinner'],
    ['22:00', 'evening'],
    ['23:30', 'Sleep (7.5 to 8 hours)'] ] }
};

export const SPLIT = ['push', 'pull', 'legs', 'rest', 'upper', 'lower', 'rest'];
export const SESSION_NAMES = { push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower', rest: 'Rest' };
export const CARDIO_DAYS = { push: 1, pull: 2, upper: 3 }; // order in which cardio sessions are added

/* t: c = compound (bigger jumps), i = isolation. vol: sets credited per muscle */
export const PROGRAM = {
  push: [
    { id: 'chest_press', n: 'Machine chest press', eq: 'Chest press machine', tg: 'Chest, front delts, triceps', sets: 3, reps: [6, 10], rest: '2–3 min', rir: '1–2', t: 'c', how: 'Seat height so the handles line up with mid-chest. Shoulder blades pulled back into the pad. Lower for 2 to 3 seconds until a deep chest stretch, then press without locking out hard.', avoid: 'Shoulders rolling forward, half reps, bouncing out of the bottom.', alt: 'Smith machine bench press or dumbbell bench press', vol: { Chest: 3 } },
    { id: 'incline_press', n: 'Incline machine press', eq: 'Incline press machine or Smith on a 30° bench', tg: 'Upper chest, front delts', sets: 3, reps: [8, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Elbows about 45° from the body. Bring the handles down to upper chest, pause briefly, press up and slightly in.', avoid: 'Bench set too steep (it becomes a shoulder press), flaring elbows straight out.', alt: 'Incline dumbbell press', vol: { Chest: 3 } },
    { id: 'shoulder_press', n: 'Shoulder press machine', eq: 'Shoulder press machine', tg: 'Front and side delts, triceps', sets: 2, reps: [8, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Back flat against the pad, handles start at about ear height. Press up without shrugging, lower under control.', avoid: 'Arching off the pad, stopping far above ear height.', alt: 'Seated dumbbell press or Smith shoulder press', vol: { 'Side delts': 1, 'Front delts': 2 } },
    { id: 'pec_deck', n: 'Pec deck fly', eq: 'Pec deck', tg: 'Chest', sets: 2, reps: [10, 15], rest: '90 s', rir: '1', t: 'i', how: 'Slight bend in the elbows, kept fixed. Open to a full stretch, squeeze the hands together for one second.', avoid: 'Turning it into a press by bending the elbows, letting the stack slam.', alt: 'Cable fly', vol: { Chest: 2 } },
    { id: 'cable_lateral', n: 'Cable lateral raise', eq: 'Low cable, one arm at a time', tg: 'Side delts', sets: 3, reps: [12, 15], rest: '60–90 s', rir: '1', t: 'i', how: 'Cable runs behind or in front of the body. Lead with the elbow and raise out to the side until the arm is level with the shoulder. Lower for 2 seconds.', avoid: 'Shrugging, swinging the torso, raising above shoulder height.', alt: 'Dumbbell lateral raise', vol: { 'Side delts': 3 } },
    { id: 'pushdown', n: 'Triceps rope pushdown', eq: 'High cable with rope', tg: 'Triceps', sets: 3, reps: [10, 15], rest: '90 s', rir: '1', t: 'i', how: 'Elbows pinned at your sides. Push down and spread the rope at the bottom, come back up until forearms pass parallel.', avoid: 'Elbows drifting forward, leaning your bodyweight onto the rope.', alt: 'Straight-bar pushdown', vol: { Triceps: 3 } },
    { id: 'oh_ext', n: 'Overhead cable triceps extension', eq: 'Cable with rope, facing away', tg: 'Triceps (long head)', sets: 2, reps: [10, 15], rest: '90 s', rir: '1', t: 'i', how: 'Elbows pointing forward beside the head. Let the rope pull the hands deep behind the head for a stretch, then extend fully.', avoid: 'Elbows flaring wide, cutting the stretch short.', alt: 'Dumbbell overhead extension', vol: { Triceps: 2 } }
  ],
  pull: [
    { id: 'lat_pulldown', n: 'Lat pulldown', eq: 'Lat pulldown, medium overhand grip', tg: 'Lats', sets: 3, reps: [8, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Slight lean back, chest up. Pull the bar to the upper chest driving elbows down toward the hips. Let the arms stretch fully at the top.', avoid: 'Leaning far back and rowing it, pulling behind the neck, half stretch.', alt: 'Assisted pull-up machine', vol: { Lats: 3 } },
    { id: 'cs_row', n: 'Chest-supported row machine', eq: 'Chest-supported row machine', tg: 'Mid-back, lats', sets: 3, reps: [8, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Chest stays on the pad. Pull the elbows back and squeeze the shoulder blades together, then let them spread fully forward.', avoid: 'Chest lifting off the pad, shrugging toward the ears.', alt: 'Chest-supported dumbbell row on an incline bench', vol: { 'Mid/upper back': 3, Lats: 1 } },
    { id: 'cable_row', n: 'Seated cable row', eq: 'Cable row, neutral close handle', tg: 'Lats, mid-back', sets: 2, reps: [10, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Torso upright, pull the handle to the lower ribs, pause, reach forward for a full stretch without rounding hard.', avoid: 'Rocking the torso back and forth to move the weight.', alt: 'Single-arm dumbbell row', vol: { 'Mid/upper back': 2, Lats: 1 } },
    { id: 'rev_pec', n: 'Reverse pec deck', eq: 'Pec deck, facing the pad', tg: 'Rear delts', sets: 3, reps: [12, 15], rest: '60–90 s', rir: '1', t: 'i', how: 'Arms nearly straight at shoulder height. Sweep the hands out and back, stop when arms are in line with the shoulders.', avoid: 'Squeezing the shoulder blades to cheat, going too heavy.', alt: 'Cable rear-delt fly', vol: { 'Rear delts': 3 } },
    { id: 'cable_curl', n: 'Cable curl', eq: 'Low cable with straight or EZ bar', tg: 'Biceps', sets: 3, reps: [10, 12], rest: '90 s', rir: '1', t: 'i', how: 'Elbows at your sides, curl to full contraction, lower for 2 to 3 seconds to a straight arm.', avoid: 'Elbows swinging forward, leaning back.', alt: 'EZ-bar curl', vol: { Biceps: 3 } },
    { id: 'preacher', n: 'Preacher curl machine', eq: 'Preacher curl machine', tg: 'Biceps', sets: 2, reps: [10, 15], rest: '90 s', rir: '1', t: 'i', how: 'Upper arms flat on the pad. Curl up, lower slowly to almost straight.', avoid: 'Lifting the elbows off the pad, dropping the weight at the bottom.', alt: 'Incline dumbbell curl', vol: { Biceps: 2 } }
  ],
  legs: [
    { id: 'leg_press', n: 'Leg press', eq: 'Leg press, feet mid-platform at shoulder width', tg: 'Quads, glutes', sets: 3, reps: [8, 12], rest: '2–3 min', rir: '1–2', t: 'c', how: 'Lower until knees are deeply bent with hips still on the pad. Press through the whole foot, stop just short of locking the knees.', avoid: 'Hips rolling off the pad, locking knees hard, shallow reps with too much weight.', alt: 'Smith machine squat', vol: { Quads: 3, Glutes: 1 } },
    { id: 'hack', n: 'Hack squat', eq: 'Hack squat machine', tg: 'Quads', sets: 2, reps: [8, 12], rest: '2–3 min', rir: '2', t: 'c', how: 'Feet low to mid platform. Descend under control as deep as you can keep heels down, drive up smoothly.', avoid: 'Heels lifting, knees caving in, cutting depth.', alt: 'Smith squat with heels raised, or goblet squat', vol: { Quads: 2, Glutes: 1 } },
    { id: 'seated_curl', n: 'Seated leg curl', eq: 'Seated leg curl', tg: 'Hamstrings', sets: 3, reps: [10, 15], rest: '90 s', rir: '1', t: 'i', how: 'Thigh pad tight. Curl all the way under, return slowly to a full stretch. Lean the torso slightly forward for more stretch.', avoid: 'Hips lifting, letting the weight snap back.', alt: 'Lying leg curl', vol: { Hamstrings: 3 } },
    { id: 'leg_ext', n: 'Leg extension', eq: 'Leg extension', tg: 'Quads', sets: 3, reps: [10, 15], rest: '90 s', rir: '1', t: 'i', how: 'Extend fully and hold one second at the top, lower for 2 to 3 seconds.', avoid: 'Kicking the weight up, lifting off the seat.', alt: 'Sissy squat holding a support', vol: { Quads: 3 } },
    { id: 'calf_stand', n: 'Standing calf raise', eq: 'Calf raise machine (or leg press calf raise)', tg: 'Calves', sets: 3, reps: [10, 15], rest: '60–90 s', rir: '1', t: 'i', how: 'Pause one second in the deep stretch at the bottom, rise as high as possible, pause again.', avoid: 'Bouncing, short range.', alt: 'Calf raise on the leg press', vol: { Calves: 3 } },
    { id: 'cable_crunch', n: 'Cable crunch', eq: 'High cable with rope, kneeling', tg: 'Abs', sets: 2, reps: [10, 15], rest: '60 s', rir: '1', t: 'i', how: 'Hips stay still. Curl the ribs toward the pelvis by rounding the spine.', avoid: 'Sitting back on the heels and pulling with the arms.', alt: 'Ab crunch machine', vol: { Abs: 2 } }
  ],
  upper: [
    { id: 'neutral_pulldown', n: 'Neutral-grip lat pulldown', eq: 'Lat pulldown with close neutral handle', tg: 'Lats', sets: 3, reps: [10, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Pull the handle to the upper chest with elbows travelling close to the body. Full stretch at the top.', avoid: 'Using momentum, shortening the top stretch.', alt: 'Single-arm cable pulldown', vol: { Lats: 3 } },
    { id: 'smith_incline', n: 'Smith machine incline press', eq: 'Smith machine, bench at 30°', tg: 'Upper chest, front delts', sets: 3, reps: [8, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Bar touches the upper chest lightly, elbows about 45°. Press up without bouncing.', avoid: 'Bench too steep, bar path drifting toward the neck.', alt: 'Incline machine press (lighter than push day) or incline dumbbell press', vol: { Chest: 3 } },
    { id: 'high_row', n: 'Machine high row', eq: 'High row machine or single-arm high cable row', tg: 'Upper back, lats', sets: 2, reps: [10, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Pull the handles down and back toward the lower chest, squeeze, return to a long stretch.', avoid: 'Shrugging, twisting the torso.', alt: 'Wide-grip seated cable row', vol: { 'Mid/upper back': 2, Lats: 1 } },
    { id: 'cable_fly', n: 'Cable fly', eq: 'Two cables set at chest height', tg: 'Chest', sets: 2, reps: [12, 15], rest: '90 s', rir: '1', t: 'i', how: 'One foot forward, slight elbow bend. Bring the hands together in front of the chest, open to a full stretch.', avoid: 'Pressing instead of sweeping, shoulders rolling forward.', alt: 'Pec deck', vol: { Chest: 2 } },
    { id: 'lateral_machine', n: 'Lateral raise machine', eq: 'Lateral raise machine', tg: 'Side delts', sets: 3, reps: [12, 20], rest: '60–90 s', rir: '1', t: 'i', how: 'Push out with the elbows against the pads to shoulder height, lower slowly.', avoid: 'Shrugging, rocking the body.', alt: 'Dumbbell lateral raise', vol: { 'Side delts': 3 } },
    { id: 'rear_cable', n: 'Cable rear-delt fly', eq: 'Two high cables crossed, no handles', tg: 'Rear delts', sets: 2, reps: [12, 15], rest: '60–90 s', rir: '1', t: 'i', how: 'Hold the opposite cables, sweep the arms out and back in a wide arc.', avoid: 'Bending the elbows and rowing.', alt: 'Reverse pec deck', vol: { 'Rear delts': 2 } },
    { id: 'hammer_curl', n: 'Rope hammer curl', eq: 'Low cable with rope', tg: 'Biceps, brachialis', sets: 2, reps: [10, 15], rest: '60 s', rir: '1', t: 'i', how: 'Palms facing each other, curl without moving the elbows. Pair it back to back with the pushdown to save time.', avoid: 'Swinging.', alt: 'Dumbbell hammer curl', vol: { Biceps: 2 } },
    { id: 'bar_pushdown', n: 'Straight-bar pushdown', eq: 'High cable with straight bar', tg: 'Triceps', sets: 2, reps: [10, 15], rest: '60 s', rir: '1', t: 'i', how: 'Elbows pinned, press to full lockout, control the return.', avoid: 'Elbows flaring, shoulders rolling over the bar.', alt: 'Triceps dip machine', vol: { Triceps: 2 } }
  ],
  lower: [
    { id: 'hip_thrust', n: 'Hip thrust machine', eq: 'Hip thrust machine or Smith hip thrust', tg: 'Glutes', sets: 3, reps: [8, 12], rest: '2 min', rir: '1–2', t: 'c', how: 'Chin tucked, ribs down. Drive the hips up until the body is flat from shoulders to knees, hold one second.', avoid: 'Arching the lower back at the top, pushing through the toes.', alt: 'Barbell hip thrust on a bench', vol: { Glutes: 3 } },
    { id: 'rdl', n: 'Smith machine Romanian deadlift', eq: 'Smith machine or dumbbells', tg: 'Hamstrings, glutes', sets: 3, reps: [8, 12], rest: '2–3 min', rir: '2', t: 'c', how: 'Soft knees, push the hips straight back, bar slides down the thighs to mid-shin with a flat back. Stand by driving the hips forward.', avoid: 'Rounding the back, bending the knees into a squat, going lower than your hamstrings allow.', alt: '45° back extension', vol: { Hamstrings: 3, Glutes: 2 } },
    { id: 'leg_press_high', n: 'Leg press, feet high and wide', eq: 'Leg press', tg: 'Glutes, hamstrings, quads', sets: 2, reps: [10, 15], rest: '2 min', rir: '1–2', t: 'c', how: 'Feet high on the platform, slightly wider than shoulders. Deep, controlled reps.', avoid: 'Hips rolling off the pad.', alt: 'Smith machine reverse lunge', vol: { Quads: 1, Glutes: 2 } },
    { id: 'lying_curl', n: 'Lying leg curl', eq: 'Lying leg curl', tg: 'Hamstrings', sets: 3, reps: [10, 15], rest: '90 s', rir: '1', t: 'i', how: 'Hips pressed into the pad. Curl to the glutes, lower for 3 seconds.', avoid: 'Hips popping up, half range.', alt: 'Seated leg curl', vol: { Hamstrings: 3 } },
    { id: 'leg_ext2', n: 'Leg extension (lighter, longer pause)', eq: 'Leg extension', tg: 'Quads', sets: 2, reps: [12, 15], rest: '90 s', rir: '1', t: 'i', how: 'Two-second hold at the top of every rep.', avoid: 'Kicking the weight.', alt: 'Goblet squat', vol: { Quads: 2 } },
    { id: 'calf_seated', n: 'Seated calf raise', eq: 'Seated calf raise machine', tg: 'Calves', sets: 3, reps: [12, 15], rest: '60–90 s', rir: '1', t: 'i', how: 'Full stretch, one-second pause, full rise.', avoid: 'Bouncing.', alt: 'Single-leg dumbbell calf raise on a step', vol: { Calves: 3 } },
    { id: 'knee_raise', n: 'Hanging or captain’s chair knee raise', eq: 'Captain’s chair or pull-up bar', tg: 'Abs', sets: 2, reps: [10, 15], rest: '60 s', rir: '1', t: 'i', how: 'Curl the pelvis up as the knees rise, lower slowly.', avoid: 'Swinging.', alt: 'Ab crunch machine', vol: { Abs: 2 } }
  ]
};

PROGRAM.full = ['leg_press', 'chest_press', 'lat_pulldown', 'seated_curl', 'shoulder_press', 'cs_row', 'cable_crunch'].map(id => { for (const k of ['push', 'pull', 'legs']) { const e = PROGRAM[k].find(x => x.id === id); if (e) return e; } });
export const SPLITS = {
  ppl5: { n: '5 days · Push, Pull, Legs, Upper, Lower', days: ['push', 'pull', 'legs', 'rest', 'upper', 'lower', 'rest'] },
  ul4: { n: '4 days · Upper, Lower, Upper, Lower', days: ['upper', 'lower', 'rest', 'upper', 'lower', 'rest', 'rest'] },
  fb3: { n: '3 days · Full body', days: ['full', 'rest', 'full', 'rest', 'full', 'rest', 'rest'] }
};
SESSION_NAMES.full = 'Full body';
CARDIO_DAYS.full = 1;
export const CARDIO_PLAN = [ // by week range
  { from: 1, to: 2, sessions: 2, min: 15, steps: 6000 },
  { from: 3, to: 4, sessions: 2, min: 20, steps: 7000 },
  { from: 5, to: 8, sessions: 3, min: 20, steps: 8000 },
  { from: 9, to: 12, sessions: 3, min: 25, steps: 9000 }
];

export const ROADMAP = [
  { w: 1, train: 'Learn the program. Find starting weights at 2–3 reps in reserve. Log every set.', nut: 'Hit calories within ±100 and protein 130–150 g on at least 5 days.', check: 'Baseline: morning weight, waist, front/side/back photos.' },
  { w: 2, train: 'Same exercises, add reps toward the top of each range.', nut: 'Same targets. Weigh food for the meals you repeat most.', check: 'Milestone 1: two full weeks logged. First 7-day average comparison. No calorie change yet.' },
  { w: 3, train: 'Work at 1–2 reps in reserve. First weight increases on exercises that hit the top of the range.', nut: 'Hold targets.', check: 'Waist measurement.' },
  { w: 4, train: 'Keep adding a rep or a small plate where earned.', nut: 'First possible adjustment, only if the rules say so.', check: 'Milestone 2: compare average weight, waist and photos with week 1. Re-scan InBody if you can (same time of day).' },
  { w: 5, train: 'Cardio goes to three sessions. Lifting stays the priority.', nut: 'Hold targets.', check: 'Waist measurement.' },
  { w: 6, train: 'Push the last set of each exercise to 1 rep in reserve.', nut: 'Hold or adjust by the rules.', check: 'Review which lifts have stalled for 3 weeks.' },
  { w: 7, train: 'Lighter week: same weights, about one third fewer sets, stop at 3 reps in reserve.', nut: 'Eat at maintenance (about +300 kcal) this week to recover.', check: 'Waist measurement. Expect scale weight to hold or tick up slightly.' },
  { w: 8, train: 'Back to full sets. Aim to beat week 6 numbers.', nut: 'Return to the deficit.', check: 'Milestone 3: photos, waist, InBody. Swap any exercise that still has not moved since week 4.' },
  { w: 9, train: 'Build again. Steps target rises.', nut: 'Hold or adjust by the rules.', check: 'Waist measurement.' },
  { w: 10, train: 'Add reps or load on at least half of your exercises.', nut: 'Hold targets.', check: 'Check hunger and energy trends.' },
  { w: 11, train: 'Hardest training week. Last sets at 0–1 reps in reserve on machines.', nut: 'Hold targets.', check: 'Waist measurement.' },
  { w: 12, train: 'Repeat week 11 and record final numbers for every lift.', nut: 'Hold targets through the final measurements.', check: 'Milestone 4: final photos, waist, 7-day average weight and InBody. Decide: continue the cut, or two weeks at maintenance.' }
];

export const WEIGHTS = { nutrition: 40, training: 25, steps: 10, recovery: 15, tracking: 10 };
export const CAT_NAMES = { nutrition: 'Nutrition', training: 'Training and cardio', steps: 'Steps', recovery: 'Recovery', tracking: 'Tracking' };
export const TIER_NAMES = { 1: 'Very cheap', 2: 'Budget', 3: 'Moderate' };


