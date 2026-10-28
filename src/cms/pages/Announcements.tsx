import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Select,
  message,
  Spin,
  Pagination,
} from "antd";
import { APP_ROUTE_OPTIONS } from "../../utils/constants";
import { core_services } from "../../utils/api";
import logo from "../../assets/images/logo2.png";

const { Text, Title } = Typography;

// ─── Platform helpers ───────────────────────────────────────────────────────
const getPlatform = (token: string): "ios" | "android" =>
  token.startsWith("ExponentPushToken") ? "ios" : "android";

  

// ─── Grid/List toggle icons ──────────────────────────────────────────────────
const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1" fill={active ? "#3b82f6" : "#9ca3af"} stroke="none" />
    <circle cx="3" cy="12" r="1" fill={active ? "#3b82f6" : "#9ca3af"} stroke="none" />
    <circle cx="3" cy="18" r="1" fill={active ? "#3b82f6" : "#9ca3af"} stroke="none" />
  </svg>
);

// ─── Platform Badge ──────────────────────────────────────────────────────────
const PlatformBadge = ({ token, listView = false }: { token: string; listView?: boolean }) => {
  const platform = getPlatform(token);
  const isAndroid = platform === "android";

  const badgeStyle: React.CSSProperties = {
    position: listView ? "relative" : "absolute",
    bottom: listView ? undefined : 4,
    right: listView ? undefined : 4,
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 7px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    background: isAndroid ? "#e8f5e9" : "#ede7f6",
    color: isAndroid ? "#2e7d32" : "#4527a0",
    border: `1px solid ${isAndroid ? "#a5d6a7" : "#b39ddb"}`,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  return (
    <span style={badgeStyle}>
      {isAndroid ? "Android" : "iOS"}
    </span>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const Announcements: React.FC = () => {
  
  const [form] = Form.useForm();

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  
  const [notifDark, setNotifDark] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<string>("");

  // ---------------- FETCH USERS ----------------
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await core_services.getUser();
      const filtered = (response || []).filter(
        (u: any) => u.pushToken && u.pushToken.length > 0
      );
      setUsers(filtered);
    } catch {
      message.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  // ---------------- SUBMIT ----------------
  const onSubmit = async (values: any) => {
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
      setSending(true);
      await core_services.sendPushNotification(payload);
      message.success("Sent successfully");
      form.resetFields();
      setSelectedUsers([]);
      setSelectedRoute("");
    } catch (e: any) {
      message.error(e?.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  // ---------------- NOTIF PREVIEW COLORS ----------------
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
    caretColor: "#3b82f6",
  };

  // ---------------- RENDER USER CARD (GRID) ----------------
  const renderGridCard = (user: any) => {
    const isSelected = selectedUsers.includes(user.UserId);
    return (
      <div
        key={user.UserId}
        onClick={() => toggleUser(user.UserId)}
        style={{ position: "relative" }}
        className={`cursor-pointer p-3 rounded-2xl border transition-all
          ${isSelected
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-200 hover:shadow"
          }
        `}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
            {user.ProfileImageUrl ? (
              <img
                src={user.ProfileImageUrl}
                className="w-full h-full object-cover"
                alt={user.Username}
              />
            ) : (
              <span className="text-blue-700 font-semibold text-lg">
                {user.Username?.[0]}
              </span>
            )}
          </div>
          <Text strong className="text-sm">
            {user.Username}
          </Text>
          <Text className="text-xs text-gray-500 truncate w-full">
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
        onClick={() => toggleUser(user.UserId)}
        className={`cursor-pointer px-3 py-2 rounded-xl border transition-all flex items-center gap-3
          ${isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:shadow"
          }
        `}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
          {user.ProfileImageUrl ? (
            <img
              src={user.ProfileImageUrl}
              className="w-full h-full object-cover"
              alt={user.Username}
            />
          ) : (
            <span className="text-blue-700 font-semibold text-sm">
              {user.Username?.[0]}
            </span>
          )}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <Text strong className="text-sm block truncate">
            {user.Username}
          </Text>
          <Text className="text-xs text-gray-500 truncate block">
            {user.Email}
          </Text>
        </div>

        {/* Platform badge inline with label */}
        <PlatformBadge token={user.pushToken} listView />
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4">
      <Title level={3}>New Announcement</Title>

      {/* ---------------- USERS SECTION ---------------- */}
      <Card
        className="mb-6"
        title={
          <div className="flex flex-col md:flex-row gap-2 md:justify-between md:items-center">
            <Text strong>Select Users</Text>
            <div className="flex gap-2 items-center flex-wrap">
              <Button onClick={handleSelectAll} size="small">
                {allFilteredSelected
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button
                onClick={handleSelectAndroid}
                size="small"
                style={{
                  background: allAndroidSelected ? "#e8f5e9" : undefined,
                  borderColor: allAndroidSelected ? "#a5d6a7" : "#d9d9d9",
                  color: allAndroidSelected ? "#2e7d32" : undefined,
                  fontWeight: 600,
                }}
              >
                {allAndroidSelected ? "Deselect Android" : "Select Android"}
              </Button>
              <Button
                onClick={handleSelectIOS}
                size="small"
                style={{
                  background: allIosSelected ? "#ede7f6" : undefined,
                  borderColor: allIosSelected ? "#b39ddb" : "#d9d9d9",
                  color: allIosSelected ? "#4527a0" : undefined,
                  fontWeight: 600,
                }}
              >
                {allIosSelected ? "Deselect iOS" : "Select iOS"}
              </Button>
              <Input
                placeholder="Search..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: 160 }}
                size="small"
              />
              {/* ── View toggle ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f3f4f6",
                  borderRadius: 8,
                  padding: "3px 4px",
                  gap: 2,
                  border: "1px solid #e5e7eb",
                }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 26,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: viewMode === "grid" ? "#ffffff" : "transparent",
                    boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <GridIcon active={viewMode === "grid"} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="List view"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 26,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: viewMode === "list" ? "#ffffff" : "transparent",
                    boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <ListIcon active={viewMode === "list"} />
                </button>
              </div>
            </div>
          </div>
        }
      >
        {loadingUsers ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleUsers.map(renderGridCard)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleUsers.map(renderListRow)}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-3">
          {filteredUsers.filter((user) => selectedUsers.includes(user.UserId)).length} / {filteredUsers.length} selected
        </div>
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
          style={{ marginTop: 16, textAlign: "right" }}
        />
      </Card>

      {/* ---------------- FORM + PREVIEW ---------------- */}
      <div className="grid md:grid-cols-2 gap-6">
        <Form form={form} onFinish={onSubmit} layout="vertical">
        <Card>
          {/* ===== NOTIFICATION PREVIEW CARD ===== */}
          <div
            style={{
              background: notif.bg,
              borderRadius: 18,
              padding: "14px 16px",
              marginBottom: 16,
              border: `1px solid ${notif.border}`,
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
                onClick={() => setNotifDark(!notifDark)}
                title={notifDark ? "Switch to light preview" : "Switch to dark preview"}
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={notifDark ? "#555555" : "#f59e0b"} strokeWidth="2.5" strokeLinecap="round">
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
                <div style={{ width: 30, height: 17, borderRadius: 999, background: notifDark ? "#3b82f6" : "#c7c7cc", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffffff", position: "absolute", top: 3, left: notifDark ? 15 : 3, transition: "left 0.2s" }} />
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill={notifDark ? "#a78bfa" : "none"} stroke={notifDark ? "#a78bfa" : "#aaaaaa"} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>

            {/* Inline title input */}
            <Form.Item name="title" rules={[{ required: true, message: "Title required" }]} style={{ margin: 0, marginBottom: 6 }}>
              <Input
                placeholder="Title preview..."
                style={{ ...inlineInputStyle, fontWeight: 600, fontSize: 15, color: notif.titleColor }}
              />
            </Form.Item>

            <div style={{ height: 1, background: notif.divider, margin: "4px 0 8px", transition: "background 0.25s" }} />

            {/* Inline message input */}
            <Form.Item name="body" rules={[{ required: true, message: "Message required" }]} style={{ margin: 0 }}>
              <Input.TextArea
                placeholder="Message preview..."
                autoSize={{ minRows: 2 }}
                style={{ ...inlineInputStyle, fontSize: 13, color: notif.bodyColor, resize: "none" }}
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
            loading={sending}
            disabled={!selectedUsers.length}
            block
          >
            Send Announcement
          </Button>
        </Card>
        </Form>
      </div>
    </div>
  );
};

export default Announcements;