# Gera src/ui/frames.css: as molduras de pedra (e a de ouro, do Escrivão) em 9 pedaços, pixel a pixel (INTERFACE.md §5). Rodar: python3 tools/build_frames.py
import zlib, struct, base64
def png(w,h,pix):
    raw=b''.join(b'\x00'+b''.join(bytes(pix.get((x,y),(0,0,0,0))) for x in range(w)) for y in range(h))
    def ch(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+ch(b'IDAT',zlib.compress(raw,9))+ch(b'IEND',b'')
def hx(c): c=c.lstrip('#'); return (int(c[0:2],16),int(c[2:4],16),int(c[4:6],16),255)
def frame(hi, lo, mid, mid2, groove, inner):
    N=24; px={}
    for y in range(N):
        for x in range(N):
            d=min(x,y,N-1-x,N-1-y)
            if d>=8: continue
            cx=min(x,N-1-x); cy=min(y,N-1-y)
            if cx+cy<2: continue
            if d==0 or cx+cy==2: c='#05040a'
            elif d in (1,2):
                c = hi if (y<N/2 and y<=x and y<=N-1-x) or (x<N/2 and x<y and x<=N-1-y) else lo
            elif d in (3,4,5): c = mid if (x*7+y*13)%5 else mid2
            elif d==6: c=groove
            else: c=inner
            px[(x,y)]=hx(c)
    return 'data:image/png;base64,'+base64.b64encode(png(N,N,px)).decode()
out={'stone':frame('#9a9286','#2a2628','#4c4752','#57525e','#0e0b12','#3a3541'),
     'gold':frame('#ffe08a','#6a5024','#a8843e','#c9a35a','#0e0b12','#4a3a1c')}
css="/* molduras de pedra em 9 pedaços (24 x 24, borda de 8 px; geradas por um script, pixel a pixel) */\n:root {\n"+"".join(f"  --frame-{k}: url(\"{v}\");\n" for k,v in out.items())+"}\n"
open(__import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'src', 'ui', 'frames.css'),'w').write(css); print(len(css))
