// ─── CMS Design Tokens ────────────────────────────────────────────────────────
// Wayyo brand palette: Cobalt #3559C7 · Light Blue #EEF2FC · Silver #C0C7D4
// Deep Navy #202A40 · White #FFFFFF. Soft, rounded, "floating surface" look.

export const CMS_COLORS = {
  // Brand
  primary:       "#3559C7",
  primaryHover:  "#2C4BB0",
  primaryActive: "#243F9C",
  primarySoft:   "#E3E9FA", // tinted chip / icon backgrounds
  light:         "#EEF2FC",
  silver:        "#C0C7D4",
  navy:          "#202A40",
  white:         "#FFFFFF",

  // Legacy aliases (kept so older imports keep compiling)
  accent:      "#3559C7",
  accentHover: "#2C4BB0",
  accentLight: "#EEF2FC",
  accentGlow:  "rgba(53,89,199,0.16)",

  // Text
  text:          "#202A40",
  textSecondary: "#5B6478",
  textMuted:     "#8A93A6",

  // Semantic
  success:   "#1F9D6B",
  successBg: "#E4F5EE",
  warning:   "#C9821A",
  warningBg: "#FCF2E2",
  danger:    "#D6453A",
  dangerBg:  "#FCE9E7",
  info:      "#3559C7",
  infoBg:    "#EEF2FC",

  // Surfaces
  bg:          "#E8ECF4",
  surface:     "#FFFFFF",
  surfaceAlt:  "#F6F8FD",
  border:      "#DFE4EE",
  borderHover: "#C0C7D4",
};

export const CMS_SHADOWS = {
  xs:   "0 1px 2px rgba(32,42,64,0.05)",
  sm:   "0 2px 8px rgba(32,42,64,0.06)",
  md:   "0 8px 24px -8px rgba(32,42,64,0.12)",
  lg:   "0 18px 40px -16px rgba(32,42,64,0.18)",
  xl:   "0 30px 60px -24px rgba(32,42,64,0.24)",
  card: "0 10px 30px -14px rgba(32,42,64,0.14), 0 1px 2px rgba(32,42,64,0.04)",
  primary: "0 10px 22px -10px rgba(53,89,199,0.55)",
};

export const CMS_RADIUS = {
  sm:  10,
  md:  14,
  lg:  20,
  xl:  26,
  xxl: 32,
  pill: 999,
};

const FONT = "'Plus Jakarta Sans', 'DM Sans', -apple-system, 'Segoe UI', sans-serif";

// Ant Design theme token overrides
export const ANT_THEME_CONFIG = {
  token: {
    colorPrimary:      CMS_COLORS.primary,
    colorSuccess:      CMS_COLORS.success,
    colorWarning:      CMS_COLORS.warning,
    colorError:        CMS_COLORS.danger,
    colorInfo:         CMS_COLORS.primary,
    colorLink:         CMS_COLORS.primary,
    colorTextBase:     CMS_COLORS.text,
    colorText:         CMS_COLORS.text,
    colorTextSecondary: CMS_COLORS.textSecondary,
    colorTextTertiary: CMS_COLORS.textMuted,
    colorBgLayout:     CMS_COLORS.bg,
    colorBgContainer:  CMS_COLORS.white,
    colorBorder:       CMS_COLORS.border,
    colorBorderSecondary: "#E9EDF4",
    colorFillAlter:    CMS_COLORS.surfaceAlt,
    borderRadius:      12,
    borderRadiusLG:    22,
    borderRadiusSM:    8,
    fontFamily:        FONT,
    fontSize:          13,
    lineHeight:        1.6,
    controlHeight:     38,
    controlHeightLG:   44,
    controlHeightSM:   30,
    motionDurationMid: "0.18s",
    boxShadow:         CMS_SHADOWS.md,
    boxShadowSecondary: CMS_SHADOWS.lg,
  },
  components: {
    Table: {
      headerBg:         "transparent",
      headerColor:      CMS_COLORS.textMuted,
      headerSplitColor: "transparent",
      rowHoverBg:       CMS_COLORS.surfaceAlt,
      borderColor:      "#EDF0F6",
      fontSize:         13,
      cellPaddingBlock: 14,
    },
    Card: {
      headerBg:  "transparent",
      paddingLG: 22,
    },
    Button: {
      borderRadius:   999,
      borderRadiusLG: 999,
      borderRadiusSM: 999,
      controlHeight:  38,
      controlHeightLG: 44,
      fontWeight:     600,
      primaryShadow:  CMS_SHADOWS.primary,
      defaultShadow:  "none",
      defaultBorderColor: CMS_COLORS.border,
    },
    Input:       { borderRadius: 12, controlHeight: 40, activeShadow: "0 0 0 3px rgba(53,89,199,0.12)" },
    InputNumber: { borderRadius: 12, controlHeight: 40 },
    Select:      { borderRadius: 12, controlHeight: 40, optionSelectedBg: CMS_COLORS.light },
    DatePicker:  { borderRadius: 12, controlHeight: 40 },
    Tag:         { borderRadiusSM: 999 },
    Modal:       { borderRadiusLG: 26, titleFontSize: 17 },
    Drawer:      { colorBgElevated: "#F6F8FD" },
    Tabs:        { itemSelectedColor: CMS_COLORS.navy, inkBarColor: CMS_COLORS.navy },
    Segmented:   { itemSelectedBg: CMS_COLORS.navy, itemSelectedColor: "#FFFFFF", borderRadius: 999, borderRadiusSM: 999 },
    Popover:     { borderRadiusLG: 18 },
    Layout: {
      siderBg:  "transparent",
      headerBg: "transparent",
      bodyBg:   CMS_COLORS.bg,
    },
  },
};
