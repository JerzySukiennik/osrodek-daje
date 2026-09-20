# Curates downloaded CC0 audio into assets/audio + manifest.json. Usage: python3 build_audio.py <scratch_dir>
import os, re, sys, json, glob, subprocess, shutil

SCR = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "audio")
SRC_KEEP = os.path.join(ROOT, "Niepotrzebne", "audio-src")
KEN = os.path.join(SCR, "kenney")

def ken(pack, family, count):
    files = sorted(glob.glob(os.path.join(KEN, "kenney_" + pack, "**", family + "*.ogg"), recursive=True))
    return files[:count]

PICKS = {
    "swallow-small": [("interface-sounds", "drop_", 4), ("interface-sounds", "pluck_", 2), ("digital-audio", "pepSound", 4), ("impact-sounds", "impactSoft_medium", 3)],
    "swallow-big": [("impact-sounds", "impactSoft_heavy", 3), ("impact-sounds", "impactPunch_heavy", 2), ("impact-sounds", "impactWood_heavy", 2), ("impact-sounds", "impactPlank_medium", 2)],
    "bump": [("impact-sounds", "impactWood_light", 2), ("impact-sounds", "impactWood_medium", 2), ("impact-sounds", "impactGeneric_light", 2), ("impact-sounds", "impactMetal_light", 2), ("impact-sounds", "impactGlass_light", 1)],
    "spit": [("digital-audio", "phaserUp", 4), ("digital-audio", "highUp", 1), ("digital-audio", "phaseJump", 3), ("interface-sounds", "maximize_", 3)],
    "grow": [("digital-audio", "powerUp", 6)],
    "ui-select": [("interface-sounds", "select_", 4), ("interface-sounds", "click_", 3), ("interface-sounds", "switch_", 3), ("ui-audio", "rollover", 3), ("interface-sounds", "tick_", 2)],
    "ui-back": [("interface-sounds", "back_", 2), ("interface-sounds", "close_", 2), ("interface-sounds", "minimize_", 2)],
    "ui-error": [("interface-sounds", "error_", 3), ("interface-sounds", "question_", 2)],
    "buy": [("casino-audio", "chips-stack", 3), ("casino-audio", "chips-collide", 2), ("casino-audio", "chip-lay", 2), ("casino-audio", "chips-handle", 2), ("rpg-audio", "handleCoins", 2)],
    "star": [("interface-sounds", "glass_", 4), ("interface-sounds", "bong_", 1), ("music-jingles", "jingles_STEEL", 3)],
    "jingle": [("music-jingles", "jingles_PIZZI", 5), ("music-jingles", "jingles_STEEL1", 4), ("music-jingles", "jingles_SAX", 3), ("music-jingles", "jingles_HIT", 3)],
    "join": [("interface-sounds", "open_", 2), ("interface-sounds", "toggle_", 2)],
    "uproot": [("rpg-audio", "creak", 2), ("rpg-audio", "doorOpen", 1), ("rpg-audio", "chop", 1)],
}
NATURAL = ["water", "fire", "explosion", "whoosh", "steam", "pop", "dog", "rocket"]
LABELS = {
    "music": "Music", "swallow-small": "Swallow (small)", "swallow-big": "Swallow (big)", "bump": "Things tipping / bumping", "spit": "Spit", "grow": "Hole grows",
    "water": "Water / splash", "fire": "Fire", "steam": "Steam", "explosion": "Fireworks / explosion", "rocket": "Rocket launch", "whoosh": "Whoosh", "pop": "Pop / plop",
    "dog": "Dropsik", "ui-select": "UI select / move", "ui-back": "UI back / close", "ui-error": "UI error", "buy": "Shop purchase", "star": "Star collected",
    "jingle": "Level complete jingle", "join": "Player joins", "uproot": "Uprooting / creak",
}

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def run(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, check=True)

def dur(path):
    try:
        return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode().strip())
    except Exception:
        return 0.0

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
os.makedirs(SRC_KEEP, exist_ok=True)
manifest = []

