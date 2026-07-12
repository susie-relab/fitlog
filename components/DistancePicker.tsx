'use client';
import ScrollFieldPicker from './ScrollFieldPicker';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function DistancePicker({ value, onChange }: Props) {
  return (
    <ScrollFieldPicker
      label="Distance"
      unit="km"
      value={value}
      onChange={onChange}
      max={999}
      decimals={2}
      suggestion={0}
      placeholder="e.g. 5.25"
    />
  );
}
