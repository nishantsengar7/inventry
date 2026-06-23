import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Dot,
} from 'recharts';
import { formatDate } from '../../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function TransactionLineChart({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Transaction Trends <span className="text-gray-400 font-normal text-sm">(Last 30 Days)</span>
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            formatter={(value) => <span className="text-gray-600 capitalize">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="in"
            name="IN"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={<Dot r={3} fill="#10B981" />}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="out"
            name="OUT"
            stroke="#EF4444"
            strokeWidth={2.5}
            dot={<Dot r={3} fill="#EF4444" />}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
