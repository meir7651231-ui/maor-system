"""מקצר את קובצי-המעקב (stab/finger) לפי טווחי-העריכה — כדי להריץ verify/contact_sheets על הפלט הערוך.
שימוש: python edit_npz.py <edit.json> <stab.npz> <finger.npz> <out_dir>"""
import sys, json, os
import numpy as np
E, STB, FIN, OD = sys.argv[1:5]
os.makedirs(OD, exist_ok=True)
kept = [f for a, b in json.load(open(E))['keep'] for f in range(a, b + 1)]
z = dict(np.load(STB, allow_pickle=True))
mk = {int(k): i for i, k in enumerate(z['meas_keys'])}
out = dict(z)
for k in ('C', 'bias', 'rms', 'status'):
    out[k] = z[k][kept]
out['N'] = len(kept)
mv = [(o, z['meas_vals'][mk[f]]) for o, f in enumerate(kept) if f in mk]
out['meas_keys'] = np.array([o for o, _ in mv]); out['meas_vals'] = np.array([v for _, v in mv], dtype=object)
out['src_frame'] = np.array(kept)
np.savez_compressed(f'{OD}/stb.npz', **out)
f = dict(np.load(FIN))
np.savez_compressed(f'{OD}/fin.npz', **{k: v[kept] for k, v in f.items()})
print('kept', len(kept))
