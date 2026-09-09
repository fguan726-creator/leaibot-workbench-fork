#!/bin/bash
# 为 leaip0 下 >30KB 的 png/jpg 生成同名 .webp 兄弟（x.jpg.webp），nginx 按 Accept 回退。
# ponytail: 单次全量脚本，图片新增后重跑即可；若以后频繁加图再挂 cron。
set -u
R=/opt/projects/lexiang/public/leaip0
one() {
  f="$1"; w="$f.webp"
  [ -f "$w" ] && [ "$w" -nt "$f" ] && return 0            # 已有且比源新，跳过
  # cwebp 读不了截断/坏头 PNG（libpng overflow）时用 PIL 兜底；PIL 装在 baiyu 用户级，sudo 下要指 PYTHONUSERBASE
  cwebp -quiet -q 80 -m 4 -mt "$f" -o "$w" 2>/dev/null \
    || env PYTHONUSERBASE=/home/baiyu/.local python3 -c "from PIL import Image,ImageFile;ImageFile.LOAD_TRUNCATED_IMAGES=True;im=Image.open('$f');im.load();im.save('$w','WEBP',quality=80,method=4)" 2>/dev/null \
    || { rm -f "$w"; echo "FAIL $f"; return 0; }
  s=$(stat -c %s "$f"); t=$(stat -c %s "$w")
  if [ "$t" -ge $((s * 9 / 10)) ]; then rm -f "$w"; echo "SKIP(no gain) $f"; return 0; fi
  chown --reference="$f" "$w" 2>/dev/null; chmod 644 "$w"
  printf 'OK %7dK -> %6dK  %s\n' $((s/1024)) $((t/1024)) "${f#$R/}"
}
export -f one; export R
find "$R/assets" "$R/leai product data" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -size +30k -print0 \
  | xargs -0 -P 4 -I{} bash -c 'one "$1"' _ {}
echo "--- totals ---"
find "$R/assets" "$R/leai product data" -type f -iname '*.webp' -printf '%s\n' | awk '{n++;s+=$1} END{printf "webp files: %d, %.1fMB\n",n,s/1048576}'
