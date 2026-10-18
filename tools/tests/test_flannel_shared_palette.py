"""Verify color correction preserves approved geometry and locks materials."""
from pathlib import Path
import importlib.util,json,unittest,os
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('palette',ROOT/'tools/apply-flannel-shared-palette.py')
palette=importlib.util.module_from_spec(spec);spec.loader.exec_module(palette)

class SharedPaletteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        version=os.environ.get('BAGSEED_PALETTE_REVIEW_VERSION','12')
        cls.records=json.loads((ROOT/f'review/flannel-proportions-v{version}/measurements.json').read_text(encoding='utf-8'))['frames']
        cls.ramps=json.loads((ROOT/f'review/flannel-proportions-v{version}/shared-palette.json').read_text(encoding='utf-8'))['materials']

    def test_geometry_and_protected_outlines_unchanged_in_all_ten_images(self):
        self.assertEqual(len(self.records),10)
        for record in self.records:
            src=ROOT/record['source'];old=Image.open(src).convert('RGBA');new=Image.open(ROOT/record['output']).convert('RGBA')
            self.assertEqual(palette.audit.sha(src),record['sourceSHA256'])
            self.assertEqual(old.size,new.size)
            a,b=np.array(old),np.array(new);regions,ink=palette.masks(old,record.get('materialHemOverride'))
            np.testing.assert_array_equal(a[:,:,3],b[:,:,3])
            np.testing.assert_array_equal(a[ink],b[ink])
            changed=np.logical_or.reduce(list(regions.values()))
            np.testing.assert_array_equal(a[~changed],b[~changed])

    def test_all_material_pixels_use_the_same_reference_ramps(self):
        for record in self.records:
            before=Image.open(ROOT/record['source']).convert('RGBA');after=np.array(Image.open(ROOT/record['output']))
            regions,_=palette.masks(before,record.get('materialHemOverride'))
            for name,mask in regions.items():
                allowed=set(map(tuple,self.ramps[name]))
                self.assertTrue(all(tuple(c) in allowed for c in np.unique(after[mask,:3],axis=0)))

    def test_material_midtone_drift_is_at_most_two_rgb_levels(self):
        for name in ['flannel','jeans','skin','leather','cream']:
            medians=[]
            for record in self.records:
                before=Image.open(ROOT/record['source']).convert('RGBA');after=np.array(Image.open(ROOT/record['output']))
                regions,_=palette.masks(before,record.get('materialHemOverride'))
                medians.append(np.median(after[regions[name],:3],axis=0))
            self.assertLessEqual(float(np.ptp(medians,axis=0).max()),2,name)

if __name__=='__main__':unittest.main()
