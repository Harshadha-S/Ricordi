# Ricordi — Visual Design Specification

## 1. Brand identity

**Name:** Ricordi  
**Meaning:** Memories in Italian  
**Concept:** A personal digital scrapbook that preserves moments as if they were collected in a handmade memory album.

**Brand personality:** Romantic, nostalgic, intimate, expressive, artistic, warm, and elegant.

**Core design principle:** The interface must resemble a real scrapbook brought to life digitally. Do not create a conventional dashboard and merely decorate it with pink colors.

## 2. Color palette

Use these exact brand colors throughout the application.

| Color | HEX | Primary use |
|---|---|---|
| Burgundy | `#6C0820` | Album covers, backgrounds, headings, buttons |
| Cherry Blossom Pink | `#F2AEBC` | Ribbons, stickers, highlights, accents |
| Misty Rose | `#F2DCDB` | Paper surfaces, pages, soft backgrounds |
| Silver Lake Blue | `#5A86CB` | Decorative tape, labels, secondary accents |
| Lapis Lazuli | `#3D5D91` | Navigation, contrast, supporting elements |

Use warm ivory and cream as neutral paper colors, with subtle paper textures.

**Color balance:** Burgundy and cream establish the main identity. Pink softens the composition. Blue provides contrast. Gold and bronze are reserved for the wax seal and occasional vintage details.

Avoid excessive gradients, neon colors, pure-black panels, and generic purple gradients.

## 3. Navigation philosophy

Ricordi is album-first.

The main journey is:

1. Enter Ricordi.
2. View the collection of personal albums.
3. Open an album.
4. Explore a two-page scrapbook spread.
5. Turn pages to revisit memories.
6. Add a new memory or create another album.

Use a compact navigation system inspired by vintage stationery and book tabs. Important controls must remain discoverable without dominating the scrapbook.

## 4. Landing page

Create an atmospheric introduction to Ricordi.

Include:
- The gold wax-seal R logo.
- Elegant Ricordi wordmark.
- A short, poetic tagline such as “Every moment deserves a page.”
- A prominent “Open your scrapbook” action.
- A layered album preview with photographs and decorative paper.
- A secondary sign-in action.

The hero should feel like an invitation to open a treasured book. Use subtle depth, shadows, textured paper, and restrained animation.

## 5. Album library

The album library is the main authenticated entry point.

Present albums as physical books or layered stacks of scrapbook pages. Each album should have a distinct cover composition while remaining within the Ricordi design system.

Each album may display:
- Album title.
- Cover photograph or illustration.
- Date range.
- Number of memories.
- A small decorative seal or label.
- A visible opening affordance.

Support creating a new album and opening existing albums.

The layout should be visually rich but organized, with generous spacing between album stacks.

## 6. Open scrapbook experience

This is the signature feature of Ricordi.

Display an open, two-page book with a central spine, slightly curved page edges, paper texture, realistic shadows, and layered pages beneath the current spread.

Use CSS 3D transforms and JavaScript to implement realistic page-turn animations. The page-turn effect must respond to previous/next controls and remain smooth and usable on mobile devices.

Each spread can contain:
- Photographs in mixed-size frames.
- Handwritten captions and annotations.
- Torn-paper notes.
- Patterned washi tape.
- Lace borders.
- Decorative tickets and labels.
- Pressed flowers and botanical illustrations.
- Tiny hearts, stars, and date stamps.
- Occasional wax seals.
- Polaroid-style photos and photo collages.

Avoid perfectly uniform card grids within the album. Allow controlled asymmetry and overlapping layers, like a handmade scrapbook.

Decorations must never obscure photographs, captions, or interactive controls.

## 7. New memory editor

Create a scrapbook composition workspace rather than a plain form.

Allow users to:
- Enter a memory title and written entry.
- Select the memory date.
- Upload multiple photographs.
- Add captions to photographs.
- Choose a layout or page arrangement.
- Add decorative elements.
- Save a draft or publish the memory to their private album.

Provide a clear, accessible editing mode. Users must be able to enter text and arrange content without fighting the decorative interface.

Initially, offer a few predefined scrapbook layouts instead of a complicated freeform editor.

## 8. Archive and calendar

The archive should resemble a collection of dated scrapbook pages.

Support browsing memories by date, year, and album. Use paper labels, ticket motifs, small photo thumbnails, and decorative date markers.

The calendar should resemble a vintage paper calendar. Mark days containing memories with subtle burgundy hearts, miniature photographs, or tiny seals.

Selecting a date should reveal the memories saved for that day.

## 9. On This Day

Create a special nostalgic feature that retrieves memories from the same calendar date in previous years.

Present each result as a small scrapbook reveal with its original date, photograph, and a short excerpt.

