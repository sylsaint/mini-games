<script>
  let { question } = $props();
  const uid = $props.id();
  const arrow = `url(#${uid}-arrow)`;
  const orangeArrow = `url(#${uid}-orange-arrow)`;
  const ids = new Set(['la01','la02','la03','la04','la05','la06','la07','la08','la09','la10','la11','la12','la13','la17','la18','la19','la20','la21','la22','la23','la24']);
  const descriptions = {
    la01: 'A、B 两个实心端点之间连着一条平直的线，没有延长箭头。',
    la02: '手电筒灯口 O 是实心起点，光线向右延伸，右端用箭头表示。',
    la03: '两条两端带延长箭头的直线相交，标出了一个 90° 的角。',
    la04: '同一平面内两条不同直线，各自向两端延长。',
    la05: '机器人从向上转到向左，曲线箭头表示向左转四分之一圈。',
    la06: '同一顶点的角边从向右经过上方转到向左，方向与原来相反。',
    la07: 'A、B 之间有平直路线和绕行的折线路线，供比较。',
    la08: 'P 在直线河岸外，连向河岸不同位置的三条线段供比较，中间一条与河岸成直角。',
    la09: '两条不同直线分别与同一条横线相交，两个交点均有直角标记。',
    la10: '同一条横线段保持长短与方向，沿方格向上平移三格。',
    la11: '甲和乙两把折扇的边使用完全相同的两个方向，甲扇骨较长，乙较短，张开刻度相同。',
    la12: '从北出发的方向先顺时针转 90° 到东，再继续顺时针转 40°。两段转向分别标注。',
    la13: '一个拼板角依次分为六个相等的小角，每个小角为 15°，没有重叠或空隙。',
    la17: '水平路向北平移两格，与原来的竖直路相交，新的交角标为问号。',
    la18: '钟面标有 1 到 12。弧线从 12 出发，沿顺时针经过 1、2、3、4、5、6，直到 7，表示实际旋转而非较小夹角。',
    la19: '直线经过 O，斜向左上方的射线把上半个角分成两部分；左侧标 64°，右侧标问号。',
    la20: '量角器示意图的始边朝左，另一条边朝左上方；同一位置标两行刻度 72 和 108，两端各标出零刻度。',
    la21: '一个直角内有一条射线，分为大角和小角；只标题设关系：大角比小角大 24°。',
    la22: '从同一顶点 O 伸出五条不同射线，均在一个直角范围内，用 A 到 E 标识。',
    la23: '直线 O 的上方被两条射线分成三个相邻角，中间标 48°，左右标为左角和右角，题设关系为左角是右角的 2 倍。',
    la24: '方向示意：从北先向右转 145°，再向左转 70°；从此方向继续向右到西，用跨过南方的长弧及问号标明待求转角。'
  };
  const point = (x, y, r, degrees) => ({ x: x + r * Math.cos(degrees * Math.PI / 180), y: y - r * Math.sin(degrees * Math.PI / 180) });
  const clockPoint = (x, y, r, degrees) => point(x, y, r, 90 - degrees);
  function arc(x,y,r,start,end) {
    const a=point(x,y,r,start), b=point(x,y,r,end);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${Math.abs(end-start)>180?1:0} ${end<start?1:0} ${b.x} ${b.y}`;
  }
  function clockArc(x,y,r,start,end) { return arc(x,y,r,90-start,90-end); }
  function fan(x,y,r) {
    const a=point(x,y,r,60),b=point(x,y,r,120);
    return `M ${x} ${y} L ${a.x} ${a.y} A ${r} ${r} 0 0 0 ${b.x} ${b.y} Z`;
  }
</script>

{#if question && ids.has(question.id)}
  <figure class="question-diagram">
    <svg viewBox="0 0 400 270" role="img" aria-labelledby={`${uid}-title ${uid}-desc`} aria-label={descriptions[question.id]}>
      <title id={`${uid}-title`}>{question.topic} · 题目配图</title>
      <desc id={`${uid}-desc`}>{descriptions[question.id]}</desc>
      <defs>
        <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9 Z" fill="#275b69"/></marker>
        <marker id={`${uid}-orange-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9 Z" fill="#a75220"/></marker>
        <pattern id={`${uid}-grid`} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 H 0 V 30" fill="none" stroke="#dce7e7" stroke-width="1"/></pattern>
      </defs>
      {#if ['la09','la10','la17'].includes(question.id)}<rect x="30" y="30" width="330" height="180" rx="8" fill={`url(#${uid}-grid)`}/>{/if}

      {#if question.id==='la01'}
        <path class="line" d="M 70 125 H 330"/><circle class="endpoint" cx="70" cy="125" r="5"/><circle class="endpoint" cx="330" cy="125" r="5"/>
        <text x="70" y="155">A</text><text x="330" y="155">B</text>
      {:else if question.id==='la02'}
        <rect x="36" y="110" width="57" height="30" rx="7" fill="#e8b86b" stroke="#80592f" stroke-width="2"/>
        <path d="M 93 110 L 108 101 V 149 L 93 140 Z" fill="#f6d999" stroke="#80592f" stroke-width="2"/>
        <path class="line" d="M 110 125 H 350" marker-end={arrow}/><circle class="endpoint" cx="110" cy="125" r="5"/>
        <text x="110" y="177">O · 灯口</text><text class="small" x="270" y="97">沿照射方向延伸</text>
      {:else if question.id==='la03'}
        <path class="line" d="M 48 125 H 352" marker-start={arrow} marker-end={arrow}/><path class="line" d="M 200 38 V 212" marker-start={arrow} marker-end={arrow}/>
        <path class="mark" d="M 200 101 H 224 V 125"/><text x="251" y="89">90°</text>
      {:else if question.id==='la04'}
        {#each [90,165] as y}<path class="line" d={`M 50 ${y} H 350`} marker-start={arrow} marker-end={arrow}/>{/each}
        <text class="small" x="200" y="208">同一平面内的两条不同直线</text>
      {:else if question.id==='la05'}
        <path class="faint" d="M 210 170 V 42" marker-end={arrow}/><path class="line" d="M 210 170 H 70" marker-end={arrow}/>
        <path class="turn" d={arc(210,170,82,90,180)} marker-end={orangeArrow}/><circle class="endpoint" cx="210" cy="170" r="5"/>
        <text x="245" y="58">开始</text><text x="73" y="200">转后</text><text class="small" x="115" y="58">向左转四分之一圈</text>
      {:else if question.id==='la06'}
        <path class="faint" d="M 200 175 H 350" marker-end={arrow}/><path class="line" d="M 200 175 H 50" marker-end={arrow}/>
        <path class="turn" d={arc(200,175,90,0,180)} marker-end={orangeArrow}/><circle class="endpoint" cx="200" cy="175" r="5"/>
        <text x="200" y="205">O</text><text x="330" y="207">原方向</text><text x="65" y="207">转后方向</text>
      {:else if question.id==='la07'}
        <path class="faint" d="M 60 155 L 140 52 L 290 65 L 340 155"/>
        <path class="line" d="M 60 155 H 340"/><circle class="endpoint" cx="60" cy="155" r="5"/><circle class="endpoint" cx="340" cy="155" r="5"/>
        <text x="60" y="185">A</text><text x="340" y="185">B</text><text class="small" x="215" y="49">绕行路线</text>
      {:else if question.id==='la08'}
        <rect x="30" y="165" width="340" height="45" rx="5" fill="#e2f1f5"/>
        <path class="line" d="M 35 165 H 365" marker-start={arrow} marker-end={arrow}/>
        <path class="faint" d="M 200 55 L 80 165 M 200 55 L 325 165"/><path class="line" d="M 200 55 V 165"/>
        <circle class="endpoint" cx="200" cy="55" r="5"/><path class="mark" d="M 200 147 H 218 V 165"/>
        <text x="200" y="35">P</text><text x="80" y="193">A</text><text x="200" y="193">B</text><text x="325" y="193">C</text><text class="small" x="346" y="144">河岸</text>
      {:else if question.id==='la09'}
        <path class="line" d="M 45 150 H 355" marker-start={arrow} marker-end={arrow}/>{#each [120,270] as x}<path class="line" d={`M ${x} 40 V 207`} marker-start={arrow} marker-end={arrow}/>{/each}
        <path class="mark" d="M 120 132 H 138 V 150 M 270 132 H 288 V 150"/>
        <text x="98" y="63">甲</text><text x="248" y="63">乙</text>
      {:else if question.id==='la10'}
        <path class="faint" d="M 90 180 H 300"/><path class="line" d="M 90 90 H 300"/>
        {#each [90,300] as x}<circle class="endpoint" cx={x} cy="180" r="4"/><circle class="endpoint" cx={x} cy="90" r="4"/>{/each}
        <path class="turn" d="M 60 180 V 90" marker-end={orangeArrow}/>
        <text class="small" x="187" y="77">新位置</text><text class="small" x="187" y="206">原位置</text><text class="small" x="42" y="126">上</text><text class="small" x="42" y="147">3格</text>
      {:else if question.id==='la11'}
        {#each [{x:100,r:125,name:'甲 · 扇骨长'},{x:300,r:78,name:'乙 · 扇骨短'}] as f}
          <path d={fan(f.x,185,f.r)} fill="#e9eee0" stroke="#275b69" stroke-width="2"/>
          {#each [60,75,90,105,120] as angle}{@const p=point(f.x,185,f.r,angle)}<path class="rib" d={`M ${f.x} 185 L ${p.x} ${p.y}`}/>{/each}
          <path class="turn" d={arc(f.x,185,27,60,120)}/><circle class="endpoint" cx={f.x} cy="185" r="4"/>
          <text x={f.x} y="215">{f.name}</text>
        {/each}
        <text class="small" x="200" y="35">两把扇子都张开到同样的刻度</text>
      {:else if question.id==='la12'}
        <path class="faint" d="M 180 135 V 30" marker-end={arrow}/><path class="faint" d="M 180 135 H 335" marker-end={arrow}/>
        {@const end=clockPoint(180,135,112,130)}<path class="line" d={`M 180 135 L ${end.x} ${end.y}`} marker-end={arrow}/>
        <path class="turn" d={clockArc(180,135,65,0,90)} marker-end={orangeArrow}/><path class="turn" d={clockArc(180,135,90,90,130)} marker-end={orangeArrow}/>
        <text x="161" y="38">北</text><text x="345" y="124">东</text><text x="236" y="72">90°</text><text x="298" y="177">40°</text><circle class="endpoint" cx="180" cy="135" r="4"/>
      {:else if question.id==='la13'}
        {#each [0,15,30,45,60,75,90] as angle}{@const p=point(90,195,165,angle)}<path class="line thin" d={`M 90 195 L ${p.x} ${p.y}`}/>{/each}
        {#each [0,1,2,3,4,5] as i}{@const p=point(90,195,130,i*15+7.5)}<path class="turn thin" d={arc(90,195,55,i*15,(i+1)*15)}/><text class="small" x={p.x} y={p.y+5}>{i+1}</text>{/each}
        <text class="small" x="285" y="66">6 个相等小角</text><text class="small" x="285" y="92">每个 15°</text><circle class="endpoint" cx="90" cy="195" r="4"/>
      {:else if question.id==='la17'}
        <path class="faint" d="M 48 180 H 352" marker-start={arrow} marker-end={arrow}/><path class="line" d="M 48 120 H 352" marker-start={arrow} marker-end={arrow}/><path class="line" d="M 240 40 V 210" marker-start={arrow} marker-end={arrow}/>
        <path class="mark" d="M 240 162 H 258 V 180"/><path class="turn" d="M 90 180 V 120" marker-end={orangeArrow}/>
        <text class="small" x="81" y="99">新路</text><text class="small" x="152" y="204">原水平路</text><text class="small" x="57" y="157">2 格</text><text x="265" y="105">?</text><text class="small" x="285" y="50">北 ↑</text>
      {:else if question.id==='la18'}
        <circle cx="200" cy="121" r="78" fill="#fffefa" stroke="#b4c8cc" stroke-width="2"/>
        {#each Array.from({length:12},(_,i)=>i+1) as n}{@const p=clockPoint(200,121,64,n*30)}<text class="clock-number" x={p.x} y={p.y+6}>{n}</text>{/each}
        <path class="faint" d="M 200 121 V 75" marker-end={arrow}/>{@const end=clockPoint(200,121,47,210)}<path class="line" d={`M 200 121 L ${end.x} ${end.y}`} marker-end={arrow}/>
        <path class="turn" d={clockArc(200,121,95,0,210)} marker-end={orangeArrow}/><circle class="endpoint" cx="200" cy="121" r="4"/>
        <text class="small" x="200" y="239">从 12 顺时针转到 7，跟着外侧箭头走</text>
      {:else if question.id==='la19'}
        <path class="line" d="M 35 185 H 365" marker-start={arrow} marker-end={arrow}/>{@const p=point(200,185,160,116)}<path class="line" d={`M 200 185 L ${p.x} ${p.y}`} marker-end={arrow}/>
        <path class="turn" d={arc(200,185,50,116,180)}/><path class="turn" d={arc(200,185,65,0,116)}/>
        <text x="139" y="147">64°</text><text x="252" y="107">?</text><text x="200" y="212">O</text><circle class="endpoint" cx="200" cy="185" r="4"/>
      {:else if question.id==='la20'}
        <path class="scale" d={arc(200,200,148,0,180)}/><path class="faint" d="M 40 200 H 360"/>
        {#each Array.from({length:19},(_,i)=>i*10) as a}{@const p=point(200,200,148,a)}{@const q=point(200,200,a%30===0?137:142,a)}<path class="tick" d={`M ${p.x} ${p.y} L ${q.x} ${q.y}`}/>{/each}
        <path class="line" d="M 200 200 H 42" marker-end={arrow}/>{@const p=point(200,200,164,108)}<path class="line" d={`M 200 200 L ${p.x} ${p.y}`} marker-end={arrow}/>
        <text x="135" y="22">72 / 108</text><text class="small" x="69" y="225">0 / 180</text><text class="small" x="330" y="225">180 / 0</text><text class="small" x="290" y="94">同一位置</text><text class="small" x="290" y="116">两行刻度</text><circle class="endpoint" cx="200" cy="200" r="4"/>
      {:else if question.id==='la21'}
        <path class="line" d="M 100 195 V 30" marker-end={arrow}/><path class="line" d="M 100 195 H 290" marker-end={arrow}/>{@const p=point(100,195,185,33)}<path class="line" d={`M 100 195 L ${p.x} ${p.y}`} marker-end={arrow}/>
        <path class="mark" d="M 100 173 H 122 V 195"/><path class="turn" d={arc(100,195,45,0,33)}/><path class="turn" d={arc(100,195,65,33,90)}/>
        <text x="177" y="184">小角</text><text x="139" y="107">大角</text><text class="small" x="245" y="45">大角比小角大 24°</text><circle class="endpoint" cx="100" cy="195" r="4"/>
      {:else if question.id==='la22'}
        {#each [90,67.5,45,22.5,0] as angle,i}{@const p=point(90,200,160,angle)}{@const label=point(90,200,182,angle)}<path class="line thin" d={`M 90 200 L ${p.x} ${p.y}`} marker-end={arrow}/><text x={label.x} y={label.y+5}>{String.fromCharCode(65+i)}</text>{/each}
        <circle class="endpoint" cx="90" cy="200" r="4"/><text x="73" y="223">O</text><text class="small" x="300" y="45">任意选两条</text><text class="small" x="300" y="68">作为角的边</text>
      {:else if question.id==='la23'}
        <path class="line" d="M 35 190 H 365" marker-start={arrow} marker-end={arrow}/>
        {#each [44,92] as a}{@const p=point(200,190,150,a)}<path class="line" d={`M 200 190 L ${p.x} ${p.y}`} marker-end={arrow}/>{/each}
        <path class="turn" d={arc(200,190,53,44,92)}/><text x="227" y="112">48°</text><text x="125" y="148">左角</text><text x="281" y="167">右角</text><text x="200" y="215">O</text><text class="small" x="200" y="247">左角是右角的 2 倍</text><circle class="endpoint" cx="200" cy="190" r="4"/>
      {:else if question.id==='la24'}
        <path class="faint" d="M 200 125 V 28" marker-end={arrow}/><path class="faint" d="M 200 125 H 94" marker-end={arrow}/>
        {@const first=clockPoint(200,125,100,145)}{@const second=clockPoint(200,125,100,75)}
        <path class="faint" d={`M 200 125 L ${first.x} ${first.y}`} marker-end={arrow}/><path class="line" d={`M 200 125 L ${second.x} ${second.y}`} marker-end={arrow}/>
        <path class="turn" d={clockArc(200,125,69,0,145)} marker-end={orangeArrow}/><path class="turn" d={clockArc(200,125,46,145,75)} marker-end={orangeArrow}/><path class="turn dashed" d={clockArc(200,125,104,75,270)} marker-end={orangeArrow}/>
        <text x="181" y="30">北</text><text x="71" y="131">西</text><text class="small" x="300" y="62">① 右转 145°</text><text class="small" x="309" y="153">② 左转 70°</text><text class="small" x="112" y="226">③ 继续向右？</text><circle class="endpoint" cx="200" cy="125" r="4"/>
      {/if}
    </svg>
    <figcaption>示意图，按题设推理{question.id==='la18' || question.id==='la24' ? '；旋转方向以箭头为准。' : '，不要靠图上量长度或猜比例。'}</figcaption>
  </figure>
{/if}

<style>
  .question-diagram{margin:16px 0;padding:8px 4px 12px;border:1px solid #d9e4e3;border-radius:18px;background:#f8fbf8;overflow:hidden}
  svg{display:block;width:100%;max-width:540px;height:auto;margin:auto;overflow:visible}
  text{font-family:system-ui,-apple-system,'PingFang SC',sans-serif;font-size:19px;font-weight:650;text-anchor:middle;fill:#203d47;paint-order:stroke;stroke:#f8fbf8;stroke-width:4px;stroke-linejoin:round}
  text.small{font-size:16px;font-weight:550}text.clock-number{font-size:17px;stroke-width:2px}
  .line,.faint,.turn,.mark,.rib,.scale,.tick{fill:none;stroke-linecap:round;stroke-linejoin:round}
  .line{stroke:#275b69;stroke-width:3.5}.faint{stroke:#71969b;stroke-width:2.5;stroke-dasharray:6 5}
  .turn{stroke:#a75220;stroke-width:3}.thin{stroke-width:2}.dashed{stroke-dasharray:6 5}
  .mark{stroke:#a75220;stroke-width:2.5}.endpoint{fill:#275b69}.rib{stroke:#547e73;stroke-width:2}
  .scale{stroke:#94afb2;stroke-width:2}.tick{stroke:#6d8e94;stroke-width:1.5}
  figcaption{padding:0 10px;text-align:center;font-size:13px;line-height:1.6;color:#536c6c}
  @media print{.question-diagram{break-inside:avoid}svg{max-width:420px}}
</style>
