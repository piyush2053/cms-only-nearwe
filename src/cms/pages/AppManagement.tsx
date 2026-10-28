// ================= pages/AppManagement.tsx =================
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Form,
  Input,
  Switch,
  Button,
  Typography,
  Table,
  Select,
  message,
  Popconfirm,
  Upload,
  Image,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  CalendarOutlined,
  EyeOutlined,
  BellOutlined,
  PlusOutlined,
  CompassOutlined,
  ReloadOutlined,
  DeleteOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { core_services } from "../../utils/api";
import { CMS_COLORS } from "../cmstheme";
import {
  Page,
  PageHeader,
  Surface,
  StatCard,
  EmptyState,
  Chip,
  IconButton,
  type ChipTone,
} from "../../components/ui";
import { useAsyncAction, useKeyedAction } from "../../hooks/useAsyncAction";

const { Text } = Typography;

/** API helpers throw either an object with `message` or a plain string. */
const errText = (err: any) =>
  err?.message || (typeof err === "string" ? err : "Something went wrong");

/* ─────────────────────────────────────────
   PHONE PREVIEW TONES
   The preview simulates the (dark) mobile app,
   built on Deep Navy with translucent layers.
───────────────────────────────────────── */
const PH = {
  frame: CMS_COLORS.navy,
  screen: CMS_COLORS.navy,
  bar: "rgba(0,0,0,0.22)",
  header: "rgba(255,255,255,0.04)",
  card: "rgba(255,255,255,0.06)",
  cardStrong: "rgba(255,255,255,0.1)",
  line: "rgba(255,255,255,0.12)",
  text: CMS_COLORS.white,
  text2: CMS_COLORS.silver,
  muted: CMS_COLORS.textMuted,
  accent: "#7F9BF0",
};

/* ─────────────────────────────────────────
   PLACEMENT CONFIG
   Maps each banner type → which screens it
   appears on + a friendly label
───────────────────────────────────────── */
const PLACEMENTS: Record<
  string,
  { screens: string[]; color: string; tone: ChipTone; label: string; description: string }
> = {
  banner: {
    screens: ["home"],
    color: CMS_COLORS.primary,
    tone: "primary",
    label: "Social Banner",
    description: "Full-width banner on Home screen below location header",
  },
  in_feed_ad: {
    screens: ["home"],
    color: CMS_COLORS.success,
    tone: "success",
    label: "In Feed Ad",
    description: "Inline ad card inside the Home social feed",
  },
  sponsored_event: {
    screens: ["events"],
    color: CMS_COLORS.warning,
    tone: "warning",
    label: "Sponsored Event",
    description: "Event card with Sponsored badge on Events screen",
  },
  map_banner: {
    screens: ["map"],
    color: CMS_COLORS.navy,
    tone: "neutral",
    label: "Map Banner",
    description: "Floating sponsored card overlaid on the Map screen",
  },
};

/* ─────────────────────────────────────────
   SCREEN TABS
───────────────────────────────────────── */
const SCREEN_TABS = [
  { key: "home", label: "Home", icon: <HomeOutlined /> },
  { key: "map", label: "Map", icon: <CompassOutlined /> },
  { key: "events", label: "Events", icon: <CalendarOutlined /> },
];

/* Page-scoped styles not covered by index.css */
const PAGE_CSS = `
.am-preview-tabs { width: 100%; }
.am-preview-tabs .cms-pill-tab {
  flex: 1; display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; position: relative; padding: 8px 10px;
}
.am-preview-tabs .cms-pill-tab.is-dim { opacity: 0.5; }
.am-preview-tabs .am-tab-dot {
  width: 6px; height: 6px; border-radius: 99px; position: absolute; top: 6px; right: 10px;
}
.am-placement-note {
  background: var(--wy-light); border-radius: 14px; padding: 10px 14px;
  font-size: 12px; color: var(--wy-text-2);
}
.am-place-icons { display: flex; gap: 6px; }
.am-place-icon {
  width: 28px; height: 28px; border-radius: 99px; display: inline-grid; place-items: center;
  font-size: 13px; background: var(--wy-light); color: var(--wy-primary); cursor: default;
}
.am-place-icon.is-off { background: transparent; color: var(--wy-silver); border: 1px dashed var(--wy-border); }
.am-thumb-empty {
  width: 64px; height: 40px; border-radius: 10px; background: var(--wy-light);
  color: var(--wy-silver); display: grid; place-items: center; font-size: 16px;
}
.am-row-busy > td { opacity: 0.5; transition: opacity 0.2s; }
.am-stats { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
`;

