import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Select,
  message,
  Skeleton,
  Pagination,
} from "antd";
import {
  AndroidOutlined,
  AppleOutlined,
  AppstoreOutlined,
  NotificationOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { APP_ROUTE_OPTIONS } from "../../utils/constants";
import { core_services } from "../../utils/api";
import logo from "../../assets/images/logo2.png";
import { Chip, EmptyState, IconButton, Page, PageHeader, Surface } from "../../components/ui";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { CMS_COLORS } from "../cmstheme";

const { Text } = Typography;

// ─── Platform helpers ───────────────────────────────────────────────────────
const getPlatform = (token: string): "ios" | "android" =>
  token.startsWith("ExponentPushToken") ? "ios" : "android";

// ─── Platform Badge ──────────────────────────────────────────────────────────
const PlatformBadge = ({ token, listView = false }: { token: string; listView?: boolean }) => {
  const isAndroid = getPlatform(token) === "android";
  return (
    <span
      style={
        listView
          ? { flexShrink: 0 }
          : { position: "absolute", bottom: 8, right: 8 }
      }
    >
      <Chip tone={isAndroid ? "success" : "neutral"} plain>
        {isAndroid ? "Android" : "iOS"}
      </Chip>
    </span>
  );
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const UserAvatar = ({ user, size }: { user: any; size: number }) => (
  <div
    className="ann-avatar"
    style={{ width: size, height: size, fontSize: size > 40 ? 18 : 13 }}
  >
    {user.ProfileImageUrl ? (
      <img src={user.ProfileImageUrl} alt={user.Username} />
    ) : (
      <span>{user.Username?.[0]?.toUpperCase()}</span>
    )}
  </div>
);

const pageStyles = `
  .ann-user {
    position: relative;
    cursor: pointer;
    background: #fff;
    border: 1px solid var(--wy-border);
    transition: transform 0.2s var(--wy-ease), box-shadow 0.2s, border-color 0.2s, background 0.2s;
  }
  .ann-user:hover { border-color: var(--wy-silver); box-shadow: var(--wy-shadow-card); transform: translateY(-2px); }
  .ann-user.is-selected {
    border-color: var(--wy-primary);
    background: var(--wy-light);
    box-shadow: 0 0 0 3px rgba(53, 89, 199, 0.12);
  }
  .ann-user:focus-visible { outline: 2px solid rgba(53, 89, 199, 0.55); outline-offset: 2px; }
  .ann-user-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  .ann-user-card { border-radius: 20px; padding: 18px 12px 34px; }
  .ann-user-row  { border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; }
  .ann-avatar {
    border-radius: 999px;
    overflow: hidden;
    background: var(--wy-navy);
    color: #fff;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .ann-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ann-user.is-selected .ann-avatar { background: var(--wy-primary); }
  .ann-inline-input.ant-input,
  .ann-inline-input.ant-input:focus,
  .ann-inline-input.ant-input:hover,
  .ann-inline-input.ant-input[disabled] { background: transparent !important; box-shadow: none !important; }
  .ann-toggle.is-on { background: var(--wy-navy) !important; border-color: var(--wy-navy) !important; color: #fff !important; }
  .ann-compose {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    align-items: start;
  }
  .ann-summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--wy-line);
    color: var(--wy-text-2);
    font-size: 13px;
  }
  .ann-summary-row:last-child { border-bottom: 0; }
  .ann-summary-row b { color: var(--wy-navy); font-size: 15px; }
  .ann-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 18px;
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────
const Announcements: React.FC = () => {

  const [form] = Form.useForm();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [notifDark, setNotifDark] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<string>("");

  // ---------------- FETCH USERS ----------------
  const [fetchUsers, loadingUsers] = useAsyncAction(async () => {
    try {
      const response = await core_services.getUser();
      const filtered = (response || []).filter(
        (u: any) => u.pushToken && u.pushToken.length > 0
      );
      setUsers(filtered);
    } catch {
      message.error("Failed to fetch users");
    }
  }, { queue: true });

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // ---------------- FILTER ----------------
  const filteredUsers = useMemo(() => {
    let data = users;
    if (searchText) {
      data = data.filter((u) =>
        [u.Username, u.Email]
          .join(" ")
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }
    return data;
  }, [users, searchText]);

  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // ---------------- SELECT ----------------
  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const ids = filteredUsers.map((user) => user.UserId);
    const allFilteredSelected = ids.length > 0 && ids.every((id) => selectedUsers.includes(id));
    if (allFilteredSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedUsers((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const allFilteredSelected = filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedUsers.includes(user.UserId));

  const androidUsers = filteredUsers.filter((u: any) => getPlatform(u.pushToken) === "android");
  const iosUsers = filteredUsers.filter((u: any) => getPlatform(u.pushToken) === "ios");

  const allAndroidSelected =
    androidUsers.length > 0 && androidUsers.every((u: any) => selectedUsers.includes(u.UserId));
  const allIosSelected =
    iosUsers.length > 0 && iosUsers.every((u: any) => selectedUsers.includes(u.UserId));

  const handleSelectAndroid = () => {
    const ids = androidUsers.map((u: any) => u.UserId);
    if (allAndroidSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedUsers((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSelectIOS = () => {
    const ids = iosUsers.map((u: any) => u.UserId);
    if (allIosSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedUsers((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  // Recipient summary (across all loaded users, not just the filtered view)
  const selectedSet = useMemo(() => new Set(selectedUsers), [selectedUsers]);
  const selectedAndroid = users.filter(
    (u: any) => selectedSet.has(u.UserId) && getPlatform(u.pushToken) === "android"
  ).length;
  const selectedIos = users.filter(
    (u: any) => selectedSet.has(u.UserId) && getPlatform(u.pushToken) === "ios"
  ).length;

  // ---------------- SUBMIT ----------------
  const [onSubmit, sending] = useAsyncAction(async (values: any) => {
    if (!selectedUsers.length) {
      message.warning("Select at least one user");
      return;
    }

    // If customer route is selected, ensure a customer URL is provided
    if (values.route === "customer" && !values.customerUrl) {
      message.error("Please enter a customer URL");
      return;
    }

    const payload: any = {
      userIds: selectedUsers,
      title: values.title,
      body: values.body,
      data: { route: values.route === "customer" ? values.customerUrl : values.route },
    };

    try {
      await core_services.sendPushNotification(payload);
      message.success("Sent successfully");
      form.resetFields();
      setSelectedUsers([]);
      setSelectedRoute("");
    } catch (e: any) {
      message.error(e?.message || "Failed");
    }
  });

  // ---------------- NOTIF PREVIEW COLORS ----------------
  // Device-preview colours intentionally mimic the phone OS, not the CMS theme.
  const notif = {
    bg: notifDark ? "#111111" : "#f2f2f7",
    border: notifDark ? "#2a2a2a" : "#d1d1d6",
    appName: notifDark ? "#ffffff" : "#000000",
    timeColor: notifDark ? "#888888" : "#8e8e93",
    titleColor: notifDark ? "#ffffff" : "#000000",
    bodyColor: notifDark ? "#bbbbbb" : "#3c3c43",
    divider: notifDark ? "#2a2a2a" : "#d1d1d6",
  };

  const inlineInputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    outline: "none",
    boxShadow: "none",
    padding: 0,
    caretColor: CMS_COLORS.primary,
  };

  const onCardKey = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleUser(id);
    }
  };

  // ---------------- RENDER USER CARD (GRID) ----------------
  const renderGridCard = (user: any) => {
    const isSelected = selectedUsers.includes(user.UserId);
    return (
      <div
        key={user.UserId}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onClick={() => toggleUser(user.UserId)}
        onKeyDown={(e) => onCardKey(e, user.UserId)}
        className={`ann-user ann-user-card ${isSelected ? "is-selected" : ""}`}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
          <UserAvatar user={user} size={52} />
          <Text strong style={{ fontSize: 13, color: CMS_COLORS.navy }}>
            {user.Username}
          </Text>
          <Text
            ellipsis
            style={{ fontSize: 11, color: CMS_COLORS.textMuted, width: "100%" }}
          >
            {user.Email}
          </Text>
        </div>

        {/* Platform badge — bottom right, absolute */}
        <PlatformBadge token={user.pushToken} />
      </div>
    );
  };

  // ---------------- RENDER USER ROW (LIST) ----------------
  const renderListRow = (user: any) => {
    const isSelected = selectedUsers.includes(user.UserId);
    return (
      <div
        key={user.UserId}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onClick={() => toggleUser(user.UserId)}
        onKeyDown={(e) => onCardKey(e, user.UserId)}
        className={`ann-user ann-user-row ${isSelected ? "is-selected" : ""}`}
      >
        <UserAvatar user={user} size={36} />

        {/* Name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong ellipsis style={{ fontSize: 13, display: "block", color: CMS_COLORS.navy }}>
            {user.Username}
          </Text>
          <Text ellipsis style={{ fontSize: 11, display: "block", color: CMS_COLORS.textMuted }}>
            {user.Email}
          </Text>
        </div>

        {/* Platform badge inline with label */}
        <PlatformBadge token={user.pushToken} listView />
      </div>
    );
  };

  const renderUsers = () => {
    if (loadingUsers && users.length === 0) {
      return viewMode === "grid" ? (
        <div className="ann-user-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="ann-user ann-user-card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <Skeleton.Avatar active size={52} />
                <Skeleton.Input active size="small" style={{ width: 90, minWidth: 0, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      );
    }

    if (visibleUsers.length === 0) {
      return (
        <EmptyState
          icon={<TeamOutlined />}
          title={searchText ? "No matching users" : "No users with push enabled"}
          description={
            searchText
              ? "Try a different name or email."
              : "Users appear here once they have registered a push token."
          }
        />
      );
    }

    return viewMode === "grid" ? (
      <div className="ann-user-grid">{visibleUsers.map(renderGridCard)}</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleUsers.map(renderListRow)}
      </div>
    );
  };

  const selectedInView = filteredUsers.filter((user) => selectedUsers.includes(user.UserId)).length;

  return (
    <Page>
      <style>{pageStyles}</style>

      <PageHeader
        title="New Announcement"
        subtitle="Pick recipients, compose a push notification and preview it before sending."
        actions={
          <IconButton
            label="Reload users"
            title="Reload users"
            onClick={() => void fetchUsers()}
            disabled={loadingUsers}
            style={loadingUsers ? { cursor: "progress", opacity: 0.7 } : undefined}
          >
            <ReloadOutlined spin={loadingUsers} />
          </IconButton>
        }
      />

      {/* ---------------- USERS SECTION ---------------- */}
      <Surface
        title="Select Users"
        icon={<TeamOutlined />}
        count={loadingUsers && users.length === 0 ? "…" : filteredUsers.length}
        extra={
          <>
            <Button onClick={handleSelectAll} disabled={!filteredUsers.length}>
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </Button>
            <Button
              icon={<AndroidOutlined />}
              onClick={handleSelectAndroid}
              disabled={!androidUsers.length}
              className={`ann-toggle ${allAndroidSelected ? "is-on" : ""}`}
            >
              {allAndroidSelected ? "Deselect Android" : "Select Android"}
            </Button>
            <Button
              icon={<AppleOutlined />}
              onClick={handleSelectIOS}
              disabled={!iosUsers.length}
              className={`ann-toggle ${allIosSelected ? "is-on" : ""}`}
            >
              {allIosSelected ? "Deselect iOS" : "Select iOS"}
            </Button>
            <Input
              prefix={<SearchOutlined style={{ color: CMS_COLORS.silver }} />}
              placeholder="Search..."
              value={searchText}
              allowClear
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 200, maxWidth: "100%" }}
            />
            {/* ── View toggle ── */}
            <div className="cms-pill-tabs" role="tablist" aria-label="View mode" style={{ padding: 3 }}>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "grid"}
                aria-label="Grid view"
                title="Grid view"
                className={`cms-pill-tab ${viewMode === "grid" ? "is-active" : ""}`}
                style={{ padding: "6px 12px" }}
                onClick={() => setViewMode("grid")}
              >
                <AppstoreOutlined />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "list"}
                aria-label="List view"
                title="List view"
                className={`cms-pill-tab ${viewMode === "list" ? "is-active" : ""}`}
                style={{ padding: "6px 12px" }}
                onClick={() => setViewMode("list")}
              >
                <UnorderedListOutlined />
              </button>
            </div>
          </>
        }
        bodyStyle={{ padding: 22 }}
      >
        {renderUsers()}

        <div className="ann-footer">
          <Chip tone={selectedInView ? "primary" : "neutral"}>
            {selectedInView} / {filteredUsers.length} selected
          </Chip>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredUsers.length}
            showSizeChanger
            pageSizeOptions={["20", "50", "100"]}
            showTotal={(total) => `${total} users`}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </Surface>

      {/* ---------------- FORM + PREVIEW ---------------- */}
      <div className="ann-compose">
        <Surface title="Compose" icon={<NotificationOutlined />} bodyStyle={{ padding: 22 }}>
          <Form form={form} onFinish={onSubmit} layout="vertical" disabled={sending}>
            {/* ===== NOTIFICATION PREVIEW CARD ===== */}
            <div
              style={{
                background: notif.bg,
                borderRadius: 22,
                padding: "14px 16px",
                marginBottom: 20,
                border: `1px solid ${notif.border}`,
                boxShadow: "0 18px 40px -22px rgba(32,42,64,0.45)",
                transition: "background 0.25s, border-color 0.25s",
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    src={logo}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                    alt="logo"
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: notif.appName,
                        transition: "color 0.25s",
                      }}
                    >
                      Nearwe
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: notif.timeColor,
                        transition: "color 0.25s",
                      }}
                    >
                      now
                    </div>
                  </div>
                </div>

                {/* Dark/Light toggle */}
                <button
                  type="button"
                  onClick={() => setNotifDark(!notifDark)}
                  title={notifDark ? "Switch to light preview" : "Switch to dark preview"}
                  aria-label={notifDark ? "Switch to light preview" : "Switch to dark preview"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: notifDark ? "#1c1c1e" : "#e5e5ea",
                    border: `1px solid ${notif.border}`,
                    borderRadius: 999,
                    padding: "4px 10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={notifDark ? "#555555" : CMS_COLORS.warning} strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <div style={{ width: 30, height: 17, borderRadius: 999, background: notifDark ? CMS_COLORS.primary : CMS_COLORS.silver, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffffff", position: "absolute", top: 3, left: notifDark ? 15 : 3, transition: "left 0.2s" }} />
                  </div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={notifDark ? "#7F9BF0" : "none"} stroke={notifDark ? "#7F9BF0" : "#aaaaaa"} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </button>
              </div>

              {/* Inline title input */}
              <Form.Item name="title" rules={[{ required: true, message: "Title required" }]} style={{ margin: 0, marginBottom: 6 }}>
                <Input
                  placeholder="Title preview..."
                  style={{ ...inlineInputStyle, fontWeight: 600, fontSize: 15, color: notif.titleColor }}
                  className="ann-inline-input"
                />
              </Form.Item>

              <div style={{ height: 1, background: notif.divider, margin: "4px 0 8px", transition: "background 0.25s" }} />

              {/* Inline message input */}
              <Form.Item name="body" rules={[{ required: true, message: "Message required" }]} style={{ margin: 0 }}>
                <Input.TextArea
                  placeholder="Message preview..."
                  autoSize={{ minRows: 2 }}
                  style={{ ...inlineInputStyle, fontSize: 13, color: notif.bodyColor, resize: "none" }}
                  className="ann-inline-input"
                />
              </Form.Item>
            </div>
            {/* ===== END NOTIFICATION CARD ===== */}

            <Form.Item name="route" label="Route" rules={[{ required: true }]}>
              <Select
                options={APP_ROUTE_OPTIONS}
                onChange={(value) => setSelectedRoute(value)}
              />
            </Form.Item>

            {selectedRoute === "customer" && (
              <Form.Item
                name="customerUrl"
                label="Customer URL"
                rules={[{ required: true, message: "Customer URL is required" }]}
                tooltip="Enter the full URL where the user will be directed (e.g., https://nearwe.in/profile)"
              >
                <Input
                  placeholder="https://nearwe.in/profile"
                  type="url"
                />
              </Form.Item>
            )}

            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={sending}
              disabled={!selectedUsers.length}
              size="large"
              block
            >
              Send Announcement
            </Button>
          </Form>
        </Surface>

        <Surface title="Recipients" icon={<TeamOutlined />} count={selectedUsers.length} bodyStyle={{ padding: "6px 22px 14px" }}>
          <div className="ann-summary-row">
            <span>Selected users</span>
            <b>{selectedUsers.length}</b>
          </div>
          <div className="ann-summary-row">
            <span><AndroidOutlined style={{ marginRight: 8, color: CMS_COLORS.success }} />Android</span>
            <b>{selectedAndroid}</b>
          </div>
          <div className="ann-summary-row">
            <span><AppleOutlined style={{ marginRight: 8, color: CMS_COLORS.textSecondary }} />iOS</span>
            <b>{selectedIos}</b>
          </div>
          <div className="ann-summary-row">
            <span>Users with push enabled</span>
            <b>{loadingUsers && users.length === 0 ? "…" : users.length}</b>
          </div>
          {!selectedUsers.length && (
            <Text style={{ display: "block", marginTop: 10, fontSize: 12, color: CMS_COLORS.textMuted }}>
              Select at least one user above to enable sending.
            </Text>
          )}
        </Surface>
      </div>
    </Page>
  );
};

export default Announcements;
