"""Remove the flat cream background from pudgyhokie.webp."""
from collections import deque
from PIL import Image

SRC = "public/pudgyhokie.webp"
OUT = "public/pudgyhokie-transparent.webp"


def is_belly_white(r, g, b):
    return r > 250 and g > 235 and b > 220


def is_maroon(r, g, b):
    return r > 100 and r > g + 15 and b < 90


def neighbors4(x, y, w, h):
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < w and 0 <= ny < h:
            yield nx, ny


img = Image.open(SRC).convert("RGBA")
w, h = img.size
px = list(img.getdata())
n = w * h

corners = [px[0], px[w - 1], px[(h - 1) * w], px[n - 1]]
sr = sum(c[0] for c in corners) // 4
sg = sum(c[1] for c in corners) // 4
sb = sum(c[2] for c in corners) // 4
bg_avg = (sr + sg + sb) / 3
print(f"seed bg color = ({sr},{sg},{sb}), avg={bg_avg:.1f}")

BG_MATCH = 14


def bg_distance(p):
    return max(abs(p[0] - sr), abs(p[1] - sg), abs(p[2] - sb))


def pixel_avg(p):
    return (p[0] + p[1] + p[2]) / 3


def is_border_background(p):
    if min(p[0], p[1], p[2]) >= 247:
        return False
    if pixel_avg(p) > bg_avg + 4:
        return False
    return bg_distance(p) <= BG_MATCH


is_bg = bytearray(n)
dq = deque()

for x in range(w):
    for idx in (x, (h - 1) * w + x):
        if is_border_background(px[idx]):
            is_bg[idx] = 1
            dq.append(idx)
for y in range(h):
    for idx in (y * w, y * w + w - 1):
        if not is_bg[idx] and is_border_background(px[idx]):
            is_bg[idx] = 1
            dq.append(idx)

while dq:
    idx = dq.popleft()
    x = idx % w
    y = idx // w
    for nx, ny in neighbors4(x, y, w, h):
        j = ny * w + nx
        if is_bg[j]:
            continue
        if is_border_background(px[j]):
            is_bg[j] = 1
            dq.append(j)

out = []
transparent = 0
for i, (r, g, b, _a) in enumerate(px):
    if is_bg[i]:
        out.append((r, g, b, 0))
        transparent += 1
    else:
        out.append((r, g, b, 255))

# Patch bottom belly-corner wedges (cream gaps between belly and wings).
bottom_start = int(h * 0.945)
filled = 0

for _ in range(24):
    changed = 0
    for y in range(bottom_start, h):
        belly_x = [
            x
            for x in range(w)
            if out[y * w + x][3] > 0 and is_belly_white(*out[y * w + x][:3])
        ]
        if not belly_x:
            continue
        xmin, xmax = min(belly_x), max(belly_x)

        for x in range(max(0, xmin - 28), min(w, xmax + 6)):
            i = y * w + x
            if out[i][3] != 0:
                continue

            belly_neighbors = []
            character_neighbors = []
            for nx, ny in neighbors4(x, y, w, h):
                j = ny * w + nx
                if out[j][3] == 0:
                    continue
                r, g, b, _a = out[j]
                if is_belly_white(r, g, b):
                    belly_neighbors.append(j)
                elif is_maroon(r, g, b):
                    character_neighbors.append(j)

            if not belly_neighbors and not character_neighbors:
                continue
            if not belly_neighbors and y < h - 6:
                continue

            if belly_neighbors:
                src = belly_neighbors
            else:
                # Pull belly color from the row above when bridging a maroon corner.
                above = (y - 1) * w + x
                if y > 0 and out[above][3] > 0 and is_belly_white(*out[above][:3]):
                    src = [above]
                else:
                    continue

            r = sum(out[j][0] for j in src) // len(src)
            g = sum(out[j][1] for j in src) // len(src)
            b = sum(out[j][2] for j in src) // len(src)
            out[i] = (r, g, b, 255)
            changed += 1
    filled += changed
    if not changed:
        break

# Final sweep: any remaining bottom transparent pixels touching belly white.
for _ in range(8):
    corner_changed = 0
    for y in range(int(h * 0.965), h):
        for x in range(w):
            i = y * w + x
            if out[i][3] != 0:
                continue
            belly_neighbors = [
                ny * w + nx
                for nx, ny in neighbors4(x, y, w, h)
                if out[ny * w + nx][3] > 0 and is_belly_white(*out[ny * w + nx][:3])
            ]
            if not belly_neighbors:
                continue
            r = sum(out[j][0] for j in belly_neighbors) // len(belly_neighbors)
            g = sum(out[j][1] for j in belly_neighbors) // len(belly_neighbors)
            b = sum(out[j][2] for j in belly_neighbors) // len(belly_neighbors)
            out[i] = (r, g, b, 255)
            corner_changed += 1
    filled += corner_changed
    if not corner_changed:
        break

img.putdata(out)
img.save(OUT, format="WEBP", lossless=True, quality=100)
img.save("public/pudgyhokie-transparent.png", format="PNG")
print(
    f"transparent bg pixels: {transparent}; foreground preserved: {n - transparent}; "
    f"corner wedges filled: {filled}; wrote {OUT}"
)
