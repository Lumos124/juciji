# -*- coding: utf-8 -*-
"""Generate page-stage assets:
- transparent WebM vertical-bar videos from the supplied ARGB MOVs
- tightly cropped page-border PNGs from the supplied border frames
"""
from pathlib import Path
import subprocess

from PIL import Image
import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[2]
SUPP_VIDEO = ROOT / "补充视频素材"
SUPP_IMAGE = ROOT / "补充图片素材"
OUT_DIR = ROOT / "image" / "两页"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def crop_alpha(src: Path, dst: Path, padding: int = 0) -> None:
    im = Image.open(src).convert("RGBA")
    alpha = im.getchannel("A")
    bbox = alpha.point(lambda p: 255 if p > 10 else 0).getbbox()
    if bbox is None:
        raise RuntimeError(f"no opaque pixels: {src}")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(im.width, right + padding)
    bottom = min(im.height, bottom + padding)
    im.crop((left, top, right, bottom)).save(dst)
    print(f"cropped {src.name} -> {dst.name} {right-left}x{bottom-top}")


def make_transparent_webm(src: Path, dst: Path) -> None:
    cmd = [
        FFMPEG, "-y",
        "-i", str(src),
        "-an",
        "-vf", "colorkey=black:0.06:0.06",
        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",
        "-b:v", "0",
        "-crf", "12",
        "-row-mt", "1",
        "-threads", "4",
        str(dst),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"converted {src.name} -> {dst.name}")


def main() -> None:
    crop_alpha(
        SUPP_IMAGE / "左右两边的边框处理" / "操作状态下的左边边框.png",
        OUT_DIR / "border-left-active.png",
    )
    crop_alpha(
        SUPP_IMAGE / "左右两边的边框处理" / "操作状态下的右边边框.png",
        OUT_DIR / "border-right-active.png",
    )

    crop_alpha(OUT_DIR / "侧边条.png", OUT_DIR / "侧边条-右.png")
    Image.open(OUT_DIR / "侧边条-右.png").transpose(Image.FLIP_LEFT_RIGHT).save(
        OUT_DIR / "侧边条-左.png"
    )
    print("generated 侧边条-左.png / 侧边条-右.png")

    make_transparent_webm(
        SUPP_VIDEO / "左右两条动画" / "左边视频条.mov",
        OUT_DIR / "竖条动画-左.webm",
    )
    make_transparent_webm(
        SUPP_VIDEO / "左右两条动画" / "右边视频条.mov",
        OUT_DIR / "竖条动画-右.webm",
    )


if __name__ == "__main__":
    main()
