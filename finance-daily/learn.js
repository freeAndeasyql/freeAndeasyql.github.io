(function(){
"use strict";
const D=window.FINSIGHT_DATA;
if(!D){document.body.innerHTML="<p>课程加载失败，请刷新。</p>";return}
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=()=>{let p=new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"Asia/Shanghai"}).formatToParts(new Date());let g=t=>p.find(x=>x.type===t).value;return g("year")+"-"+g("month")+"-"+g("day")};
const add=(s,n)=>{let d=new Date(s+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
let today=date(),saved={};
try{saved=JSON.parse(localStorage.getItem("finsight.learn.v1")||"{}")}catch(e){}
if(!saved||typeof saved!=="object")saved={};
saved.completed||={};saved.bookmark||={};saved.reviews||={};saved.quizAttempts||=[];saved.analystAnswers||=[];
const persist=()=>{try{localStorage.setItem("finsight.learn.v1",JSON.stringify(saved))}catch(e){}};
const lesson=id=>D.lessons.find(x=>x.id===id);
const src=id=>D.sources.find(x=>x.id===id);
const link=id=>{let s=src(id);return s?'<a target="_blank" rel="noopener noreferrer" href="'+esc(s.url)+'">'+esc(s.publisher)+' ↗</a>':""};
const terms=Object.keys(D.glossary).sort((a,b)=>b.length-a.length);
const pattern=new RegExp("("+terms.map(x=>x.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&")).join("|")+")","g");
const rich=x=>String(x??"").split(pattern).map(s=>D.glossary[s]?'<button class="term" data-term="'+esc(s)+'">'+esc(s)+'</button>':esc(s)).join("");
const box=(txt,cls="")=>'<div class="card '+cls+'">'+txt+'</div>';
const head=(h,s="")=>'<div class="section-head"><h2 class="section-title">'+h+'</h2><p class="section-sub">'+s+'</p></div>';
const money=x=>"¥"+Math.round(x).toLocaleString("zh-CN");
let page="home",current="fed",quizIndex=0,answers=[],locked=false,filter="due",analystLocked=false,toastTimer;
const completed=()=>D.lessons.slice(0,3).filter(l=>saved.completed[l.id]).length;
function streak(){let ds=new Set(Object.values(saved.completed));let d=ds.has(today)?today:add(today,-1),n=0;while(ds.has(d)&&n<1000){n++;d=add(d,-1)}return n}
const due=()=>Object.keys(saved.reviews).filter(t=>saved.reviews[t]?.due<=today);
const accuracy=()=>{let total=saved.quizAttempts.reduce((a,x)=>a+x.total,0);return total?Math.round(saved.quizAttempts.reduce((a,x)=>a+x.correct,0)/total*100)+"%":"暂无"};
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2400)}
function spark(points,dir){
 if(!points||points.length<2)return "";
 let mi=Math.min(...points),ma=Math.max(...points),d=Math.max(ma-mi,.00001);
 let path=points.map((x,i)=>(6+i*82/(points.length-1)).toFixed(1)+","+(29-(x-mi)/d*25).toFixed(1)).join(" ");
 return '<svg class="spark" viewBox="0 0 94 35" role="img" aria-label="最近几个交易日的历史价格示意折线"><polyline points="'+path+'" fill="none" stroke="'+(dir==="up"?"#D64545":"#3E8E5A")+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}
function home(){
 let n=completed(),pc=Math.round(n/3*100);
 let ring='<div class="ring"><svg viewBox="0 0 122 122" width="100%" height="100%" aria-hidden="true"><circle cx="61" cy="61" r="47" fill="none" stroke="#f0d3c3" stroke-width="12"/><circle cx="61" cy="61" r="47" fill="none" stroke="#E8632C" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+(295.31*pc/100)+' 295.31"/></svg><div class="ring-center"><strong>'+pc+'%</strong><span>今日进度</span></div></div>';
 let market=(D.marketSnapshot||D.markets).map(m=>'<div class="market-card"><div class="market-name">'+esc(m.name)+'</div><div class="market-number num '+(m.direction==="up"?"rise":m.direction==="down"?"fall":"flat")+'">'+esc(m.value)+'</div><div class="row between"><span class="market-move '+(m.direction==="up"?"rise":m.direction==="down"?"fall":"flat")+'">'+(m.direction==="up"?"▲":m.direction==="down"?"▼":"●")+' '+esc(m.change)+'</span>'+spark(m.points,m.direction)+'</div><div class="market-time">'+esc(m.date)+' · '+esc(m.unit)+'</div><div class="market-note"><b>📖 和你有关：</b>'+esc(m.note)+'</div><span class="smallsource">'+link(m.source)+'</span></div>').join("");
 let news=D.lessons.map(l=>'<article class="news card"><span class="news-num">'+l.number+'</span><div><div class="row wrap"><span class="chip easy">'+esc(l.level)+'</span><span class="chip topic">'+esc(l.category)+'</span><span class="chip">'+l.minutes+'分钟</span>'+(saved.completed[l.id]?'<span class="chip easy">✓ 已学</span>':"")+'</div><h3>'+esc(l.title)+'</h3><p>'+esc(l.summary)+'</p><span class="tiny muted">将学到：'+esc(l.terms.join(" · "))+'</span></div><button class="news-go" data-action="lesson" data-id="'+l.id+'" aria-label="学习第'+l.number+'课">→</button></article>').join("");
 return '<section class="hero section"><div><div class="hero-small">☀️ '+esc(D.edition.label)+' · '+esc(D.edition.readingTime)+'</div><h1>今天，学懂一点金融新闻。</h1><p>先从生活中的问题出发，再慢慢理解市场。每天10分钟，不要求一口气学完。</p><button class="btn" data-action="lesson" data-id="'+(D.lessons.find(x=>!saved.completed[x.id])||D.lessons[0]).id+'">开始今天的学习 →</button></div>'+ring+'</section><section class="section">'+head("📊 今日宏观数据","这里展示可核实的官方宏观指标，不把延迟行情误标成实时价格。每张卡片都注明统计口径和发布日期。")+'<div class="market-grid">'+market+'</div><p class="small muted">数据参考期：'+esc(D.edition.label)+'。这里是宏观统计数据，不是实时市场报价；各指标的统计期和发布日期标在卡片内。涨红跌绿遵循中国市场惯例。</p></section><section class="section">'+head("📰 今天的新闻课","从容易到稍难。学完一课再做题，比一次阅读很多资讯更有效。")+'<div class="news-grid">'+news+'</div></section><section class="section">'+box('<h2 class="section-title">🌱 学一点，再练一下</h2><p class="section-sub">把每条新闻当成一节小课，而不是需要背下来的市场术语。</p><p><span class="chip brand">今日已完成 '+n+'/3 课</span> <span class="chip">今天到期复习 '+due().length+' 张</span></p><button class="btn ghost" data-page="quiz">去做每日三题 →</button>')+'</section>';
}
function lessonPage(){
 let l=lesson(current),isDone=!!saved.completed[l.id],steps=["发生了什么","这是什么意思","生活中的例子","影响市场","记住什么"];
 let stepBar='<div class="step-strip">'+steps.map((s,i)=>'<button class="step-chip '+(i===0?"current":"")+'" data-action="step" data-step="'+i+'">'+(i+1)+' '+s+'</button>').join("")+'</div>';
 let fact=box('<h2 class="lesson-title">📌 第一：今天发生了什么？</h2><p class="lesson-body">'+rich(l.fact)+'</p><p class="tiny muted">核实来源：'+l.sourceIds.map(link).join(" · ")+'</p>',"lesson-block");
 let defs=box('<h2 class="lesson-title">📖 第二：这件事是什么意思？</h2><p class="small muted">点击蓝色虚线词语就能马上看到解释。</p>'+l.definitions.map(x=>'<div class="defbox"><b>'+rich(x.term)+'</b><p>'+rich(x.text)+'</p></div>').join(""),"lesson-block");
 let ex=l.life,life=box('<h2 class="lesson-title">🏠 第三：生活中的例子</h2><div class="lifebox"><b>'+esc(ex.title)+'</b><p>'+rich(ex.setup)+'</p><div class="example-comparison"><div class="example-card"><span class="small muted">'+esc(ex.a.label)+'</span><b>'+esc(ex.a.value)+'</b><span class="tiny muted">'+esc(ex.a.desc)+'</span></div><div class="arrow">→</div><div class="example-card"><span class="small muted">'+esc(ex.b.label)+'</span><b>'+esc(ex.b.value)+'</b><span class="tiny muted">'+esc(ex.b.desc)+'</span></div></div><p class="bold">'+rich(ex.conclusion)+'</p><p class="small muted">'+esc(ex.note)+'</p></div><button class="btn ghost small" data-page="lab">去实验室亲手试试 →</button>',"lesson-block");
 let chain=box('<h2 class="lesson-title">🔍 第四：为什么会影响金融市场？</h2><p class="small muted">每一步都解释原因，不直接跳到“利好或利空”。</p><div class="chain">'+l.chain.map((x,i)=>'<div class="chain-node">'+rich(x.title)+'<div class="tiny muted">'+rich(x.detail)+'</div></div>'+(i<l.chain.length-1?'<span class="chain-arrow">→</span>':"")).join("")+'</div><h3 style="margin:20px 0 8px;font-size:16px">对不同资产有什么影响？</h3><div class="reason-cards">'+l.assetNotes.map(x=>'<div class="reason-card"><h4>'+esc(x.name)+' <span class="chip">'+esc(x.direction)+'</span></h4><p>'+rich(x.why)+'</p></div>').join("")+'</div><p class="risk">⚠️ '+esc(l.caution)+' 传导链不代表必然结果。</p>',"lesson-block");
 let last=box('<h2 class="lesson-title">⭐ 第五：今天记住什么？</h2><div class="keybox">'+l.remember.map(x=>'<p>✓ '+rich(x)+'</p>').join("")+'</div><div class="task-btns"><button class="btn ghost" data-action="bookmark" data-id="'+l.id+'">'+(saved.bookmark[l.id]?"♥ 已收藏知识卡":"♡ 收藏本课知识卡")+'</button><button class="btn" data-action="finish" data-id="'+l.id+'">'+(isDone?"✓ 已学完 · 去做题":"学完了，去做每日三题 →")+'</button></div>',"lesson-block");
 let analysis=box('<h2 class="lesson-title">🧠 你来当小小分析师</h2><p>'+esc(l.analyst.question)+'</p><div id="analystChoices">'+l.analyst.options.map((x,i)=>'<button class="option-btn" data-action="analyst" data-id="'+l.id+'" data-choice="'+i+'">'+String.fromCharCode(65+i)+'. '+esc(x)+'</button>').join("")+'</div><div id="analystFeedback"></div><p class="small muted">先自己想，再看原因；答错也没关系。</p>',"analyst");
 return '<section class="section"><div class="row between wrap" style="margin-bottom:16px"><button class="btn ghost small" data-page="home">← 今日学习</button><span class="chip easy">第'+l.number+'课 · '+esc(l.level)+' · '+l.minutes+'分钟</span></div><div class="lesson-head">'+stepBar+'<h1>'+esc(l.title)+'</h1><p class="summary">'+esc(l.summary)+'</p></div><div class="teaching-steps">'+[fact,defs,life,chain,last].map((x,i)=>'<div id="lesson-step-'+i+'">'+x+'</div>').join("")+analysis+'</div></section>';
}
function mort(rate){let P=1e6,n=360,r=rate/1200,pay=P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);return {pay,interest:pay*n-P}}
function bond(y){let r=y/100,n=10,c=3;return c*(1-Math.pow(1+r,-n))/r+100*Math.pow(1+r,-n)}
function curve(y){let t=(y-1)/5,x=40+340*t+15*t*t,py=(1-t)*(1-t)*25+2*(1-t)*t*131+t*t*155;return '<svg class="lineplot" viewBox="0 0 440 215" role="img" aria-label="收益率越高，固定票息债券价格越低的示意曲线"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ede9e3"/></pattern></defs><rect x="35" y="12" width="373" height="169" fill="url(#grid)"/><path d="M 40 25 Q 210 131 395 155" fill="none" stroke="#3E8E5A" stroke-width="3" stroke-linecap="round"/><circle cx="'+x.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="8" fill="#E8632C" stroke="#fff" stroke-width="3"/><text x="32" y="201" font-size="12" fill="#827569">1% 市场收益率</text><text x="317" y="201" font-size="12" fill="#827569">6%</text><text x="45" y="24" font-size="12" fill="#6B6257">债券价格 ↑</text></svg>'}
function labPage(){let m=mort(4);return '<section class="section">'+head("🔬 互动实验室","让手指来帮你理解利率，改变滑块就能立刻看到结果。")+'<div class="lab-grid">'
 +box('<h3 class="lab-title">🏠 实验1 · 利率改变房贷月供</h3><p class="lab-desc">贷款100万元 · 30年 · 等额本息。教学模型假设整个贷款期间利率固定。</p><div class="slider-line"><label for="mortSlider">贷款年利率</label><b id="mortRate" class="rate num">4.00%</b></div><input type="range" id="mortSlider" min="2" max="7" value="4" step=".05"><div class="row between tiny muted"><span>2%</span><span>7%</span></div><div class="metrics"><div class="metric"><small>每月月供</small><b id="monthly">'+money(m.pay)+'</b><small id="monthlyDiff">与4%基准相同</small></div><div class="metric"><small>30年总利息</small><b id="totalInterest">'+money(m.interest)+'</b><small id="interestDiff">与4%基准相同</small></div></div><p class="note-blue">💡 利率变高时，同样的贷款通常每月要还更多钱。现实中政策利率变化不会立刻、等比例影响所有房贷。</p>',"lab-card")
 +box('<h3 class="lab-title">🪙 实验2 · 债券与利率的跷跷板</h3><p class="lab-desc">假设债券面值100元，每年固定付3元利息，10年到期。忽略税费与违约风险。</p><div class="slider-line"><label for="bondSlider">市场收益率</label><b id="bondRate" class="rate num">3.0%</b></div><input type="range" id="bondSlider" min="1" max="6" value="3" step=".1"><div class="row between tiny muted"><span>1%</span><span>6%</span></div><div class="metrics"><div class="metric"><small>估算债券价格</small><b id="bondValue">¥100.00</b></div><div class="metric"><small>相对面值</small><b id="bondStatus">平价</b><small>不是实时交易报价</small></div></div><div id="bondPlot">'+curve(3)+'</div><p class="note-blue">💡 新买家要求的市场收益率越高，原来每年只付3元的旧债券通常越需要降价。</p>',"lab-card")
 +'</div></section>'}
function quizPage(){
 if(quizIndex>=D.quiz.length){let score=answers.filter((x,i)=>x===D.quiz[i].correct).length;return '<section class="section">'+head("✏️ 每日三题","今天的理解练习完成！")+box('<h2 class="section-title">完成啦 · 答对 '+score+' / '+D.quiz.length+' 题</h2><p class="muted">答错的知识点可以回课文或实验室再理解。答题记录已保存在本设备。</p><div class="task-btns"><button class="btn ghost" data-action="quiz-reset">再练一次</button><button class="btn" data-page="review">去知识复习 →</button></div>')+'</section>'}
 let q=D.quiz[quizIndex];return '<section class="section">'+head("✏️ 每日三题","每次只做一道，答完立刻得到详细解释。")+box('<div class="row between"><b class="kicker">第'+(quizIndex+1)+' / '+D.quiz.length+'题 · '+esc(q.type)+'</b><span class="small muted">已答对 '+answers.filter((x,i)=>x===D.quiz[i].correct).length+' 题</span></div><div class="qa-progress" style="margin:14px 0 24px"><div class="qa-fill" style="width:'+(quizIndex/D.quiz.length*100)+'%"></div></div><h3>'+esc(q.question)+'</h3><div>'+q.options.map((x,i)=>'<button class="option-btn '+(locked?(i===q.correct?"right":i===answers[quizIndex]?"wrong":""):"")+'" data-action="answer" data-choice="'+i+'" '+(locked?"disabled":"")+'>'+String.fromCharCode(65+i)+'. '+esc(x)+'</button>').join("")+'</div>'+(locked?'<div class="answer-why">💡 '+esc(q.explain)+'</div><div class="task-btns"><button class="btn ghost small" data-action="lesson" data-id="'+esc(q.lesson)+'">回到这节课</button><button class="btn" data-action="quiz-next">'+(quizIndex===D.quiz.length-1?"查看得分":"下一题 →")+'</button></div>':'<p class="small muted">请选择一个答案。答错也可以看解析。</p>'))+'</section>'}
function reviewPage(){
 let items=filter==="due"?due():filter==="mine"?Object.keys(saved.reviews):Object.keys(D.glossary);
 let cards=items.filter(t=>D.glossary[t]).map(t=>{let g=D.glossary[t];return '<div class="flash-wrap"><div class="flash" tabindex="0" role="button" data-action="flip" data-termname="'+esc(t)+'" aria-label="翻面查看'+esc(t)+'"><div class="flash-inner"><div class="flash-face"><span class="chip topic">'+esc(g.group)+'</span><strong>'+esc(t)+'</strong><span class="flash-indicator">点击翻面看解释 →</span></div><div class="flash-face flash-back"><strong>'+esc(t)+'</strong><p>📖 '+esc(g.simple)+'</p><p>🏠 '+esc(g.life)+'</p></div></div></div>'+(saved.reviews[t]?'<div class="row wrap" style="margin-top:8px"><button class="btn ghost small" data-action="review-score" data-name="'+esc(t)+'" data-yes="no">还没记住</button><button class="btn small" data-action="review-score" data-name="'+esc(t)+'" data-yes="yes">记住了 ✓</button></div>':"")+'</div>'}).join("");
 return '<section class="section">'+head("🗂️ 知识复习","按间隔复习安排，今天有 "+due().length+" 张卡片到期。点击卡片可以翻面，查看生活例子。")+'<div class="row wrap" style="margin-bottom:18px"><button class="btn small '+(filter==="due"?"":"ghost")+'" data-action="review-filter" data-filter="due">今日到期 '+due().length+'</button><button class="btn small '+(filter==="mine"?"":"ghost")+'" data-action="review-filter" data-filter="mine">我的卡片 '+Object.keys(saved.reviews).length+'</button><button class="btn small '+(filter==="all"?"":"ghost")+'" data-action="review-filter" data-filter="all">全部词汇</button></div>'+(cards?'<div class="flash-grid">'+cards+'</div>':box('<h3>今天没有到期卡片 ☀️</h3><p class="muted">学完课程，术语会加入复习列表；也可以点击任意蓝色术语手动收藏。</p><button class="btn ghost" data-page="home">去学习 →</button>'))+box('<h3 style="margin-top:0">为什么要隔几天复习？</h3><p class="small muted">第一次加入后第2天再看。每次选择“记住了”，会依次延后3、7、14天；“还没记住”则安排明天再来。间隔安排是简化版，所有记录仅存本设备。</p>')+'</section>'}
function progressPage(){
 let completed=Object.keys(saved.completed).filter(x=>lesson(x)).length;
 let stats=[["🔥","连续学习",streak()+"天"],["📚","已完成课程",completed+"课"],["🎯","答题正确率",accuracy()],["🗂️","今日待复习",due().length+"张"]];
 let groups=["央行与利率","宏观经济","债券基础","投资基础","外汇基础"].map(t=>{let arr=Object.entries(D.glossary).filter(([k,v])=>v.group===t),mastered=arr.filter(([k])=>saved.reviews[k]?.stage>=2).length,n=arr.length?Math.round(mastered/arr.length*100):0;return '<div class="mastery-row"><b>'+t+'</b><div class="mastery-track"><div class="mastery-fill" style="width:'+n+'%"></div></div><span>'+n+'%</span></div>'}).join("");
 return '<section class="section">'+head("🌱 学习进度","进度根据真实完成记录计算，不会预先显示虚构的打卡天数。")+'<div class="progress-grid">'+box('<div class="chip brand">当前阶段</div><div class="stage-icon">🌱</div><h3>入门：认识基础概念</h3><p>先理解利率、通胀、股票与债券。</p>',"stage current")+box('<div class="chip">🔒 尚未解锁</div><div class="stage-icon">🌿</div><h3>进阶：理解金融关系</h3><p>完成入门课后再系统学习资产之间的传导。</p>',"stage")+box('<div class="chip">🔒 尚未解锁</div><div class="stage-icon">🌳</div><h3>提高：独立分析</h3><p>把自己的判断和实际结果进行对照。</p>',"stage")+'</div><div class="section">'+head("学习统计","不参加的项目不会被计入成绩。")+'<div class="stat-grid">'+stats.map(x=>box('<div>'+x[0]+'</div><b>'+x[2]+'</b><span>'+x[1]+'</span>',"stat")).join("")+'</div></div><div class="section">'+head("概念掌握度","至少两次复习时选择“记住了”，才记为初步掌握。")+box(groups)+'</div></section>'}
function footer(){return '<footer class="footer"><b>FinSight · 每天看懂一点金融</b><br>事实与推演分开；金融知识仅供学习，不构成投资建议。<br>学习记录、收藏和复习均保存在当前设备浏览器中。<div style="margin-top:10px"><button class="btn ghost small" data-action="sources">查看原文和数据来源</button></div><div id="sourceList" class="hide" style="margin-top:10px">'+D.sources.map(x=>'<div class="source-row"><div><b>'+esc(x.title)+'</b><div class="tiny muted">'+esc(x.kind)+'</div></div>'+link(x.id)+'</div>').join("")+'</div></footer>'}
function render(){
 document.querySelectorAll("[data-page]").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
 $("streak").textContent="🔥 已连续学习"+streak()+"天";
 const routes={home,lesson:lessonPage,lab:labPage,quiz:quizPage,review:reviewPage,progress:progressPage};
 $("main").innerHTML='<div class="page">'+routes[page]()+'</div>'+footer();
 if(page==="lab")attachLab();
 if(page==="lesson")analystLocked=false;
}
function navigate(p,id){if(id)current=id;page=p;render();window.scrollTo({top:0,behavior:"smooth"})}
function attachLab(){["mortSlider","bondSlider"].forEach(id=>$(id).addEventListener("input",calc));calc()}
function calc(){
 let rate=Number($("mortSlider").value),b=Number($("bondSlider").value),m=mort(rate),base=mort(4),v=bond(b);
 const diff=x=>Math.abs(x)<.005?"与4%基准相同":(x>0?"比4%多":"比4%少")+money(Math.abs(x));
 $("mortRate").textContent=rate.toFixed(2)+"%";$("monthly").textContent=money(m.pay);$("totalInterest").textContent=money(m.interest);
 $("monthlyDiff").textContent=diff(m.pay-base.pay);$("interestDiff").textContent=diff(m.interest-base.interest);
 $("bondRate").textContent=b.toFixed(1)+"%";$("bondValue").textContent="¥"+v.toFixed(2);
 $("bondStatus").textContent=v>100.005?"溢价 +¥"+(v-100).toFixed(2):v<99.995?"折价 −¥"+(100-v).toFixed(2):"平价";
 $("bondStatus").style.color=v>100.005?"var(--red)":v<99.995?"var(--green)":"var(--ink)";
 $("bondPlot").innerHTML=curve(b);
}
function ensure(t){if(!D.glossary[t])return;if(!saved.reviews[t])saved.reviews[t]={stage:0,added:today,due:add(today,2)};persist()}
function finish(id){saved.completed[id]??=today;lesson(id).terms.forEach(ensure);persist();toast("已保存学习记录，继续答题巩固！");quizIndex=0;locked=false;answers=[];navigate("quiz")}
function advance(name,yes){let o=saved.reviews[name];if(!o)return;if(yes){o.stage=Math.min(4,(o.stage||0)+1);o.due=add(today,[2,3,7,14,30][o.stage])}else{o.stage=0;o.due=add(today,1)}o.lastReview=today;persist();toast(yes?"已安排下次复习":"明天继续练习");render()}
function pop(el,name){
 const x=D.glossary[name];if(!x)return;let pop=$("termPop");
 pop.innerHTML='<button data-action="close" style="float:right;border:0;background:none" aria-label="关闭">✕</button><h3>'+esc(name)+'</h3><h4>📖 简单解释</h4><p>'+esc(x.simple)+'</p><h4>🏠 生活例子</h4><p>'+esc(x.life)+'</p><h4>💪 它的作用</h4><p>'+esc(x.why)+'</p><button class="btn small" data-action="save-term" data-term="'+esc(name)+'">'+(saved.reviews[name]?"✓ 已加入复习卡":"＋ 加入复习卡")+'</button>';
 $("popLayer").classList.add("show");
 let rc=el.getBoundingClientRect(),w=Math.min(340,innerWidth-24);pop.style.left=Math.max(12,Math.min(innerWidth-w-12,rc.left))+"px";
 pop.style.top=Math.max(12,Math.min(innerHeight-(pop.offsetHeight||330)-12,rc.bottom+8))+"px";
}
function close(){$("popLayer").classList.remove("show")}
document.addEventListener("click",e=>{
 let el=e.target.closest("[data-action],[data-page],[data-term]");
 if(!el)return;
 if(el.dataset.term){pop(el,el.dataset.term);return}
 if(el.dataset.page){close();navigate(el.dataset.page);return}
 let a=el.dataset.action,id=el.dataset.id;
 if(a==="lesson"){navigate("lesson",id);return}
 if(a==="finish"){finish(id);return}
 if(a==="bookmark"){saved.bookmark[id]=!saved.bookmark[id];persist();toast(saved.bookmark[id]?"已收藏":"已取消收藏");render();return}
 if(a==="step"){let i=Number(el.dataset.step);$("lesson-step-"+i)?.scrollIntoView({behavior:"smooth",block:"start"});document.querySelectorAll(".step-chip").forEach((b,j)=>b.classList.toggle("current",i===j));return}
 if(a==="answer"){if(locked)return;answers[quizIndex]=Number(el.dataset.choice);locked=true;render();return}
 if(a==="quiz-next"){if(!locked)return;quizIndex++;locked=false;if(quizIndex===D.quiz.length){let correct=answers.filter((x,i)=>x===D.quiz[i].correct).length;saved.quizAttempts.push({date:today,total:D.quiz.length,correct});saved.quizAttempts=saved.quizAttempts.slice(-100);persist()}render();return}
 if(a==="quiz-reset"){quizIndex=0;locked=false;answers=[];render();return}
 if(a==="review-filter"){filter=el.dataset.filter;render();return}
 if(a==="flip"){el.classList.toggle("flipped");return}
 if(a==="review-score"){advance(el.dataset.name,el.dataset.yes==="yes");return}
 if(a==="analyst"){if(analystLocked)return;analystLocked=true;let l=lesson(id),c=Number(el.dataset.choice);document.querySelectorAll("#analystChoices button").forEach((b,i)=>{b.disabled=true;if(i===l.analyst.correct)b.classList.add("right");else if(i===c)b.classList.add("wrong")});$("analystFeedback").innerHTML='<div class="answer-why">💡 '+esc(l.analyst.explain)+'</div>';saved.analystAnswers.push({date:today,lesson:id,correct:c===l.analyst.correct});persist();return}
 if(a==="save-term"){ensure(el.dataset.term);toast("已加入复习卡");close();return}
 if(a==="close"){close();return}
 if(a==="sources"){$("sourceList").classList.toggle("hide");return}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")close();if((e.key==="Enter"||e.key===" ")&&e.target.classList?.contains("flash")){e.preventDefault();e.target.click()}});
$("popLayer").addEventListener("click",e=>{if(e.target===$("popLayer"))close()});
$("homeDate").textContent=D.edition.label;
render();
})();