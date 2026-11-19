import {
  Brain,
  Calculator,
  Moon,
  Shuffle,
  SlidersHorizontal,
  Utensils,
  Wind,
} from 'lucide-react';
import type { TraitId } from '../types/ranking';

interface TraitIconProps {
  traitId: TraitId;
  className?: string;
  style?: React.CSSProperties;
}

export function TraitIcon({ traitId, className = 'w-3.5 h-3.5', style }: TraitIconProps) {
  switch (traitId) {
    case 'stinkiness':
      return <Wind className={className} style={style} aria-hidden="true" />;
    case 'smartness':
      return <Brain className={className} style={style} aria-hidden="true" />;
    case 'chaos':
      return <Shuffle className={className} style={style} aria-hidden="true" />;
    case 'hunger':
      return <Utensils className={className} style={style} aria-hidden="true" />;
    case 'logicness':
      return <Calculator className={className} style={style} aria-hidden="true" />;
    case 'sleepiness':
      return <Moon className={className} style={style} aria-hidden="true" />;
    default:
      return <SlidersHorizontal className={className} style={style} aria-hidden="true" />;
  }
}
