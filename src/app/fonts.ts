import { Montserrat, Noto_Sans_Bengali, Noto_Serif_Bengali, Playfair_Display } from "next/font/google";

// English editorial pair
export const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", style: ["normal", "italic"] });
export const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
// Bangla pair (also covers the Taka sign ৳ on English pages). Loaded only when Bengali glyphs appear.
export const notoSerifBn = Noto_Serif_Bengali({ subsets: ["bengali"], variable: "--font-serif-bn", display: "swap", weight: ["400", "500", "600"], preload: false });
export const notoSansBn = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-sans-bn", display: "swap", weight: ["400", "500", "600"], preload: false });

export const fontVariables = `${playfair.variable} ${montserrat.variable} ${notoSerifBn.variable} ${notoSansBn.variable}`;
