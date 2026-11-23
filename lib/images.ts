import manifest from "@/data/images.json";

export type Img = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
};

export type GalleryPhoto = Img & { alt: string };

export type Album = {
  slug: string;
  title: string;
  dateLabel: string;
  photos: GalleryPhoto[];
};

const site = manifest.site as Record<string, Img>;

export const img = {
  hero: site["hero-church"],
  newChurch1: site["new-church-1"],
  newChurch2: site["new-church-2"],
  newChurch3: site["new-church-3"],
  bishopPeter: site["bishop-peter"],
  donateBanner: site["donate-banner"],
  crest: site["crest"],
};

export const IMG_ALT = {
  hero: "The white wooden church at 2929 Bennett Charles Road with its steeple and red front doors",
  newChurch1: "Side view of the new church building, a white wooden chapel with a steeple",
  newChurch2: "Aerial view of the new church property surrounded by trees",
  newChurch3: "The bright, empty interior hall of the new church",
  bishopPeter: "Portrait of His Grace Bishop Peter",
  donateBanner: "Two people clasping hands",
  crest: "Crest of the Coptic Orthodox Diocese of North, South Carolina and Kentucky showing the Virgin Mary and St. George",
} as const;

// Alt text per photo, in gallery order. Describes what is visible only.
const ALTS: Record<string, string[]> = {
  "cleaning-new-church": [
    "A child mows the lawn at the new church property",
    "A young volunteer sweeps the floor beside the wooden pews",
    "Volunteers carry a leather sofa into the new church",
    "Two men carry a large black leather sofa through a doorway",
    "A child lies on the floor beside a wooden pew",
    "Two teenage volunteers wipe down the pews",
    "Volunteers polish the wooden pews with cloths",
    "A volunteer in a blue shirt smiles, holding a cleaning cloth",
    "A woman in a green blouse holds up a cleaning cloth",
    "Rows of clean wooden pews with volunteers working at the back",
    "Families and children gather for a group photo in the sanctuary after the cleanup",
  ],
  "easter-2021": [
    "The Good Friday icon table decorated with flowers and greenery, with a cross in front",
    "The congregation gathers for a group photo in the church hall",
    "Children and teens crowd around a picnic table under a striped tent",
    "Men eat grilled food at a wooden picnic table in the park",
    "Men tend a large charcoal grill beside a wooded path",
    "A baby in a car seat wearing a pacifier",
    "A woman in a striped shirt talks with a priest under the pavilion",
    "Two women smile at the camera at a picnic table",
    "Men grill skewers of meat while smoke rises through the palm trees",
    "The grill team turns skewers over the coals",
    "Two women take a selfie in the park",
    "Two women pose together, one holding a baby",
    "Men and boys sit at a picnic table under the tent",
    "A priest talks with parishioners at a picnic table",
    "Families sit together at long tables under the striped tent",
    "A woman serves food from foil trays at the buffet table",
    "Parishioners share a meal at a picnic table",
    "Plates of grilled chicken and rice on a picnic table with men seated around it",
    "Young people eat together at a long table under the tent",
    "Teens and families seated along a long table with plates of food",
    "Adults chat over plates of food at a picnic table",
    "A shared meal at a wooden picnic table in the park",
    "Two boys play on a wooden playground structure",
    "A woman and a toddler on the playground",
    "A large group including a priest gathers for a photo on the park path",
    "The congregation poses for a group photo among the trees",
    "A group photo with a priest and a small white dog in the park",
    "The whole group gathers for a photo under the trees, some kneeling in front",
    "A final group photo of the picnic with a priest in the center",
  ],
  "nativity-2021": [
    "The congregation seated in the church hall during the Feast of the Holy Nativity",
    "A clergyman in blue and gold vestments stands beside a clergyman in white",
    "Two clergymen in black robes holding hand crosses pose with a family and a toddler",
    "Two clergymen with hand crosses stand with a family",
    "Two clergymen with hand crosses pose with parishioners, including young children",
    "Two clergymen with hand crosses stand with an older couple",
    "Two clergymen with hand crosses stand with a family, including a girl in a patterned dress",
    "Two clergymen with hand crosses pose with a family",
    "Two clergymen with hand crosses stand with parishioners holding a gift bag",
    "Two clergymen with hand crosses pose with a woman holding a baby",
    "Two clergymen with hand crosses stand with parishioners in the church hall",
    "The clergy and altar servers in white vestments line up in the church hall",
  ],
};

export const albums: Album[] = manifest.gallery.map((a) => ({
  slug: a.slug,
  title: a.title,
  dateLabel: a.dateLabel,
  photos: a.photos.map((p, i) => ({
    ...(p as Img),
    alt: ALTS[a.slug]?.[i] ?? `${a.title}, photo ${i + 1}`,
  })),
}));

export const GALLERY_ALTS = ALTS;
