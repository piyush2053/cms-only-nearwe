import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  message,
  Spin,
  Typography,
  Tag,
} from "antd";
import type { StatisticProps } from "antd";
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  RiseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import CountUp from "react-countup";
import { core_services } from "../../utils/api";
import dayjs from "dayjs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const { Text } = Typography;

const INDIGO      = "#3F51B5";
const INDIGO_LIGHT = "#E8EAF6";

interface EventItem {
  EventID: string;
  EventTitle: string;
  EventDesc: string;
  EventTime: string;
  Status: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  delta?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor, delta }) => {
  const formatter: StatisticProps["formatter"] = (v) => (
    <CountUp end={Number(v) || 0} duration={1.2} separator="," />
  );

  return (
    <Card
      className="cms-stat-card"
      style={{
        borderRadius: 16,
        border: "1px solid #E3E6F0",
        boxShadow: "0 2px 12px rgba(63,81,181,0.08)",
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#9E9E9E",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            {title}
          </div>
          <Statistic
            value={value}
            formatter={formatter}
            valueStyle={{ fontSize: 28, fontWeight: 700, color: "#212121", lineHeight: 1.1 }}
          />
          {delta && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <RiseOutlined style={{ color: "#00897B", fontSize: 11 }} />
              <Text style={{ color: "#00897B", fontSize: 11, fontWeight: 600 }}>{delta} vs last month</Text>
            </div>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E3E6F0",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(63,81,181,0.12)",
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: "#424242", marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, display: "flex", gap: 10 }}>
          <span style={{ textTransform: "capitalize" }}>{p.dataKey}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const cardStyle = {
  borderRadius: 16,
  border: "1px solid #E3E6F0",
  boxShadow: "0 2px 12px rgba(63,81,181,0.08)",
};

// ─── Component ────────────────────────────────────────────────────────────────
const InsightsDashboard: React.FC = () => {
  const [loading, setLoading]               = useState(true);
  const [categoryCount, setCategoryCount]   = useState(0);
  const [eventCount, setEventCount]         = useState(0);
  const [activeEventCount, setActiveEventCount] = useState(0);
  const [usersCount, setUsersCount]         = useState(0);
  const [events, setEvents]                 = useState<EventItem[]>([]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [categoriesRes, eventsRes, usersRes] = await Promise.all([
        core_services.getCategories(),
        core_services.getAllEvents(),
        core_services.getUser(),
      ]);
      setCategoryCount(categoriesRes?.length || 0);
      setEventCount(eventsRes?.length || 0);
      setEvents(eventsRes || []);
      setActiveEventCount((eventsRes || []).filter((e: any) => e.Status === 1).length);
      setUsersCount(usersRes?.length || 0);
    } catch {
      message.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <Spin size="large" indicator={<LoadingOutlined style={{ color: INDIGO }} />} />
      </div>
    );
  }

  const eventTrendData = [
    { month: "Jan", events: 65, capacity: 80 },
    { month: "Feb", events: 78, capacity: 90 },
    { month: "Mar", events: 92, capacity: 95 },
    { month: "Apr", events: 88, capacity: 85 },
    { month: "May", events: 105, capacity: 110 },
    { month: "Jun", events: 130, capacity: 125 },
  ];

  const eventStatusData = [
    { name: "Active",    value: activeEventCount,               color: INDIGO },
    { name: "Upcoming",  value: 28,                             color: "#7B1FA2" },
    { name: "Completed", value: eventCount - activeEventCount,  color: "#00897B" },
  ];

  const attendanceData = [
    { name: "Conference", attended: 890, registered: 950 },
    { name: "Workshop",   attended: 380, registered: 400 },
    { name: "Meetup",     attended: 150, registered: 200 },
  ];

  const getEventLife = (eventTime: string) => {
    const start    = dayjs(eventTime).subtract(1, "day");
    const end      = start.add(4, "day");
    const total    = end.diff(start, "minute");
    const passed   = dayjs().diff(start, "minute");
    const progress = Math.min(Math.max((passed / total) * 100, 0), 100);
    return { start, end, progress: Math.round(progress) };
  };

  return (
    <div>
      {/* KPI Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Total Categories" value={categoryCount}    icon={<AppstoreOutlined />}   color={INDIGO}    bgColor={INDIGO_LIGHT}  delta="+12%" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Total Events"     value={eventCount}       icon={<CalendarOutlined />}   color="#7B1FA2"   bgColor="#F3E5F5"       delta="+8%" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Active Events"    value={activeEventCount} icon={<CheckCircleOutlined />} color="#00897B"  bgColor="#E0F2F1" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Registered Users" value={usersCount}       icon={<TeamOutlined />}        color="#F57C00"  bgColor="#FFF3E0"       delta="+5%" />
        </Col>
      </Row>

      <div style={{ height: 20 }} />

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>Event Growth Trend</span>}
            style={cardStyle}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={eventTrendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor={INDIGO} stopOpacity={0.20} />
                    <stop offset="95%" stopColor={INDIGO} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCapacity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#7B1FA2" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#7B1FA2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FA" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#BDBDBD" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#BDBDBD" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
                <Area type="monotone" dataKey="events"   stroke={INDIGO}   fill="url(#gradEvents)"   strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="capacity" stroke="#7B1FA2"  fill="url(#gradCapacity)" strokeWidth={2.5} dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>Event Status</span>}
            style={{ ...cardStyle, height: "100%" }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={eventStatusData} dataKey="value" innerRadius={54} outerRadius={82} strokeWidth={0}>
                  {eventStatusData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, name]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E3E6F0", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {eventStatusData.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <Text style={{ fontSize: 12, color: "#757575" }}>{d.name}</Text>
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 700, color: "#212121" }}>{d.value}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ height: 16 }} />

      <Row gutter={[16, 16]}>
        {/* Attendance */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>Attendance Analysis</span>}
            style={cardStyle}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attendanceData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FA" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#BDBDBD" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#BDBDBD" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
                <Bar dataKey="attended"   fill={INDIGO}   radius={[4, 4, 0, 0]} />
                <Bar dataKey="registered" fill="#E8EAF6"  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Event Life Tracker */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>Event Lifecycle</span>}
            style={cardStyle}
            styles={{ body: { padding: "16px 20px" } }}
          >
            {events.slice(0, 3).map((e) => {
              const life = getEventLife(e.EventTime);
              const progressColor = life.progress < 50 ? INDIGO : life.progress < 80 ? "#F57C00" : "#E53935";
              return (
                <div
                  key={e.EventID}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #E3E6F0",
                    marginBottom: 10,
                    background: "#FAFBFF",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: "#212121" }}>{e.EventTitle}</Text>
                    <Tag
                      style={{
                        fontSize: 10,
                        borderRadius: 20,
                        background: life.progress < 50 ? "#E0F2F1" : life.progress < 80 ? "#FFF3E0" : "#FFEBEE",
                        color:      life.progress < 50 ? "#00897B" : life.progress < 80 ? "#F57C00" : "#E53935",
                        border:     "none",
                        fontWeight: 700,
                      }}
                    >
                      {life.progress}%
                    </Tag>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "#E3E6F0", overflow: "hidden", marginBottom: 6 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${life.progress}%`,
                        background: progressColor,
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 10, color: "#BDBDBD" }}>{life.start.format("DD MMM")}</Text>
                    <Text style={{ fontSize: 10, color: "#BDBDBD" }}>{life.end.format("DD MMM")}</Text>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#BDBDBD", fontSize: 13 }}>
                No events to display
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InsightsDashboard;