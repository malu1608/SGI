# Interactive Graphics with Three.js — from a 3D room to a tractor racing game

Three browser projects built with **Three.js / WebGL** for the Interactive Graphics Systems course (SGI), each building on the previous one.

| Part | What it is |
|---|---|
| `tp1` | A 3D room modelled from scratch: geometry, cameras, lights, materials and textures |
| `tp2` | A farm scene **loaded from an XML scene description**, parsed into a Three.js scene graph |
| `tp3` | A **tractor racing game** against an autonomous opponent |

## The racing game (tp3)
- Start menu with **difficulty levels**
- The player drives a tractor around a track with the keyboard
- An **autonomous enemy tractor** that follows the track
- **Power-ups and obstacles** placed on the track, with collision detection
- Lap counting, pause screen, winner screen and restart
- A short user manual

## My contribution
I designed and built the **game menus and their integration with the game** (start menu, final menu and the new visual design), and worked on the scenes in the earlier parts together with my partner.

## Team
Pair project · **Maria Luísa Salvador** · Catarina Gonçalves

## Run
Serve the folder with any local web server and open the part you want, for example:
```bash
python -m http.server 8080
# then open http://localhost:8080/tp3/
```

---
Academic project developed at FEUP (Faculty of Engineering, University of Porto), Interactive Graphics Systems 2023/24.