The experience should feel like discovering an old photograph tucked between pages, not receiving a generic notification.

## 10. Decoration and asset rules

Use a rich scrapbook vocabulary:
- Patterned and solid-color washi tape.
- Torn and deckled paper edges.
- Lace trims.
- Vintage tickets.
- Wax seals.
- Pressed flowers.
- Hand-drawn hearts and stars.
- Handwritten annotations.
- Photo frames and paper clips.
- Date stamps and cutout numerals.

Use decorations in coordinated combinations. Not every page needs every element.

Prefer transparent PNG or SVG assets where appropriate. Use optimized image files and reusable CSS patterns for repeated effects.

Do not stretch, recolor, or distort the main R logo. Preserve its proportions and use the official logo asset.

## 11. Typography

Use three complementary typography roles:

**Display typography:** An elegant serif for the Ricordi wordmark, album titles, and important page headings.

**Handwritten typography:** A readable script font for selected captions, annotations, and decorative notes.

**Functional typography:** A clear sans-serif for navigation, buttons, forms, dates, and body text.

Handwritten fonts are decorative, not a replacement for readable body text. Maintain sufficient contrast and comfortable text sizes.

Use locally available or properly licensed fonts and provide sensible fallback fonts.

## 12. Interaction design

Page turns are the primary transition inside an album.

Include:
- Smooth, realistic page-turn animations.
- Previous and next page controls.
- Optional click or drag interaction where reliable.
- Subtle hover responses for album covers.
- Gentle entrance animations for newly revealed memories.
- Clear feedback when a memory is saved or a photo is uploaded.

Respect reduced-motion preferences. Provide keyboard-accessible page controls and prevent animations from blocking essential interactions.

## 13. Responsive behavior

On desktop, emphasize the open two-page spread and layered album library.

On tablets, reduce decorative clutter and adjust the book dimensions.

On mobile, use a single-page reading layout where necessary, with swipe navigation and visible previous/next controls. Never shrink a two-page spread until its text becomes unreadable.

Forms, upload controls, navigation, and dialogs must remain usable on smaller screens.

## 14. Technical implementation rules

Use the existing Java 21, Spring Boot, Thymeleaf, HTML, CSS, and JavaScript stack.

- Keep server-side application logic in Java.
- Use CSS 3D transforms for page-turn effects.
- Use JavaScript for page navigation and scrapbook interactions.
- Use Thymeleaf fragments for shared navigation and reusable layout elements.
- Keep CSS organized into typography, colors, paper effects, album layouts, page transitions, and responsive rules.
- Store palette values as CSS custom properties.
- Reuse components and assets rather than duplicating markup.
- Keep uploaded memories private by default and validate uploads securely.
- Ensure all core features remain functional without decorative assets or animation.

Do not introduce React, Node.js, Python, or a separate frontend framework.

## 15. Implementation priorities

Build in this order:

1. Brand foundation, typography, palette, and shared layout.
2. Landing page and album library.
3. Open album with a working page-turn prototype.
4. Scrapbook spread layouts and decorative asset integration.
5. New memory editor and photo uploads.
6. Archive and calendar.
7. On This Day.
8. Responsive refinement, accessibility, and testing.

Build and validate each stage before moving to the next.

## 16. Acceptance criteria

The design is successful when:
- Ricordi is immediately recognizable through its burgundy, blush, cream, and blue identity.
- Albums look like physical scrapbook objects.
- Opening an album reveals a convincing two-page layout.
- Page-turn animation works without breaking navigation.
- Photos, notes, tape, and decorative details form a coherent composition.
- Users can read, create, save, and revisit memories.
- The website works on desktop and mobile.
- Decorations enhance the experience without compromising usability.
- The finished product does not resemble a generic admin dashboard.

## 17. Collage typography and cutout elements

Use magazine-cutout letters and paper punctuation as a distinctive scrapbook motif.

- Create reusable cutout assets for punctuation, numerals, and selected alphabet characters.
- Mix vintage serif, italic, bold, and typewriter-inspired styles while preserving a cohesive visual identity.
- Use brand colors and cream paper backgrounds; avoid introducing unrelated bright colors from the inspiration references.
- Apply subtle paper texture, irregular edges, tiny rotations, and realistic shadows.
- Use cutout lettering for short titles, chapter numbers, section labels, and decorative phrases.
- Use oversized question marks for daily prompts and exclamation marks for special memory discoveries.
- Keep body text, form labels, dates, and navigation in accessible, consistent fonts.
- Avoid generating headings as flattened images when real text is required for accessibility, responsive layouts, or dynamic content.
- Ensure decorations never interfere with the reading or interaction experience.
