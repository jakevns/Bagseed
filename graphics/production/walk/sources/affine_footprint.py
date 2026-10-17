"""One-pass premultiplied Lanczos sampling for heavily reduced source artwork."""
import numpy as np
from PIL import Image

def affine_lanczos(im,matrix,translation,size=(288,432)):
 source=np.asarray(im.convert('RGBA'),dtype=np.float32)/255
 source[:,:,:3]*=source[:,:,3:4]
 inverse=np.linalg.inv(matrix);scale=min(1.,float(np.sqrt(abs(np.linalg.det(matrix)))))
 yy,xx=np.mgrid[:size[1],:size[0]];points=np.column_stack([xx.ravel()+.5,yy.ravel()+.5])
 mapped=(points-translation)@inverse.T-.5
 active=np.argwhere(source[:,:,3]>.001)
 out=np.zeros((points.shape[0],4),np.float32)
 if not len(active):return Image.new('RGBA',size)
 radius=int(np.ceil(3/scale));lo=active.min(0)[::-1]-radius;hi=active.max(0)[::-1]+radius
 use=np.flatnonzero(((mapped>=lo)&(mapped<=hi)).all(1));q=mapped[use];base=np.floor(q).astype(int)
 offsets=np.arange(-radius+1,radius+1);ix=base[:,0,None]+offsets;iy=base[:,1,None]+offsets
 def kernel(distance):
  u=distance*scale;return np.where(abs(u)<3,np.sinc(u)*np.sinc(u/3),0)
 wx=kernel(q[:,0,None]-ix);wy=kernel(q[:,1,None]-iy)
 wx/=wx.sum(1)[:,None];wy/=wy.sum(1)[:,None]
 color=np.zeros((len(use),4),np.float32);height,width=source.shape[:2]
 for j in range(len(offsets)):
  cy=iy[:,j];validy=(cy>=0)&(cy<height)
  for i in range(len(offsets)):
   cx=ix[:,i];valid=validy&(cx>=0)&(cx<width)
   weight=wx[:,i]*wy[:,j];v=valid&(abs(weight)>1e-8)
   color[v]+=source[cy[v],cx[v]]*weight[v,None]
 out[use]=color;out=np.clip(out,0,1);alpha=out[:,3:4]
 out[:,:3]=np.divide(out[:,:3],alpha,out=np.zeros_like(out[:,:3]),where=alpha>1e-7)
 return Image.fromarray(np.round(np.clip(out.reshape(size[1],size[0],4),0,1)*255).astype(np.uint8),'RGBA')
