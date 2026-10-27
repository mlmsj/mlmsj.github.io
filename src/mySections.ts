export const mySections = ["overview", "favorites", "history", "downloads", "tools", "settings", "feedback", "about"] as const;
export type MySection = typeof mySections[number];
