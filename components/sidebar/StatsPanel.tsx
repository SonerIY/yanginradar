import { Card } from '@/components/ui/card'

interface Props {
  totalFires: number
  affectedIl: number
  diff: number
}

export default function StatsPanel({ totalFires, affectedIl, diff }: Props) {
  const diffPositive = diff > 0
  const diffNegative = diff < 0
  const diffColor = diffPositive
    ? 'text-[#E24B4A]'
    : diffNegative
      ? 'text-[#30c7a4]'
      : 'text-neutral-300'
  const diffPrefix = diffPositive ? '▲ +' : diffNegative ? '▼ ' : ''

  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      <Card className="bg-[#30302d] border-[#595954] rounded-lg p-3 gap-0">
        <span className="block text-[11px] font-extrabold text-[#a3a09a] uppercase">
          Aktif Nokta
        </span>
        <strong className="block mt-1 text-2xl text-[#E24B4A]">{totalFires}</strong>
      </Card>

      <Card className="bg-[#30302d] border-[#595954] rounded-lg p-3 gap-0">
        <span className="block text-[11px] font-extrabold text-[#a3a09a] uppercase">
          Etkilenen İl
        </span>
        <strong className="block mt-1 text-2xl text-[#f4f2ec]">{affectedIl}</strong>
      </Card>

      <Card className="col-span-2 bg-[#30302d] border-[#595954] rounded-lg p-3 gap-0">
        <span className="block text-[11px] font-extrabold text-[#a3a09a] uppercase">
          Dünkünden Fark
        </span>
        <strong className={`block mt-1 text-2xl ${diffColor}`}>
          {diffPrefix}
          {Math.abs(diff)} nokta
        </strong>
      </Card>
    </div>
  )
}
