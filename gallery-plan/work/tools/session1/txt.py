import re,html,sys
for f in sys.argv[1:]:
  s=open(f,encoding='utf8').read()
  t=re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S); t=re.sub(r'<[^>]+>','\n',t)
  lines=[l.strip() for l in html.unescape(t).splitlines() if l.strip()]
  print('=====',f); print('\n'.join(lines))
