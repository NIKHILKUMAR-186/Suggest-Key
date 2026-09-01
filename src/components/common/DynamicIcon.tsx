import React from 'react';
import {
  Heart,
  Briefcase,
  Brain,
  Sparkles,
  Coins,
  Compass,
  Scale,
  GraduationCap,
  DollarSign,
  Activity,
  Users,
  Target,
  Shield,
  BookOpen,
  TrendingUp,
  Globe,
  Building,
  Award,
  Smile,
  Layers,
  Lightbulb,
  Zap,
  Home,
  FileText,
  Stethoscope,
  BadgeCheck,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  heart: Heart,
  briefcase: Briefcase,
  brain: Brain,
  sparkles: Sparkles,
  coins: Coins,
  compass: Compass,
  scale: Scale,
  graduationcap: GraduationCap,
  dollarsign: DollarSign,
  dollar: DollarSign,
  money: DollarSign,
  activity: Activity,
  health: Activity,
  users: Users,
  people: Users,
  target: Target,
  shield: Shield,
  bookopen: BookOpen,
  education: GraduationCap,
  trendingup: TrendingUp,
  finance: TrendingUp,
  globe: Globe,
  building: Building,
  award: Award,
  smile: Smile,
  layers: Layers,
  lightbulb: Lightbulb,
  zap: Zap,
  home: Home,
  filetext: FileText,
  stethoscope: Stethoscope,
  badgecheck: BadgeCheck,
};

export const getIconComponent = (name?: string): LucideIcon => {
  if (!name) return Sparkles;
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ICON_MAP[key] || Sparkles;
};

interface DynamicIconProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = '', style }) => {
  const Icon = getIconComponent(name);
  return <Icon className={className} style={style} />;
};

export const AVAILABLE_SEGMENT_ICONS = [
  'Heart',
  'Briefcase',
  'Brain',
  'Sparkles',
  'Coins',
  'Compass',
  'Scale',
  'GraduationCap',
  'DollarSign',
  'Activity',
  'Users',
  'Target',
  'Shield',
  'BookOpen',
  'TrendingUp',
  'Globe',
  'Building',
  'Award',
  'Lightbulb',
  'Stethoscope',
];
