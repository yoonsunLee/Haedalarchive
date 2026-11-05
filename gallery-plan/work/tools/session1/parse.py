import re,html,json,glob,os
out={}
for f in sorted(glob.glob('w/*.html')):
  id=os.path.basename(f)[:-5]
  s=open(f,encoding='utf8').read()
  t=re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S); t=re.sub(r'<[^>]+>','\n',t)
  L=[l.strip() for l in html.unescape(t).splitlines() if l.strip()]
  i=L.index('← All works'); title=L[i+1]; en=L[i+2]
  # medium line: first line containing ' cm · ' in Korean (not starting with Traditional)
  mi=next(k for k in range(i,len(L)) if ' · ' in L[k] and 'cm' in L[k] and not re.match(r'[A-Za-z]',L[k]))
  medium=L[mi]
  ei=L.index('전시 이력') if '전시 이력' in L else L.index('Exhibitions')
  body=[x for x in L[mi+2:ei] if re.search(r'[가-힣]',x) and not re.match(r'[A-Za-z]',x)]
  ex=[]
  if '전시 이력' in L:
    for x in L[L.index('Exhibitions')+1:]:
      if x.startswith('작품 뷰어') or x.startswith('Open in'): break
      if re.search(r'[가-힣]',x): ex.append(re.sub(r'\s+',' ',x))
  out[id]=dict(title=title,en=en,medium=medium,body=body,ex=ex,audio=('도슨트' in s and '.mp3' in s) or bool(re.search(r'docent[^"]*\.(mp3|m4a|aac|ogg)',s)))
json.dump(out,open('../works.json','w',encoding='utf8'),ensure_ascii=False,indent=1)
for k,v in out.items(): print(k,'|',v['medium'],'|',len(v['body']),'para |',len(v['ex']),'ex | audio',v['audio'])
