import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 border-b border-white/10 overflow-x-auto no-scrollbar ${className}`}>
      {(tabs || []).map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-all relative whitespace-nowrap flex items-center gap-2 ${
              isActive
                ? 'text-white'
                : 'text-[#9a9a9a] hover:text-white/80'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-[#8052ff] text-white'
                    : 'bg-white/10 text-[#9a9a9a]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8052ff] rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