for cat, picks in PICKS.items():
    os.makedirs(os.path.join(OUT, cat), exist_ok=True)
    for pack, family, count in picks:
        for src in ken(pack, family, count):
            if "confirmation" in src:
                continue
            base = slug(os.path.splitext(os.path.basename(src))[0])
            dst = os.path.join(OUT, cat, base + ".ogg")
            shutil.copy(src, dst)
            manifest.append({"id": f"{cat}/{base}", "cat": cat, "label": base, "file": f"assets/audio/{cat}/{base}.ogg", "seconds": round(dur(dst), 2),
                             "source": "Kenney — " + pack.replace("-", " ").title(), "author": "Kenney", "page": "https://kenney.nl/assets/" + pack, "license": "CC0"})

sources = json.load(open(os.path.join(SCR, "oga", "sources.json")))
for s in sources:
    cat = s["cat"]
    src = os.path.join(SCR, "oga", s["file"])
    os.makedirs(os.path.join(OUT, cat), exist_ok=True)
    base = slug(os.path.splitext(os.path.basename(src))[0])[:40]
    dst = os.path.join(OUT, cat, base + ".mp3")
    limit = "10" if cat in ("fire", "steam", "rocket") else "6"
    try:
        run(["-i", src, "-t", limit, "-af", "afade=t=out:st=%s:d=0.4" % (float(limit) - 0.4), "-ac", "2", "-c:a", "libmp3lame", "-b:a", "128k", dst])
    except Exception as e:
        print("skip", src, e)
        continue
    manifest.append({"id": f"{cat}/{base}", "cat": cat, "label": base, "file": f"assets/audio/{cat}/{base}.mp3", "seconds": round(dur(dst), 2),
                     "source": "OpenGameArt — " + s["title"], "author": s["author"], "page": s["page"], "license": "CC0"})

MUSIC = [(p, "OpenGameArt — Happy Lo-Fi (Lofi Collection)", "HoliznaCC0", "https://opengameart.org/content/happy-lo-fi-lofi-collection") for p in sorted(glob.glob(os.path.join(SCR, "music", "happy", "**", "*.mp3"), recursive=True))]
MUSIC += [(p, "OpenGameArt — lofi Compilation", "see page", "https://opengameart.org/content/lofi-compilation") for p in sorted(glob.glob(os.path.join(SCR, "music", "*.mp3"))) if "menu_chill" not in p]
MUSIC += [(os.path.join(SCR, "music", "chilllofir-loop.ogg"), "OpenGameArt — Chill lofi inspired [loop edit]", "see page", "https://opengameart.org/content/chill-lofi-inspired-loop-edit"),
          (os.path.join(SCR, "music", "lofihiphop.ogg"), "OpenGameArt — lofi hip hop", "see page", "https://opengameart.org/content/lofi-hip-hop"),
          (glob.glob(os.path.join(SCR, "music", "menu_chill*.mp3"))[0], "OpenGameArt — Menu Chill Music", "see page", "https://opengameart.org/content/menu-chill-music")]
os.makedirs(os.path.join(OUT, "music"), exist_ok=True)
for src, source, author, page in MUSIC:
    name = re.sub(r"^\d+\s*", "", os.path.splitext(os.path.basename(src))[0]).replace(".mp3", "").replace("HoliznaCC0 - ", "").replace("(online-audio-converter.com)", "").strip()
    base = slug(name)
    total = dur(src)
    start = 12 if total > 100 else 0
    length = min(38, total - start)
    dst = os.path.join(OUT, "music", base + ".mp3")
    run(["-ss", str(start), "-i", src, "-t", str(length), "-af", "afade=t=in:d=0.6,afade=t=out:st=%.2f:d=2" % max(0, length - 2), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "80k", dst])
    shutil.copy(src, os.path.join(SRC_KEEP, os.path.basename(src)))
    manifest.append({"id": "music/" + base, "cat": "music", "label": name, "file": f"assets/audio/music/{base}.mp3", "seconds": round(dur(dst), 1), "fullSeconds": round(total, 1),
                     "source": source, "author": author, "page": page, "license": "CC0", "excerpt": True})

order = list(LABELS.keys())
manifest.sort(key=lambda m: (order.index(m["cat"]), m["label"]))
json.dump({"categories": [{"id": c, "label": LABELS[c]} for c in order if any(m["cat"] == c for m in manifest)], "tracks": manifest}, open(os.path.join(OUT, "manifest.json"), "w"), indent=1, ensure_ascii=False)
print(len(manifest), "tracks in", len(set(m["cat"] for m in manifest)), "categories")
