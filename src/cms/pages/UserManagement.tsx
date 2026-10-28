import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Grid,
  List,
  Typography,
  Space,
  message,
  Input,
  Avatar,
  Dropdown,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  UserOutlined,
  StopOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { core_services } from "../../utils/api";

const { useBreakpoint } = Grid;
const { Text } = Typography;

const INDIGO = "#3F51B5";

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ active?: boolean }> = ({ active = true }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: active ? "#E0F2F1" : "#FFEBEE",
      color:      active ? "#00897B" : "#E53935",
    }}
  >
    <span
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: active ? "#00897B" : "#E53935",
        display: "inline-block",
      }}
    />
    {active ? "Active" : "Blocked"}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────
const UserManagement: React.FC = () => {
  const screens    = useBreakpoint();
  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await core_services.getUser();
      setUsers(response || []);
    } catch {
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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
    return [...data].sort((a, b) => {
      const aEnabled = a.pushToken && a.pushToken.length > 0 ? 1 : 0;
      const bEnabled = b.pushToken && b.pushToken.length > 0 ? 1 : 0;
      return bEnabled - aEnabled;
    });
  }, [users, searchText]);

  const toggleBlock = (userId: string) => {
    message.info(`Toggle block for ${userId}`);
  };

  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "User",
        render: (_: any, record: any) => (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={36}
              style={{
                background: "#E8EAF6",
                color: INDIGO,
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
              icon={<UserOutlined />}
            />
            <div style={{ minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: 600, color: "#212121", display: "block" }}>
                {record.Username}
              </Text>
              <Text style={{ fontSize: 11, color: "#9E9E9E" }}>{record.Email}</Text>
            </div>
          </div>
        ),
      },
      {
        title: "Location",
        dataIndex: "Location",
        render: (v: string) => (
          <Text style={{ fontSize: 12, color: "#757575" }}>{v || "—"}</Text>
        ),
      },
      {
        title: "Push Notifications",
        dataIndex: "pushToken",
        render: (pushToken: string | null) =>
          pushToken && pushToken.length > 0 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                color: "#00897B",
                background: "#E0F2F1",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              <CheckCircleOutlined /> Enabled
            </span>
          ) : (
            <Text style={{ fontSize: 11, color: "#BDBDBD" }}>Disabled</Text>
          ),
      },
      {
        title: "Status",
        render: () => <StatusBadge active={true} />,
      },
      {
        title: "",
        width: 48,
        render: (_: any, record: any) => (
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
            <Button
              type="text"
              icon={<MoreOutlined />}
              style={{
                color: "#BDBDBD",
                width: 32,
                height: 32,
                padding: 0,
                borderRadius: 8,
              }}
            />
          </Dropdown>
        ),
      },
    ],
    []
  );

  return (
    <Card
      style={{
        borderRadius: 16,
        border: "1px solid #E3E6F0",
        boxShadow: "0 2px 12px rgba(63,81,181,0.08)",
        overflow: "hidden",
      }}
      styles={{
        header: {
          borderBottom: "1px solid #F5F5F5",
          padding: "0 24px",
          minHeight: 60,
        },
        body: { padding: 0 },
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#E8EAF6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserOutlined style={{ color: INDIGO, fontSize: 15 }} />
          </div>
          <Text style={{ fontSize: 15, fontWeight: 700, color: "#212121" }}>User Management</Text>
          <span
            style={{
              background: "#E8EAF6",
              color: INDIGO,
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: 20,
            }}
          >
            {filteredUsers.length}
          </span>
        </div>
      }
      extra={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#BDBDBD", fontSize: 13 }} />}
            placeholder="Search users..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220, borderRadius: 10, fontSize: 12 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            loading={loading}
            style={{ borderRadius: 10 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              borderRadius: 10,
              background: INDIGO,
              boxShadow: "0 4px 12px rgba(63,81,181,0.30)",
              fontWeight: 600,
            }}
          >
            Add User
          </Button>
        </div>
      }
    >
      {screens.md ? (
        <Table
          rowKey="UserId"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => (
              <Text style={{ fontSize: 11, color: "#9E9E9E" }}>
                {total} users
              </Text>
            ),
          }}
          style={{ borderRadius: 0 }}
          rowClassName={() => "cms-table-row"}
        />
      ) : (
        <div style={{ padding: 16 }}>
          <List
            dataSource={filteredUsers}
            loading={loading}
            renderItem={(user: any) => (
              <Card
                key={user.UserId}
                size="small"
                style={{ marginBottom: 10, borderRadius: 12, border: "1px solid #E3E6F0" }}
              >
                <Space style={{ width: "100%" }} direction="vertical" size={8}>
                  <Space>
                    <Avatar
                      size={36}
                      style={{ background: "#E8EAF6", color: INDIGO }}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{user.Username}</Text>
                      <div style={{ fontSize: 11, color: "#9E9E9E" }}>{user.Email}</div>
                    </div>
                  </Space>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <StatusBadge active />
                    <Button
                      danger
                      size="small"
                      icon={<StopOutlined />}
                      style={{ borderRadius: 8, fontSize: 11 }}
                      onClick={() => toggleBlock(user.UserId)}
                    >
                      Block
                    </Button>
                  </div>
                </Space>
              </Card>
            )}
          />
        </div>
      )}
    </Card>
  );
};

export default UserManagement;