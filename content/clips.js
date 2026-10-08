/* Clip highlights on the DTRTC homepage.
   Add a clip by appending an object to this array, then reload the page.
   No build step.

   title — short label shown on the card.
   slug  — the Twitch clip id, the last segment of a clips.twitch.tv URL.
           Example: https://clips.twitch.tv/SomeSlugHere  →  slug: "SomeSlugHere"
   thumb — optional static thumbnail, assets/clips/SLUG.webp (640 wide).
           The 320-wide file is assets/clips/SLUG-320.webp.
           Run scripts/fetch-clip-thumbs to fill any clip that is missing one.
           If thumb is omitted, or the file 404s, the card keeps the gradient.
*/
window.DTRT_CLIPS = [
  {
    title: "insane knife round",
    slug: "GeniusSwissOkapiPMSTwin-duYLliqZdd1FzIeF",
    thumb: "assets/clips/GeniusSwissOkapiPMSTwin-duYLliqZdd1FzIeF.webp"
  },
  {
    title: "not the molly",
    slug: "SuaveConcernedRaisinEagleEye--Ww8MHcdddZRo8sp",
    thumb: "assets/clips/SuaveConcernedRaisinEagleEye--Ww8MHcdddZRo8sp.webp"
  },
  {
    title: "poop",
    slug: "EvilRespectfulMonkeyLeeroyJenkins-5RAFxUmkGSD-t4GC",
    thumb: "assets/clips/EvilRespectfulMonkeyLeeroyJenkins-5RAFxUmkGSD-t4GC.webp"
  },
  {
    title: "what you see is what you get",
    slug: "AverageApatheticCockroachPJSugar-6Q1neY-R6gdxtciw",
    thumb: "assets/clips/AverageApatheticCockroachPJSugar-6Q1neY-R6gdxtciw.webp"
  },
  {
    title: "skitz whiff pov",
    slug: "MildHandsomeHedgehogSoonerLater-quqE9w-TP1wRRGov",
    thumb: "assets/clips/MildHandsomeHedgehogSoonerLater-quqE9w-TP1wRRGov.webp"
  },
  {
    title: "skitz 200iq 0 aim",
    slug: "KawaiiMildAlbatrossDatBoi-wJFt6HdvJx9dZqfN",
    thumb: "assets/clips/KawaiiMildAlbatrossDatBoi-wJFt6HdvJx9dZqfN.webp"
  },
  {
    title: "window break",
    slug: "GiantBoringFlyEleGiggle-uUSE5sJQTFBguyu3",
    thumb: "assets/clips/GiantBoringFlyEleGiggle-uUSE5sJQTFBguyu3.webp"
  },
  {
    title: "Skitz curse",
    slug: "InventiveNastySashimiNononoCat-MxON-cLfRUIgnmoY",
    thumb: "assets/clips/InventiveNastySashimiNononoCat-MxON-cLfRUIgnmoY.webp"
  },
  {
    title: "ninja",
    slug: "SmallCalmLlamaImGlitch-E61IvMc563GrIRub",
    thumb: "assets/clips/SmallCalmLlamaImGlitch-E61IvMc563GrIRub.webp"
  }
];
