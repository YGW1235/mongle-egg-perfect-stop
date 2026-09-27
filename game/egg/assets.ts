import { ImageSourcePropType } from 'react-native';

export const CREAM_EGG_IMAGES: ImageSourcePropType[] = [
  require('../../assets/eggs/cream-0.png'),
  require('../../assets/eggs/cream-1.png'),
  require('../../assets/eggs/cream-2.png'),
  require('../../assets/eggs/cream-3.png'),
  require('../../assets/eggs/cream-4.png'),
];

export const CHARACTER_IMAGES = {
  mongle: require('../../assets/characters/mongle.png'),
  'mallang-mongle': require('../../assets/characters/mallang-mongle.png'),
  'kkakkung-mongle': require('../../assets/characters/kkakkung-mongle.png'),
  'kkori-mongle': require('../../assets/characters/kkori-mongle.png'),
  'kkubeok-mongle': require('../../assets/characters/kkubeok-mongle.png'),
  'donggeul-mongle': require('../../assets/characters/donggeul-mongle.png'),
  'ppijuk-mongle': require('../../assets/characters/ppijuk-mongle.png'),
  'seot-mongle': require('../../assets/characters/seot-mongle.png'),
  'jjomul-mongle': require('../../assets/characters/jjomul-mongle.png'),
  'hesil-mongle': require('../../assets/characters/hesil-mongle.png'),
  'posil-mongle': require('../../assets/characters/posil-mongle.png'),
  'kkot-mongle': require('../../assets/characters/kkot-mongle.png'),
  'meokbo-mongle': require('../../assets/characters/meokbo-mongle.png'),
  'meong-mongle': require('../../assets/characters/meong-mongle.png'),
  'ppogeul-mongle': require('../../assets/characters/ppogeul-mongle.png'),
  'eojil-mongle': require('../../assets/characters/eojil-mongle.png'),
  'kong-mongle': require('../../assets/characters/kong-mongle.png'),
  'poljjak-mongle': require('../../assets/characters/poljjak-mongle.png'),
  'bangul-mongle': require('../../assets/characters/bangul-mongle.png'),
  'gureum-mongle': require('../../assets/characters/gureum-mongle.png'),
  'kkum-mongle': require('../../assets/characters/kkum-mongle.png'),
  'bamtol-mongle': require('../../assets/characters/bamtol-mongle.png'),
  'byeol-mongle': require('../../assets/characters/byeol-mongle.png'),
  'pogeun-mongle': require('../../assets/characters/pogeun-mongle.png'),
  'dal-mongle': require('../../assets/characters/dal-mongle.png'),
  'namu-mongle': require('../../assets/characters/namu-mongle.png'),
  ororongle: require('../../assets/characters/ororongle.png'),
  'cheonsa-mongle': require('../../assets/characters/cheonsa-mongle.png'),
  'king-mongle': require('../../assets/characters/king-mongle.png'),
  'sinbi-mongle': require('../../assets/characters/sinbi-mongle.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export const CHARACTER_THUMBNAILS = {
  mongle: require('../../assets/characters/thumbs/mongle.png'),
  'mallang-mongle': require('../../assets/characters/thumbs/mallang-mongle.png'),
  'kkakkung-mongle': require('../../assets/characters/thumbs/kkakkung-mongle.png'),
  'kkori-mongle': require('../../assets/characters/thumbs/kkori-mongle.png'),
  'kkubeok-mongle': require('../../assets/characters/thumbs/kkubeok-mongle.png'),
  'donggeul-mongle': require('../../assets/characters/thumbs/donggeul-mongle.png'),
  'ppijuk-mongle': require('../../assets/characters/thumbs/ppijuk-mongle.png'),
  'seot-mongle': require('../../assets/characters/thumbs/seot-mongle.png'),
  'jjomul-mongle': require('../../assets/characters/thumbs/jjomul-mongle.png'),
  'hesil-mongle': require('../../assets/characters/thumbs/hesil-mongle.png'),
  'posil-mongle': require('../../assets/characters/thumbs/posil-mongle.png'),
  'kkot-mongle': require('../../assets/characters/thumbs/kkot-mongle.png'),
  'meokbo-mongle': require('../../assets/characters/thumbs/meokbo-mongle.png'),
  'meong-mongle': require('../../assets/characters/thumbs/meong-mongle.png'),
  'ppogeul-mongle': require('../../assets/characters/thumbs/ppogeul-mongle.png'),
  'eojil-mongle': require('../../assets/characters/thumbs/eojil-mongle.png'),
  'kong-mongle': require('../../assets/characters/thumbs/kong-mongle.png'),
  'poljjak-mongle': require('../../assets/characters/thumbs/poljjak-mongle.png'),
  'bangul-mongle': require('../../assets/characters/thumbs/bangul-mongle.png'),
  'gureum-mongle': require('../../assets/characters/thumbs/gureum-mongle.png'),
  'kkum-mongle': require('../../assets/characters/thumbs/kkum-mongle.png'),
  'bamtol-mongle': require('../../assets/characters/thumbs/bamtol-mongle.png'),
  'byeol-mongle': require('../../assets/characters/thumbs/byeol-mongle.png'),
  'pogeun-mongle': require('../../assets/characters/thumbs/pogeun-mongle.png'),
  'dal-mongle': require('../../assets/characters/thumbs/dal-mongle.png'),
  'namu-mongle': require('../../assets/characters/thumbs/namu-mongle.png'),
  ororongle: require('../../assets/characters/thumbs/ororongle.png'),
  'cheonsa-mongle': require('../../assets/characters/thumbs/cheonsa-mongle.png'),
  'king-mongle': require('../../assets/characters/thumbs/king-mongle.png'),
  'sinbi-mongle': require('../../assets/characters/thumbs/sinbi-mongle.png'),
} as const satisfies Record<keyof typeof CHARACTER_IMAGES, ImageSourcePropType>;

export const MONGLE_IMAGE = CHARACTER_IMAGES.mongle;
export const MALLANG_MONGLE_IMAGE = CHARACTER_IMAGES['mallang-mongle'];
export const POSIL_MONGLE_IMAGE = CHARACTER_IMAGES['posil-mongle'];
export const BANGUL_MONGLE_IMAGE = CHARACTER_IMAGES['bangul-mongle'];
export const DAL_MONGLE_IMAGE = CHARACTER_IMAGES['dal-mongle'];
export const KING_MONGLE_IMAGE = CHARACTER_IMAGES['king-mongle'];
