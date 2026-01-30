import { useState } from 'react';
import { Tooltip } from './Tooltip';

export default {
  title: 'UI/Tooltip',
  component: Tooltip,
};

const CenterWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    {children}
  </div>
);

export const TopPosition = () => (
  <CenterWrapper>
    <Tooltip content="Tooltip on top" position="top">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Hover me (top)
      </button>
    </Tooltip>
  </CenterWrapper>
);

export const BottomPosition = () => (
  <CenterWrapper>
    <Tooltip content="Tooltip on bottom" position="bottom">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Hover me (bottom)
      </button>
    </Tooltip>
  </CenterWrapper>
);

export const LeftPosition = () => (
  <CenterWrapper>
    <Tooltip content="Tooltip on left" position="left">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Hover me (left)
      </button>
    </Tooltip>
  </CenterWrapper>
);

export const RightPosition = () => (
  <CenterWrapper>
    <Tooltip content="Tooltip on right" position="right">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Hover me (right)
      </button>
    </Tooltip>
  </CenterWrapper>
);

export const WithDelay = () => {
  const [delayMs, setDelayMs] = useState(800);

  return (
    <div className="flex flex-col items-center gap-4 min-h-[200px] justify-center">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        Delay:
        <input
          type="range"
          min={0}
          max={2000}
          step={100}
          value={delayMs}
          onChange={(e) => setDelayMs(Number(e.target.value))}
          className="w-40"
        />
        <span className="font-mono">{delayMs}ms</span>
      </label>
      <Tooltip content={`Appears after ${delayMs}ms`} position="top" delay={delayMs}>
        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Hover me (custom delay)
        </button>
      </Tooltip>
    </div>
  );
};
