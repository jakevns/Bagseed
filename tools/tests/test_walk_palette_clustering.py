"""Regression: sparse button colors must not consume all fabric clusters."""
import importlib.util
from pathlib import Path
import unittest, itertools
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('walk_audit',ROOT/'tools/audit-walk-rerender-v6.py')
audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)

class PaletteClusteringTests(unittest.TestCase):
    def samples(self):
        return np.repeat(np.array([[34,6,-28],[45,4,-30],[96,-1,18],[63,2,10],[40,4,2]],dtype=float),[1000,1000,3,3,3],axis=0)

    def test_two_fabric_tones_survive_sparse_button_outliers(self):
        centers,weights=audit.means(self.samples())
        dominant=centers[weights>.1]
        self.assertEqual(len(dominant),2)
        for tone in [[34,6,-28],[45,4,-30]]:
            self.assertLess(np.linalg.norm(dominant-np.array(tone),axis=1).min(),.1)
        self.assertAlmostEqual(float(weights.sum()),1)

    def test_repeated_runs_are_deterministic(self):
        a,aw=audit.means(self.samples());b,bw=audit.means(self.samples())
        np.testing.assert_array_equal(a,b);np.testing.assert_array_equal(aw,bw)

    def test_large_color_shift_is_not_hidden(self):
        a,aw=audit.means(self.samples());b,bw=audit.means(self.samples()+[15,0,0])
        costs=np.linalg.norm(a[:,None]-b[None],axis=2)
        distance=min(sum(costs[i,j]*(aw[i]+bw[j])/2 for i,j in enumerate(order))
                     for order in itertools.permutations(range(4)))
        self.assertGreater(distance,6)

if __name__=='__main__':unittest.main()
