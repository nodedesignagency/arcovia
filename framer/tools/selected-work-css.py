# Run from the repo root: python3 framer/tools/selected-work-css.py
# Rebuilds the CSS inside framer/code/ArcoviaSelectedWork.tsx from site/sections/selected-work.css
import re
css = open('site/sections/selected-work.css').read()
art = {
 'cover-concrete': 'https://framerusercontent.com/images/xpd0ie0VyvOOMHZ5ZbYk7RoU2mg.jpg',
 'cover-charcoal': 'https://framerusercontent.com/images/11jleDdOmcfXbH7ZLPeCwffWYs.jpg',
 'cover-paper':    'https://framerusercontent.com/images/d3wIK5E061h9Kcp89ANg80Dq1U.jpg',
 'spine-concrete': 'https://framerusercontent.com/images/nCHtdPAQkNvKovnHsTwVkXOxkc.jpg',
 'spine-charcoal': 'https://framerusercontent.com/images/yHIEGG2vYkh5xCE0mR4pUV2RzQ.jpg',
 'spine-paper':    'https://framerusercontent.com/images/kwEEkcOyOPiK0op4ANkkpiXOI0.jpg',
}
for k,v in art.items():
    a=f'url("../assets/books/{k}.jpg")'; assert css.count(a)==1, k
    css=css.replace(a, f'url("{v}")')
css=re.sub(r'(\d+(?:\.\d+)?)vw\b', r'\1cqw', css)
assert not re.search(r'\dvw\b', css)
# Width breakpoints (including ranges) answer to the component's width, as in the other
# Arcovia components; hover and reduced-motion queries stay media queries
css, n = re.subn(r'@media ((?:\((?:min|max)-width: [^)]*\)(?: and )?)+)', r'@container arc \1', css)
assert n == 3, n
assert not re.search(r'@media \((?:min|max)-width', css)
old='  padding-block: calc(var(--mh-compact) + 8px) var(--space-7);'
assert old in css
css=css.replace(old,'  padding-block: calc(var(--mh-labels) + var(--mh-compact)) var(--space-5);')
assert '`' not in css and '${' not in css and '\\' not in css
p='framer/code/ArcoviaSelectedWork.tsx'
t=open(p).read()
i=t.index('const SELECTED_WORK_CSS = `')+len('const SELECTED_WORK_CSS = `'); j=t.index('`', i)
t=t[:i]+css+t[j:]
open(p,'w').write(t)
print('tsx', len(t))
