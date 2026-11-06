"use client";

import { createContext } from "react";

/**
 * Ders içi geri bildirim bağlamı (S1): LessonPlayer, o ana kadarki "üst üste doğru" sayısını sağlar;
 * FeedbackBanner bunu efekt şiddetine ve "N üst üste" rozetine çevirir. Bağlam yoksa (tekrar sayfası) 0.
 */
export const LessonFxContext = createContext<{ combo: number }>({ combo: 0 });
