import React, { useState } from "react";
import { Avatar, Popover, Button, Divider } from "antd";
import { UserOutlined, LogoutOutlined, FlagFilled, BellOutlined } from "@ant-design/icons";
import image from "../assets/logo/logo-removebg.png";
import { Layout, Menu, Drawer, Grid } from "antd";
import {
  AppstoreOutlined,
  CalendarOutlined,
  SettingOutlined,
  MenuOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { removeToken } from "../utils/function";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const INDIGO = "#3F51B5";
const INDIGO_DARK = "#303F9F";
const INDIGO_DEEPER = "#283593";

const menuItems = [
  { key: "/insights",      icon: <DashboardOutlined />,  label: "Insights" },
  { key: "/users",         icon: <UserOutlined />,       label: "User Management" },
  { key: "/categories",    icon: <AppstoreOutlined />,   label: "Category Management" },
  { key: "/events",        icon: <CalendarOutlined />,   label: "Event Management" },
  { key: "/app",           icon: <SettingOutlined />,    label: "Advertise" },
  { key: "/reports",       icon: <FlagFilled />,         label: "Reports" },
  { key: "/announcements", icon: <BellOutlined />,       label: "Announcements" },
  { key: "/interests",     icon: <UserOutlined />,       label: "User Interests" },
];

// ─── Sidebar brand area ───────────────────────────────────────────────────────
const SidebarLogo: React.FC = () => (
  <div
    style={{
      height: 72,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderBottom: "1px solid rgba(255,255,255,0.10)",
      marginBottom: 8,
      gap: 10,
      padding: "0 20px",
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "rgba(255,255,255,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img src={image} alt="logo" style={{ height: 22, objectFit: "contain" }} />
    </div>
    <div>
      <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
        Admin Panel
      </div>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 500 }}>
        CMS Dashboard
      </div>
    </div>
  </div>
);

// ─── Curved notch active item ─────────────────────────────────────────────────
const SidebarStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    * { font-family: 'DM Sans', -apple-system, sans-serif; }

    .cms-sidebar .ant-menu-item {
      border-radius: 12px !important;
      margin: 2px 12px !important;
      width: calc(100% - 24px) !important;
      padding-left: 14px !important;
      height: 44px !important;
      line-height: 44px !important;
      transition: all 0.2s ease !important;
    }

    .cms-sidebar .ant-menu-item:hover {
      background: rgba(255,255,255,0.10) !important;
      color: #fff !important;
    }

    .cms-sidebar .ant-menu-item-selected {
      background: rgba(255,255,255,0.18) !important;
      color: #fff !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15) !important;
      position: relative !important;
    }

    .cms-sidebar .ant-menu-item-selected::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background: #FFFFFF;
      border-radius: 0 3px 3px 0;
    }

    .cms-sidebar .ant-menu-item .ant-menu-item-icon {
      font-size: 16px !important;
    }

    .cms-sidebar .ant-menu-item .ant-menu-title-content {
      font-size: 13px !important;
      font-weight: 500 !important;
    }

    .cms-sidebar .ant-menu-item-selected .ant-menu-title-content {
      font-weight: 600 !important;
    }

    /* Scrollbar */
    .cms-sidebar::-webkit-scrollbar { width: 0px; }

    /* Table rows */
    .cms-table-row:hover td {
      background: #F0F2FA !important;
    }

    /* Card hover effect */
    .cms-stat-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    }
    .cms-stat-card:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 24px rgba(63,81,181,0.15) !important;
    }
  `}</style>
);

// ─── User popover content ─────────────────────────────────────────────────────
const AdminPopover: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <div style={{ width: 220, padding: "4px 0" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px 14px",
      }}
    >
      <Avatar
        size={40}
        style={{
          background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
        }}
        icon={<UserOutlined />}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#212121",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Admin User
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#9E9E9E",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          admin@example.com
        </div>
      </div>
    </div>

    <Divider style={{ margin: "0 0 6px" }} />

    <div style={{ padding: "0 8px 8px" }}>
      <Button
        type="text"
        danger
        block
        icon={<LogoutOutlined />}
        onClick={onLogout}
        style={{
          textAlign: "left",
          justifyContent: "flex-start",
          height: 38,
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Sign Out
      </Button>
    </div>
  </div>
);

// ─── Bottom user info in sidebar ──────────────────────────────────────────────
const SidebarFooter: React.FC = () => (
  <div
    style={{
      padding: "12px 16px",
      borderTop: "1px solid rgba(255,255,255,0.10)",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    <Avatar
      size={32}
      style={{
        background: "rgba(255,255,255,0.20)",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
      }}
      icon={<UserOutlined />}
    />
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
        Admin User
      </div>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
        Online
      </div>
    </div>
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#69F0AE",
        boxShadow: "0 0 0 2px rgba(105,240,174,0.3)",
        flexShrink: 0,
      }}
    />
  </div>
);

// ─── Sidebar content (shared between desktop & drawer) ────────────────────────
const SidebarContent: React.FC<{ selectedKey: string; onNavigate: (key: string) => void }> = ({
  selectedKey,
  onNavigate,
}) => (
  <div
    style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${INDIGO} 0%, ${INDIGO_DEEPER} 100%)`,
    }}
  >
    <SidebarLogo />

    <div
      className="cms-sidebar"
      style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}
    >
      {/* Section label */}
      <div
        style={{
          padding: "8px 24px 4px",
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(255,255,255,0.30)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Main Menu
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={(e) => onNavigate(e.key)}
        items={menuItems}
        style={{
          border: "none",
          background: "transparent",
        }}
      />
    </div>

    <SidebarFooter />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const CmsHome: React.FC = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const screens     = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKey = location.pathname;

  const handleLogout = () => {
    removeToken();
    navigate("/login", { replace: true });
  };

  const handleNavigate = (key: string) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const currentPage = menuItems.find((m) => m.key === selectedKey)?.label || "Dashboard";

  return (
    <Layout style={{ minHeight: "100vh", background: "#F0F2FA" }}>
      <SidebarStyles />

      {/* ── Desktop Sidebar ── */}
      {screens.md && (
        <Sider
          width={248}
          style={{
            background: "transparent",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            // Curved right side
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            overflow: "hidden",
            boxShadow: "4px 0 24px rgba(63,81,181,0.20)",
          }}
        >
          <SidebarContent selectedKey={selectedKey} onNavigate={handleNavigate} />
        </Sider>
      )}

      {/* ── Mobile Drawer ── */}
      {!screens.md && (
        <Drawer
          placement="left"
          closable={false}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={248}
          styles={{
            body: { padding: 0, background: "transparent" },
            content: {
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
              overflow: "hidden",
            },
          }}
        >
          <SidebarContent selectedKey={selectedKey} onNavigate={handleNavigate} />
        </Drawer>
      )}

      {/* ── Main Layout (offset for fixed sidebar) ── */}
      <Layout
        style={{
          marginLeft: screens.md ? 248 : 0,
          background: "#F0F2FA",
        }}
      >
        {/* ── Header ── */}
        <Header
          style={{
            background: "#FFFFFF",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #E3E6F0",
            boxShadow: "0 2px 12px rgba(63,81,181,0.06)",
            height: 64,
            lineHeight: "64px",
            position: "sticky",
            top: 0,
            zIndex: 99,
          }}
        >
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!screens.md && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ color: "#616161", fontSize: 16, padding: "0 8px" }}
              />
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#212121" }}>
                {currentPage}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Notification bell */}
            <Button
              type="text"
              style={{
                width: 36,
                height: 36,
                padding: 0,
                borderRadius: 10,
                color: "#616161",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              icon={<BellOutlined style={{ fontSize: 16 }} />}
            />

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: "#f0e3e3" }} />

            {/* User popover */}
            <Popover
              content={<AdminPopover onLogout={handleLogout} />}
              trigger="click"
              placement="bottomRight"
              arrow={false}
              styles={{
                root: { paddingTop: 8 },
                body: {
                  borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(63,81,181,0.14), 0 2px 8px rgba(63,81,181,0.08)",
                  border: "1px solid #E3E6F0",
                  padding: 0,
                  overflow: "hidden",
                },
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #E3E6F0",
                  background: "#FAFAFA",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F0F2FA";
                  e.currentTarget.style.borderColor = "#C5CAE9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FAFAFA";
                  e.currentTarget.style.borderColor = "#E3E6F0";
                }}
              >
                <Avatar
                  size={28}
                  style={{
                    background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                  icon={<UserOutlined />}
                />
                {screens.md && (
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ color: "#212121", fontSize: 12, fontWeight: 600 }}>
                      Admin User
                    </div>
                    <div style={{ color: "#9E9E9E", fontSize: 10 }}>
                      admin@example.com
                    </div>
                  </div>
                )}
              </div>
            </Popover>
          </div>
        </Header>

        {/* ── Content ── */}
        <Content
          style={{
            margin: 24,
            minHeight: "calc(100vh - 112px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default CmsHome;
