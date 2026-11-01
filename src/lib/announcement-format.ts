function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function formatInline(text: string): string {
  const withBold = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return withBold.split(/(<[^>]+>)/g).map((part) => {
    if (part.startsWith("<") && part.endsWith(">")) return part;
    return part.replace(/https?:\/\/[^\s<]+/g, (url) => {
      const trailingPunctuation = url.match(/[.,!?;:)\]}]+$/)?.[0] ?? "";
      const href = trailingPunctuation ? url.slice(0, -trailingPunctuation.length) : url;
      if (!href) return url;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#F59E0B;text-decoration:underline;">${href}</a>${trailingPunctuation}`;
    });
  }).join("");
}

export function formatAnnouncementInlineHtml(text: string): string {
  return formatInline(escapeHtml(text));
}

export function formatAnnouncementHtml(text: string): string {
  return text.split(/\r?\n/).map((line) => {
    const content = line ? formatAnnouncementInlineHtml(line) : "&nbsp;";
    return `<p style="margin:0 0 0.25rem">${content}</p>`;
  }).join("");
}
