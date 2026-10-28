import React, { useEffect, useState } from "react";
import { Col, Row, Skeleton, message } from "antd";
import {
  AppstoreOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  PieChartOutlined,
  ReloadOutlined,
  RiseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import CountUpImport from "react-countup";
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
import { Chip, EmptyState, IconButton, Page, PageHeader, StatCard, Surface } from "../../components/ui";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { CMS_COLORS } from "../cmstheme";

// CommonJS interop can wrap react-countup's component in a default export object.
const CountUp = typeof CountUpImport === "function"
  ? CountUpImport
  : (CountUpImport as unknown as { default: typeof CountUpImport }).default;

// Chart palette (Wayyo)
const COBALT   = CMS_COLORS.primary;   // #3559C7
const NAVY     = CMS_COLORS.navy;      // #202A40
const PERIWINKLE = "#7F9BF0";
const SILVER   = CMS_COLORS.silver;    // #C0C7D4
const GRID     = "#EDF0F6";
const AXIS_TICK = { fontSize: 11, fill: CMS_COLORS.textMuted };

interface EventItem {
  EventID: string;
  EventTitle: string;
  EventDesc: string;
  EventTime: string;
  Status: number;
}

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { color?: string; fill?: string };
}

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      {label !== undefined && <div className="dash-tooltip-title">{label}</div>}
      {payload.map((p) => (
        <div key={String(p.dataKey ?? p.name)} className="dash-tooltip-row">
          <span className="dash-tooltip-dot" style={{ background: p.color ?? p.payload?.color ?? p.payload?.fill }} />
          <span className="dash-tooltip-key">{p.name ?? p.dataKey}</span>
          <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
};

const LegendText = (value: string) => (
  <span style={{ color: CMS_COLORS.textSecondary, fontSize: 12, fontWeight: 500, textTransform: "capitalize" }}>
    {value}
  </span>
);

const ChartSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <div style={{ height, display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <Skeleton active title={false} paragraph={{ rows: 5, width: ["90%", "70%", "85%", "60%", "75%"] }} />
  </div>
);

const Count: React.FC<{ value: number }> = ({ value }) => (
  <CountUp end={Number(value) || 0} duration={1.2} separator="," />
);

const DeltaHint: React.FC<{ delta: string }> = ({ delta }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <RiseOutlined style={{ color: CMS_COLORS.success }} />
    <b style={{ color: CMS_COLORS.success, fontWeight: 600 }}>{delta}</b> vs last month
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────
const InsightsDashboard: React.FC = () => {
  const [loaded, setLoaded]                 = useState(false);
  const [categoryCount, setCategoryCount]   = useState(0);
  const [eventCount, setEventCount]         = useState(0);
  const [activeEventCount, setActiveEventCount] = useState(0);
  const [usersCount, setUsersCount]         = useState(0);
  const [events, setEvents]                 = useState<EventItem[]>([]);

  const [fetchInsights, fetching] = useAsyncAction(async () => {
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
      setLoaded(true);
    }
  }, { queue: true });

  useEffect(() => { void fetchInsights(); }, [fetchInsights]);

  const loading = fetching || !loaded;

  const eventTrendData = [
    { month: "Jan", events: 65, capacity: 80 },
    { month: "Feb", events: 78, capacity: 90 },
    { month: "Mar", events: 92, capacity: 95 },
    { month: "Apr", events: 88, capacity: 85 },
    { month: "May", events: 105, capacity: 110 },
    { month: "Jun", events: 130, capacity: 125 },
  ];

  const eventStatusData = [
    { name: "Active",    value: activeEventCount,               color: COBALT },
    { name: "Upcoming",  value: 28,                             color: PERIWINKLE },
    { name: "Completed", value: eventCount - activeEventCount,  color: NAVY },
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

  const statusTotal = eventStatusData.reduce((s, d) => s + Math.max(d.value, 0), 0);

  return (
    <Page>
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .dash-tooltip {
          background: #fff; border: 1px solid var(--wy-line); border-radius: 14px;
          padding: 10px 14px; box-shadow: var(--wy-shadow-float); font-size: 12px; min-width: 140px;
        }
        .dash-tooltip-title { font-weight: 700; color: var(--wy-navy); margin-bottom: 6px; }
        .dash-tooltip-row { display: flex; align-items: center; gap: 8px; color: var(--wy-text-2); line-height: 1.8; }
        .dash-tooltip-row b { margin-left: auto; color: var(--wy-navy); font-weight: 700; }
        .dash-tooltip-key { text-transform: capitalize; }
        .dash-tooltip-dot { width: 8px; height: 8px; border-radius: 99px; flex-shrink: 0; }
        .dash-legend-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-radius: 14px; background: var(--wy-light); }
        .dash-legend-row + .dash-legend-row { margin-top: 8px; }
        .dash-legend-dot { width: 10px; height: 10px; border-radius: 99px; flex-shrink: 0; }
        .dash-activity { display: flex; align-items: center; gap: 14px; padding: 14px 4px; }
        .dash-activity + .dash-activity { border-top: 1px solid var(--wy-line); }
        .dash-activity-body { flex: 1; min-width: 0; }
        .dash-activity-title { font-size: 13px; font-weight: 600; color: var(--wy-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dash-progress { height: 6px; border-radius: 99px; background: var(--wy-light); overflow: hidden; margin: 8px 0 6px; }
        .dash-progress > span { display: block; height: 100%; border-radius: 99px; transition: width 0.6s var(--wy-ease); }
        .dash-dates { display: flex; justify-content: space-between; font-size: 11px; color: var(--wy-muted); }
        .dash-donut { position: relative; }
        .dash-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
        .dash-donut-center b { font-size: 24px; font-weight: 700; color: var(--wy-navy); letter-spacing: -0.02em; line-height: 1; }
        .dash-donut-center span { font-size: 11px; color: var(--wy-muted); margin-top: 4px; }      `}</style>

      <PageHeader
        title="Insights Dashboard"
        subtitle="A live snapshot of categories, events and community activity."
        actions={
          <IconButton
            label="Refresh dashboard"
            title="Refresh"
            onClick={() => void fetchInsights()}
            disabled={loading}
            aria-busy={loading}
            style={loading ? { cursor: "progress" } : undefined}
          >
            <ReloadOutlined spin={loading} />
          </IconButton>
        }
      />

      {/* KPI Row */}
      <div className="dash-stats">
        <StatCard label="Total Categories" value={<Count value={categoryCount} />}    icon={<AppstoreOutlined />}    tone="primary" loading={loading} hint={<DeltaHint delta="+12%" />} />
        <StatCard label="Total Events"     value={<Count value={eventCount} />}       icon={<CalendarOutlined />}    tone="navy"    loading={loading} hint={<DeltaHint delta="+8%" />} />
        <StatCard label="Active Events"    value={<Count value={activeEventCount} />} icon={<CheckCircleOutlined />} tone="success" loading={loading} hint="Currently live" />
        <StatCard label="Registered Users" value={<Count value={usersCount} />}       icon={<TeamOutlined />}        tone="warning" loading={loading} hint={<DeltaHint delta="+5%" />} />
      </div>

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Surface title="Event Growth Trend" icon={<AreaChartOutlined />} style={{ height: "100%" }} bodyStyle={{ padding: "18px 16px 14px 4px" }}>
            {loading ? (
              <div style={{ paddingLeft: 18 }}><ChartSkeleton height={280} /></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={eventTrendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={COBALT} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={COBALT} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCapacity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={NAVY} stopOpacity={0.08} />
                      <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: SILVER, strokeDasharray: "4 4" }} />
                  <Legend iconType="circle" iconSize={8} formatter={LegendText} wrapperStyle={{ paddingTop: 12 }} />
                  <Area type="monotone" dataKey="events"   stroke={COBALT} fill="url(#gradEvents)"   strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff" }} />
                  <Area type="monotone" dataKey="capacity" stroke={NAVY}   fill="url(#gradCapacity)" strokeWidth={2}   dot={false} strokeDasharray="5 4" activeDot={{ r: 4, strokeWidth: 3, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Surface>
        </Col>

        <Col xs={24} lg={8}>
          <Surface title="Event Status" icon={<PieChartOutlined />} style={{ height: "100%" }} bodyStyle={{ padding: "18px 22px 22px" }}>
            {loading ? (
              <ChartSkeleton height={300} />
            ) : (
              <>
                <div className="dash-donut">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={eventStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={84}
                        paddingAngle={3}
                        cornerRadius={8}
                        stroke="none"
                      >
                        {eventStatusData.map((e) => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="dash-donut-center">
                    <b>{statusTotal}</b>
                    <span>events</span>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {eventStatusData.map((d) => (
                    <div key={d.name} className="dash-legend-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="dash-legend-dot" style={{ background: d.color }} />
                        <span style={{ fontSize: 12, color: CMS_COLORS.textSecondary, fontWeight: 500 }}>{d.name}</span>
                      </div>
                      <b style={{ fontSize: 13, color: CMS_COLORS.navy }}>{d.value}</b>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Surface>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Attendance */}
        <Col xs={24} lg={12}>
          <Surface title="Attendance Analysis" icon={<BarChartOutlined />} style={{ height: "100%" }} bodyStyle={{ padding: "18px 16px 14px 4px" }}>
            {loading ? (
              <div style={{ paddingLeft: 18 }}><ChartSkeleton height={260} /></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendanceData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barSize={22} barGap={6}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: CMS_COLORS.light }} />
                  <Legend iconType="circle" iconSize={8} formatter={LegendText} wrapperStyle={{ paddingTop: 12 }} />
                  <Bar dataKey="attended"   fill={COBALT} radius={[8, 8, 8, 8]} />
                  <Bar dataKey="registered" fill={SILVER} radius={[8, 8, 8, 8]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Surface>
        </Col>

        {/* Event Life Tracker */}
        <Col xs={24} lg={12}>
          <Surface
            title="Event Lifecycle"
            icon={<FieldTimeOutlined />}
            count={loading ? undefined : Math.min(events.length, 3)}
            style={{ height: "100%" }}
            bodyStyle={{ padding: "6px 22px 10px" }}
          >
            {loading ? (
              <div style={{ padding: "12px 0" }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} active avatar={{ shape: "square", size: 40 }} title={{ width: "50%" }} paragraph={{ rows: 1, width: "90%" }} style={{ marginBottom: 12 }} />
                ))}
              </div>
            ) : events.length === 0 ? (
              <EmptyState title="No events to display" icon={<CalendarOutlined />} />
            ) : (
              events.slice(0, 3).map((e) => {
                const life = getEventLife(e.EventTime);
                const tone = life.progress < 50 ? "primary" : life.progress < 80 ? "warning" : "danger";
                const progressColor = tone === "primary" ? COBALT : tone === "warning" ? CMS_COLORS.warning : CMS_COLORS.danger;
                return (
                  <div key={e.EventID} className="dash-activity">
                    <span className="cms-icon-tile"><CalendarOutlined /></span>
                    <div className="dash-activity-body">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <span className="dash-activity-title" title={e.EventTitle}>{e.EventTitle}</span>
                        <Chip tone={tone} plain>{life.progress}%</Chip>
                      </div>
                      <div className="dash-progress">
                        <span style={{ width: `${life.progress}%`, background: progressColor }} />
                      </div>
                      <div className="dash-dates">
                        <span>{life.start.format("DD MMM")}</span>
                        <span>{life.end.format("DD MMM")}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </Surface>
        </Col>
      </Row>
    </Page>
  );
};

export default InsightsDashboard;
