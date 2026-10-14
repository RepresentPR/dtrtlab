/* Canonical socials for DTRT Lab + DTRTC + career.
   One file feeds footer strips, nav icons, Find me page, and optional stream rail.
   Add a network below — no build step.
*/
window.DTRT_SOCIALS = {
  updated: "2026-10-14",
  hub: "/find.html",
  networks: [
    {
      id: "resume",
      label: "Resume",
      handle: "dtrtlab.com/resume",
      url: "https://dtrtlab.com/resume.html",
      surface: "career",
      enabled: true
    },
    {
      id: "x",
      label: "X",
      handle: "@DTRTLab",
      url: "https://x.com/DTRTLab",
      surface: "lab",
      enabled: true
    },
    {
      id: "instagram",
      label: "Instagram",
      handle: "@officiallydtrt",
      url: "https://www.instagram.com/officiallydtrt/",
      surface: "lab",
      enabled: true
    },
    {
      id: "youtube",
      label: "YouTube",
      handle: "@DTRTLabYT",
      url: "https://www.youtube.com/@DTRTLabYT",
      surface: "lab",
      enabled: true
    },
    {
      id: "tiktok",
      label: "TikTok",
      handle: "@iananthonyfc",
      url: "https://www.tiktok.com/@iananthonyfc",
      surface: "lab",
      enabled: true
    },
    {
      id: "twitch",
      label: "Twitch",
      handle: "dtrtc",
      url: "https://www.twitch.tv/dtrtc",
      surface: "stream",
      enabled: true
    },
    {
      id: "kick",
      label: "Kick",
      handle: "movebro",
      url: "https://kick.com/movebro",
      surface: "stream",
      enabled: true
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      handle: "Ian Ferraro",
      url: "https://www.linkedin.com/in/ian-ferraro-578784419/",
      surface: "career",
      enabled: true
    },
    {
      id: "github",
      label: "GitHub",
      handle: "RepresentPR",
      url: "https://github.com/RepresentPR",
      surface: "career",
      enabled: true
    }
  ]
};

window.DTRT_ICONS = {
  twitch:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.3 2 2.5 5.7v13.6h4.6V22l3.2-2.7h3.7L21.5 12V2H4.3zm15.4 9.2-3.2 3.2h-4.1l-2.8 2.3v-2.3H6.4V3.8h13.3v7.4z"/><path fill="currentColor" d="M16.2 6.2h1.6v4.8h-1.6V6.2zm-4.3 0h1.6v4.8h-1.6V6.2z"/></svg>',
  kick:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 3h4.2v7.1L14.6 3H19l-7.3 8.1L19.2 21h-4.5l-6.5-7.4V21H4V3z"/></svg>',
  youtube:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z"/></svg>',
  x:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.6 3H20.4l-6.6 7.5L21.5 21h-6.2l-4.8-6.3L5.4 21H2.6l7.1-8.1L2.2 3h6.3l4.4 5.8L17.6 3zm-1.1 16.2h1.7L7.6 4.7H5.8l10.7 14.5z"/></svg>',
  tiktok:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 3h2.2a5.4 5.4 0 0 0 3.6 3.4v2.3a7.6 7.6 0 0 1-3.6-1v6.6a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.4a3.4 3.4 0 1 0 2.4 3.3V3z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8a3.2 3.2 0 0 0 3.2-3.2V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.2 8.6H3.4V20h2.8V8.6zM4.8 3.5A1.6 1.6 0 1 0 4.8 6.7 1.6 1.6 0 0 0 4.8 3.5zM20.6 20h-2.8v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H11V8.6h2.7v1.6h0a3 3 0 0 1 2.7-1.5c2.9 0 3.4 1.9 3.4 4.4V20z"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.6s.8-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.6 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>'
};
