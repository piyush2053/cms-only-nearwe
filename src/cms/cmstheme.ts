// ─── CMS Design Tokens ────────────────────────────────────────────────────────
// White + Indigo (#3F51B5) premium enterprise theme

export const CMS_COLORS = {
  // Indigo Scale
  indigo50:  "#E8EAF6",
  indigo100: "#C5CAE9",
  indigo200: "#9FA8DA",
  indigo300: "#7986CB",
  indigo400: "#5C6BC0",
  indigo500: "#3F51B5",  // ← primary
  indigo600: "#3949AB",
  indigo700: "#303F9F",
  indigo800: "#283593",
  indigo900: "#1A237E",

  // Accent
  accent:       "#3F51B5",
  accentHover:  "#303F9F",
  accentLight:  "#E8EAF6",
  accentGlow:   "rgba(63,81,181,0.15)",

  // Semantic
  success:   "#00897B",
  successBg: "#E0F2F1",
  warning:   "#F57C00",
  warningBg: "#FFF3E0",
  danger:    "#E53935",
  dangerBg:  "#FFEBEE",
  info:      "#0288D1",
  infoBg:    "#E1F5FE",

  // Neutrals
  white:    "#FFFFFF",
  gray50:   "#FAFAFA",
  gray100:  "#F5F5F5",
  gray200:  "#EEEEEE",
  gray300:  "#E0E0E0",
  gray400:  "#BDBDBD",
  gray500:  "#9E9E9E",
  gray600:  "#757575",
  gray700:  "#616161",
  gray800:  "#424242",
  gray900:  "#212121",

  // Surface
  bg:         "#F0F2FA",
  surface:    "#FFFFFF",
  surfaceAlt: "#FAFBFF",
  border:     "#E3E6F0",
  borderHover:"#B0BAD4",

  // Sidebar
  sidebarBg:          "#3F51B5",
  sidebarItemColor:   "rgba(255,255,255,0.65)",
  sidebarItemHover:   "rgba(255,255,255,0.12)",
  sidebarItemActive:  "#FFFFFF",
  sidebarActiveBg:    "rgba(255,255,255,0.18)",
};

export const CMS_SHADOWS = {
  xs:  "0 1px 3px rgba(63,81,181,0.06)",
  sm:  "0 2px 6px rgba(63,81,181,0.08), 0 1px 2px rgba(63,81,181,0.04)",
  md:  "0 4px 16px rgba(63,81,181,0.10), 0 2px 4px rgba(63,81,181,0.06)",
  lg:  "0 8px 28px rgba(63,81,181,0.14), 0 4px 8px rgba(63,81,181,0.08)",
  xl:  "0 16px 48px rgba(63,81,181,0.18), 0 8px 16px rgba(63,81,181,0.10)",
  card: "0 2px 12px rgba(63,81,181,0.08)",
};

export const CMS_RADIUS = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  xxl: 28,
};

// Ant Design theme token overrides
export const ANT_THEME_CONFIG = {
  token: {
    colorPrimary:       "#3F51B5",
    colorSuccess:       "#00897B",
    colorWarning:       "#F57C00",
    colorError:         "#E53935",
    colorInfo:          "#0288D1",
    colorTextBase:      "#212121",
    colorBgBase:        "#F0F2FA",
    colorBorder:        "#E3E6F0",
    borderRadius:       10,
    fontFamily:         "'DM Sans', 'Inter', -apple-system, sans-serif",
    fontSize:           13,
    lineHeight:         1.6,
    controlHeight:      36,
    controlHeightLG:    42,
    controlHeightSM:    28,
    motionDurationMid:  "0.18s",
    boxShadow:          "0 2px 8px rgba(63,81,181,0.08)",
  },
  components: {
    Table: {
      headerBg:     "#F5F6FF",
      headerColor:  "#424242",
      rowHoverBg:   "#F0F2FA",
      borderColor:  "#E3E6F0",
      fontSize:     13,
    },
    Card: {
      headerBg:    "#FFFFFF",
      paddingLG:   20,
    },
    Menu: {
      darkItemBg:           "#3F51B5",
      darkItemColor:        "rgba(255,255,255,0.65)",
      darkItemHoverBg:      "rgba(255,255,255,0.12)",
      darkItemHoverColor:   "#FFFFFF",
      darkItemSelectedBg:   "rgba(255,255,255,0.20)",
      darkItemSelectedColor:"#FFFFFF",
      darkSubMenuItemBg:    "#303F9F",
      itemHeight:           44,
    },
    Button: {
      borderRadius:    10,
      controlHeight:   36,
      controlHeightLG: 42,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Tag: {
      borderRadius: 6,
    },
    Modal: {
      borderRadius: 14,
    },
    Layout: {
      siderBg:  "#3F51B5",
      headerBg: "#FFFFFF",
      bodyBg:   "#F0F2FA",
    },
  },
};