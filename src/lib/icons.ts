import { BarChart3, Clock, Gift, Globe, Heart, Megaphone, RefreshCw, Sparkles, TrendingUp, Users, type LucideIcon } from 'lucide-react'

const PROBLEM_ICONS: Record<string, LucideIcon> = {
  captacion: Megaphone, landing: Globe, captacion_leads: Users, atencion_leads: Clock, seguimientos: RefreshCw,
  ltv: TrendingUp, fidelizacion: Heart, ofertas: Gift, upsells: BarChart3,
}
export const problemIcon = (id: string): LucideIcon => PROBLEM_ICONS[id] ?? Sparkles
