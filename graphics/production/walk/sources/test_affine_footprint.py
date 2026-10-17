"""Quality checks for one-pass reduction of thin illustrated outlines."""
import unittest
import numpy as np
from PIL import Image,ImageDraw
from affine_footprint import affine_lanczos

class FootprintTests(unittest.TestCase):
 def test_thin_line_reduction_matches_reference_lanczos(self):
  source=Image.new('RGBA',(120,120),(80,130,190,255));draw=ImageDraw.Draw(source)
  for x in range(20,100,4):draw.line((x,10,x+10,110),fill=(12,18,25,255),width=1)
  actual=np.array(affine_lanczos(source,np.eye(2)*.2,np.zeros(2),(24,24))).astype(int)
  expected=np.array(source.resize((24,24),Image.Resampling.LANCZOS)).astype(int)
  self.assertLessEqual(abs(actual[3:-3,3:-3]-expected[3:-3,3:-3]).max(),1)

 def test_transparent_edges_do_not_pick_up_black_rgb(self):
  source=Image.new('RGBA',(120,120));ImageDraw.Draw(source).rectangle((25,25,95,95),fill=(60,120,180,255))
  actual=np.array(affine_lanczos(source,np.eye(2)*.2,np.array([.3,.7]),(24,24)))
  edge=(actual[:,:,3]>20)&(actual[:,:,3]<235)
  self.assertTrue(edge.any())
  self.assertLessEqual(abs(actual[:,:,:3][edge].astype(int)-[60,120,180]).max(),1)

if __name__=='__main__':unittest.main()
