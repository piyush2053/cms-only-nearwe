// ================= pages/AppManagement.tsx =================
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
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
  Tag,
  Badge,
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
} from "@ant-design/icons";
import { core_services } from "../../utils/api";

const { Text, Title } = Typography;

/* ─────────────────────────────────────────
   PLACEMENT CONFIG
   Maps each banner type → which screens it
   appears on + a friendly label
───────────────────────────────────────── */
const PLACEMENTS: Record<
  string,
  { screens: string[]; color: string; label: string; description: string }
> = {
  banner: {
    screens: ["home"],
    color: "#3B82F6",
    label: "Social Banner",
    description: "Full-width banner on Home screen below location header",
  },
  in_feed_ad: {
    screens: ["home"],
    color: "#10B981",
    label: "In Feed Ad",
    description: "Inline ad card inside the Home social feed",
  },
  sponsored_event: {
    screens: ["events"],
    color: "#F59E0B",
    label: "Sponsored Event",
    description: "Event card with Sponsored badge on Events screen",
  },
  map_banner: {
    screens: ["map"],
    color: "#8B5CF6",
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

/* ─────────────────────────────────────────
   MAP GRID SVG  (simplified street grid)
───────────────────────────────────────── */
const MapGrid = () => (
  <svg
    width="100%"
    height="100%"
    style={{ position: "absolute", inset: 0, opacity: 0.35 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path
          d="M 28 0 L 0 0 0 28"
          fill="none"
          stroke="#334155"
          strokeWidth="0.8"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
    {/* diagonal roads */}
    <line x1="0" y1="60" x2="280" y2="200" stroke="#1e3a5f" strokeWidth="6" />
    <line x1="30" y1="0" x2="280" y2="300" stroke="#1e3a5f" strokeWidth="4" />
    <line x1="0" y1="180" x2="280" y2="80" stroke="#1e3a5f" strokeWidth="5" />
    <line x1="80" y1="0" x2="200" y2="340" stroke="#1e3a5f" strokeWidth="3" />
  </svg>
);

/* ─────────────────────────────────────────
   PHONE MOCKUP SHELL
───────────────────────────────────────── */
const PhoneMockup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      width: 280,
      height: 560,
      borderRadius: 36,
      background: "#0B1829",
      border: "2px solid #1E3A5F",
      boxShadow:
        "0 0 0 1px #0a1628, 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
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
        background: "#060E1A",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      <Text style={{ color: "#94A3B8", fontSize: 10 }}>9:41</Text>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[3, 4, 5, 6].map((h) => (
          <div
            key={h}
            style={{
              width: 3,
              height: h,
              background: "#94A3B8",
              borderRadius: 1,
            }}
          />
        ))}
        <div
          style={{
            width: 14,
            height: 7,
            border: "1px solid #94A3B8",
            borderRadius: 2,
            marginLeft: 4,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 1,
              background: "#94A3B8",
              borderRadius: 1,
              width: "60%",
            }}
          />
        </div>
      </div>
    </div>
    {/* Content */}
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
      {children}
    </div>
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
      background: "#060E1A",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* App header */}
    <div style={{ padding: "10px 12px 6px", background: "#0B1829" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <EnvironmentOutlined style={{ color: "#3B82F6", fontSize: 12 }} />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
              Indore
            </Text>
          </div>
          <Text style={{ color: "#64748B", fontSize: 9 }}>
            Piplya Kumar, 452076
          </Text>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div
            style={{
              border: "1.5px solid #3B82F6",
              borderRadius: 20,
              padding: "3px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <PlusOutlined style={{ color: "#3B82F6", fontSize: 9 }} />
            <Text style={{ color: "#3B82F6", fontSize: 9 }}>Event</Text>
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              border: "1.5px solid #1E3A5F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BellOutlined style={{ color: "#64748B", fontSize: 10 }} />
          </div>
        </div>
      </div>
    </div>

    {/* Social Banner placement */}
    {(type === "banner" || type === "in_feed_ad") && (
      <div style={{ padding: "8px 10px 4px" }}>
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            position: "relative",
            background: image ? "transparent" : "#122B44",
            height: 90,
            border: isActive ? "1.5px solid #3B82F6" : "1.5px solid #1E3A5F",
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
              <EyeOutlined style={{ color: "#334155", fontSize: 18 }} />
              <Text style={{ color: "#334155", fontSize: 9 }}>
                Upload image to preview
              </Text>
            </div>
          )}
          {/* Sponsored badge */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 6,
              background: "rgba(0,0,0,0.65)",
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
            <Text style={{ color: "#CBD5E1", fontSize: 8, fontWeight: 600 }}>
              SPONSORED
            </Text>
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
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 8 }}>↗</Text>
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
                  color: "#fff",
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
            background: "#0F1E30",
            borderRadius: 10,
            padding: 8,
            marginBottom: 6,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#1E3A5F",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 6,
                background: "#1E3A5F",
                borderRadius: 3,
                marginBottom: 4,
                width: "70%",
              }}
            />
            <div
              style={{
                height: 5,
                background: "#162030",
                borderRadius: 3,
                width: "50%",
              }}
            />
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
  <div
    style={{
      height: "100%",
      background: "#0B1829",
      position: "relative",
      overflow: "hidden",
    }}
  >
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
          background: "#3B82F6",
          border: "2.5px solid #fff",
          boxShadow: "0 0 0 4px rgba(59,130,246,0.25)",
        }}
      />
      <div
        style={{
          background: "rgba(11,24,41,0.85)",
          borderRadius: 10,
          padding: "2px 7px",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 8, fontWeight: 600 }}>
          You are here
        </Text>
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
            borderRadius: 14,
            overflow: "hidden",
            background: image ? "transparent" : "#122B44",
            border: isActive ? "1.5px solid #3B82F6" : "1.5px solid #1E3A5F",
            position: "relative",
            height: 80,
            transition: "all 0.3s",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
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
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EyeOutlined style={{ color: "#334155", fontSize: 16 }} />
            </div>
          )}
          {/* SPONSORED badge top-right */}
          <div
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              background: "#00B4D8",
              borderRadius: 5,
              padding: "1px 5px",
            }}
          >
            <Text
              style={{
                color: "#000",
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
            >
              SPONSORED
            </Text>
          </div>
          {title && (
            <div
              style={{
                position: "absolute",
                bottom: 4,
                left: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 8, fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
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
            background: "rgba(11,24,41,0.85)",
            borderRadius: 12,
            padding: "10px 16px",
            border: "1px dashed #1E3A5F",
            textAlign: "center",
          }}
        >
          <CompassOutlined style={{ color: "#334155", fontSize: 20 }} />
          <br />
          <Text style={{ color: "#334155", fontSize: 9, display: "block", marginTop: 4 }}>
            This type doesn't<br />appear on Map
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
  <div
    style={{
      height: "100%",
      background: "#060E1A",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Events header */}
    <div style={{ padding: "10px 12px 8px", background: "#0B1829" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <EnvironmentOutlined style={{ color: "#3B82F6", fontSize: 12 }} />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Events</Text>
          </div>
          <Text style={{ color: "#64748B", fontSize: 9 }}>Piplya Momsore, 450076</Text>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: "#1E3A5F", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#94A3B8", fontSize: 10 }}>F</Text>
          </div>
          <div style={{ width: 24, height: 24, borderRadius: 12, border: "1.5px solid #1E3A5F", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BellOutlined style={{ color: "#64748B", fontSize: 10 }} />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 5, marginTop: 8, overflowX: "hidden" }}>
        {["Musical", "Test", "Screening", "Celebration"].map((cat) => (
          <div
            key={cat}
            style={{
              background: "#122B44",
              borderRadius: 20,
              padding: "3px 8px",
              flexShrink: 0,
            }}
          >
            <Text style={{ color: "#CBD5E1", fontSize: 8 }}>{cat}</Text>
          </div>
        ))}
      </div>
    </div>

    <div style={{ padding: "8px 10px", flex: 1 }}>
      {/* Sponsored Event card */}
      {type === "sponsored_event" && (
        <div
          style={{
            borderRadius: 12,
            background: "#0F1E30",
            overflow: "hidden",
            marginBottom: 8,
            border: isActive ? "1.5px solid #F59E0B" : "1.5px solid #1E3A5F",
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
                background: "#122B44",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EyeOutlined style={{ color: "#334155", fontSize: 16 }} />
            </div>
          )}
          <div style={{ padding: "6px 8px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid #F59E0B",
                borderRadius: 20,
                padding: "2px 7px",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 8 }}>📢</span>
              <Text style={{ color: "#F59E0B", fontSize: 8, fontWeight: 600 }}>
                Sponsored
              </Text>
            </div>
            {title && (
              <Text style={{ color: "#fff", fontSize: 9, display: "block", fontWeight: 500 }}>
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
            background: "#0F1E30",
            borderRadius: 10,
            marginBottom: 6,
            height: type === "sponsored_event" ? 55 : 70,
            border: "1px solid #162030",
          }}
        />
      ))}

      {type !== "sponsored_event" && (
        <div
          style={{
            textAlign: "center",
            padding: "8px",
            border: "1px dashed #1E3A5F",
            borderRadius: 8,
            marginTop: 4,
          }}
        >
          <CalendarOutlined style={{ color: "#334155", fontSize: 14 }} />
          <br />
          <Text style={{ color: "#334155", fontSize: 9, display: "block", marginTop: 3 }}>
            This type doesn't<br />appear on Events
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isActive ? "#22C55E" : "#EF4444",
              boxShadow: isActive
                ? "0 0 0 3px rgba(34,197,94,0.2)"
                : "0 0 0 3px rgba(239,68,68,0.2)",
              transition: "all 0.3s",
            }}
          />
          <Text style={{ fontWeight: 700, fontSize: 14 }}>Live Preview</Text>
          <Tag
            color={placement.color}
            style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600 }}
          >
            {placement.label}
          </Tag>
        </div>

        {/* Placement description */}
        <div
          style={{
            background: "#F0F9FF",
            border: `1px solid ${placement.color}40`,
            borderLeft: `3px solid ${placement.color}`,
            borderRadius: 6,
            padding: "6px 10px",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 11, color: "#475569" }}>
            📍 <strong>Appears on:</strong> {placement.description}
          </Text>
        </div>
      </div>

      {/* Screen tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {SCREEN_TABS.map((tab) => {
          const isRelevant = placement.screens.includes(tab.key);
          return (
            <Tooltip
              key={tab.key}
              title={
                isRelevant
                  ? `Banner appears here`
                  : `Banner doesn't appear on ${tab.label}`
              }
            >
              <button
                onClick={() => setActiveScreen(tab.key)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  borderRadius: 8,
                  border: activeScreen === tab.key
                    ? `1.5px solid ${isRelevant ? placement.color : "#94A3B8"}`
                    : "1.5px solid #E2E8F0",
                  background: activeScreen === tab.key
                    ? isRelevant
                      ? `${placement.color}15`
                      : "#F8FAFC"
                    : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.2s",
                  opacity: isRelevant ? 1 : 0.5,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    color: activeScreen === tab.key
                      ? isRelevant ? placement.color : "#64748B"
                      : "#94A3B8",
                    fontSize: 14,
                  }}
                >
                  {tab.icon}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: activeScreen === tab.key
                      ? isRelevant ? placement.color : "#64748B"
                      : "#94A3B8",
                  }}
                >
                  {tab.label}
                </span>
                {isRelevant && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: placement.color,
                    }}
                  />
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Phone */}
      <div style={{ display: "flex", justifyContent: "center", flex: 1 }}>
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
      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          padding: "8px 12px",
        }}
      >
        <Text style={{ fontSize: 11, color: "#64748B", display: "block", marginBottom: 4 }}>
          <strong>All placements for this type:</strong>
        </Text>
        <div style={{ display: "flex", gap: 4 }}>
          {SCREEN_TABS.map((tab) => (
            <Tag
              key={tab.key}
              color={placement.screens.includes(tab.key) ? "blue" : "default"}
              style={{ fontSize: 10, opacity: placement.screens.includes(tab.key) ? 1 : 0.4 }}
            >
              {placement.screens.includes(tab.key) ? "✓" : "✗"} {tab.label}
            </Tag>
          ))}
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  /* fetch */
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await core_services.getAllBanners();
      const sorted = (res.banners || []).sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      );
      setBanners(sorted);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  /* create */
  const onFinish = async (values: any) => {
    try {
      console.log("Form values:", values);
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("type", values.type || "banner");
      formData.append("sort_order", values.sort_order || "0");
      formData.append("is_active", values.is_active ? "1" : "0");
      if (values.link_url) formData.append("link_url", values.link_url);
      if (values.image?.length > 0)
        formData.append("image", values.image[0].originFileObj);
      console.log("FormData entries:");
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      await core_services.createBanner(formData);
      message.success("Banner created 🚀");
      form.resetFields();
      fetchBanners();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  /* delete */
  const handleDelete = async (id: string) => {
    await core_services.deleteBanner(id);
    fetchBanners();
    setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("No banners selected.");
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        selectedRowKeys.map((key) => core_services.deleteBanner(String(key)))
      );
      message.success("Selected banners deleted.");
      setSelectedRowKeys([]);
      fetchBanners();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    await core_services.toggleBanner(id);
    fetchBanners();
  };

  /* table */
  const columns = [
    {
      title: "Preview",
      width: 80,
      render: (_: any, record: any) =>
        record.image_url ? (
          <Image src={record.image_url} width={60} style={{ borderRadius: 6 }} />
        ) : (
          <div
            style={{
              width: 60,
              height: 40,
              background: "#F1F5F9",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#CBD5E1", fontSize: 10 }}>No img</Text>
          </div>
        ),
    },
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a: any, b: any) => a.title.localeCompare(b.title),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type: string) => {
        const p = PLACEMENTS[type];
        return (
          <Tag
            color={p?.color || "blue"}
            style={{ fontWeight: 600, fontSize: 11 }}
          >
            {p?.label || type}
          </Tag>
        );
      },
      filters: Object.entries(PLACEMENTS).map(([value, { label }]) => ({
        text: label,
        value,
      })),
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: "Placement",
      dataIndex: "type",
      key: "placement",
      render: (type: string) => {
        const p = PLACEMENTS[type];
        return (
          <div style={{ display: "flex", gap: 3 }}>
            {SCREEN_TABS.map((tab) => (
              <Tooltip
                key={tab.key}
                title={`${p?.screens.includes(tab.key) ? "Shown" : "Not shown"} on ${tab.label}`}
              >
                <Tag
                  style={{
                    opacity: p?.screens.includes(tab.key) ? 1 : 0.3,
                    fontSize: 10,
                    cursor: "default",
                    margin: 0,
                  }}
                >
                  {tab.icon}
                </Tag>
              </Tooltip>
            ))}
          </div>
        );
      },
    },
    {
      title: "Order",
      dataIndex: "sort_order",
      width: 70,
      sorter: (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0),
    },
    {
      title: "Status",
      render: (_: any, record: any) => (
        <Switch
          checked={record.is_active}
          onChange={() => handleToggle(record.id)}
          checkedChildren="Live"
          unCheckedChildren="Off"
        />
      ),
    },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <Popconfirm title="Delete this banner?" onConfirm={() => handleDelete(record.id)}>
          <Button danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>🚀</span>
          <Title level={4} style={{ margin: 0 }}>
            App Management
          </Title>
          <Badge count={banners.length} style={{ background: "#3B82F6" }} />
        </div>
      }
      styles={{ body: { padding: "16px 20px" } }}
    >
      <Row gutter={32}>
        {/* ── FORM ── */}
        <Col xs={24} md={12}>
          <div
            style={{
              background: "#FAFBFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Title level={5} style={{ margin: "0 0 16px", color: "#1E293B" }}>
              Create New Banner
            </Title>

            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Title is required" }]}
              >
                <Input placeholder="e.g. Shampoo Ad, RCB Schedule" />
              </Form.Item>

              <Form.Item
                label="Banner Type"
                name="type"
                initialValue="banner"
              >
                <Select
                  onChange={() => { }}
                  options={Object.entries(PLACEMENTS).map(([value, { label, color }]) => ({
                    value,
                    label: (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: color,
                          }}
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
                <Col span={12}>
                  <Form.Item name="sort_order" label="Sort Order">
                    <Input type="number" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col span={12}>
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

              <Button type="primary" htmlType="submit" block size="large">
                Create Banner 🚀
              </Button>
            </Form>
          </div>
        </Col>

        {/* ── LIVE PREVIEW ── */}
        <Col xs={24} md={12}>
          <div
            style={{
              background: "#FAFBFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: 20,
              minHeight: 500,
            }}
          >
            <LivePreview form={form} />
          </div>
        </Col>
      </Row>

      {/* ── TABLE ── */}
      <div style={{ marginTop: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Active Banners
          </Title>
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={handleDeleteSelected}
              disabled={loading}
            >
              Delete Selected ({selectedRowKeys.length})
            </Button>
          )}
        </div>

        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
          }}
          dataSource={banners}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 6, showTotal: (total) => `${total} banners` }}
          size="middle"
          scroll={{ x: 700 }}
        />
      </div>
    </Card>
  );
};

export default AppManagement;