// import the theme to use for this web app (from compiled dist)
import theme from 'clad-ui/theme/chotot';

// new from clad-ui@1.2
export type {
  alias,
  BorderWidths,
  ColorAlias,
  Colors,
  Durations,
  FontSizes,
  FontWeights,
  Fonts,
  Gradients,
  MediaQuery,
  Radii,
  Shadows,
  Sizes,
  Space,
  ZIndices,
} from 'clad-ui/theme';

/**
 * extend and override custom tokens for theme here
 */
// const { colors } = theme;
const appTheme = {
  ...theme,
  // colors: {
  //   ...colors,
  //   primary: colors.red2,
  //   secondary: colors.blue2,
  // },
};

export default appTheme;
