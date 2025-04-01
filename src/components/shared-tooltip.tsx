import React, { useState, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

interface SharedTooltipContextType {
  showTooltip: (content: React.ReactNode, target: HTMLElement) => void;
  hideTooltip: () => void;
}

const SharedTooltipContext = React.createContext<SharedTooltipContextType | null>(null);

export const useSharedTooltip = () => {
  const context = React.useContext(SharedTooltipContext);
  if (!context) {
    throw new Error("useSharedTooltip must be used within a SharedTooltipProvider");
  }
  return context;
};

export const SharedTooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const currentTarget = useRef<HTMLElement | null>(null);

  const showTooltip = (newContent: React.ReactNode, target: HTMLElement) => {
    setContent(newContent);
    currentTarget.current = target;
    setIsOpen(true);
  };

  const hideTooltip = () => {
    setIsOpen(false);
  };

  return (
    <SharedTooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      <TooltipProvider>
        <Tooltip open={isOpen}>
          <TooltipTrigger asChild>
            <div 
              ref={triggerRef} 
              style={{ 
                position: 'absolute', 
                top: currentTarget.current?.getBoundingClientRect().top ?? 0,
                left: currentTarget.current?.getBoundingClientRect().left ?? 0,
                width: currentTarget.current?.offsetWidth ?? 0,
                height: currentTarget.current?.offsetHeight ?? 0,
                pointerEvents: 'none',
                opacity: 0
              }} 
            />
          </TooltipTrigger>
          <TooltipContent>
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </SharedTooltipContext.Provider>
  );
};