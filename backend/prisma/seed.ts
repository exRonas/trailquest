import { randomBytes } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Stable QR token per checkpoint (mirrors route.service's generator). */
function makeQrCode(): string {
  return `cp_${randomBytes(9).toString('base64url')}`;
}

/**
 * Seed data uses real, walkable locations with approximate-but-plausible
 * coordinates so the map, checkpoints and distance maths look believable in
 * development.
 */

/** Per-language text. Seed content is authored in English; `ru`/`kk` are left
 *  for translation via the admin panel's language tabs (except route
 *  title/description, which get real translations below since those are
 *  what's most visible on first launch). */
interface LocalizedText {
  ru: string;
  en: string;
  kk: string;
}

interface SeedCheckpoint {
  name: string;
  type: 'HISTORICAL' | 'DANGER' | 'UPCOMING' | 'INFO';
  lat: number;
  lng: number;
  altitudeM?: number;
  radiusTriggerM?: number;
  description: string;
  orderIndex: number;
}

interface SeedTip {
  type: 'WARNING' | 'ADVICE';
  text: string;
  // Index into the route's checkpoint array, or undefined for route-wide tips.
  checkpointIndex?: number;
}

interface SeedRoute {
  title: LocalizedText;
  description: LocalizedText;
  category: 'HISTORICAL' | 'BATTLE' | 'SCENIC' | 'GATHERING_SPOT' | 'MIXED';
  difficulty: 'EASY' | 'MODERATE' | 'HARD';
  distanceKm: number;
  estimatedMinutes: number;
  region: LocalizedText;
  country: LocalizedText;
  coverImageUrl?: string;
  pathPoints: { lat: number; lng: number; altitudeM?: number; sequence: number }[];
  checkpoints: SeedCheckpoint[];
  tips: SeedTip[];
}

const routes: SeedRoute[] = [
  {
    title: {
      ru: 'Геттисбергская петля сражения',
      en: 'Gettysburg Battlefield Loop',
      kk: 'Геттисберг шайқас алаңының шеңбері',
    },
    description: {
      ru: 'Созерцательная прогулка по решающим местам Гражданской войны в США — от Кладбищенского хребта до Литл-Раунд-Топ, мимо памятников, артиллерийских позиций и поля атаки Пикетта.',
      en: 'A reflective walk across the decisive ground of the American Civil War, from Cemetery Ridge to Little Round Top, passing monuments, cannon lines and the field of Pickett\'s Charge.',
      kk: 'АҚШ-тағы Азамат соғысының шешуші орындары бойынша ой салатын серуен — Зират жотасынан Литл-Раунд-Топқа дейін, ескерткіштер, зеңбірек шептері және Пикетт шабуылы даласы арқылы өтеді.',
    },
    category: 'BATTLE',
    difficulty: 'MODERATE',
    distanceKm: 6.4,
    estimatedMinutes: 110,
    region: {
      ru: 'Геттисберг, Пенсильвания, США',
      en: 'Gettysburg, Pennsylvania, USA',
      kk: 'Геттисберг, Пенсильвания, АҚШ',
    },
    country: { ru: 'США', en: 'United States', kk: 'АҚШ' },
    coverImageUrl:
      'https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?w=1200',
    pathPoints: [
      { lat: 39.8121, lng: -77.2311, altitudeM: 178, sequence: 0 },
      { lat: 39.8098, lng: -77.2342, altitudeM: 182, sequence: 1 },
      { lat: 39.8042, lng: -77.2368, altitudeM: 190, sequence: 2 },
      { lat: 39.7918, lng: -77.2369, altitudeM: 201, sequence: 3 },
      { lat: 39.7905, lng: -77.2356, altitudeM: 205, sequence: 4 },
      { lat: 39.7989, lng: -77.2331, altitudeM: 188, sequence: 5 },
      { lat: 39.8121, lng: -77.2311, altitudeM: 178, sequence: 6 },
    ],
    checkpoints: [
      {
        name: 'Soldiers\' National Cemetery',
        type: 'HISTORICAL',
        lat: 39.8121,
        lng: -77.2311,
        altitudeM: 178,
        description:
          'Site of Lincoln\'s Gettysburg Address (Nov 19, 1863). Over 3,500 Union soldiers are interred here in a semicircle by home state.',
        orderIndex: 0,
      },
      {
        name: 'The Angle & Copse of Trees',
        type: 'HISTORICAL',
        lat: 39.8098,
        lng: -77.2342,
        altitudeM: 182,
        description:
          'The "High Water Mark of the Confederacy" — the furthest point reached by Pickett\'s Charge on July 3, 1863.',
        orderIndex: 1,
      },
      {
        name: 'Pickett\'s Charge Field Crossing',
        type: 'UPCOMING',
        lat: 39.8042,
        lng: -77.2368,
        altitudeM: 190,
        description:
          'Ahead lies the open mile that ~12,500 Confederate infantry crossed under artillery fire. Interpretive markers line the path.',
        orderIndex: 2,
      },
      {
        name: 'Little Round Top Summit',
        type: 'HISTORICAL',
        lat: 39.7918,
        lng: -77.2369,
        altitudeM: 201,
        radiusTriggerM: 40,
        description:
          'Key Union left flank held by the 20th Maine. Panoramic view over Devil\'s Den and the Valley of Death.',
        orderIndex: 3,
      },
      {
        name: 'Devil\'s Den Rocks',
        type: 'DANGER',
        lat: 39.7905,
        lng: -77.2356,
        altitudeM: 205,
        radiusTriggerM: 25,
        description:
          'Uneven boulder field. Surfaces are slick after rain and gaps between rocks are deep — watch your footing.',
        orderIndex: 4,
      },
    ],
    tips: [
      {
        type: 'ADVICE',
        text: 'Start early — the battlefield is exposed with little shade and gets busy with tour traffic by mid-morning.',
      },
      {
        type: 'WARNING',
        text: 'Climbing on monuments and cannons is prohibited and can be dangerous.',
      },
      {
        type: 'WARNING',
        text: 'The boulders here shift and the gaps are deeper than they look. Keep children close.',
        checkpointIndex: 4,
      },
    ],
  },
  {
    title: {
      ru: 'Подъём на Артурс-Сит через Старый город',
      en: 'Arthur\'s Seat & Old Town Ascent',
      kk: 'Ескі қала арқылы Артурс-Ситке көтерілу',
    },
    description: {
      ru: 'От средневековой Royal Mile вверх по потухшему вулкану — лучшая панорама Эдинбурга. Короткий, но крутой классический маршрут, сочетающий историю с суровым шотландским пейзажем.',
      en: 'From the medieval Royal Mile up an extinct volcano for the best panorama in Edinburgh. A short but steep classic that mixes history with raw Scottish landscape.',
      kk: 'Ортағасырлық Royal Mile-дан сөнген жанартауға дейін — Эдинбургтің ең тамаша панорамасы. Тарихты қатаң шотланд пейзажымен ұштастыратын қысқа, бірақ тік классикалық маршрут.',
    },
    category: 'MIXED',
    difficulty: 'HARD',
    distanceKm: 5.1,
    estimatedMinutes: 95,
    region: {
      ru: 'Эдинбург, Шотландия, Великобритания',
      en: 'Edinburgh, Scotland, UK',
      kk: 'Эдинбург, Шотландия, Ұлыбритания',
    },
    country: { ru: 'Великобритания', en: 'United Kingdom', kk: 'Ұлыбритания' },
    coverImageUrl:
      'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=1200',
    pathPoints: [
      { lat: 55.9486, lng: -3.1999, altitudeM: 80, sequence: 0 },
      { lat: 55.9522, lng: -3.1866, altitudeM: 70, sequence: 1 },
      { lat: 55.9486, lng: -3.1722, altitudeM: 95, sequence: 2 },
      { lat: 55.9445, lng: -3.1619, altitudeM: 180, sequence: 3 },
      { lat: 55.9441, lng: -3.1618, altitudeM: 251, sequence: 4 },
    ],
    checkpoints: [
      {
        name: 'Edinburgh Castle Esplanade',
        type: 'HISTORICAL',
        lat: 55.9486,
        lng: -3.1999,
        altitudeM: 80,
        description:
          'A fortress on Castle Rock since at least the 12th century. The esplanade hosts the Royal Edinburgh Military Tattoo each August.',
        orderIndex: 0,
      },
      {
        name: 'St Giles\' Cathedral',
        type: 'HISTORICAL',
        lat: 55.9497,
        lng: -3.1908,
        altitudeM: 75,
        description:
          'The principal place of worship of the Church of Scotland for ~900 years, famous for its crown steeple.',
        orderIndex: 1,
      },
      {
        name: 'Holyrood Park Gate',
        type: 'INFO',
        lat: 55.9486,
        lng: -3.1722,
        altitudeM: 95,
        description:
          'Entrance to the royal park. From here the paved street gives way to grass and rock — the real climb begins.',
        orderIndex: 2,
      },
      {
        name: 'Steep Scramble Section',
        type: 'DANGER',
        lat: 55.9445,
        lng: -3.1619,
        altitudeM: 180,
        radiusTriggerM: 35,
        description:
          'Loose scree and exposed rock steps. Strong winds funnel through here — keep three points of contact on the final approach.',
        orderIndex: 3,
      },
      {
        name: 'Arthur\'s Seat Summit',
        type: 'HISTORICAL',
        lat: 55.9441,
        lng: -3.1618,
        altitudeM: 251,
        radiusTriggerM: 30,
        description:
          'The 251 m summit of an extinct volcano, with Iron Age hill-fort remains and a 360° view of the city, Firth of Forth and Pentland Hills.',
        orderIndex: 4,
      },
    ],
    tips: [
      {
        type: 'WARNING',
        text: 'Edinburgh weather turns fast — bring a windproof layer even on a sunny start. The summit is far colder and windier than the city.',
      },
      {
        type: 'ADVICE',
        text: 'Wear proper grip footwear. The basalt is slippery when wet and many ankle injuries happen on the descent, not the climb.',
        checkpointIndex: 3,
      },
    ],
  },
  {
    title: {
      ru: 'Прибрежная панорама Золотых Ворот',
      en: 'Golden Gate Coastal Vista',
      kk: 'Алтын қақпаның жағалаулық панорамасы',
    },
    description: {
      ru: 'Овеваемая ветром прогулка по утёсам от центра для посетителей моста Золотые Ворота вдоль тропы Battery to Bluffs, с непрерывными видами на мост, залив и холмы Марин.',
      en: 'A breezy clifftop walk from the Golden Gate Bridge welcome center out along the Battery to Bluffs Trail, with non-stop views of the bridge, the bay and the Marin Headlands.',
      kk: 'Алтын қақпа көпірінің қонақ үйінен Battery to Bluffs жолы бойымен жағалаудағы желді серуен — көпірге, шығанаққа және Марин тауларына үздіксіз көрініс ашылады.',
    },
    category: 'SCENIC',
    difficulty: 'EASY',
    distanceKm: 4.2,
    estimatedMinutes: 70,
    region: {
      ru: 'Сан-Франциско, Калифорния, США',
      en: 'San Francisco, California, USA',
      kk: 'Сан-Франциско, Калифорния, АҚШ',
    },
    country: { ru: 'США', en: 'United States', kk: 'АҚШ' },
    coverImageUrl:
      'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=1200',
    pathPoints: [
      { lat: 37.8078, lng: -122.4753, altitudeM: 60, sequence: 0 },
      { lat: 37.8053, lng: -122.4744, altitudeM: 55, sequence: 1 },
      { lat: 37.8019, lng: -122.4738, altitudeM: 40, sequence: 2 },
      { lat: 37.7986, lng: -122.4729, altitudeM: 30, sequence: 3 },
      { lat: 37.7955, lng: -122.4737, altitudeM: 25, sequence: 4 },
    ],
    checkpoints: [
      {
        name: 'Bridge Welcome Center',
        type: 'INFO',
        lat: 37.8078,
        lng: -122.4753,
        altitudeM: 60,
        description:
          'Start point with exhibits on the 1937 construction of the Golden Gate Bridge and the original test tower.',
        orderIndex: 0,
      },
      {
        name: 'Battery East Vista',
        type: 'HISTORICAL',
        lat: 37.8053,
        lng: -122.4744,
        altitudeM: 55,
        description:
          'A late-19th-century coastal artillery battery. The classic postcard angle of the south tower is right here.',
        orderIndex: 1,
      },
      {
        name: 'Cliff Edge Overlook',
        type: 'DANGER',
        lat: 37.8019,
        lng: -122.4738,
        altitudeM: 40,
        radiusTriggerM: 20,
        description:
          'Unfenced cliff edge with a long drop to the rocks below. Stay on the marked trail, especially in fog.',
        orderIndex: 2,
      },
      {
        name: 'Marshall\'s Beach Viewpoint',
        type: 'INFO',
        lat: 37.7986,
        lng: -122.4729,
        altitudeM: 30,
        description:
          'A quieter overlook above a sandy cove, looking back at the full span of the bridge.',
        orderIndex: 3,
      },
    ],
    tips: [
      {
        type: 'ADVICE',
        text: 'Afternoon fog ("Karl") often rolls in and hides the bridge entirely. Late morning usually gives the clearest views.',
      },
      {
        type: 'WARNING',
        text: 'The wind off the Pacific is strong and cold at the overlooks — hold onto hats and phones near the edge.',
        checkpointIndex: 2,
      },
    ],
  },
  {
    title: {
      ru: 'Прогулка по Римскому форуму',
      en: 'Ancient Rome Forum Walk',
      kk: 'Ежелгі Рим форумы бойынша серуен',
    },
    description: {
      ru: 'Ровная, насыщенная историей прогулка по сердцу Римской империи: Колизей, руины храмов и базилик Форума, а также подъём на Палатин, где был основан город.',
      en: 'A flat, history-dense stroll through the heart of the Roman Empire: the Colosseum, the Forum\'s ruined temples and basilicas, and up the Palatine where the city was founded.',
      kk: 'Рим империясының жүрегі арқылы өтетін тегіс, тарихқа бай серуен: Колизей, Форумның қираған ғибадатханалары мен базиликалары және қала негізі қаланған Палатин төбесі.',
    },
    category: 'HISTORICAL',
    difficulty: 'EASY',
    distanceKm: 3.3,
    estimatedMinutes: 90,
    region: { ru: 'Рим, Италия', en: 'Rome, Italy', kk: 'Рим, Италия' },
    country: { ru: 'Италия', en: 'Italy', kk: 'Италия' },
    coverImageUrl:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
    pathPoints: [
      { lat: 41.8902, lng: 12.4922, altitudeM: 25, sequence: 0 },
      { lat: 41.8919, lng: 12.4869, altitudeM: 28, sequence: 1 },
      { lat: 41.8925, lng: 12.4853, altitudeM: 30, sequence: 2 },
      { lat: 41.8892, lng: 12.4853, altitudeM: 40, sequence: 3 },
      { lat: 41.8877, lng: 12.4869, altitudeM: 45, sequence: 4 },
    ],
    checkpoints: [
      {
        name: 'The Colosseum',
        type: 'HISTORICAL',
        lat: 41.8902,
        lng: 12.4922,
        altitudeM: 25,
        description:
          'The largest amphitheatre ever built (80 AD), seating ~50,000 for gladiatorial games. The exposed hypogeum below the floor housed animals and machinery.',
        orderIndex: 0,
      },
      {
        name: 'Arch of Titus',
        type: 'HISTORICAL',
        lat: 41.8919,
        lng: 12.4869,
        altitudeM: 28,
        description:
          'A 1st-century triumphal arch commemorating the Siege of Jerusalem, the model for many later arches including the Arc de Triomphe.',
        orderIndex: 1,
      },
      {
        name: 'Roman Forum Main Path',
        type: 'INFO',
        lat: 41.8925,
        lng: 12.4853,
        altitudeM: 30,
        description:
          'The Via Sacra runs through the political and religious centre of ancient Rome, past the Temple of Saturn and the Curia.',
        orderIndex: 2,
      },
      {
        name: 'Uneven Ancient Paving',
        type: 'DANGER',
        lat: 41.8892,
        lng: 12.4853,
        altitudeM: 40,
        radiusTriggerM: 20,
        description:
          'Original basalt paving is worn smooth and uneven. Twisted ankles are the most common injury here — walk slowly.',
        orderIndex: 3,
      },
      {
        name: 'Palatine Hill Viewpoint',
        type: 'HISTORICAL',
        lat: 41.8877,
        lng: 12.4869,
        altitudeM: 45,
        description:
          'Legendary founding site of Rome and home to imperial palaces. Overlooks the Circus Maximus and the Forum below.',
        orderIndex: 4,
      },
    ],
    tips: [
      {
        type: 'ADVICE',
        text: 'Bring a refillable bottle — Rome\'s "nasoni" drinking fountains run cold, clean water and there are several along the route.',
      },
      {
        type: 'WARNING',
        text: 'Very little shade and brutal summer heat. Visit early or late and carry sun protection.',
      },
    ],
  },

  // ─── Pavlodar, Kazakhstan ────────────────────────────────────────────────────
  {
    title: {
      ru: 'Прогулка по набережной Иртыша в Павлодаре',
      en: 'Pavlodar Irtysh Embankment Stroll',
      kk: 'Павлодардағы Ертіс жағалауы бойынша серуен',
    },
    description: {
      ru: 'Лёгкая ровная прогулка вдоль набережной Иртыша — любимый променад города. Широкие дорожки, фонтаны, смотровые площадки над рекой и множество скамеек делают это классической вечерней прогулкой Павлодара.',
      en: 'An easy, flat riverside walk along the Irtysh embankment — the city\'s favourite promenade. Wide paths, fountains, viewpoints over the river and plenty of benches make this the classic Pavlodar evening walk.',
      kk: 'Ертіс жағалауы бойымен жеңіл әрі тегіс серуен — қаланың сүйікті серуен жолы. Кең жолдар, субұрқақтар, өзенге қарайтын көрнекі алаңдар мен көптеген орындықтар оны Павлодардың классикалық кешкі серуеніне айналдырады.',
    },
    category: 'SCENIC',
    difficulty: 'EASY',
    distanceKm: 3.8,
    estimatedMinutes: 60,
    region: { ru: 'Павлодар, Казахстан', en: 'Pavlodar, Kazakhstan', kk: 'Павлодар, Қазақстан' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', kk: 'Қазақстан' },
    coverImageUrl:
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
    pathPoints: [
      { lat: 52.3015, lng: 76.9438, altitudeM: 122, sequence: 0 },
      { lat: 52.2982, lng: 76.9456, altitudeM: 122, sequence: 1 },
      { lat: 52.2951, lng: 76.9472, altitudeM: 121, sequence: 2 },
      { lat: 52.2916, lng: 76.9488, altitudeM: 121, sequence: 3 },
      { lat: 52.2884, lng: 76.9503, altitudeM: 120, sequence: 4 },
    ],
    checkpoints: [
      {
        name: 'River Station (Rechnoy Vokzal)',
        type: 'INFO',
        lat: 52.3015,
        lng: 76.9438,
        altitudeM: 122,
        description:
          'The Pavlodar river station, departure point for Irtysh boat trips and the northern end of the embankment promenade.',
        orderIndex: 0,
      },
      {
        name: 'Embankment Fountains',
        type: 'INFO',
        lat: 52.2951,
        lng: 76.9472,
        altitudeM: 121,
        description:
          'A popular gathering spot with cascading fountains that run all summer — lively in the evenings.',
        orderIndex: 1,
      },
      {
        name: 'Irtysh Viewpoint',
        type: 'HISTORICAL',
        lat: 52.2916,
        lng: 76.9488,
        altitudeM: 121,
        radiusTriggerM: 40,
        description:
          'Open overlook across the Irtysh — one of the longest rivers in Asia, flowing from the Altai through Kazakhstan to Russia.',
        orderIndex: 2,
      },
      {
        name: 'Riverbank Steps',
        type: 'DANGER',
        lat: 52.2884,
        lng: 76.9503,
        altitudeM: 120,
        radiusTriggerM: 25,
        description:
          'Stone steps down to the water can be slippery and the current is strong here — keep back from the edge.',
        orderIndex: 3,
      },
    ],
    tips: [
      {
        type: 'ADVICE',
        text: 'Go an hour before sunset — the light over the Irtysh is the best in the city and the fountains are lit.',
      },
      {
        type: 'WARNING',
        text: 'Winters are harsh in Pavlodar; the embankment gets icy and windy from November to March. Dress for it.',
      },
    ],
  },
  {
    title: {
      ru: 'Прогулка по историческому центру Павлодара',
      en: 'Pavlodar Old Town Heritage Walk',
      kk: 'Павлодардың тарихи орталығы бойынша серуен',
    },
    description: {
      ru: 'Спокойная петля по историческому центру Павлодара: Благовещенский собор, мечеть Машхур Жусупа, тенистый парк имени Ленина и центральная площадь. Компактное знакомство со смешанным культурным наследием города.',
      en: 'A gentle loop through historic central Pavlodar, taking in the Annunciation Cathedral, the Mashkhur Jusup mosque, leafy Lenin Park and the central square. A compact introduction to the city\'s mixed cultural heritage.',
      kk: 'Павлодардың тарихи орталығы бойынша жайбарақат шеңбер: Благовещение соборы, Машхүр Жүсіп мешіті, көлеңкелі Ленин паркі және орталық алаң. Қаланың аралас мәдени мұрасымен қысқаша танысу.',
    },
    category: 'HISTORICAL',
    difficulty: 'EASY',
    distanceKm: 4.5,
    estimatedMinutes: 80,
    region: { ru: 'Павлодар, Казахстан', en: 'Pavlodar, Kazakhstan', kk: 'Павлодар, Қазақстан' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', kk: 'Қазақстан' },
    coverImageUrl:
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200',
    pathPoints: [
      { lat: 52.2870, lng: 76.9665, altitudeM: 130, sequence: 0 },
      { lat: 52.2858, lng: 76.9628, altitudeM: 131, sequence: 1 },
      { lat: 52.2841, lng: 76.9583, altitudeM: 132, sequence: 2 },
      { lat: 52.2825, lng: 76.9541, altitudeM: 133, sequence: 3 },
      { lat: 52.2849, lng: 76.9519, altitudeM: 132, sequence: 4 },
      { lat: 52.2870, lng: 76.9665, altitudeM: 130, sequence: 5 },
    ],
    checkpoints: [
      {
        name: 'Annunciation Cathedral',
        type: 'HISTORICAL',
        lat: 52.2870,
        lng: 76.9665,
        altitudeM: 130,
        description:
          'The Blagoveshchensky (Annunciation) Cathedral, a striking Russian-Orthodox church and one of Pavlodar\'s landmarks.',
        orderIndex: 0,
      },
      {
        name: 'Central Square',
        type: 'INFO',
        lat: 52.2858,
        lng: 76.9628,
        altitudeM: 131,
        description:
          'The civic heart of the city, framed by the regional administration building and seasonal installations.',
        orderIndex: 1,
      },
      {
        name: 'Lenin Park',
        type: 'INFO',
        lat: 52.2841,
        lng: 76.9583,
        altitudeM: 132,
        description:
          'A shaded city park with avenues of trees — a cool refuge on hot summer afternoons.',
        orderIndex: 2,
      },
      {
        name: 'Mashkhur Jusup Mosque',
        type: 'HISTORICAL',
        lat: 52.2825,
        lng: 76.9541,
        altitudeM: 133,
        radiusTriggerM: 35,
        description:
          'The central mosque named after the Kazakh scholar and poet Mashkhur Jusup Kopeev, with its distinctive blue domes.',
        orderIndex: 3,
      },
    ],
    tips: [
      {
        type: 'ADVICE',
        text: 'Dress respectfully if you plan to enter the mosque or cathedral, and check visiting hours around prayer/service times.',
      },
      {
        type: 'ADVICE',
        text: 'The whole loop is flat and paved — comfortable for all ages and good in any season except deep winter.',
      },
    ],
  },
  {
    title: {
      ru: 'Петля по городскому парку и набережной Павлодара',
      en: 'Pavlodar City Park & Riverside Loop',
      kk: 'Павлодар қалалық паркі мен жағалау шеңбері',
    },
    description: {
      ru: 'Более длинная смешанная петля, соединяющая центральный городской парк с набережной Иртыша. Сочетает тенистые парковые аллеи, детские площадки и открытые прибрежные тропы в один разнообразный полудневный маршрут.',
      en: 'A longer mixed loop linking the central city park with the Irtysh waterfront. Combines shaded park avenues, playgrounds and open riverside paths into one varied half-day walk.',
      kk: 'Орталық қалалық паркті Ертіс жағалауымен байланыстыратын ұзынырақ аралас шеңбер. Көлеңкелі парк аллеяларын, ойын алаңдарын және ашық жағалау жолдарын бір алуан түрлі жарты күндік серуенге біріктіреді.',
    },
    category: 'MIXED',
    difficulty: 'MODERATE',
    distanceKm: 6.2,
    estimatedMinutes: 105,
    region: { ru: 'Павлодар, Казахстан', en: 'Pavlodar, Kazakhstan', kk: 'Павлодар, Қазақстан' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', kk: 'Қазақстан' },
    coverImageUrl:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
    pathPoints: [
      { lat: 52.2879, lng: 76.9651, altitudeM: 129, sequence: 0 },
      { lat: 52.2905, lng: 76.9602, altitudeM: 128, sequence: 1 },
      { lat: 52.2933, lng: 76.9551, altitudeM: 126, sequence: 2 },
      { lat: 52.2951, lng: 76.9495, altitudeM: 123, sequence: 3 },
      { lat: 52.2980, lng: 76.9460, altitudeM: 122, sequence: 4 },
      { lat: 52.2939, lng: 76.9523, altitudeM: 125, sequence: 5 },
      { lat: 52.2879, lng: 76.9651, altitudeM: 129, sequence: 6 },
    ],
    checkpoints: [
      {
        name: 'City Park Gate',
        type: 'INFO',
        lat: 52.2879,
        lng: 76.9651,
        altitudeM: 129,
        description:
          'Main entrance to the central park (gorodskoy sad), with rides, kiosks and tree-lined avenues.',
        orderIndex: 0,
      },
      {
        name: 'Park Avenue Crossing',
        type: 'UPCOMING',
        lat: 52.2933,
        lng: 76.9551,
        altitudeM: 126,
        description:
          'Ahead the route leaves the park and heads down toward the river — watch for cyclists on the shared path.',
        orderIndex: 1,
      },
      {
        name: 'Waterfront Junction',
        type: 'INFO',
        lat: 52.2951,
        lng: 76.9495,
        altitudeM: 123,
        description:
          'Where the park path meets the Irtysh embankment — turn here to follow the river north.',
        orderIndex: 2,
      },
      {
        name: 'Open Riverside Stretch',
        type: 'DANGER',
        lat: 52.2980,
        lng: 76.9460,
        altitudeM: 122,
        radiusTriggerM: 30,
        description:
          'Exposed, unshaded riverside with little cover. Carry water in summer and a windbreak in cooler months.',
        orderIndex: 3,
      },
    ],
    tips: [
      {
        type: 'ADVICE',
        text: 'Start from the park in the morning, do the riverside leg before midday, and finish back in the shade of the park.',
      },
      {
        type: 'WARNING',
        text: 'The river leg is fully exposed — sun protection in summer, wind protection in spring and autumn.',
      },
    ],
  },
];

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database...');

  // Clean slate (order respects FK / cascade safety).
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.userRouteProgress.deleteMany();
  await prisma.routeTip.deleteMany();
  await prisma.checkpoint.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@trailquest.app',
      name: 'Trail Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });
  const hiker = await prisma.user.create({
    data: {
      email: 'hiker@trailquest.app',
      name: 'Sam Walker',
      role: 'USER',
      passwordHash,
    },
  });
  const quickLoginHash = await bcrypt.hash('123', 12);
  const quickLogin = await prisma.user.create({
    data: {
      email: 'email@email.com',
      name: 'Quick Login',
      role: 'USER',
      passwordHash: quickLoginHash,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`   created users: ${admin.email}, ${hiker.email}, ${quickLogin.email}`);

  // ─── Routes + checkpoints + tips ─────────────────────────────────────────────
  let firstPostRouteId: string | null = null;

  for (const r of routes) {
    const created = await prisma.route.create({
      data: {
        titleRu: r.title.ru,
        titleEn: r.title.en,
        titleKk: r.title.kk,
        descriptionRu: r.description.ru,
        descriptionEn: r.description.en,
        descriptionKk: r.description.kk,
        category: r.category,
        difficulty: r.difficulty,
        distanceKm: r.distanceKm,
        estimatedMinutes: r.estimatedMinutes,
        regionRu: r.region.ru,
        regionEn: r.region.en,
        regionKk: r.region.kk,
        countryRu: r.country.ru,
        countryEn: r.country.en,
        countryKk: r.country.kk,
        coverImageUrl: r.coverImageUrl ?? null,
        pathPoints: r.pathPoints as unknown as Prisma.InputJsonValue,
        checkpoints: {
          create: r.checkpoints.map((c) => ({
            nameRu: '',
            nameEn: c.name,
            nameKk: '',
            type: c.type,
            lat: c.lat,
            lng: c.lng,
            altitudeM: c.altitudeM ?? null,
            radiusTriggerM: c.radiusTriggerM ?? 30,
            descriptionRu: '',
            descriptionEn: c.description,
            descriptionKk: '',
            qrCode: makeQrCode(),
            orderIndex: c.orderIndex,
          })),
        },
      },
      include: { checkpoints: { orderBy: { orderIndex: 'asc' } } },
    });

    // Tips — resolve checkpointIndex to the real checkpoint id.
    for (const t of r.tips) {
      const checkpointId =
        t.checkpointIndex !== undefined
          ? created.checkpoints[t.checkpointIndex]?.id ?? null
          : null;
      await prisma.routeTip.create({
        data: {
          routeId: created.id,
          checkpointId,
          type: t.type,
          textRu: '',
          textEn: t.text,
          textKk: '',
        },
      });
    }

    if (!firstPostRouteId) firstPostRouteId = created.id;
    // eslint-disable-next-line no-console
    console.log(
      `   created route "${created.titleEn}" (${created.checkpoints.length} checkpoints)`,
    );
  }

  // ─── A sample forum thread ───────────────────────────────────────────────────
  if (firstPostRouteId) {
    const post = await prisma.forumPost.create({
      data: {
        routeId: firstPostRouteId,
        userId: hiker.id,
        title: 'Best time of day to start?',
        body: 'Did this last weekend — strongly recommend an early start to beat the crowds and the heat. Took about 2 hours at an easy pace.',
      },
    });
    await prisma.forumComment.create({
      data: {
        postId: post.id,
        userId: admin.id,
        body: 'Agreed. The light just after sunrise is also fantastic for photos at the overlooks.',
      },
    });
    // eslint-disable-next-line no-console
    console.log('   created sample forum thread');
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
