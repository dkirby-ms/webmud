//// filepath: /home/saitcho/webmud/game-service/src/db/utils.ts
export function escape(str: string): string {
  return str.replaceAll("~", "~~").replaceAll("%", "~%").replaceAll("_", "~_");
}