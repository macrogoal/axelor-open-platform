import { useEffect } from "react";

import { useAppSettings } from "@/hooks/use-app-settings";

export function useAppHead() {
  const { name, description, icon, isReady } = useAppSettings();
  useEffect(() => {
    if (isReady) {
      setTitle(name, description);
      setIcon(icon);
    }
  }, [name, description, icon, isReady]);
}

function setTitle(name: string, description: string) {
  document.title = `${name} – ${description}`;
}

function setIcon(icon: string | undefined) {
  const elem = document.querySelector(
    "head > link[rel='shortcut icon']",
  ) as HTMLLinkElement;

  if (icon && elem) {
    elem.href = icon;
  }
}
