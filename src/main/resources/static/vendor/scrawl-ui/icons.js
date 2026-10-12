/*!
 * scrawl-icons v0.1.0
 * Hand-drawn icon set with semantic search
 * MIT License
 *
 * Usage:
 *   <span data-icon="instagram"></span>
 *   <span data-icon="dollar" data-size="2em" data-color="#4cb878" data-wobble="1"></span>
 *
 * JS search:
 *   scrawl.icons.search('social photo')  // → ['instagram','camera',...]
 *   scrawl.icons.search('money')         // → ['dollar','credit-card',...]
 *
 * ~28KB unminified · ~9KB gzipped
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  // ─────────────────────────────────────────────────────────────────────────
  // ICON REGISTRY
  //
  // Format: { p: 'path_d' | ['p1','p2',...], t: ['tag','tag',...] }
  //   p  — SVG path `d` attribute(s). Stroke-based (fill:none) by default.
  //   t  — search tags (semantic aliases)
  //   f  — true = filled icon (fill:currentColor, stroke:none)
  //   vb — custom viewBox (default '0 0 24 24')
  // ─────────────────────────────────────────────────────────────────────────

  var R = {

    // ══════════════════════════════════════════
    // NAVIGATION & UI
    // ══════════════════════════════════════════
    'home': {
      p: 'M3 9L12 3L21 9V20C21 20.6 20.6 21 20 21H15V15H9V21H4C3.4 21 3 20.6 3 20V9Z',
      t: ['house','main','index','start','page','dashboard']
    },
    'search': {
      p: ['M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0', 'M16.5 16.5L22 22'],
      t: ['find','magnify','lens','look','query','filter','seek']
    },
    'menu': {
      p: 'M3 6H21M3 12H21M3 18H21',
      t: ['hamburger','nav','navigation','lines','sidebar','bars','toggle']
    },
    'close': {
      p: 'M5 5L19 19M19 5L5 19',
      t: ['x','cross','cancel','dismiss','remove','exit','clear']
    },
    'check': {
      p: 'M3.5 13L9 18.5L20.5 5.5',
      t: ['tick','done','complete','yes','confirm','correct','success']
    },
    'plus': {
      p: 'M12 4V20M4 12H20',
      t: ['add','new','create','insert','+','expand']
    },
    'minus': {
      p: 'M4 12H20',
      t: ['remove','subtract','collapse','-','decrease']
    },
    'chevron-right': {
      p: 'M9 5L16 12L9 19',
      t: ['arrow','right','next','forward','expand','caret']
    },
    'chevron-left': {
      p: 'M15 5L8 12L15 19',
      t: ['arrow','left','back','previous','collapse','caret']
    },
    'chevron-up': {
      p: 'M5 15L12 8L19 15',
      t: ['arrow','up','collapse','ascending','caret']
    },
    'chevron-down': {
      p: 'M5 9L12 16L19 9',
      t: ['arrow','down','expand','dropdown','descending','caret']
    },
    'arrow-right': {
      p: 'M3 12H21M15 6L21 12L15 18',
      t: ['arrow','right','next','forward','navigate','proceed']
    },
    'arrow-left': {
      p: 'M21 12H3M9 6L3 12L9 18',
      t: ['arrow','left','back','previous','return','undo']
    },
    'arrow-up': {
      p: 'M12 21V3M6 9L12 3L18 9',
      t: ['arrow','up','top','submit','upload','scroll']
    },
    'arrow-down': {
      p: 'M12 3V21M6 15L12 21L18 15',
      t: ['arrow','down','bottom','download','descend','scroll']
    },
    'refresh': {
      p: ['M21 2V8H15','M3 12A9 9 0 0 1 18 5.3','M3 22V16H9','M21 12A9 9 0 0 1 6 18.7'],
      t: ['reload','sync','update','retry','rotate','loop']
    },
    'filter': {
      p: 'M22 3H2L10 12.5V19L14 21V12.5L22 3',
      t: ['sort','narrow','refine','select','funnel','adjust']
    },
    'grid': {
      p: 'M3 3H10V10H3ZM14 3H21V10H14ZM3 14H10V21H3ZM14 14H21V21H14Z',
      t: ['layout','tiles','gallery','dashboard','apps','mosaic']
    },
    'list': {
      p: 'M9 6H21M9 12H21M9 18H21M4 6H4M4 12H4M4 18H4',
      t: ['items','lines','todo','checklist','rows','feed']
    },
    'sidebar': {
      p: ['M3 3H21V21H3Z','M9 3V21'],
      t: ['panel','layout','navigation','drawer','split']
    },

    // ══════════════════════════════════════════
    // USER / ACCOUNT
    // ══════════════════════════════════════════
    'user': {
      p: ['M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0','M4 21C4 17.5 7.6 15 12 15C16.4 15 20 17.5 20 21'],
      t: ['person','account','profile','avatar','me','member','account']
    },
    'users': {
      p: ['M17 21C17 18.2 14.8 16 12 16S7 18.2 7 21','M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M22 21C22 18.5 20.2 16.5 18 16','M18 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7'],
      t: ['team','group','people','members','community','friends','audience']
    },
    'user-plus': {
      p: ['M16 21C16 18.2 14 16 11 16H7C4 16 2 18.2 2 21','M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M18 8V14','M15 11H21'],
      t: ['add-user','invite','signup','register','new-member','follow']
    },
    'log-in': {
      p: ['M15 3H19C19.5 3 20 3.2 20.4 3.6S21 4.5 21 5V19C21 19.5 20.8 20 20.4 20.4S19.5 21 19 21H15','M10 17L15 12L10 7','M15 12H3'],
      t: ['signin','login','enter','access','authenticate']
    },
    'log-out': {
      p: ['M9 21H5C4.5 21 4 20.8 3.6 20.4S3 19.5 3 19V5C3 4.5 3.2 4 3.6 3.6S4.5 3 5 3H9','M16 17L21 12L16 7','M21 12H9'],
      t: ['signout','logout','exit','leave','quit']
    },

    // ══════════════════════════════════════════
    // SETTINGS / CONTROLS
    // ══════════════════════════════════════════
    'settings': {
      p: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6','M12 2V4.5M12 19.5V22M4.9 4.9L6.6 6.6M17.4 17.4L19.1 19.1M2 12H4.5M19.5 12H22M4.9 19.1L6.6 17.4M17.4 6.6L19.1 4.9'],
      t: ['gear','cog','config','preferences','options','customize','admin']
    },
    'bell': {
      p: ['M6 10C6 6.7 8.7 4 12 4S18 6.7 18 10V17H6V10Z','M9.5 17C9.5 18.9 10.6 20 12 20S14.5 18.9 14.5 17'],
      t: ['notification','alert','alarm','remind','ping','subscribe']
    },
    'eye': {
      p: ['M1 12C1 12 5 5 12 5S23 12 23 12C23 12 19 19 12 19S1 12 1 12Z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
      t: ['view','visible','show','look','watch','reveal','preview']
    },
    'eye-off': {
      p: ['M1 1L23 23','M9.9 9.9A3 3 0 0 0 9 12a3 3 0 0 0 4.1 2.8','M6.7 6.7C4.5 8.1 2.8 10 1 12C1 12 5 19 12 19C14.2 19 16.2 18.2 17.8 17','M10.7 3C11.1 3 11.6 2.9 12 3C19 3 23 12 23 12C22.3 13.1 21.6 14 20.7 14.9'],
      t: ['hide','invisible','hidden','disable','private']
    },
    'lock': {
      p: ['M8 11V7.5A4 4 0 0 1 16 7.5V11','M5 11H19V22H5Z','M12 15.5V17.5'],
      t: ['secure','password','private','protected','auth','closed']
    },
    'unlock': {
      p: ['M8 11V7.5A4 4 0 0 1 16 7.5','M5 11H19V22H5Z','M12 15.5V17.5'],
      t: ['open','unlocked','access','public','free']
    },
    'link': {
      p: ['M10 13.5C11.5 15 14 15 15.5 13.5L18 11C19.5 9.5 19.5 7 18 5.5S14 4 12.5 5.5L11 7','M14 10.5C12.5 9 10 9 8.5 10.5L6 13C4.5 14.5 4.5 17 6 18.5S10 20 11.5 18.5L13 17'],
      t: ['url','href','chain','connect','hyperlink','attach','reference']
    },
    'external-link': {
      p: ['M18 13V19C18 20.1 17.1 21 16 21H5C3.9 21 3 20.1 3 19V8C3 6.9 3.9 6 5 6H11','M15 3H21V9','M10 14L21 3'],
      t: ['open','new-tab','external','navigate','goto','outside']
    },
    'share': {
      p: ['M18 6m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0','M6 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0','M18 18m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0','M7.5 11L16.5 7M7.5 13L16.5 17'],
      t: ['send','distribute','repost','forward','network','social']
    },
    'copy': {
      p: ['M8 8H20V20H8Z','M5 4H16V16'],
      t: ['duplicate','clone','paste','ctrl-c']
    },
    'bookmark': {
      p: 'M5 2H19V22L12 17L5 22Z',
      t: ['save','mark','flag','remember','favourite','ribbon']
    },
    'edit': {
      p: ['M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13','M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5S22.3 4.7 21.5 5.5L12 15L8 16L9 12Z'],
      t: ['pencil','write','modify','update','pen','compose','change']
    },
    'trash': {
      p: 'M3 6H21M8 6V4H16V6M5 6L6 20C6 21.1 7 22 8 22H16C17 22 18 21.1 18 20L19 6M10 11V17M14 11V17',
      t: ['delete','remove','bin','garbage','clear','waste','destroy']
    },
    'download': {
      p: ['M12 3V15.5','M7 10.5L12 15.5L17 10.5','M4 20H20'],
      t: ['save','export','get','install','receive','arrow-down']
    },
    'upload': {
      p: ['M12 21V8.5','M7 13.5L12 8.5L17 13.5','M4 4H20'],
      t: ['publish','send','export','submit','post','arrow-up']
    },

    // ══════════════════════════════════════════
    // CONTENT & MEDIA
    // ══════════════════════════════════════════
    'image': {
      p: ['M3 3H21V21H3Z','M8.5 10a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0','M3 16L8 11L12 15L16 12L21 17'],
      t: ['photo','picture','gallery','landscape','thumbnail','img']
    },
    'video': {
      p: ['M3 7H15V17H3Z','M15 10.5L21 7V17L15 13.5'],
      t: ['film','record','movie','clip','media','camera','stream']
    },
    'film': {
      p: ['M2 2H22V22H2Z','M7 2V22M17 2V22','M2 7H7M17 7H22','M2 12H7M17 12H22','M2 17H7M17 17H22'],
      t: ['movie','cinema','reel','film-strip','frame','footage']
    },
    'music': {
      p: ['M9 18V5L21 3V16','M9 18a3 3 0 1 0 0.01 0','M21 16a3 3 0 1 0 0.01 0'],
      t: ['note','song','audio','sound','melody','track','tune','beat']
    },
    'headphones': {
      p: ['M3 18C3 13.6 7.1 10 12 10S21 13.6 21 18','M3 18H5C6.1 18 7 18.9 7 20V20C7 21.1 6.1 22 5 22H4C3.4 22 3 21.6 3 21V18Z','M21 18V21C21 21.6 20.6 22 20 22H19C17.9 22 17 21.1 17 20V20C17 18.9 17.9 18 19 18H21Z'],
      t: ['audio','listen','podcast','earphones','earbuds','music','sound']
    },
    'mic': {
      p: ['M9 5C9 3.3 10.3 2 12 2S15 3.3 15 5V12C15 13.7 13.7 15 12 15S9 13.7 9 12V5Z','M5 10V12C5 15.9 8.1 19 12 19S19 15.9 19 12V10','M12 19V22M9 22H15'],
      t: ['microphone','record','voice','podcast','speak','audio','karaoke']
    },
    'camera': {
      p: ['M1 7H23V19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V7Z','M7 7L8.5 4H15.5L17 7','M12 14a3.5 3.5 0 1 0 0.01 0'],
      t: ['photo','picture','shoot','photograph','snap','lens','instagram']
    },
    'play': {
      p: 'M5 3L19 12L5 21V3Z',
      t: ['start','media','run','go','video','audio','stream','begin']
    },
    'pause': {
      p: 'M6 4H10V20H6ZM14 4H18V20H14Z',
      t: ['stop','hold','media','wait','break']
    },
    'volume': {
      p: ['M12 6L7 10H3V14H7L12 18V6Z','M15.5 9C16.4 10 17 11 17 12S16.4 14 15.5 15','M19 6.5C20.7 8 22 9.9 22 12S20.7 16 19 17.5'],
      t: ['sound','audio','speaker','loud','unmute','music']
    },
    'volume-off': {
      p: ['M12 6L7 10H3V14H7L12 18V6Z','M23 9L17 15M17 9L23 15'],
      t: ['mute','silent','quiet','no-sound','speaker-off']
    },

    // ══════════════════════════════════════════
    // COMMUNICATION
    // ══════════════════════════════════════════
    'mail': {
      p: ['M2 4H22V20H2Z','M2 4L12 13L22 4'],
      t: ['email','inbox','letter','message','contact','envelope','newsletter']
    },
    'message': {
      p: 'M21 15C21 15.5 20.8 16 20.4 16.4S19.5 17 19 17H7L3 21V5C3 4.5 3.2 4 3.6 3.6S4.5 3 5 3H19C19.5 3 20 3.2 20.4 3.6S21 4.5 21 5V15Z',
      t: ['chat','bubble','talk','comment','reply','sms','text','dm']
    },
    'phone': {
      p: 'M22 16.9C21.6 17.8 20.7 18.4 19.7 18.4C16.9 18.4 14.5 17.5 11 14C7.5 10.5 6.6 8.1 6.6 5.3C6.6 4.3 7.2 3.4 8.1 3C8.5 2.9 8.8 2.8 9.1 2.8C9.5 2.8 9.8 3 10 3.4L11.8 6.8C12 7.2 12.1 7.6 12.1 8C12.1 8.4 11.9 8.8 11.6 9.1L10.4 10.3C11.4 12 13 13.6 14.7 14.6L15.9 13.4C16.2 13.1 16.6 12.9 17 12.9C17.4 12.9 17.8 13 18.2 13.2L21.6 15C22.1 15.2 22.3 15.7 22 16.9Z',
      t: ['call','contact','telephone','ring','mobile','speak','dial']
    },
    'send': {
      p: 'M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z',
      t: ['submit','paper-plane','forward','post','message','go','dispatch']
    },
    'globe': {
      p: ['M12 2a10 10 0 1 0 0.01 0','M2 12H22','M12 2C12 2 7.5 6.5 7.5 12S12 22 12 22C12 22 16.5 17.5 16.5 12S12 2 12 2Z'],
      t: ['world','earth','language','translate','international','web','internet','planet','website']
    },
    'map-pin': {
      p: ['M21 10C21 15.5 12 22 12 22S3 15.5 3 10A9 9 0 0 1 21 10Z','M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
      t: ['location','place','marker','gps','address','here','venue','pin','drop']
    },

    // ══════════════════════════════════════════
    // SOCIAL MEDIA
    // ══════════════════════════════════════════
    'instagram': {
      p: ['M5 3C3 3 3 3 3 5V19C3 21 3 21 5 21H19C21 21 21 21 21 19V5C21 3 21 3 19 3Z','M12 8a4 4 0 1 0 0.01 0','M17 7a0.5 0.5 0 1 0 0.01 0'],
      t: ['social','photo','ig','reel','stories','camera','app','influencer','feed']
    },
    'twitter': {
      p: 'M4 4L20 20M20 4L4 20',
      t: ['x','tweet','social','bird','post','microblog','retweet','follow']
    },
    'youtube': {
      p: ['M22.5 7C22.5 7 22.2 5 21.5 4.3C20.6 3.4 19.6 3.4 19.1 3.3C15.9 3.1 12 3 12 3S8.1 3.1 4.9 3.3C4.4 3.4 3.4 3.4 2.5 4.3C1.8 5 1.5 7 1.5 7S1.2 9.1 1.2 11.2V13C1.2 15.1 1.5 17.2 1.5 17.2S1.8 19.2 2.5 19.9C3.4 20.8 4.6 20.8 5.1 20.9C7.2 21.1 12 21.1 12 21.1S15.9 21.1 19.1 20.8C19.6 20.7 20.6 20.7 21.5 19.8C22.2 19.1 22.5 17.1 22.5 17.1S22.8 15 22.8 12.9V11.1C22.8 9 22.5 7 22.5 7Z','M10 15V9L16 12L10 15Z'],
      t: ['video','watch','stream','yt','subscribe','channel','shorts','creator']
    },
    'tiktok': {
      p: 'M19 3C19 3 17.5 3 16 4.5C14.5 6 14.5 8 14.5 8V16C14.5 18.5 12.8 20 11 20S7.5 18.5 7.5 16S9.2 12 11 12C11.3 12 11.7 12.1 12 12.2V8.1C11.7 8 11.3 8 11 8C6.6 8 3 11.6 3 16S6.6 24 11 24C15.4 24 19 20.4 19 16V9.5C20.5 10.5 22 10.8 22 10.8V6.8C22 6.8 19 6.5 19 3Z',
      t: ['social','video','short','dance','viral','trending','fyp','creator']
    },
    'facebook': {
      p: 'M18 2H15C13.3 2 12 3.3 12 5V8H9V12H12V22H16V12H19L20 8H16V5C16 4.4 16.4 4 17 4H18V2Z',
      t: ['fb','social','meta','post','feed','page','group']
    },
    'github': {
      p: 'M12 2A10 10 0 0 0 2 12C2 16.4 4.9 20.2 8.8 21.5C9.3 21.6 9.5 21.3 9.5 21V19.2C6.7 19.8 6.1 17.8 6.1 17.8C5.7 16.7 5.1 16.4 5.1 16.4C4.2 15.8 5.1 15.8 5.1 15.8C6.1 15.9 6.6 16.8 6.6 16.8C7.5 18.3 9 17.9 9.5 17.6C9.6 17 9.9 16.6 10.2 16.4C7.7 16.1 5 15.1 5 11C5 9.8 5.5 8.9 6.1 8.1C6 7.9 5.6 6.8 6.2 5.4C6.2 5.4 7.1 5.1 9.5 6.6C10.5 6.3 11.3 6.2 12 6.2C12.7 6.2 13.5 6.3 14.5 6.6C16.9 5.1 17.8 5.4 17.8 5.4C18.4 6.8 18 7.9 17.9 8.1C18.6 8.9 19 9.8 19 11C19 15.1 16.3 16.1 13.8 16.4C14.2 16.7 14.5 17.3 14.5 18.3V21C14.5 21.3 14.7 21.6 15.2 21.5C19.1 20.2 22 16.4 22 12A10 10 0 0 0 12 2Z',
      f: true,
      t: ['code','git','repo','repository','dev','open-source','octocat','version-control']
    },
    'discord': {
      p: ['M20 4C20 4 16.5 2 13 2C13 2 12.5 3 12 4C8.5 4.5 6 4 6 4C3 6 2 11 2 11C3.5 12.5 6 13 6 13C6.5 12 7 11.5 7 11.5C5.5 11 5 10 5 10C7 10.5 10 11 12 11C14 11 17 10.5 19 10C19 10 18.5 11 17 11.5C17.5 12 18 13 18 13C20.5 12.5 22 11 22 11C21 6 20 4 20 4Z','M9.5 8a1.5 1.5 0 1 0 0.01 0','M14.5 8a1.5 1.5 0 1 0 0.01 0'],
      t: ['gaming','community','server','voice','chat','social','gamer']
    },
    'linkedin': {
      p: ['M16 8C18.2 8 20 9.8 20 12V20H16V12C16 11.4 15.6 11 15 11S14 11.4 14 12V20H10V8H14V9.5C14.8 8.5 15.8 8 16 8Z','M4 8H8V20H4Z','M6 6a2 2 0 1 0 0.01 0'],
      t: ['professional','work','career','network','job','business','social','b2b']
    },
    'pinterest': {
      p: 'M12 2A10 10 0 0 0 7 20C7.2 19 7.5 17.7 7.7 17.1L9.2 11C9.2 11 8.8 10.2 8.8 9C8.8 7.3 9.8 6 11 6C12 6 12.5 6.8 12.5 7.7C12.5 8.7 11.9 10.2 11.5 11.6C11.3 12.7 12.1 13.6 13.2 13.6C15.1 13.6 16.5 11.5 16.5 8.5C16.5 5.9 14.7 4 12 4C8.9 4 7 6.3 7 8.7C7 9.7 7.4 10.7 7.9 11.2C7.9 11.4 7.9 11.5 7.8 11.8L7.4 13.2C7.4 13.4 7.2 13.5 7 13.4C5.7 12.8 5 11.2 5 8.9C5 5.3 7.6 2 12.3 2C16.1 2 19 4.8 19 8.7C19 12.8 16.4 16.1 12.7 16.1C11.5 16.1 10.4 15.5 10 14.8L9 18.5C8.7 19.5 8 20.5 7.5 21.1C9 21.7 10.5 22 12 22A10 10 0 0 0 12 2Z',
      f: true,
      t: ['pin','save','board','inspiration','craft','diy','fashion','recipe']
    },
    'spotify': {
      p: ['M12 2a10 10 0 1 0 0.01 0','M16.5 16.5C14.8 15.5 13 15 10.5 15C8.8 15 7.2 15.3 6 15.8','M17.5 13.5C15.5 12.3 12.8 11.5 9.5 11.5C7.5 11.5 5.7 11.9 4.5 12.5','M18.5 10.5C16 9 12.8 8 9 8C6.8 8 4.8 8.5 3.5 9.2'],
      t: ['music','stream','listen','audio','podcast','playlist','songs']
    },
    'twitch': {
      p: ['M3 2L3 16L7 16L7 20L11 16H15L21 10V2Z','M9 6V11','M14 6V11'],
      t: ['streaming','gaming','live','broadcast','gamer','esports']
    },

    // ══════════════════════════════════════════
    // COMMERCE & MONEY
    // ══════════════════════════════════════════
    'cart': {
      p: ['M1.5 1.5H4.5L7.2 13.5H19','M7.5 6H21.5L19.5 13.5','M9 18a1.5 1.5 0 1 0 0.01 0','M17 18a1.5 1.5 0 1 0 0.01 0'],
      t: ['shop','buy','purchase','basket','ecommerce','store','checkout']
    },
    'dollar': {
      p: ['M12 2V22','M17 6H9.5C8.1 6 7 7.1 7 8.5S8.1 11 9.5 11H14.5C15.9 11 17 12.1 17 13.5S15.9 16 14.5 16H7'],
      t: ['money','usd','payment','price','cash','currency','finance','$','coin','wallet','revenue']
    },
    'coins': {
      p: ['M12 8m-7 0a7 4 0 1 0 14 0a7 4 0 1 0-14 0','M5 8V12C5 14.2 8.1 16 12 16S19 14.2 19 12V8','M5 12V16C5 18.2 8.1 20 12 20S19 18.2 19 16V12'],
      t: ['money','cash','currency','coins','stack','wealth','savings','crypto']
    },
    'wallet': {
      p: ['M2 5H20C21.1 5 22 5.9 22 7V19C22 20.1 21.1 21 20 21H2C1.4 21 1 20.6 1 20V6C1 5.4 1.4 5 2 5Z','M16 14a1 1 0 1 0 0.01 0','M2 9H22'],
      t: ['money','payment','bank','finance','balance','savings','spend']
    },
    'credit-card': {
      p: ['M2 5H22V19H2Z','M2 10H22','M6 15H8M12 15H14'],
      t: ['card','payment','bank','billing','stripe','checkout','swipe']
    },
    'tag': {
      p: ['M20.6 11.4L12.6 3.4C12.2 3 11.7 2.8 11.2 2.8L5 2.8C3.9 2.8 3 3.7 3 4.8V11C3 11.5 3.2 12 3.6 12.4L11.6 20.4C12.4 21.2 13.7 21.2 14.5 20.4L20.6 14.3C21.4 13.5 21.4 12.2 20.6 11.4Z','M7 8a0.5 0.5 0 1 0 0.01 0'],
      t: ['label','price','badge','category','coupon','ticket','sale','deal']
    },
    'package': {
      p: ['M12 3L2 7V17L12 21L22 17V7Z','M2 7L12 11','M12 11L22 7','M12 11V21','M7 9.5L17 5.5'],
      t: ['box','delivery','shipping','product','order','parcel','warehouse']
    },
    'bag': {
      p: ['M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2Z','M3 6H21','M16 10C16 12.2 14.2 14 12 14S8 12.2 8 10'],
      t: ['shopping','store','purchase','fashion','handbag','tote']
    },
    'receipt': {
      p: ['M4 2V22L6.5 20L9 22L11.5 20L14 22L16.5 20L19 22V2L4 2Z','M8 7H16M8 11H16M8 15H12'],
      t: ['invoice','bill','payment','order','transaction','purchase']
    },

    // ══════════════════════════════════════════
    // TIME & CALENDAR
    // ══════════════════════════════════════════
    'clock': {
      p: ['M12 2a10 10 0 1 0 0.01 0','M12 6V12L16 14'],
      t: ['time','watch','schedule','history','deadline','timer','hour']
    },
    'calendar': {
      p: ['M3 5H21V21H3Z','M16 3V7M8 3V7','M3 11H21','M8 15H10M11 15H13M14 15H16','M8 18H10M11 18H13'],
      t: ['date','schedule','event','month','plan','booking','appointment','agenda']
    },
    'timer': {
      p: ['M12 6a8 8 0 1 0 0.01 0','M12 2V4','M10 2H14','M12 10V14'],
      t: ['stopwatch','countdown','time','clock','duration','race']
    },

    // ══════════════════════════════════════════
    // TECH & DEVELOPER
    // ══════════════════════════════════════════
    'code': {
      p: 'M16 18L22 12L16 6M8 6L2 12L8 18',
      t: ['programming','developer','html','syntax','angle-brackets','<>','dev','engineer']
    },
    'terminal': {
      p: ['M4 4H20V20H4Z','M8 12L11 15L8 18','M13 18H16'],
      t: ['command','console','programming','developer','bash','cli','shell']
    },
    'cpu': {
      p: ['M9 2H15M9 22H15M2 9V15M22 9V15','M7 7H17V17H7Z','M11 2V5M13 2V5M11 19V22M13 19V22M2 11H5M2 13H5M19 11H22M19 13H22'],
      t: ['processor','computer','hardware','tech','chip','server']
    },
    'database': {
      p: ['M12 8m-9 0a9 4 0 1 0 18 0a9 4 0 1 0-18 0','M3 8V14C3 16.2 7.1 18 12 18S21 16.2 21 14V8','M3 14V20C3 22.2 7.1 24 12 24S21 22.2 21 20V14'],
      t: ['db','sql','storage','data','server','backend','records']
    },
    'server': {
      p: ['M2 4H22V10H2ZM2 14H22V20H2Z','M6 7H6.01M6 17H6.01','M10 7H14M10 17H14'],
      t: ['hosting','backend','cloud','infrastructure','devops','rack']
    },
    'wifi': {
      p: ['M1.5 8.5C5.5 4.5 10 2.5 12 2.5S18.5 4.5 22.5 8.5','M5 12C7.8 9.2 10.5 8 12 8S16.2 9.2 19 12','M8.5 15.5C10 14 11 13.5 12 13.5S14 14 15.5 15.5','M12 20a0.5 0.5 0 1 0 0.01 0'],
      t: ['internet','network','connection','wireless','online','signal','router']
    },
    'zap': {
      p: 'M13 2L3 14H12L11 22L21 10H12L13 2Z',
      t: ['lightning','flash','fast','power','electric','energy','charge','bolt','speed']
    },

    // ══════════════════════════════════════════
    // NATURE & MISC
    // ══════════════════════════════════════════
    'sun': {
      p: ['M12 8a4 4 0 1 0 0.01 0','M12 2V4M12 20V22M4.9 4.9L6.3 6.3M17.7 17.7L19.1 19.1M2 12H4M20 12H22M4.9 19.1L6.3 17.7M17.7 6.3L19.1 4.9'],
      t: ['light','day','bright','sunny','weather','summer','clear','warm']
    },
    'moon': {
      p: 'M21 12.8A9 9 0 1 1 9.2 3C7.4 4.2 6 6.7 6 9.5A9 9 0 0 0 18 18.5C19.4 17.4 20.5 15.2 21 12.8Z',
      t: ['night','dark','sleep','crescent','weather','bedtime','evening']
    },
    'cloud': {
      p: 'M18 10H18.5C20.5 10 22 11.5 22 13.5S20.5 17 18.5 17H5.5C3.5 17 2 15.5 2 13.5C2 11.8 3.2 10.4 4.8 10.1C4.8 7.1 7 5 9.8 5C11.4 5 12.8 5.7 13.8 6.8C14.5 5.7 15.7 5 17 5',
      t: ['weather','sky','storage','sync','upload','internet','overcast']
    },
    'fire': {
      p: 'M12 2C12 2 14 6 14 10C14 12 12.5 13.5 12 14C11.5 13.5 10 12 10 10C10 8 10.5 6 10.5 6C10.5 6 9 7.5 8 10C6.5 13.5 8 17 10 19C10.7 19.7 11.3 20 12 20.5C12.7 20 13.3 19.7 14 19C16 17 17.5 13.5 16 10Z',
      t: ['hot','trending','popular','flame','burn','heat','spicy','viral']
    },
    'smile': {
      p: ['M12 2a10 10 0 1 0 0.01 0','M8 13C8 13 9.5 16 12 16S16 13 16 13','M8.5 9H8.5','M15.5 9H15.5'],
      t: ['happy','emoji','face','reaction','good','like','lol','mood','positive']
    },
    'coffee': {
      p: ['M3 5H17V18C17 19.7 15.7 21 14 21H6C4.3 21 3 19.7 3 18V5Z','M17 8H19C20.7 8 22 9.3 22 11S20.7 14 19 14H17','M7 2V4M11 2V4M15 2V4'],
      t: ['drink','cafe','mug','cup','morning','hot','tea','espresso','caffeine','latte']
    },
    'map': {
      p: ['M3 7L9 4L15 7L21 4V17L15 20L9 17L3 20V7Z','M9 4V17','M15 7V20'],
      t: ['navigation','location','travel','place','explore','route','directions','atlas']
    },
    'palette': {
      p: ['M12 2A10 10 0 0 0 2 12C2 17 6 21 11 21.9C12 22.2 13 21.3 13 20.3A2 2 0 0 0 11.3 18.4C10.4 18.4 9.8 17.6 10 16.8C10.2 16 11 15.4 11.8 15.4H16C19.3 15.4 22 12.7 22 9.4A10 10 0 0 0 12 2Z','M7.5 11.5a0.5 0.5 0 1 0 1 0 0.5 0.5 0 0 0-1 0','M15.5 9a0.5 0.5 0 1 0 1 0 0.5 0.5 0 0 0-1 0','M9 7a0.5 0.5 0 1 0 1 0 0.5 0.5 0 0 0-1 0'],
      t: ['color','paint','art','design','creative','brush','artistic','colours']
    },
    'brush': {
      p: ['M21.3 2.7C20.2 1.6 18.4 1.6 17.3 2.7L6 14L10 18L21.3 6.7C22.4 5.6 22.4 3.8 21.3 2.7Z','M5.5 14.5L2 22L9.5 18.5'],
      t: ['paint','draw','art','creative','design','color','stroke','illustrate']
    },
    'award': {
      p: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z','M8.2 13.7L7 22L12 19L17 22L15.8 13.7'],
      t: ['medal','badge','achievement','winner','trophy','prize','champion']
    },
    'gift': {
      p: ['M3 9H21V22H3Z','M3 13H21','M12 9V22','M12 9C12 9 10.5 7 9 7S6.5 9 9 9S12 9 12 9Z','M12 9C12 9 13.5 7 15 7S17.5 9 15 9S12 9 12 9Z'],
      t: ['present','birthday','surprise','wrap','reward','celebrate','offer']
    },
    'star-filled': {
      p: 'M12 2L14.4 8.8L21.5 9.5L16.4 14.1L17.9 21L12 17.5L6.1 21L7.6 14.1L2.5 9.5L9.6 8.8Z',
      f: true,
      t: ['star','rate','favourite','liked','saved','featured']
    },
    'heart-filled': {
      p: 'M12 21C10 19 3 14.5 3 8.5C3 5.5 5.5 3 8.5 3C10 3 11.5 3.8 12 5.5C12.5 3.8 14 3 15.5 3C18.5 3 21 5.5 21 8.5C21 14.5 14 19 12 21Z',
      f: true,
      t: ['heart','love','like','favourite','wishlist','liked']
    },
    'ai': {
      p: ['M12 2L14 8L20 6L16 12L20 18L14 16L12 22L10 16L4 18L8 12L4 6L10 8Z','M12 9V15','M9 12H15'],
      t: ['artificial-intelligence','robot','machine-learning','brain','tech','smart','gpt','llm','ml']
    },
    'sparkle': {
      p: 'M12 2L13.8 8.8L20.5 7L15.5 12L20.5 17L13.8 15.2L12 22L10.2 15.2L3.5 17L8.5 12L3.5 7L10.2 8.8Z',
      t: ['magic','shine','glow','special','effect','fairy','glitter','new']
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH
  // Returns icon names sorted by relevance score.
  // Handles exact, prefix, and partial tag matches.
  // ─────────────────────────────────────────────────────────────────────────

  function search(query) {
    if (!query || !query.trim()) return Object.keys(R);
    var terms = query.toLowerCase().trim().split(/[\s,+]+/).filter(Boolean);
    var scores = {};

    Object.keys(R).forEach(function (name) {
      var allTags = [name].concat(R[name].t || []);
      var score = 0;
      terms.forEach(function (term) {
        allTags.forEach(function (tag) {
          if (tag === term)               score += 10;
          else if (tag.startsWith(term))  score += 5;
          else if (tag.includes(term))    score += 2;
          else if (term.includes(tag) && tag.length > 2) score += 1;
        });
      });
      if (score > 0) scores[name] = score;
    });

    return Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  function renderIcon(name, opts) {
    var icon = R[name];
    if (!icon) return null;
    opts = opts || {};

    var size  = opts.size  || '1.5em';
    var color = opts.color || '';
    var vb    = icon.vb    || '0 0 24 24';

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', vb);
    svg.setAttribute('width',  size);
    svg.setAttribute('height', size);
    svg.setAttribute('aria-hidden', 'true');
    var css = 'display:block;overflow:visible;flex-shrink:0';
    if (color) css += ';color:' + color;
    svg.style.cssText = css;

    var paths = Array.isArray(icon.p) ? icon.p : [icon.p];
    paths.forEach(function (pd) {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', pd);
      if (icon.f) {
        path.setAttribute('fill', 'currentColor');
        path.setAttribute('stroke', 'none');
      } else {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
      }
      svg.appendChild(path);
    });

    return svg;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOUNT  data-icon="name"
  // ─────────────────────────────────────────────────────────────────────────

  function initIcons(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-icon]').forEach(function (host) {
      if (host.dataset.iconInit) return;
      host.dataset.iconInit = '1';

      var name   = host.dataset.icon;
      var size   = host.dataset.size   || '1.5em';
      var color  = host.dataset.color  || '';
      var wobble = host.dataset.wobble || '';

      var svg = renderIcon(name, { size: size, color: color });

      if (!svg) {
        host.style.fontFamily = 'monospace';
        host.style.fontSize   = '0.7em';
        host.style.opacity    = '0.5';
        host.textContent      = '[' + name + '?]';
        return;
      }

      if (wobble) svg.style.filter = 'url(#sw-f' + wobble + ')';

      while (host.firstChild) host.removeChild(host.firstChild);
      host.appendChild(svg);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXPOSE
  // ─────────────────────────────────────────────────────────────────────────

  var sc = (window.scrawl = window.scrawl || {});
  sc.icons = {
    search : search,
    find   : search,
    render : renderIcon,
    init   : initIcons,
    all    : function () { return Object.keys(R); },
    count  : Object.keys(R).length,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initIcons(); });
  } else {
    initIcons();
  }

})();
