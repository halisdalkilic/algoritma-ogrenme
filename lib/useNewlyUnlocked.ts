"use client";

import { useEffect, useState } from "react";
import { useProgressStore } from "@/lib/useProgressStore";

const KEY = "algoritma-app:unlocked-seen";

/** Sayfa yüklemesi başına bir kez okunur: tüm dünyalar aynı "ilk ziyaret mi?" kararını paylaşır. */
let hadBaseline: boolean | null = null;

/**
 * Bu ziyarette YENİ açılmış (daha önce haritada kilitli görülmüş) ders kimlikleri (S10).
 * Kayıtlı ilerleme yüklenene kadar bekler; ilk ziyarette (kayıt yok) hiçbir ders "yeni" sayılmaz, böylece
 * mevcut ilerlemesi olan kullanıcıda tüm harita birden animasyona girmez. Görülenler yalnızca bu tarayıcıda
 * saklanır (localStorage), başka hiçbir yere gönderilmez.
 */
export function useNewlyUnlocked(unlockedIds: string[]): Set<string> {
  const hydrated = useProgressStore((s) => s.hydrated);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  const signature = unlockedIds.join(",");

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(KEY);
        hadBaseline ??= raw !== null;
        const seen = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
        const added = unlockedIds.filter((id) => !seen.has(id));
        if (hadBaseline && added.length > 0) setFresh(new Set(added));
        if (added.length > 0 || raw === null) localStorage.setItem(KEY, JSON.stringify([...seen, ...unlockedIds]));
      } catch {
        // depolama kapalı: animasyon yok, sorun yok
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unlockedIds yerine imzası izlenir
  }, [hydrated, signature]);

  return fresh;
}
