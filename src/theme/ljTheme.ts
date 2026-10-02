import type { ThemeConfig } from 'antd'

/** LJ Hooker brand palette, taken from the office site's `--ljh-brand-color-*` variables. */
export const brand = {
  vintageLeather: '#5E211C',
  vintageLeatherText: '#CFBCBB',
  youngLeather: '#AB826E',
  darkOcean: '#223F57',
  darkOceanText: '#BDC5CD',
  darkGum: '#626F5C',
  lightGum: '#619975',
  darkClay: '#AE8F73',
  lightClay: '#E5D2AC',
  linen: '#FFF9EB',
  lightGray: '#E8EBEE',
  ink: '#000000',
  paper: '#FFFFFF',
} as const

export const fontFamily = '"Instrument Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export const ljTheme: ThemeConfig = {
  token: {
    colorPrimary: brand.vintageLeather,
    colorInfo: brand.darkOcean,
    colorSuccess: brand.lightGum,
    colorWarning: brand.darkClay,
    colorLink: brand.vintageLeather,
    colorTextHeading: brand.vintageLeather,
    colorText: brand.ink,
    colorBgLayout: brand.linen,
    colorBorderSecondary: '#EFE6D6',
    fontFamily,
    fontSize: 15,
    borderRadius: 6,
    controlHeight: 40,
  },
  components: {
    Button: {
      borderRadius: 100,
      borderRadiusLG: 100,
      borderRadiusSM: 100,
      paddingInline: 24,
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Segmented: {
      borderRadius: 100,
      borderRadiusSM: 100,
      itemSelectedBg: brand.vintageLeather,
      itemSelectedColor: brand.linen,
      trackBg: '#F3EBDD',
    },
    Card: {
      headerFontSize: 17,
    },
    Table: {
      headerBg: '#FBF5EA',
      headerColor: brand.vintageLeather,
      rowHoverBg: '#FFFCF5',
    },
    Tag: {
      borderRadiusSM: 100,
    },
  },
}
