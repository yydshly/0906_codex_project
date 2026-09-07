# 素材生成记录

工具：内置 image_gen；未使用 CLI/API fallback。三张素材最终保存在 docs/demos/009-holo-card-studio/assets/。提示词用于记录创作意图，不保证重新生成可逐像素复现。

## subject.png

Use case: stylized-concept. Asset type: transparent foreground PNG artwork for an original holographic collectible card called Moonlit White Deer. Create a refined, beautiful ivory white deer in three-quarter profile, standing gracefully, antlers formed of fine brushed gold crescent branches, subtle tiny teal gemstone accents, delicate botanical engraving in fur, elegant Art Nouveau illustration mixed with luminous realistic porcelain rendering. The complete deer including antlers and hooves must fit inside the central 70 percent of the portrait canvas with ample empty margins above and below for later typeset text. White and warm ivory body with delicate gold contour details, clear readable silhouette. Portrait 1024x1536. Background must be genuinely transparent alpha, no backdrop, no ground, no shadow plane, no text, no letters, no frame, no watermark. This is only the foreground layer, not a finished card mockup. Save the generated file.

## background.png

Use case: stylized-concept. Asset type: background layer for Moonlit White Deer holographic collectible card. Portrait 1024x1536, edge to edge illustration. A deep midnight teal and blue enchanted forest at night, distant layered mountains and fine gold botanical branches framing the edges, a luminous small ivory full moon at upper center around 28 percent down, fine sparse constellation stars, calm reflective dark water at bottom. Luxurious Art Nouveau storybook print, atmospheric and detailed, sophisticated restrained gold accent, deep rich dark green-blue contrast. Keep middle and lower middle spacious and fairly dark for a white deer foreground to be overlaid later. Upper 18 percent and bottom 17 percent darker and uncluttered for later typesetting. No deer, no animals, no person, no text, no letters, no border, no card mockup, no watermark. This is only the full-bleed background illustration.

## lineart.png

编辑输入为本次生成的 subject.png。

Edit this exact image into an aligned line-art mask for the SAME foreground texture. Keep the exact 1024x1536 canvas and absolutely identical deer size, position, silhouette, antlers, legs, gemstones, anatomy and all details. Change only rendering: pure white opaque background and sparse fine dark black contours of the existing deer. No grayscale shading, no color, no added objects, no text. Trace the source exactly; do not redraw or rearrange the deer. Sparse fine black outline drawing on white, suitable for a holographic selective glow mask.

## text.png

上游 generate_typography.py 根据 card-config.json 生成，使用本机 simkai.ttf，不分发字体文件。
