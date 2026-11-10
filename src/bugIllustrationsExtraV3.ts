import type {ImageSourcePropType} from 'react-native';
// HD illustrations supplied by the project owner (AI-generated, 10 Nov 2026) for species without a usable picture in the
// original bugdex. Kept apart from the generated src/bugIllustrationsV2.ts so a re-import never overwrites them.
// Provenance: assets/v2/illustrations/source-extra.json. Shinies keep their model-matched portraits.
export const extraBugIllustrations:Record<string,{hd:ImageSourcePropType;thumb:ImageSourcePropType}>={
 'weevil':{hd:require('../assets/v2/illustrations/weevil.webp'),thumb:require('../assets/v2/illustrations/thumbs/weevil.webp')},
 'beetlegrub':{hd:require('../assets/v2/illustrations/beetlegrub.webp'),thumb:require('../assets/v2/illustrations/thumbs/beetlegrub.webp')},
};
