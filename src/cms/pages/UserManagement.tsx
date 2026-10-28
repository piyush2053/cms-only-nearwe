import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Grid, List, Typography, message, Input, Avatar, Dropdown } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  UserOutlined,
  StopOutlined,
  MoreOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  UserDeleteOutlined,
  TeamOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { core_services } from "../../utils/api";
import { CMS_COLORS } from "../cmstheme";
import { Page, PageHeader, Surface, StatCard, EmptyState, IconButton, Chip } from "../../components/ui";
import { useAsyncAction } from "../../hooks/useAsyncAction";

const { useBreakpoint } = Grid;
const { Text } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ active?: boolean }> = ({ active = true }) =>
  active ? <Chip tone="success">Active</Chip> : <Chip tone="danger">Blocked</Chip>;

const hasPush = (u: any) => !!(u?.pushToken && u.pushToken.length > 0);

const initials = (name?: string) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

const UserAvatar: React.FC<{ name?: string }> = ({ name }) => {
  const text = initials(name);
  return (
    <Avatar
      size={38}
      style={{ background: CMS_COLORS.navy, color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
      icon={text ? undefined : <UserOutlined />}
    >
      {text || null}
    </Avatar>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const UserManagement: React.FC = () => {
  const screens = useBreakpoint();
  const [users, setUsers]           = useState<any[]>([]);
  const [loaded, setLoaded]         = useState(false);
  const [searchText, setSearchText] = useState("");

  const [fetchUsers, loading] = useAsyncAction(async () => {
    try {
      const response = await core_services.getUser();
      setUsers(response || []);
    } catch {
      message.error("Failed to load users");
    } finally {
      setLoaded(true);
    }
  }, { queue: true });

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    let data = users;
    if (searchText) {
      data = data.filter((u) =>
        [u.Username, u.Email, u.Location]
          .join(" ")
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }
    return [...data].sort((a, b) => (hasPush(b) ? 1 : 0) - (hasPush(a) ? 1 : 0));
  }, [users, searchText]);

  const pushEnabledCount = useMemo(() => users.filter(hasPush).length, [users]);

  const toggleBlock = (userId: string) => {
    message.info(`Toggle block for ${userId}`);
  };

  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "User",
        render: (_: unknown, record: any) => (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <UserAvatar name={record.Username} />
            <div style={{ minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: 600, color: CMS_COLORS.navy, display: "block" }}>
                {record.Username}
              </Text>
              <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }}>{record.Email}</Text>
            </div>
          </div>
        ),
      },
      {
        title: "Location",
        dataIndex: "Location",
        render: (v: string) => (
          <Text style={{ fontSize: 12, color: CMS_COLORS.textSecondary }}>{v || "—"}</Text>
        ),
      },
      {
        title: "Push Notifications",
        dataIndex: "pushToken",
        render: (pushToken: string | null) =>
          pushToken && pushToken.length > 0 ? (
            <Chip tone="primary">Enabled</Chip>
          ) : (
            <Chip tone="neutral">Disabled</Chip>
          ),
      },
      {
        title: "Status",
        render: () => <StatusBadge active={true} />,
      },
      {
        title: "",
        width: 64,
        align: "right" as const,
        render: (_: unknown, record: any) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "block",
                  icon: <StopOutlined />,
                  label: "Block User",
                  danger: true,
                  onClick: () => toggleBlock(record.UserId),
                },
                {
                  key: "delete",
                  icon: <UserDeleteOutlined />,
                  label: "Delete User",
                  danger: true,
                },
              ],
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <IconButton label={`Actions for ${record.Username ?? "user"}`} style={{ width: 34, height: 34, fontSize: 14 }}>
              <MoreOutlined />
            </IconButton>
          </Dropdown>
        ),
      },
    ],
    []
  );

  const emptyText =
    loading || !loaded ? (
      <div style={{ height: 160 }} />
    ) : (
      <EmptyState
        title={searchText ? "No matching users" : "No users yet"}
        description={searchText ? "Try a different name, email or location." : undefined}
        icon={<TeamOutlined />}
      />
    );

  return (
    <Page>
      <PageHeader
        title="User Management"
        subtitle="See everyone using the app and manage their access."
        actions={
          <>
            <IconButton
              label="Refresh users"
              onClick={() => void fetchUsers()}
              disabled={loading}
              aria-busy={loading}
            >
              <ReloadOutlined spin={loading} />
            </IconButton>
            <Button type="primary" icon={<PlusOutlined />}>
              Add User
            </Button>
          </>
        }
      />

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <StatCard label="Total users" value={users.length} icon={<TeamOutlined />} loading={!loaded} />
        <StatCard
          label="Push notifications enabled"
          value={pushEnabledCount}
          icon={<BellOutlined />}
          tone="success"
          loading={!loaded}
        />
      </div>

      <Surface
        title="All users"
        icon={<UserOutlined />}
        count={filteredUsers.length}
        bodyStyle={{ padding: 0 }}
        extra={
          <Input
            prefix={<SearchOutlined style={{ color: CMS_COLORS.silver }} />}
            placeholder="Search users..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240, maxWidth: "100%" }}
          />
        }
      >
        {screens.md ? (
          <Table
            rowKey="UserId"
            columns={columns}
            dataSource={filteredUsers}
            loading={loading}
            size="middle"
            scroll={{ x: "max-content" }}
            locale={{ emptyText }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => (
                <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }}>{total} users</Text>
              ),
            }}
          />
        ) : (
          <div style={{ padding: 14 }}>
            <List
              dataSource={filteredUsers}
              loading={loading}
              locale={{ emptyText }}
              split={false}
              renderItem={(user: any) => (
                <div
                  key={user.UserId}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderRadius: 18,
                    background: CMS_COLORS.surfaceAlt,
                    border: "1px solid var(--wy-line)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <UserAvatar name={user.Username} />
                    <div style={{ minWidth: 0 }}>
                      <Text strong style={{ fontSize: 13, color: CMS_COLORS.navy, display: "block" }}>
                        {user.Username}
                      </Text>
                      <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }} ellipsis>
                        {user.Email}
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <StatusBadge active />
                    <Button danger size="small" icon={<StopOutlined />} onClick={() => toggleBlock(user.UserId)}>
                      Block
                    </Button>
                  </div>
                </div>
              )}
            />
          </div>
        )}
      </Surface>
    </Page>
  );
};

export default UserManagement;