/* ─────────────────────────────────────────
   MAP GRID SVG  (simplified street grid)
───────────────────────────────────────── */
const MapGrid = () => (
  <svg
    width="100%"
    height="100%"
    style={{ position: "absolute", inset: 0, opacity: 0.5 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(192,199,212,0.18)" strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
    {/* diagonal roads */}
    <line x1="0" y1="60" x2="280" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
    <line x1="30" y1="0" x2="280" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
    <line x1="0" y1="180" x2="280" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
    <line x1="80" y1="0" x2="200" y2="340" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
  </svg>
);

/* ─────────────────────────────────────────
   PHONE MOCKUP SHELL
───────────────────────────────────────── */
const PhoneMockup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      width: 280,
      maxWidth: "100%",
      height: 560,
      borderRadius: 40,
      background: PH.frame,
      border: `6px solid ${PH.frame}`,
      boxShadow: "0 30px 60px -24px rgba(32,42,64,0.55), 0 0 0 1px rgba(32,42,64,0.08)",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Status bar */}
    <div
      style={{
        height: 28,
        background: PH.bar,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      <Text style={{ color: PH.text2, fontSize: 10 }}>9:41</Text>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[3, 4, 5, 6].map((h) => (
          <div key={h} style={{ width: 3, height: h, background: PH.text2, borderRadius: 1 }} />
        ))}
        <div
          style={{
            width: 14,
            height: 7,
            border: `1px solid ${PH.text2}`,
            borderRadius: 2,
            marginLeft: 4,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 1,
              background: PH.text2,
              borderRadius: 1,
              width: "60%",
            }}
          />
        </div>
      </div>
    </div>
    {/* Content */}
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>{children}</div>
  </div>
);

/* ─────────────────────────────────────────
   HOME SCREEN PREVIEW
───────────────────────────────────────── */
const HomeScreen: React.FC<{
  type: string;
  image: string | null;
  title: string;
  isActive: boolean;
}> = ({ type, image, title, isActive }) => (
  <div
    style={{
      height: "100%",
      background: PH.screen,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* App header */}
    <div style={{ padding: "10px 12px 6px", background: PH.header }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <EnvironmentOutlined style={{ color: PH.accent, fontSize: 12 }} />
            <Text style={{ color: PH.text, fontSize: 13, fontWeight: 700 }}>Indore</Text>
          </div>
          <Text style={{ color: PH.muted, fontSize: 9 }}>Piplya Kumar, 452076</Text>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div
            style={{
              border: `1.5px solid ${PH.accent}`,
              borderRadius: 20,
              padding: "3px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <PlusOutlined style={{ color: PH.accent, fontSize: 9 }} />
            <Text style={{ color: PH.accent, fontSize: 9 }}>Event</Text>
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              border: `1.5px solid ${PH.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BellOutlined style={{ color: PH.muted, fontSize: 10 }} />
          </div>
        </div>
      </div>
    </div>

    {/* Social Banner placement */}
    {(type === "banner" || type === "in_feed_ad") && (
      <div style={{ padding: "8px 10px 4px" }}>
        <div
          style={{
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            background: image ? "transparent" : PH.card,
            height: 90,
            border: `1.5px solid ${isActive ? PH.accent : PH.line}`,
            transition: "all 0.3s",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={title || "preview image"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <EyeOutlined style={{ color: PH.muted, fontSize: 18 }} />
              <Text style={{ color: PH.muted, fontSize: 9 }}>Upload image to preview</Text>
            </div>
          )}
          {/* Sponsored badge */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 6,
              background: "rgba(32,42,64,0.7)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "2px 6px",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 8 }}>📢</span>
            <Text style={{ color: PH.text2, fontSize: 8, fontWeight: 600 }}>SPONSORED</Text>
          </div>
          {/* External link */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "rgba(32,42,64,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: PH.text2, fontSize: 8 }}>↗</Text>
          </div>
          {/* Title label */}
          {title && (
            <div
              style={{
                position: "absolute",
                bottom: 6,
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              <Text
                style={{
                  color: PH.text,
                  fontSize: 9,
                  fontWeight: 500,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {title}
              </Text>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Feed skeleton */}
    <div style={{ padding: "4px 10px", flex: 1 }}>
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: PH.card,
            borderRadius: 12,
            padding: 8,
            marginBottom: 6,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{ width: 32, height: 32, borderRadius: 10, background: PH.cardStrong, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{ height: 6, background: PH.cardStrong, borderRadius: 3, marginBottom: 4, width: "70%" }}
            />
            <div style={{ height: 5, background: PH.card, borderRadius: 3, width: "50%" }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAP SCREEN PREVIEW
───────────────────────────────────────── */
const MapScreen: React.FC<{
  type: string;
  image: string | null;
  title: string;
  isActive: boolean;
}> = ({ type, image, title, isActive }) => (
  <div style={{ height: "100%", background: PH.screen, position: "relative", overflow: "hidden" }}>
    <MapGrid />

    {/* "You are here" dot */}
    <div
      style={{
        position: "absolute",
        bottom: "38%",
        left: "50%",
        transform: "translate(-50%, 50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: CMS_COLORS.primary,
          border: "2.5px solid #fff",
          boxShadow: "0 0 0 4px rgba(53,89,199,0.3)",
        }}
      />
      <div style={{ background: "rgba(32,42,64,0.85)", borderRadius: 10, padding: "2px 7px" }}>
        <Text style={{ color: PH.text, fontSize: 8, fontWeight: 600 }}>You are here</Text>
      </div>
    </div>

    {/* Map Banner card */}
    {type === "map_banner" && (
      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 12,
          right: 12,
          zIndex: 3,
          display: "flex",
          gap: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            borderRadius: 16,
            overflow: "hidden",
            background: image ? "transparent" : CMS_COLORS.navy,
            border: `1.5px solid ${isActive ? PH.accent : PH.line}`,
            position: "relative",
            height: 80,
            transition: "all 0.3s",
            boxShadow: "0 8px 20px -6px rgba(0,0,0,0.5)",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={title || "preview image"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EyeOutlined style={{ color: PH.muted, fontSize: 16 }} />
            </div>
          )}
          {/* SPONSORED badge top-right */}
          <div
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              background: CMS_COLORS.primary,
              borderRadius: 5,
              padding: "1px 5px",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 7, fontWeight: 800, letterSpacing: 0.5 }}>
              SPONSORED
            </Text>
          </div>
          {title && (
            <div style={{ position: "absolute", bottom: 4, left: 6 }}>
              <Text
                style={{
                  color: PH.text,
                  fontSize: 8,
                  fontWeight: 600,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {title}
              </Text>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Non-map-banner placeholder */}
    {type !== "map_banner" && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            background: "rgba(32,42,64,0.9)",
            borderRadius: 14,
            padding: "10px 16px",
            border: `1px dashed ${PH.line}`,
            textAlign: "center",
          }}
        >
          <CompassOutlined style={{ color: PH.muted, fontSize: 20 }} />
          <br />
          <Text style={{ color: PH.muted, fontSize: 9, display: "block", marginTop: 4 }}>
            This type doesn't
            <br />
            appear on Map
          </Text>
        </div>
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────
   EVENTS SCREEN PREVIEW
───────────────────────────────────────── */
const EventsScreen: React.FC<{
  type: string;
  image: string | null;
  title: string;
  isActive: boolean;
}> = ({ type, image, title, isActive }) => (
  <div style={{ height: "100%", background: PH.screen, display: "flex", flexDirection: "column" }}>
    {/* Events header */}
    <div style={{ padding: "10px 12px 8px", background: PH.header }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <EnvironmentOutlined style={{ color: PH.accent, fontSize: 12 }} />
            <Text style={{ color: PH.text, fontSize: 13, fontWeight: 700 }}>Events</Text>
          </div>
          <Text style={{ color: PH.muted, fontSize: 9 }}>Piplya Momsore, 450076</Text>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              background: PH.cardStrong,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: PH.text2, fontSize: 10 }}>F</Text>
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              border: `1.5px solid ${PH.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BellOutlined style={{ color: PH.muted, fontSize: 10 }} />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 5, marginTop: 8, overflowX: "hidden" }}>
        {["Musical", "Test", "Screening", "Celebration"].map((cat) => (
          <div
            key={cat}
            style={{ background: PH.cardStrong, borderRadius: 20, padding: "3px 8px", flexShrink: 0 }}
          >
            <Text style={{ color: PH.text2, fontSize: 8 }}>{cat}</Text>
          </div>
        ))}
      </div>
    </div>

    <div style={{ padding: "8px 10px", flex: 1 }}>
      {/* Sponsored Event card */}
      {type === "sponsored_event" && (
        <div
          style={{
            borderRadius: 14,
            background: PH.card,
            overflow: "hidden",
            marginBottom: 8,
            border: `1.5px solid ${isActive ? CMS_COLORS.warning : PH.line}`,
            transition: "all 0.3s",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={title || "preview image"}
              style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                height: 70,
                background: PH.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EyeOutlined style={{ color: PH.muted, fontSize: 16 }} />
            </div>
          )}
          <div style={{ padding: "6px 8px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                background: "rgba(201,130,26,0.16)",
                border: `1px solid ${CMS_COLORS.warning}`,
                borderRadius: 20,
                padding: "2px 7px",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 8 }}>📢</span>
              <Text style={{ color: CMS_COLORS.warning, fontSize: 8, fontWeight: 600 }}>Sponsored</Text>
            </div>
            {title && (
              <Text style={{ color: PH.text, fontSize: 9, display: "block", fontWeight: 500 }}>
                {title}
              </Text>
            )}
          </div>
        </div>
      )}

      {/* Regular event skeletons */}
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: PH.card,
            borderRadius: 12,
            marginBottom: 6,
            height: type === "sponsored_event" ? 55 : 70,
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        />
      ))}

      {type !== "sponsored_event" && (
        <div
          style={{
            textAlign: "center",
            padding: "8px",
            border: `1px dashed ${PH.line}`,
            borderRadius: 10,
            marginTop: 4,
          }}
        >
          <CalendarOutlined style={{ color: PH.muted, fontSize: 14 }} />
          <br />
          <Text style={{ color: PH.muted, fontSize: 9, display: "block", marginTop: 3 }}>
            This type doesn't
            <br />
            appear on Events
          </Text>
        </div>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────
   LIVE PREVIEW PANEL
───────────────────────────────────────── */
const LivePreview = ({ form }: { form: any }) => {
  const values: any = Form.useWatch([], form);
  const [activeScreen, setActiveScreen] = useState<string>("home");

  const type: string = values?.type || "banner";
  const title: string = values?.title || "";
  const isActive: boolean = values?.is_active !== false;

  const imageFile = values?.image?.[0]?.originFileObj;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  // Auto-switch to relevant screen when type changes
  useEffect(() => {
    const placement = PLACEMENTS[type];
    if (placement && !placement.screens.includes(activeScreen)) {
      setActiveScreen(placement.screens[0]);
    }
  }, [type, activeScreen]);

  const placement = PLACEMENTS[type] || PLACEMENTS.banner;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {/* Status + placement */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Chip tone={isActive ? "success" : "danger"}>{isActive ? "Active" : "Inactive"}</Chip>
        <span style={{ marginLeft: "auto" }}>
          <Chip tone={placement.tone} plain>
            {placement.label}
          </Chip>
        </span>
      </div>

      {/* Placement description */}
      <div className="am-placement-note" style={{ borderLeft: `3px solid ${placement.color}` }}>
        <EnvironmentOutlined style={{ color: placement.color, marginRight: 6 }} />
        <strong style={{ color: CMS_COLORS.navy }}>Appears on:</strong> {placement.description}
      </div>

      {/* Screen tabs */}
      <div className="cms-pill-tabs am-preview-tabs" role="tablist">
        {SCREEN_TABS.map((tab) => {
          const isRelevant = placement.screens.includes(tab.key);
          const selected = activeScreen === tab.key;
          return (
            <Tooltip
              key={tab.key}
              title={isRelevant ? `Banner appears here` : `Banner doesn't appear on ${tab.label}`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveScreen(tab.key)}
                className={`cms-pill-tab ${selected ? "is-active" : ""} ${isRelevant ? "" : "is-dim"}`}
              >
                {tab.icon}
                {tab.label}
                {isRelevant && (
                  <span
                    className="am-tab-dot"
                    style={{ background: selected ? "#fff" : placement.color }}
                  />
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Phone */}
      <div style={{ display: "flex", justifyContent: "center", flex: 1, padding: "6px 0" }}>
        <PhoneMockup>
          {activeScreen === "home" && (
            <HomeScreen type={type} image={previewUrl} title={title} isActive={isActive} />
          )}
          {activeScreen === "map" && (
            <MapScreen type={type} image={previewUrl} title={title} isActive={isActive} />
          )}
          {activeScreen === "events" && (
            <EventsScreen type={type} image={previewUrl} title={title} isActive={isActive} />
          )}
        </PhoneMockup>
      </div>

      {/* Placement summary */}
      <div>
        <Text
          style={{ fontSize: 12, fontWeight: 600, color: CMS_COLORS.textSecondary, display: "block", marginBottom: 8 }}
        >
          All placements for this type:
        </Text>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SCREEN_TABS.map((tab) => {
            const on = placement.screens.includes(tab.key);
            return (
              <Chip key={tab.key} tone={on ? "primary" : "neutral"} plain>
                <span style={{ opacity: on ? 1 : 0.55 }}>
                  {on ? "✓" : "✗"} {tab.label}
                </span>
              </Chip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const AppManagement: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  // Track overlapping fetches so `loading` only clears when the latest one ends,
  // and stale responses never overwrite newer data.
  const fetchSeq = useRef(0);

  /* fetch */
  const fetchBanners = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);
    try {
      const res = await core_services.getAllBanners();
      if (seq !== fetchSeq.current) return;
      const sorted = (res.banners || []).sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      );
      setBanners(sorted);
    } catch (err: any) {
      if (seq === fetchSeq.current) message.error(errText(err));
    } finally {
      if (seq === fetchSeq.current) {
        setLoading(false);
        setLoadedOnce(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const [refresh] = useAsyncAction(fetchBanners);

  /* create */
  const [onFinish, creating] = useAsyncAction(async (values: any) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("type", values.type || "banner");
      formData.append("sort_order", values.sort_order || "0");
      formData.append("is_active", values.is_active ? "1" : "0");
      if (values.link_url) formData.append("link_url", values.link_url);
      if (values.image?.length > 0) formData.append("image", values.image[0].originFileObj);
      await core_services.createBanner(formData);
      message.success("Banner created 🚀");
      form.resetFields();
      await fetchBanners();
    } catch (err: any) {
      message.error(errText(err));
    }
  });

  /* delete (single row) */
  const remove = useKeyedAction(async (id: string | number) => {
    try {
      await core_services.deleteBanner(String(id));
      setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
      await fetchBanners();
    } catch (err: any) {
      message.error(errText(err));
    }
  });

  /* delete (bulk) */
  const [handleDeleteSelected, bulkDeleting] = useAsyncAction(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("No banners selected.");
      return;
    }
    try {
      await Promise.all(selectedRowKeys.map((key) => core_services.deleteBanner(String(key))));
      message.success("Selected banners deleted.");
      setSelectedRowKeys([]);
      await fetchBanners();
    } catch (err: any) {
      message.error(errText(err));
    }
  });

  /* toggle */
  const toggle = useKeyedAction(async (id: string | number) => {
    try {
      await core_services.toggleBanner(String(id));
      await fetchBanners();
    } catch (err: any) {
      message.error(errText(err));
    }
  });

  const liveCount = banners.filter((b) => b.is_active).length;
  const statsLoading = loading && !loadedOnce;

  /* table */
  const columns = [
    {
      title: "Preview",
      width: 88,
      render: (_: any, record: any) =>
        record.image_url ? (
          <Image
            src={record.image_url}
            width={64}
            height={40}
            style={{ borderRadius: 10, objectFit: "cover" }}
          />
        ) : (
          <div className="am-thumb-empty" title="No image">
            <PictureOutlined />
          </div>
        ),
    },
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a: any, b: any) => a.title.localeCompare(b.title),
      render: (t: string) => <span style={{ fontWeight: 600, color: CMS_COLORS.navy }}>{t}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type: string) => {
        const p = PLACEMENTS[type];
        return <Chip tone={p?.tone || "primary"}>{p?.label || type}</Chip>;
      },
      filters: Object.entries(PLACEMENTS).map(([value, { label }]) => ({ text: label, value })),
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: "Placement",
      dataIndex: "type",
      key: "placement",
      render: (type: string) => {
        const p = PLACEMENTS[type];
        return (
          <div className="am-place-icons">
            {SCREEN_TABS.map((tab) => {
              const on = !!p?.screens.includes(tab.key);
              return (
                <Tooltip key={tab.key} title={`${on ? "Shown" : "Not shown"} on ${tab.label}`}>
                  <span className={`am-place-icon ${on ? "" : "is-off"}`}>{tab.icon}</span>
                </Tooltip>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Order",
      dataIndex: "sort_order",
      width: 80,
      sorter: (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0),
      render: (v: any) => <span style={{ color: CMS_COLORS.textSecondary }}>{v ?? 0}</span>,
    },
    {
      title: "Status",
      render: (_: any, record: any) => (
        <Switch
          checked={record.is_active}
          loading={toggle.isPending(record.id)}
          disabled={remove.isPending(record.id) || bulkDeleting}
          onChange={() => void toggle.run(record.id)}
          checkedChildren="Live"
          unCheckedChildren="Off"
        />
      ),
    },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <Popconfirm
          title="Delete this banner?"
          onConfirm={() => remove.run(record.id)}
          okButtonProps={{ danger: true }}
          disabled={bulkDeleting}
        >
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={remove.isPending(record.id)}
            disabled={bulkDeleting}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Page>
      <style>{PAGE_CSS}</style>

      <PageHeader
        title="App Management"
        subtitle="Create sponsored banners and preview exactly where they appear in the app."
        actions={
          <Tooltip title="Refresh">
            <IconButton label="Refresh banners" onClick={() => void refresh()} disabled={loading}>
              <ReloadOutlined spin={loading} />
            </IconButton>
          </Tooltip>
        }
      />

      {/* ── STATS ── */}
      <div className="am-stats">
        <StatCard
          label="Total banners"
          value={banners.length}
          icon={<NotificationOutlined />}
          loading={statsLoading}
        />
        <StatCard
          label="Live"
          value={liveCount}
          icon={<CheckCircleOutlined />}
          tone="success"
          loading={statsLoading}
        />
        <StatCard
          label="Off"
          value={banners.length - liveCount}
          icon={<StopOutlined />}
          tone="warning"
          loading={statsLoading}
        />
      </div>

      <Row gutter={[20, 20]}>
        {/* ── FORM ── */}
        <Col xs={24} lg={13}>
          <Surface
            title="Create New Banner"
            icon={<PlusOutlined />}
            style={{ height: "100%" }}
            bodyStyle={{ padding: 22 }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              disabled={creating}
              requiredMark={false}
            >
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Title is required" }]}
              >
                <Input placeholder="e.g. Shampoo Ad, RCB Schedule" />
              </Form.Item>

              <Form.Item label="Banner Type" name="type" initialValue="banner">
                <Select
                  options={Object.entries(PLACEMENTS).map(([value, { label, color }]) => ({
                    value,
                    label: (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{ width: 8, height: 8, borderRadius: "50%", background: color }}
                        />
                        {label}
                      </div>
                    ),
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Upload Image"
                name="image"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList}
              >
                <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                  <Button icon={<UploadOutlined />}>Upload Image</Button>
                </Upload>
              </Form.Item>

              <Form.Item label="Link URL (optional)" name="link_url">
                <Input placeholder="https://..." />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="sort_order" label="Sort Order">
                    <Input type="number" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="is_active"
                    label="Status"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                icon={<PlusOutlined />}
                loading={creating}
                disabled={false}
              >
                {creating ? "Creating…" : "Create Banner"}
              </Button>
            </Form>
          </Surface>
        </Col>

        {/* ── LIVE PREVIEW ── */}
        <Col xs={24} lg={11}>
          <Surface
            title="Live Preview"
            icon={<EyeOutlined />}
            style={{ height: "100%" }}
            bodyStyle={{ padding: 22 }}
          >
            <LivePreview form={form} />
          </Surface>
        </Col>
      </Row>

      {/* ── TABLE ── */}
      <Surface
        title="Active Banners"
        icon={<NotificationOutlined />}
        count={banners.length}
        bodyStyle={{ padding: 0 }}
        extra={
          selectedRowKeys.length > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => void handleDeleteSelected()}
              loading={bulkDeleting}
              disabled={loading && !bulkDeleting}
            >
              Delete Selected ({selectedRowKeys.length})
            </Button>
          )
        }
      >
        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
            getCheckboxProps: () => ({ disabled: bulkDeleting }),
          }}
          rowClassName={(record: any) =>
            remove.isPending(record.id) ||
            (bulkDeleting && selectedRowKeys.includes(record.id))
              ? "am-row-busy"
              : ""
          }
          dataSource={banners}
          columns={columns}
          loading={loading || bulkDeleting}
          locale={{
            emptyText:
              loading || !loadedOnce ? (
                <div style={{ height: 160 }} />
              ) : (
                <EmptyState
                  title="No banners yet"
                  description="Create your first banner using the form above."
                  icon={<NotificationOutlined />}
                />
              ),
          }}
          pagination={{ pageSize: 6, showTotal: (total) => `${total} banners` }}
          size="middle"
          scroll={{ x: "max-content" }}
        />
      </Surface>
    </Page>
  );
};

export default AppManagement;
