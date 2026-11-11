import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FLAVORS } from '../game/data';
import type { Flavor, MonthRecord } from '../game/types';

export function FlavorChart({ flavor, comparison }: { flavor: Flavor; comparison?: Flavor }) {
  const data = FLAVORS.map((k) => ({ name: k, 预测: flavor[k], 实测: comparison?.[k] }));
  return (
    <div className="radar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#dce3db" />
          <PolarAngleAxis dataKey="name" tick={{ fill: '#6b766e', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="预测"
            stroke="#377a61"
            fill="#377a61"
            fillOpacity={0.17}
            strokeWidth={2}
          />
          {comparison && (
            <Radar dataKey="实测" stroke="#be9251" fill="#be9251" fillOpacity={0.12} />
          )}
          <Tooltip formatter={(v) => Number(v).toFixed(1)} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function OperatingChart({
  history,
  kind = 'finance',
}: {
  history: MonthRecord[];
  kind?: 'finance' | 'channel';
}) {
  const data = history.slice(-12).map((h) => ({
    月份: `${h.month}月`,
    营业收入: h.revenue,
    实际回款: h.receipts,
    终端动销: h.retail,
    企业出货: h.shipped,
    渠道库存: h.dealerStock,
  }));
  const preview = data.length
    ? data
    : [{ 月份: '待结算', 营业收入: 0, 实际回款: 0, 终端动销: 0, 企业出货: 0, 渠道库存: 1600 }];
  return (
    <div className="operating-chart">
      <ResponsiveContainer width="100%" height="100%">
        {kind === 'finance' ? (
          <AreaChart data={preview} margin={{ top: 16, right: 5, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#60937a" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#60937a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e8ece6" />
            <XAxis
              dataKey="月份"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#87918a' }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#87918a' }} />
            <Tooltip
              formatter={(v) => `${Number(v).toFixed(2)} 万元`}
              contentStyle={{ borderRadius: 10, borderColor: '#e5e8e0', fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11, paddingTop: 15 }}
            />
            <Area
              type="monotone"
              dataKey="营业收入"
              stroke="#377a61"
              strokeWidth={2.5}
              fill="url(#revenueFill)"
            />
            <Area
              type="monotone"
              dataKey="实际回款"
              stroke="#c2a06b"
              strokeWidth={2}
              strokeDasharray="5 4"
              fill="transparent"
            />
          </AreaChart>
        ) : (
          <LineChart data={preview} margin={{ top: 16, right: 5, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e8ece6" />
            <XAxis dataKey="月份" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="企业出货" stroke="#377a61" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="终端动销" stroke="#ba9251" dot={false} strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="渠道库存"
              stroke="#b16b62"
              dot={false}
              strokeDasharray="4 4"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
