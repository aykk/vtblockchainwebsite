"""Clean fringe from pudgyhokie-transparent.webp for the flat orange hero."""
from PIL import Image

PATH = "public/pudgyhokie-transparent.webp"
CREAM_BG = (253, 241, 229)


def load_image():
    import subprocess
    import sys

    try:
        Image.open("public/pudgyhokie.webp")
    except FileNotFoundError as exc:
        raise SystemExit("public/pudgyhokie.webp is required") from exc

    subprocess.check_call([sys.executable, "scripts/make_hokie_transparent.py"])
    return Image.open(PATH).convert("RGBA")


def main():
    img = load_image()
    w, h = img.size
    px = list(img.getdata())
    n = w * h
    bg_avg = sum(CREAM_BG) / 3

    def pixel_avg(p):
        return (p[0] + p[1] + p[2]) / 3

    def bg_distance(p):
        return max(abs(p[0] - CREAM_BG[0]), abs(p[1] - CREAM_BG[1]), abs(p[2] - CREAM_BG[2]))

    def neighbors(x, y):
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                yield nx, ny

    def touches_transparent(x, y, alpha):
        return any(alpha[ny * w + nx] == 0 for nx, ny in neighbors(x, y))

    def interior_neighbors(x, y, alpha):
        for nx, ny in neighbors(x, y):
            if alpha[ny * w + nx] == 0:
                continue
            if touches_transparent(nx, ny, alpha):
                continue
            yield ny * w + nx

    def is_cream(p):
        if bg_distance(p) <= 22 and pixel_avg(p) >= 232:
            return True
        if min(p[0], p[1], p[2]) >= 248:
            return False
        if pixel_avg(p) > bg_avg + 8:
            return False
        return bg_distance(p) <= 24

    def is_maroon(r, g, b):
        return r > 120 and r > g + 20 and b < 90

    def inner_avg(inner):
        return (
            sum(px[i][0] for i in inner) // len(inner),
            sum(px[i][1] for i in inner) // len(inner),
            sum(px[i][2] for i in inner) // len(inner),
        )

    alpha = [p[3] for p in px]
    recolored = 0
    peeled = 0

    for _ in range(8):
        to_recolor = []
        for y in range(h):
            for x in range(w):
                i = y * w + x
                if alpha[i] == 0 or not touches_transparent(x, y, alpha):
                    continue
                inner = list(interior_neighbors(x, y, alpha))
                if not inner:
                    continue
                r, g, b = px[i][:3]
                pavg = pixel_avg((r, g, b))
                ir, ig, ib = inner_avg(inner)
                iavg = pixel_avg((ir, ig, ib))
                if is_cream((r, g, b)) and iavg < 170:
                    to_recolor.append((i, (ir, ig, ib)))
                elif is_maroon(ir, ig, ib) and pavg > iavg + 12:
                    to_recolor.append((i, (ir, ig, ib)))
                elif pavg > iavg + 28:
                    to_recolor.append((i, (ir, ig, ib)))
        if not to_recolor:
            break
        for i, color in to_recolor:
            px[i] = (*color, 255)
        recolored += len(to_recolor)

    for _ in range(2):
        to_clear = [
            y * w + x
            for y in range(h)
            for x in range(w)
            if alpha[y * w + x]
            and touches_transparent(x, y, alpha)
            and is_cream(px[y * w + x][:3])
        ]
        if not to_clear:
            break
        for i in to_clear:
            alpha[i] = 0
        peeled += len(to_clear)

    out = [(px[i][0], px[i][1], px[i][2], alpha[i]) for i in range(n)]
    img.putdata(out)
    img.save(PATH, format="WEBP", lossless=True, quality=100)
    img.save("public/pudgyhokie-transparent.png", format="PNG")
    print(f"recolored {recolored}, peeled {peeled}")


if __name__ == "__main__":
    main()
