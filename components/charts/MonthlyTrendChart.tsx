'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DataPoint {
  month: string  // "Oca", "Şub", ...
  count: number
}

interface Props {
  data: DataPoint[]
}

export default function MonthlyTrendChart({ data }: Props) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f3c" vertical={false} />
          <XAxis dataKey="month" stroke="#a3a09a" fontSize={11} tickMargin={6} />
          <YAxis stroke="#a3a09a" fontSize={11} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#30302d' }}
            contentStyle={{
              background: '#1a1a18',
              border: '1px solid #3f3f3c',
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: '#a3a09a' }}
            itemStyle={{ color: '#EF9F27' }}
          />
          <Bar dataKey="count" fill="#EF9F27" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
