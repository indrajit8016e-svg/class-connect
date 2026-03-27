import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(url: string | null) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = apiUrl.split("/api")[0];
  return `${baseUrl}${url}`;
}
