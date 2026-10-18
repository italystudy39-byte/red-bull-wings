// Вкусы для карусели. Чтобы добавить или поменять банку, правьте только этот список.
// vol/caf/sugar — официальные данные с redbull.com на банку 250 мл: Classic, Zero, Pink и Iced (Iced Vanilla Berry) —
// со страниц США, Blue/Green/White/Apricot — с немецкого сайта, Lilac — с британского (проверено 18.10.2026).
// image — этикетка банки: вырезана из студийных PNG с redbull.com и сжата в JPG (в 9 раз легче, та же чёткость),
// crop — прямоугольник этикетки на картинке (x, y, w, h в пикселях).
// base/base2 — цвет банки (середина и края): из них красится фон, точки выбора и запасная этикетка, если фото не загрузится.
// liquid — цвет самого напитка (футер): по описаниям налитых напитков — Pink красно-фиолетовый, Iced ледяной голубой,
// Green жёлто-зелёный, Lilac лавандовый, White мутно-светлый, Apricot оранжевый; Blue — предположительно золотистый.
// accent — подсветка сцены и плашки, text/check/edition — для запасной нарисованной этикетки.
var FLAVORS = [
  { name: "CLASSIC", liquid: "#f0a81c", tag: "Red Bull Energy Drink", edition: "", image: "img/classic-label.jpg", crop: { x: 0, y: 0, w: 818, h: 2079 }, base: "#1f3c88", base2: "#0d1d4a", check: "#c8ced8", accent: "#ffc20e", text: "#ffffff", vol: "250 ml", caf: "80 mg", sugar: "26 g", desc: "The original taste where it all began." },
  { name: "ZERO", liquid: "#f2c544", tag: "Sugar-free", edition: "ZERO", image: "img/zero-label.jpg", crop: { x: 0, y: 0, w: 818, h: 2079 }, base: "#9fc0e4", base2: "#45698f", check: "#e4ebf2", accent: "#dcecff", text: "#c8102e", vol: "250 ml", caf: "80 mg", sugar: "0 g", desc: "The classic taste with no sugar and almost no calories." },
  { name: "PINK EDITION", liquid: "#b0285a", tag: "Wild berries", edition: "THE PINK EDITION", image: "img/pink-label.jpg", crop: { x: 0, y: 0, w: 496, h: 1274 }, base: "#f08db5", base2: "#a1386a", check: "#f6e3ec", accent: "#ffc4dc", text: "#ffffff", vol: "250 ml", caf: "80 mg", sugar: "26 g", desc: "A sweet, bright mix of wild berries." },
  { name: "ICED EDITION", liquid: "#4fb3dc", tag: "Iced vanilla berry", edition: "THE ICED EDITION", image: "img/iced-label.jpg", crop: { x: 0, y: 0, w: 496, h: 1274 }, base: "#8ed2e6", base2: "#2c7a95", check: "#e6f6fb", accent: "#dff8ff", text: "#ffffff", vol: "250 ml", caf: "80 mg", sugar: "26 g", desc: "Vanilla and berries with a cool finish." },
  { name: "BLUE EDITION", liquid: "#e3bf4f", tag: "Blueberry", edition: "THE BLUE EDITION", image: "img/blue-label.jpg", crop: { x: 0, y: 0, w: 496, h: 1274 }, base: "#3a3ea6", base2: "#14164e", check: "#d6d8ee", accent: "#b7b9ff", text: "#ffffff", vol: "250 ml", caf: "80 mg", sugar: "27 g", desc: "Rich blueberry with a light tang." },
  { name: "GREEN EDITION", liquid: "#c4d443", tag: "Cactus fruit", edition: "THE GREEN EDITION", image: "img/green-label.jpg", crop: { x: 0, y: 0, w: 818, h: 2079 }, base: "#4fb24a", base2: "#1b5c1e", check: "#dcefdb", accent: "#c9ff9e", text: "#ffffff", vol: "250 ml", caf: "80 mg", sugar: "27 g", desc: "Cactus fruit, fresh and unexpected." },
  { name: "LILAC EDITION", liquid: "#9466e0", tag: "Grapefruit & blossom, sugar-free", edition: "THE LILAC EDITION", image: "img/lilac-label.jpg", crop: { x: 0, y: 0, w: 818, h: 2079 }, base: "#a68ae0", base2: "#4b378a", check: "#ece5f8", accent: "#e3d6ff", text: "#ffffff", vol: "250 ml", caf: "80 mg", sugar: "0 g", desc: "Grapefruit with a floral note and no sugar." },
  { name: "WHITE EDITION", liquid: "#ead79a", tag: "Coconut & blueberry", edition: "THE WHITE EDITION", image: "img/white-label.jpg", crop: { x: 0, y: 0, w: 496, h: 1274 }, base: "#dfe4ea", base2: "#7d8898", check: "#b9c3cf", accent: "#ffffff", text: "#4a5260", vol: "250 ml", caf: "80 mg", sugar: "27 g", desc: "Coconut and blueberry, smooth and creamy." },
  { name: "APRICOT EDITION", liquid: "#f5862a", tag: "Apricot & strawberry", edition: "THE APRICOT EDITION", image: "img/apricot-label.jpg", crop: { x: 0, y: 0, w: 818, h: 2079 }, base: "#f7943b", base2: "#a1470b", check: "#fbe3cf", accent: "#ffd2a8", text: "#ffffff", vol: "250 ml", caf: "80 mg", sugar: "27 g", desc: "Ripe apricot with a hint of strawberry." }
];

// Начинаем качать этикетки сразу, пока идёт заставка: к моменту сборки 3D-сцен они уже в кэше браузера
FLAVORS.forEach(function (f) { if (f.image) { var im = new Image(); im.src = f.image; } });
