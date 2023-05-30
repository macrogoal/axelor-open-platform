import { useCallback, useEffect } from "react";

export const isMac = /Mac OS/i.test(navigator.userAgent);

export type Options = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  canHandle?: (e: KeyboardEvent) => boolean;
  action: (e: KeyboardEvent) => void;
};

const ctrlOrMetaKey = isMac ? "metaKey" : "ctrlKey";

export function useShortcut(options: Options) {
  const { key, altKey, ctrlKey, shiftKey, canHandle, action } = options;
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.key === key &&
        (altKey === undefined || e.altKey === altKey) &&
        (ctrlKey === undefined || e[ctrlOrMetaKey] === ctrlKey) &&
        (shiftKey === undefined || e.shiftKey === shiftKey) &&
        (canHandle === undefined || canHandle(e))
      ) {
        e.stopPropagation();
        e.preventDefault();
        action(e);
      }
    },
    [action, altKey, canHandle, ctrlKey, key, shiftKey]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, action, handleKeyDown]);
}
