"""מכין עותקי צילומי-ממשק נקיים למודעות: מסתיר את תווית «מצב דמו (מוק)» ו-«(דמו)».
המקור: ../video/compose/ui/. הפלט: ui/. אזורים נמדדו על הצילומים (פיקסלים במקור)."""
from PIL import Image, ImageDraw
SRC = '../video/compose/ui/'
def cover(im, box, sample):
    d = ImageDraw.Draw(im); d.rectangle(box, fill=im.getpixel(sample)); return im
im = Image.open(SRC + 'dash_full.png').convert('RGB')
cover(im, (0, 18, 330, 82), (360, 50))                 # «מצב דמו (מוק) — אין שליחה» בכותרת
im.save('ui/dash_clean.png')
im = Image.open(SRC + 'desktop_dash.png').convert('RGB')
cover(im, (2480, 1690, 2820, 1745), (2460, 1660))      # תווית דמו בכרטיס «מחובר/ת כ-»
cover(im, (1915, 860, 2113, 905), (1900, 830))         # «(דמו)» בכותרת הגרף
im.save('ui/desktop_clean.png')
print('ok')
