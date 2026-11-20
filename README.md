# Giant Portal viewer

Static GitHub Pages viewer based on the Metads tunnel viewer. Includes the revised portal model and base, both video layouts, fonts and Three.js. No install or build step required.

## Publish

1. Extract this ZIP and upload its contents to the root of a separate GitHub repository. Keep `index.html`, `app.js`, `navigation.js`, `motion.js`, `style.css`, `assets` and `vendor` together.
2. In repository Settings > Pages, choose Deploy from a branch, then `main` and `/ (root)`, and Save.
3. Open the HTTPS Pages address GitHub provides after deployment.

Do not upload only the ZIP itself. Files must be extracted in the repository.

## Controls

- Front returns to the revised Blender camera's position and angle, with the requested 1.70 m eye height. Default FOV is 80 degrees; the selected FOV is retained when using Front. Height and FOV remain adjustable.
- Desktop: drag to look, WASD or arrow keys to walk, wheel to move forward/backward, right-drag or Shift-drag to move. Front clearance extends to 35 m on the world Z axis.
- Mobile: drag the left joystick to walk; drag elsewhere to look. Motion View appears on touch devices only and requests sensor permission when needed. Touch look remains available while motion is on. Motion requires HTTPS and a supported phone/browser.
- Combined layout opens by default, using the joined model's second UV map and one video/image input. The included Santa clip is its default.
- The layout button switches to five independent video/image inputs: Back, Left, Right, Ceiling, and Ceiling Front. Switching back restores the combined layout and its selected content. Local replacements stay in your browser; they are not uploaded to a server.
- Playback controls apply to all loaded videos. Frame buttons step by 1/30 second. Shorter replacement videos loop individually. Browser playback is approximately synchronized, not a frame-locked installation player.
- Reset all videos restores the five included clips. Test grid replaces all five surfaces with a numbered UV grid. You can walk through the entrance onto the base; movement stays within the base edges inside.

## Included media

The supplied H.264 MP4 clips are used as defaults for both layouts. Blender UV mapping is preserved without tunnel-specific flips. The revised stage, base, and black casing are included in the two GLB files.

Default videos are `assets/shared.mp4` for the combined layout, and `assets/back.mp4`, `left.mp4`, `right.mp4`, `ceiling.mp4`, and `ceiling-front.mp4` for the five-screen layout. Replace these files to change permanent defaults. User content remains subject to its owner's rights. Bundled library and font licenses are in `vendor/LICENSE.txt` and `assets/fonts`.
